import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  TableStatus,
} from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { VouchersService } from '../vouchers/vouchers.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private vouchersService: VouchersService,
  ) {}

  async create(dto: CreateOrderDto, userId: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Đơn hàng phải có ít nhất 1 món');
    }

    if (dto.type === OrderType.DINE_IN && dto.tableId) {
      const table = await this.prisma.table.findUnique({
        where: { id: dto.tableId },
      });
      if (!table) throw new NotFoundException('Không tìm thấy bàn');
    }

    // Build order items & calculate pricing
    let subtotal = 0;
    interface PreparedItem {
      productId: string;
      productName: string;
      size: string;
      unitPrice: number;
      quantity: number;
      toppingsTotal: number;
      lineTotal: number;
      note?: string;
      toppings: Array<{ toppingId: string; toppingName: string; price: number }>;
    }
    const preparedItems: PreparedItem[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });
      if (!product || !product.isAvailable) {
        throw new BadRequestException(
          `Món ${product ? product.name : item.productId} hiện không khả dụng`,
        );
      }

      const variant = product.variants.find((v) => v.size === item.size);
      const unitPrice = product.basePrice + (variant ? variant.priceDelta : 0);

      let toppingsTotal = 0;
      const toppingsData: Array<{ toppingId: string; toppingName: string; price: number }> = [];
      if (item.toppingIds && item.toppingIds.length > 0) {
        const toppings = await this.prisma.topping.findMany({
          where: { id: { in: item.toppingIds }, isAvailable: true },
        });
        for (const t of toppings) {
          toppingsTotal += t.price;
          toppingsData.push({ toppingId: t.id, toppingName: t.name, price: t.price });
        }
      }

      const lineTotal = (unitPrice + toppingsTotal) * item.quantity;
      subtotal += lineTotal;

      preparedItems.push({
        productId: product.id,
        productName: product.name,
        size: item.size,
        unitPrice,
        quantity: item.quantity,
        toppingsTotal,
        lineTotal,
        note: item.note,
        toppings: toppingsData,
      });
    }

    let discountAmount = 0;
    let voucherId: string | null = null;
    if (dto.voucherCode) {
      const validated = await this.vouchersService.validateVoucher(
        dto.voucherCode,
        subtotal,
      );
      discountAmount = validated.discountAmount;
      voucherId = validated.voucher.id;
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);
    const orderCode = `CF${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderCode,
          type: dto.type || OrderType.DINE_IN,
          status: OrderStatus.PENDING,
          subtotal,
          discountAmount,
          totalAmount,
          note: dto.note,
          tableId: dto.tableId,
          customerId: dto.customerId,
          voucherId,
          createdById: userId,
          items: {
            create: preparedItems.map((pi) => ({
              productId: pi.productId,
              productName: pi.productName,
              size: pi.size,
              unitPrice: pi.unitPrice,
              quantity: pi.quantity,
              toppingsTotal: pi.toppingsTotal,
              lineTotal: pi.lineTotal,
              note: pi.note,
              toppings: {
                create: pi.toppings,
              },
            })),
          },
        },
        include: {
          items: { include: { toppings: true } },
          table: true,
          customer: true,
          voucher: true,
          createdBy: { select: { id: true, fullName: true, role: true } },
        },
      });

      if (dto.tableId) {
        await tx.table.update({
          where: { id: dto.tableId },
          data: { status: TableStatus.OCCUPIED },
        });
      }

      if (voucherId) {
        await tx.voucher.update({
          where: { id: voucherId },
          data: { usedCount: { increment: 1 } },
        });
      }

      if (dto.paymentMethod) {
        const paid = dto.paidAmount !== undefined ? dto.paidAmount : totalAmount;
        const change = Math.max(0, paid - totalAmount);
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            method: dto.paymentMethod,
            status: PaymentStatus.PAID,
            amount: totalAmount,
            paidAmount: paid,
            changeAmount: change,
            paidAt: new Date(),
            processedById: userId,
          },
        });
      }

      if (dto.customerId) {
        const pointsEarned = Math.floor(totalAmount / 10000);
        if (pointsEarned > 0) {
          await tx.customer.update({
            where: { id: dto.customerId },
            data: { loyaltyPoints: { increment: pointsEarned } },
          });
        }
      }

      return newOrder;
    });

    return this.findOne(order.id);
  }

  findAll(query: {
    status?: OrderStatus;
    type?: OrderType;
    tableId?: string;
    customerId?: string;
    from?: string;
    to?: string;
  }) {
    return this.prisma.order.findMany({
      where: {
        status: query.status || undefined,
        type: query.type || undefined,
        tableId: query.tableId || undefined,
        customerId: query.customerId || undefined,
        createdAt:
          query.from || query.to
            ? {
                gte: query.from ? new Date(query.from) : undefined,
                lte: query.to ? new Date(query.to) : undefined,
              }
            : undefined,
      },
      include: {
        items: { include: { toppings: true } },
        table: true,
        customer: true,
        payment: true,
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { toppings: true } },
        table: true,
        customer: true,
        voucher: true,
        payment: true,
        createdBy: { select: { id: true, fullName: true, role: true } },
      },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.order.update({
        where: { id },
        data: { status: dto.status },
      });

      if (
        (dto.status === OrderStatus.COMPLETED || dto.status === OrderStatus.CANCELLED) &&
        order.tableId
      ) {
        const activeOrdersOnTable = await tx.order.count({
          where: {
            tableId: order.tableId,
            id: { not: id },
            status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY] },
          },
        });
        if (activeOrdersOnTable === 0) {
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: TableStatus.AVAILABLE },
          });
        }
      }
      return res;
    });

    return this.findOne(updated.id);
  }
}

