import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { HcmClientService } from './hcm-client.service';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('HcmClientService', () => {
  const mockAxios = axios as unknown as {
    get: jest.Mock;
    post: jest.Mock;
  };

  let service: HcmClientService;

  beforeEach(() => {
    mockAxios.get.mockReset();
    mockAxios.post.mockReset();
    const config = {
      get: (key: string) => (key === 'HCM_URL' ? 'http://localhost:3001' : undefined),
    } as unknown as ConfigService;
    service = new HcmClientService(config);
  });

  it('getBalance - returns balance data on success', async () => {
    mockAxios.get.mockResolvedValue({
      data: {
        success: true,
        data: { employeeId: 1, locationId: 'LOC-1', totalDays: 10, usedDays: 2, availableDays: 8 },
      },
    });

    const result = await service.getBalance(1, 'LOC-1');
    expect(result?.availableDays).toBe(8);
  });

  it('getBalance - returns null on axios error', async () => {
    mockAxios.get.mockRejectedValue(new Error('network'));
    const result = await service.getBalance(1, 'LOC-1');
    expect(result).toBeNull();
  });

  it('deductDays - returns true on success', async () => {
    mockAxios.post.mockResolvedValue({ data: { success: true } });
    const ok = await service.deductDays(1, 'LOC-1', 1);
    expect(ok).toBe(true);
  });

  it('deductDays - returns false on 400 error', async () => {
    mockAxios.post.mockRejectedValue({ response: { status: 400 } });
    const ok = await service.deductDays(1, 'LOC-1', 99);
    expect(ok).toBe(false);
  });

  it('restoreDays - returns true on success', async () => {
    mockAxios.post.mockResolvedValue({ data: { success: true } });
    const ok = await service.restoreDays(1, 'LOC-1', 1);
    expect(ok).toBe(true);
  });

  it('batchSync - returns array of records', async () => {
    mockAxios.get.mockResolvedValue({
      data: {
        success: true,
        data: [{ employeeId: 1, locationId: 'LOC-1', totalDays: 10, usedDays: 0, availableDays: 10 }],
      },
    });
    const list = await service.batchSync();
    expect(list.length).toBe(1);
  });

  it('batchSync - returns empty array on failure', async () => {
    mockAxios.get.mockRejectedValue(new Error('nope'));
    const list = await service.batchSync();
    expect(list).toEqual([]);
  });
});
