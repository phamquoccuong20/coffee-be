import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StockTransactionType } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { StockTransactionDto } from './dto/stock-transaction.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateIngredientDto) {
    const exists = await this.prisma.ingredient.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Nguyên liệu đã tồn tại');
    return this.prisma.ingredient.create({ data: dto });
  }

  findAll() {
    return this.prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
  }

  async findLowStock() {
    const all = await this.prisma.ingredient.findMany({ orderBy: { currentStock: 'asc' } });
    return all.filter((item) => item.currentStock <= item.minStock);
  }

  async findOne(id: string) {
    const item = await this.prisma.ingredient.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { createdBy: { select: { id: true, fullName: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException('Không tìm thấy nguyên liệu');
    return item;
  }

  async adjustStock(id: string, dto: StockTransactionDto, userId: string) {
    const ingredient = await this.findOne(id);
    let newStock = ingredient.currentStock;

    if (dto.type === StockTransactionType.IN) {
      newStock += dto.quantity;
    } else if (dto.type === StockTransactionType.OUT) {
      if (ingredient.currentStock < dto.quantity) {
        throw new BadRequestException('Số lượng tồn kho không đủ để xuất');
      }
      newStock -= dto.quantity;
    } else if (dto.type === StockTransactionType.ADJUST) {
      newStock = dto.quantity;
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.stockTransaction.create({
        data: {
          ingredientId: id,
          type: dto.type,
          quantity: dto.quantity,
          note: dto.note,
          createdById: userId,
        },
      });
      return tx.ingredient.update({
        where: { id },
        data: { currentStock: newStock },
      });
    });
  }

  async update(id: string, dto: UpdateIngredientDto) {
    await this.findOne(id);
    return this.prisma.ingredient.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.ingredient.delete({ where: { id } });
  }
}

