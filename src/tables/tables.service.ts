import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TableStatus } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTableDto) {
    const exists = await this.prisma.table.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Tên bàn đã tồn tại');
    return this.prisma.table.create({ data: dto });
  }

  findAll(query: { zone?: string; status?: TableStatus }) {
    return this.prisma.table.findMany({
      where: {
        zone: query.zone || undefined,
        status: query.status || undefined,
      },
      orderBy: [{ zone: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: { in: ['PENDING', 'PREPARING', 'READY'] } },
          include: { items: true },
        },
      },
    });
    if (!table) throw new NotFoundException('Không tìm thấy bàn');
    return table;
  }

  async update(id: string, dto: UpdateTableDto) {
    await this.findOne(id);
    return this.prisma.table.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.table.delete({ where: { id } });
  }
}

