import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReportsService } from './reports.service';

@ApiTags('Reports & Dashboard (Báo cáo doanh thu & Thống kê)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Tổng quan chỉ số kinh doanh trong ngày' })
  getDashboard() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Báo cáo doanh thu theo khoảng thời gian và hình thức thanh toán' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getRevenue(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getRevenueReport(from, to);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Top món bán chạy nhất quán' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopProducts(@Query('limit') limit?: string) {
    return this.reportsService.getTopSellingProducts(limit ? parseInt(limit, 10) : 10);
  }
}

