import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { StockTransactionDto } from './dto/stock-transaction.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { IngredientsService } from './ingredients.service';

@ApiTags('Ingredients (Kho nguyên liệu)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ingredients')
export class IngredientsController {
  constructor(private ingredientsService: IngredientsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Thêm nguyên liệu mới vào kho' })
  create(@Body() dto: CreateIngredientDto) {
    return this.ingredientsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách tồn kho nguyên liệu' })
  findAll() {
    return this.ingredientsService.findAll();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Cảnh báo nguyên liệu sắp hết hàng' })
  findLowStock() {
    return this.ingredientsService.findLowStock();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết nguyên liệu & lịch sử nhập/xuất kho' })
  findOne(@Param('id') id: string) {
    return this.ingredientsService.findOne(id);
  }

  @Post(':id/transactions')
  @Roles(Role.ADMIN, Role.MANAGER, Role.BARISTA)
  @ApiOperation({ summary: 'Nhập kho / Xuất kho / Kiểm kê nguyên liệu' })
  adjustStock(
    @Param('id') id: string,
    @Body() dto: StockTransactionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ingredientsService.adjustStock(id, dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cập nhật thông tin nguyên liệu' })
  update(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.ingredientsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Xóa nguyên liệu' })
  remove(@Param('id') id: string) {
    return this.ingredientsService.remove(id);
  }
}

