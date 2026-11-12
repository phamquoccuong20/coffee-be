import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ShiftStatus } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CloseShiftDto, OpenShiftDto } from './dto/shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  async openShift(dto: OpenShiftDto, userId: string) {
    const existingOpen = await this.prisma.shift.findFirst({
      where: { userId, status: ShiftStatus.OPEN },
    });
    if (existingOpen) {
      throw new BadRequestException('Bạn đang có một ca làm việc chưa kết thúc');
    }

    return this.prisma.shift.create({
      data: {
        userId,
        startingCash: dto.startingCash,
        note: dto.note,
        status: ShiftStatus.OPEN,
      },
      include: { user: { select: { id: true, fullName: true, role: true } } },
    });
  }

  async closeShift(id: string, dto: CloseShiftDto) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) throw new NotFoundException('Không tìm thấy ca làm việc');
    if (shift.status === ShiftStatus.CLOSED) {
      throw new BadRequestException('Ca này đã được đóng trước đó');
    }

    return this.prisma.shift.update({
      where: { id },
      data: {
        status: ShiftStatus.CLOSED,
        endTime: new Date(),
        endingCash: dto.endingCash,
        note: dto.note ? `${shift.note || ''} | Đóng ca: ${dto.note}` : shift.note,
      },
      include: { user: { select: { id: true, fullName: true } } },
    });
  }

  async getCurrentShift(userId: string) {
    return this.prisma.shift.findFirst({
      where: { userId, status: ShiftStatus.OPEN },
      include: { user: { select: { id: true, fullName: true } } },
    });
  }

  findAll() {
    return this.prisma.shift.findMany({
      include: { user: { select: { id: true, fullName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

