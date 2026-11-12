import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToppingDto } from './dto/create-topping.dto';
import { UpdateToppingDto } from './dto/update-topping.dto';

@Injectable()
export class ToppingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateToppingDto) {
    const exists = await this.prisma.topping.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Topping đã tồn tại');
    return this.prisma.topping.create({ data: dto });
  }

  findAll(onlyAvailable?: boolean) {
    return this.prisma.topping.findMany({
      where: onlyAvailable ? { isAvailable: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const topping = await this.prisma.topping.findUnique({ where: { id } });
    if (!topping) throw new NotFoundException('Không tìm thấy topping');
    return topping;
  }

  async update(id: string, dto: UpdateToppingDto) {
    await this.findOne(id);
    return this.prisma.topping.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.topping.delete({ where: { id } });
  }
}

