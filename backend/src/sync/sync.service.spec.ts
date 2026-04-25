import { SyncService } from './sync.service';
import { SyncStatus, SyncType } from '../entities/sync-log.entity';

describe('SyncService', () => {
  const balanceRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((v) => v),
  };
  const requestRepo = {
    count: jest.fn(),
  };
  const syncLogRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({ ...v, id: 1 })),
    find: jest.fn(),
  };
  const hcm = {
    batchSync: jest.fn(),
  };

  const service = new SyncService(balanceRepo as any, requestRepo as any, syncLogRepo as any, hcm as any);

  beforeEach(() => {
    jest.resetAllMocks();
    balanceRepo.create.mockImplementation((v) => ({ ...v }));
    syncLogRepo.create.mockImplementation((v) => ({ ...v }));
    balanceRepo.save.mockImplementation(async (v) => v);
    syncLogRepo.save.mockImplementation(async (v) => ({ ...v, id: 1 }));
  });

  it('batchSync - updates balance for employees with no pending requests', async () => {
    hcm.batchSync.mockResolvedValue([
      { employeeId: 1, locationId: 'LOC-1', totalDays: 10, usedDays: 0, availableDays: 10 },
    ]);
    requestRepo.count.mockResolvedValue(0);
    balanceRepo.findOne.mockResolvedValue({ employeeId: 1, locationId: 'LOC-1' });
    balanceRepo.save.mockResolvedValue(true);

    const log = await service.batchSync(SyncType.BATCH);
    expect(balanceRepo.save).toHaveBeenCalled();
    expect(log.status).toBe(SyncStatus.SUCCESS);
  });

  it('batchSync - skips employees with PENDING requests', async () => {
    hcm.batchSync.mockResolvedValue([
      { employeeId: 1, locationId: 'LOC-1', totalDays: 10, usedDays: 0, availableDays: 10 },
      { employeeId: 2, locationId: 'LOC-1', totalDays: 12, usedDays: 0, availableDays: 12 },
    ]);
    requestRepo.count.mockImplementation(async (args: any) =>
      args?.where?.employeeId === 2 ? 1 : 0,
    );
    balanceRepo.findOne.mockResolvedValue({ employeeId: 1, locationId: 'LOC-1' });
    balanceRepo.save.mockResolvedValue(true);

    const log = await service.batchSync(SyncType.BATCH);
    expect(log.status).toBe(SyncStatus.PARTIAL);
  });

  it('batchSync - saves SUCCESS sync log when all processed', async () => {
    hcm.batchSync.mockResolvedValue([
      { employeeId: 1, locationId: 'LOC-1', totalDays: 10, usedDays: 0, availableDays: 10 },
    ]);
    requestRepo.count.mockResolvedValue(0);
    balanceRepo.findOne.mockResolvedValue({ employeeId: 1, locationId: 'LOC-1' });
    balanceRepo.save.mockResolvedValue(true);
    const log = await service.batchSync(SyncType.BATCH);
    expect(log.status).toBe(SyncStatus.SUCCESS);
  });

  it('batchSync - saves PARTIAL sync log when some skipped', async () => {
    hcm.batchSync.mockResolvedValue([
      { employeeId: 1, locationId: 'LOC-1', totalDays: 10, usedDays: 0, availableDays: 10 },
      { employeeId: 2, locationId: 'LOC-1', totalDays: 12, usedDays: 0, availableDays: 12 },
    ]);
    requestRepo.count.mockImplementation(async (args: any) =>
      args?.where?.employeeId === 2 ? 1 : 0,
    );
    balanceRepo.findOne.mockResolvedValue({ employeeId: 1, locationId: 'LOC-1' });
    balanceRepo.save.mockResolvedValue(true);
    const log = await service.batchSync(SyncType.BATCH);
    expect(log.status).toBe(SyncStatus.PARTIAL);
  });

  it('batchSync - saves FAILED sync log when HCM returns empty', async () => {
    hcm.batchSync.mockResolvedValue([]);
    const log = await service.batchSync(SyncType.BATCH);
    expect(log.status).toBe(SyncStatus.FAILED);
  });
});
