import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateToppingDto } from './dto/create-topping.dto';
import { UpdateToppingDto } from './dto/update-topping.dto';
import { ToppingsService } from './toppings.service';

@ApiTags('Toppings')
@Controller('toppings')
export class ToppingsController {
  constructor(private toppingsService: ToppingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thêm topping mới' })
  create(@Body() dto: CreateToppingDto) {
    return this.toppingsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách topping' })
  @ApiQuery({ name: 'available', required: false, type: Boolean })
  findAll(@Query('available') available?: string) {
    return this.toppingsService.findAll(available === 'true');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BARISTA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật topping' })
  update(@Param('id') id: string, @Body() dto: UpdateToppingDto) {
    return this.toppingsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa topping' })
  remove(@Param('id') id: string) {
    return this.toppingsService.remove(id);
  }
}

