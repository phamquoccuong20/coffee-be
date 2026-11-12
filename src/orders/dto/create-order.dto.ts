import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderType, PaymentMethod, ProductSize } from '../../common/enums';

export class OrderItemDto {
  @ApiProperty({ example: 'product-cuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ enum: ProductSize, example: ProductSize.M })
  @IsEnum(ProductSize)
  size: ProductSize;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ type: [String], example: ['topping-cuid-1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toppingIds?: string[];

  @ApiPropertyOptional({ example: 'Ít đường, nhiều đá' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ enum: OrderType, default: OrderType.DINE_IN })
  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @ApiPropertyOptional({ example: 'table-cuid' })
  @IsOptional()
  @IsString()
  tableId?: string;

  @ApiPropertyOptional({ example: 'customer-cuid' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: 'SUMMER20' })
  @IsOptional()
  @IsString()
  voucherCode?: string;

  @ApiPropertyOptional({ example: 'Giao nhanh giúp mình' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  paidAmount?: number;
}

