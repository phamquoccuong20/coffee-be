import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductSize } from '../../common/enums';

export class ProductVariantDto {
  @ApiProperty({ enum: ProductSize, example: ProductSize.M })
  @IsEnum(ProductSize)
  size: ProductSize;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  priceDelta: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Cà phê sữa đá' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Cà phê phin truyền thống kết hợp sữa đặc' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 35000 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ example: 'https://example.com/cf-sua-da.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ example: 'category-cuid' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional({ type: [ProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}
