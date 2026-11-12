import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayPaidPayments,
      todayOrdersCount,
      activeOrdersCount,
      lowStockCount,
      occupiedTablesCount,
      totalTablesCount,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          createdAt: { gte: today },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.order.count({
        where: {
          status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY] },
        },
      }),
      this.prisma.ingredient.findMany({
        select: { id: true, currentStock: true, minStock: true },
      }).then((items) => items.filter((i) => i.currentStock <= i.minStock).length),
      this.prisma.table.count({ where: { status: 'OCCUPIED' } }),
      this.prisma.table.count(),
    ]);

    return {
      todayRevenue: todayPaidPayments._sum.amount || 0,
      todayPaidTransactions: todayPaidPayments._count,
      todayOrdersCount,
      activeOrdersCount,
      lowStockCount,
      tableOccupancy: {
        occupied: occupiedTablesCount,
        total: totalTablesCount,
        rate: totalTablesCount > 0 ? (occupiedTablesCount / totalTablesCount) * 100 : 0,
      },
    };
  }

  async getRevenueReport(from?: string, to?: string) {
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const endDate = to ? new Date(to) : new Date();

    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        paidAt: { gte: startDate, lte: endDate },
      },
      select: {
        amount: true,
        method: true,
        paidAt: true,
      },
    });

    const revenueByMethod: Record<string, number> = {};
    let totalRevenue = 0;

    for (const p of payments) {
      totalRevenue += p.amount;
      revenueByMethod[p.method] = (revenueByMethod[p.method] || 0) + p.amount;
    }

    return {
      from: startDate,
      to: endDate,
      totalRevenue,
      totalOrders: payments.length,
      averageOrderValue: payments.length > 0 ? totalRevenue / payments.length : 0,
      revenueByMethod,
    };
  }

  async getTopSellingProducts(limit = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    return items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      totalQuantitySold: i._sum.quantity || 0,
      totalRevenueGenerated: i._sum.lineTotal || 0,
    }));
  }
}

