import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscountType } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';

@Injectable()
export class VouchersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVoucherDto) {
    const code = dto.code.trim().toUpperCase();
    const exists = await this.prisma.voucher.findUnique({ where: { code } });
    if (exists) throw new ConflictException('Mã voucher đã tồn tại');

    return this.prisma.voucher.create({
      data: {
        ...dto,
        code,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  findAll(onlyActive?: boolean) {
    return this.prisma.voucher.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const voucher = await this.prisma.voucher.findUnique({ where: { id } });
    if (!voucher) throw new NotFoundException('Không tìm thấy voucher');
    return voucher;
  }

  async validateVoucher(code: string, orderAmount: number) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!voucher || !voucher.isActive) {
      throw new BadRequestException('Mã giảm giá không hợp lệ hoặc đã tắt');
    }
    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      throw new BadRequestException('Mã giảm giá chưa đến hạn hoặc đã hết hạn');
    }
    if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }
    if (orderAmount < voucher.minOrderAmount) {
      throw new BadRequestException(
        `Đơn hàng cần đạt tối thiểu ${voucher.minOrderAmount.toLocaleString('vi-VN')}đ`,
      );
    }

    let discount = 0;
    if (voucher.discountType === DiscountType.PERCENTAGE) {
      discount = (orderAmount * voucher.discountValue) / 100;
      if (voucher.maxDiscount && discount > voucher.maxDiscount) {
        discount = voucher.maxDiscount;
      }
    } else {
      discount = voucher.discountValue;
    }

    return {
      voucher,
      discountAmount: Math.min(discount, orderAmount),
    };
  }

  async update(id: string, dto: UpdateVoucherDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.code) data.code = dto.code.trim().toUpperCase();
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    return this.prisma.voucher.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.voucher.delete({ where: { id } });
  }
}

