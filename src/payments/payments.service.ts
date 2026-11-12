import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, TableStatus } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async processPayment(dto: CreatePaymentDto, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Không thể thanh toán đơn hàng đã hủy');
    }
    if (order.payment && order.payment.status === PaymentStatus.PAID) {
      throw new ConflictException('Đơn hàng này đã được thanh toán');
    }
    if (dto.paidAmount < order.totalAmount) {
      throw new BadRequestException(
        `Số tiền khách đưa (${dto.paidAmount}) nhỏ hơn tổng hóa đơn (${order.totalAmount})`,
      );
    }

    const changeAmount = dto.paidAmount - order.totalAmount;

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          method: dto.method,
          status: PaymentStatus.PAID,
          amount: order.totalAmount,
          paidAmount: dto.paidAmount,
          changeAmount,
          transactionRef: dto.transactionRef,
          paidAt: new Date(),
          processedById: userId,
        },
        update: {
          method: dto.method,
          status: PaymentStatus.PAID,
          paidAmount: dto.paidAmount,
          changeAmount,
          transactionRef: dto.transactionRef,
          paidAt: new Date(),
          processedById: userId,
        },
        include: { order: true },
      });

      if (order.status === OrderStatus.READY || order.status === OrderStatus.PENDING) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.COMPLETED },
        });
        if (order.tableId) {
          const active = await tx.order.count({
            where: {
              tableId: order.tableId,
              id: { not: order.id },
              status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY] },
            },
          });
          if (active === 0) {
            await tx.table.update({
              where: { id: order.tableId },
              data: { status: TableStatus.AVAILABLE },
            });
          }
        }
      }

      return payment;
    });
  }

  findAll() {
    return this.prisma.payment.findMany({
      include: {
        order: { select: { id: true, orderCode: true, totalAmount: true } },
        processedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async refund(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    return this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.REFUNDED },
    });
  }
}

