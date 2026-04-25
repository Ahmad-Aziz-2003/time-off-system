import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HcmClientService } from '../common/hcm-client.service';
import { LeaveBalance } from '../entities/leave-balance.entity';
import { LeaveRequest } from '../entities/leave-request.entity';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveBalance, LeaveRequest])],
  controllers: [LeaveController],
  providers: [LeaveService, HcmClientService],
  exports: [LeaveService],
})
export class LeaveModule {}
