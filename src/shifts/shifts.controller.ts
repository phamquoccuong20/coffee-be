import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { CloseShiftDto, OpenShiftDto } from './dto/shift.dto';
import { ShiftsService } from './shifts.service';

@ApiTags('Shifts (Giao ca & Tiền mặt)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private shiftsService: ShiftsService) {}

  @Post('open')
  @ApiOperation({ summary: 'Mở ca làm việc (khai báo tiền đầu ca)' })
  openShift(@Body() dto: OpenShiftDto, @CurrentUser() user: RequestUser) {
    return this.shiftsService.openShift(dto, user.id);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Đóng ca & bàn giao số dư kết ca' })
  closeShift(@Param('id') id: string, @Body() dto: CloseShiftDto) {
    return this.shiftsService.closeShift(id, dto);
  }

  @Get('current')
  @ApiOperation({ summary: 'Xem ca làm việc hiện tại của tôi' })
  getCurrent(@CurrentUser() user: RequestUser) {
    return this.shiftsService.getCurrentShift(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lịch sử toàn bộ ca làm việc' })
  findAll() {
    return this.shiftsService.findAll();
  }
}

