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
import { Role, TableStatus } from '../common/enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { TablesService } from './tables.service';

@ApiTags('Tables (Bàn & Khu vực)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tables')
export class TablesController {
  constructor(private tablesService: TablesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Tạo bàn mới' })
  create(@Body() dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách bàn theo khu vực / trạng thái' })
  @ApiQuery({ name: 'zone', required: false })
  @ApiQuery({ name: 'status', required: false, enum: TableStatus })
  findAll(@Query('zone') zone?: string, @Query('status') status?: TableStatus) {
    return this.tablesService.findAll({ zone, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết bàn & các đơn đang phục vụ' })
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Cập nhật bàn / trạng thái bàn' })
  update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.tablesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Xóa bàn' })
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}

