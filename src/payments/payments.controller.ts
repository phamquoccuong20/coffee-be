import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments (Thanh toán & Hóa đơn)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Thanh toán đơn hàng & tính tiền thừa' })
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: RequestUser) {
    return this.paymentsService.processPayment(dto, user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Lịch sử giao dịch thanh toán' })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Patch(':id/refund')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Hoàn tiền giao dịch' })
  refund(@Param('id') id: string) {
    return this.paymentsService.refund(id);
  }
}

