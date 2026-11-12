import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductSize } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Danh mục không tồn tại');

    const { variants, ...productData } = dto;
    const defaultVariants =
      variants && variants.length > 0
        ? variants
        : [
            { size: ProductSize.S, priceDelta: -5000 },
            { size: ProductSize.M, priceDelta: 0 },
            { size: ProductSize.L, priceDelta: 6000 },
          ];

    return this.prisma.product.create({
      data: {
        ...productData,
        variants: {
          create: defaultVariants,
        },
      },
      include: { category: true, variants: true },
    });
  }

  findAll(query: { categoryId?: string; search?: string; available?: boolean }) {
    return this.prisma.product.findMany({
      where: {
        categoryId: query.categoryId || undefined,
        isAvailable: query.available !== undefined ? query.available : undefined,
        name: query.search ? { contains: query.search } : undefined,
      },
      include: { category: true, variants: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true },
    });
    if (!product) throw new NotFoundException('Không tìm thấy món');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    const { variants, ...productData } = dto;

    if (variants) {
      await this.prisma.productVariant.deleteMany({ where: { productId: id } });
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(variants ? { variants: { create: variants } } : {}),
      },
      include: { category: true, variants: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
