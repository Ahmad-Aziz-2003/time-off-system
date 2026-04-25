import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HcmClientService } from '../common/hcm-client.service';
import { LeaveBalance } from '../entities/leave-balance.entity';
import { LeaveRequest, RequestStatus } from '../entities/leave-request.entity';
import { SyncLog, SyncStatus, SyncType } from '../entities/sync-log.entity';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectRepository(LeaveBalance) private readonly balanceRepo: Repository<LeaveBalance>,
    @InjectRepository(LeaveRequest) private readonly requestRepo: Repository<LeaveRequest>,
    @InjectRepository(SyncLog) private readonly syncLogRepo: Repository<SyncLog>,
    private readonly hcmClient: HcmClientService,
  ) {}

  @Cron('0 */10 * * * *')
  async cronBatchSync() {
    this.logger.log('Scheduled batch sync started');

    try {
      const syncLog = await this.batchSync(SyncType.BATCH);
      this.logger.log(
        `Scheduled batch sync finished: status=${syncLog.status}, processed=${syncLog.employeesProcessed}`,
      );
    } catch (err) {
      this.logger.error('cron batchSync failed', err as any);
    }
  }

  async batchSync(syncType: SyncType | 'MANUAL' = SyncType.BATCH) {
    const resolvedType = syncType === 'MANUAL' ? SyncType.MANUAL : syncType;
    this.logger.log(`Batch sync started: type=${resolvedType}`);

    const records = await this.hcmClient.batchSync();

    if (!records || records.length === 0) {
      this.logger.warn(`Batch sync finished with no HCM records: type=${resolvedType}`);

      const failed = this.syncLogRepo.create({
        syncType: resolvedType,
        status: SyncStatus.FAILED,
        employeesProcessed: 0,
        errorDetails: 'HCM returned empty batch',
      });
      return await this.syncLogRepo.save(failed);
    }

    let processed = 0;
    let skipped = 0;

    for (const rec of records) {
      const pendingCount = await this.requestRepo.count({
        where: { employeeId: rec.employeeId, status: RequestStatus.PENDING },
      });

      if (pendingCount > 0) {
        skipped += 1;
        continue;
      }

      let local = await this.balanceRepo.findOne({
        where: { employeeId: rec.employeeId, locationId: rec.locationId },
      });

      if (!local) {
        local = this.balanceRepo.create({
          employeeId: rec.employeeId,
          locationId: rec.locationId,
          totalDays: rec.totalDays,
          usedDays: rec.usedDays,
          availableDays: rec.availableDays,
        });
      } else {
        local.totalDays = rec.totalDays;
        local.usedDays = rec.usedDays;
        local.availableDays = rec.availableDays;
      }

      await this.balanceRepo.save(local);
      processed += 1;
    }

    const status = skipped > 0 ? SyncStatus.PARTIAL : SyncStatus.SUCCESS;
    const log = this.syncLogRepo.create({
      syncType: resolvedType,
      status,
      employeesProcessed: processed,
      errorDetails: skipped > 0 ? `Skipped ${skipped} employees with pending requests` : null,
    });

    const savedLog = await this.syncLogRepo.save(log);

    this.logger.log(
      `Batch sync finished: type=${resolvedType}, status=${savedLog.status}, processed=${processed}, skipped=${skipped}`,
    );

    return savedLog;
  }

  async getRecentLogs() {
    return await this.syncLogRepo.find({ order: { createdAt: 'DESC' }, take: 20 });
  }
}
