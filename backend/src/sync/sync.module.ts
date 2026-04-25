import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HcmClientService } from '../common/hcm-client.service';
import { LeaveBalance } from '../entities/leave-balance.entity';
import { LeaveRequest } from '../entities/leave-request.entity';
import { SyncLog } from '../entities/sync-log.entity';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveBalance, LeaveRequest, SyncLog])],
  controllers: [SyncController],
  providers: [SyncService, HcmClientService],
})
export class SyncModule {}
