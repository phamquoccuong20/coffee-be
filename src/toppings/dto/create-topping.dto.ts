import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateToppingDto {
  @ApiProperty({ example: 'Trân châu đen' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 8000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

