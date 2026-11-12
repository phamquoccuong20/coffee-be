import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OpenShiftDto {
  @ApiProperty({ example: 1000000 })
  @IsNumber()
  @Min(0)
  startingCash: number;

  @ApiPropertyOptional({ example: 'Bắt đầu ca sáng' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CloseShiftDto {
  @ApiProperty({ example: 4500000 })
  @IsNumber()
  @Min(0)
  endingCash: number;

  @ApiPropertyOptional({ example: 'Bàn giao ca cho ca chiều' })
  @IsOptional()
  @IsString()
  note?: string;
}

