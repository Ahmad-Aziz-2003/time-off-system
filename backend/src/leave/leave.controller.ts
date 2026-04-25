import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { LeaveService } from './leave.service';

class SubmitLeaveRequestDto {
  @IsNumber()
  employeeId: number;

  @IsString()
  locationId: string;

  @IsNumber()
  @Min(0.01)
  daysRequested: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

class ApproveLeaveRequestDto {
  @IsNumber()
  managerId: number;

  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  action: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  managerNote?: string;
}

class CancelLeaveRequestDto {
  @IsNumber()
  employeeId: number;
}

@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get('balance/:employeeId')
  async getBalance(@Param('employeeId') employeeId: string) {
    const balance = await this.leaveService.getBalance(Number(employeeId));
    return { success: true, data: balance };
  }

  @Get('balance/:employeeId/sync')
  async syncBalance(@Param('employeeId') employeeId: string) {
    const balance = await this.leaveService.forceSyncBalance(Number(employeeId));
    return { success: true, data: balance };
  }

  @Post('request')
  async submitRequest(@Body() dto: SubmitLeaveRequestDto) {
    const request = await this.leaveService.submitRequest(dto);
    return { success: true, data: request };
  }

  @Get('requests/:employeeId')
  async listEmployeeRequests(@Param('employeeId') employeeId: string) {
    const requests = await this.leaveService.getRequestsForEmployee(Number(employeeId));
    return { success: true, data: requests };
  }

  @Get('requests/pending/all')
  async listPendingAll() {
    const requests = await this.leaveService.getAllPending();
    return { success: true, data: requests };
  }

  @Post('approve/:requestId')
  @HttpCode(200)
  async approve(@Param('requestId') requestId: string, @Body() dto: ApproveLeaveRequestDto) {
    const updated = await this.leaveService.approveRequest(Number(requestId), dto);
    return { success: true, data: updated };
  }

  @Delete('request/:requestId')
  async cancel(@Param('requestId') requestId: string, @Body() dto: CancelLeaveRequestDto) {
    await this.leaveService.cancelRequest(Number(requestId), dto.employeeId);
    return { success: true };
  }
}
