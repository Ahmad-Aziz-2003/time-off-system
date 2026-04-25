import { Controller, Get, Post } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('trigger')
  async trigger() {
    const syncLog = await this.syncService.batchSync('MANUAL');
    return { success: true, data: syncLog };
  }

  @Get('logs')
  async logs() {
    const logs = await this.syncService.getRecentLogs();
    return { success: true, data: logs };
  }
}
