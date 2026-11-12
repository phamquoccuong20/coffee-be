import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { StockTransactionType } from '../../common/enums';

export class StockTransactionDto {
  @ApiProperty({ enum: StockTransactionType, example: StockTransactionType.IN })
  @IsEnum(StockTransactionType)
  type: StockTransactionType;

  @ApiProperty({ example: 2000 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ example: 'Nhập hàng đầu tuần' })
  @IsOptional()
  @IsString()
  note?: string;
}

