import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { LeaveBalance } from '../entities/leave-balance.entity';
import { LeaveRequest, RequestStatus } from '../entities/leave-request.entity';
import { HcmClientService } from '../common/hcm-client.service';

describe('LeaveService', () => {
  const balanceRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((v) => v),
  };

  const requestRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((v) => v),
    count: jest.fn(),
  };

  const hcm: Partial<Record<keyof HcmClientService, any>> = {
    getBalance: jest.fn(),
    deductDays: jest.fn(),
  };

  const service = new LeaveService(balanceRepo as any, requestRepo as any, hcm as any);

  beforeEach(() => {
    jest.resetAllMocks();
    balanceRepo.create.mockImplementation((v) => ({ ...v }));
    requestRepo.create.mockImplementation((v) => ({ ...v }));
    balanceRepo.save.mockImplementation(async (v) => v);
    requestRepo.save.mockImplementation(async (v) => v);
  });

  it('submitRequest - happy path: saves request when balance sufficient', async () => {
    const local: LeaveBalance = {
      id: 1,
      employeeId: 1,
      locationId: 'LOC-1',
      totalDays: 10,
      usedDays: 0,
      availableDays: 10,
      lastSyncedAt: new Date(),
      version: 1,
    };

    balanceRepo.findOne.mockResolvedValue(local);
    (hcm.getBalance as jest.Mock).mockResolvedValue({
      employeeId: 1,
      locationId: 'LOC-1',
      totalDays: 10,
      usedDays: 0,
      availableDays: 10,
    });

    requestRepo.save.mockImplementation(async (r: LeaveRequest) => ({ ...r, id: 99 }));

    const req = await service.submitRequest({
      employeeId: 1,
      locationId: 'LOC-1',
      daysRequested: 2,
      reason: 'test',
    });

    expect(req.id).toBe(99);
    expect(requestRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: RequestStatus.PENDING }),
    );
  });

  it('submitRequest - throws 400 when local balance insufficient', async () => {
    balanceRepo.findOne.mockResolvedValue({ availableDays: 1 } as LeaveBalance);
    await expect(
      service.submitRequest({ employeeId: 1, locationId: 'LOC-1', daysRequested: 2, reason: 'x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('submitRequest - updates local balance when HCM returns lower value', async () => {
    const local: LeaveBalance = {
      id: 1,
      employeeId: 1,
      locationId: 'LOC-1',
      totalDays: 10,
      usedDays: 0,
      availableDays: 10,
      lastSyncedAt: new Date(),
      version: 1,
    };
    balanceRepo.findOne.mockResolvedValue(local);
    (hcm.getBalance as jest.Mock).mockResolvedValue({
      employeeId: 1,
      locationId: 'LOC-1',
      totalDays: 10,
      usedDays: 3,
      availableDays: 7,
    });
    requestRepo.save.mockImplementation(async (r: LeaveRequest) => ({ ...r, id: 1 }));

    const req = await service.submitRequest({
      employeeId: 1,
      locationId: 'LOC-1',
      daysRequested: 2,
      reason: 'ok',
    });

    expect(balanceRepo.save).toHaveBeenCalled();
    expect(requestRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: RequestStatus.PENDING }),
    );
  });

  it('submitRequest - throws 400 when HCM confirms insufficient', async () => {
    const local: LeaveBalance = {
      id: 1,
      employeeId: 1,
      locationId: 'LOC-1',
      totalDays: 10,
      usedDays: 0,
      availableDays: 10,
      lastSyncedAt: new Date(),
      version: 1,
    };
    balanceRepo.findOne.mockResolvedValue(local);
    (hcm.getBalance as jest.Mock).mockResolvedValue({
      employeeId: 1,
      locationId: 'LOC-1',
      totalDays: 10,
      usedDays: 8,
      availableDays: 2,
    });

    await expect(
      service.submitRequest({ employeeId: 1, locationId: 'LOC-1', daysRequested: 5, reason: 'x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('approveRequest - deducts from HCM and updates local balance on APPROVED', async () => {
    requestRepo.findOne.mockResolvedValue({
      id: 1,
      employeeId: 1,
      locationId: 'LOC-1',
      daysRequested: 3,
      status: RequestStatus.PENDING,
      managerId: null,
      managerNote: null,
      hcmAcknowledged: false,
    } as LeaveRequest);

    balanceRepo.findOne.mockResolvedValue({
      id: 1,
      employeeId: 1,
      locationId: 'LOC-1',
      totalDays: 15,
      usedDays: 0,
      availableDays: 15,
    } as LeaveBalance);

    (hcm.getBalance as jest.Mock).mockResolvedValue({
      employeeId: 1,
      locationId: 'LOC-1',
      totalDays: 15,
      usedDays: 0,
      availableDays: 15,
    });
    (hcm.deductDays as jest.Mock).mockResolvedValue(true);

    requestRepo.save.mockImplementation(async (r: LeaveRequest) => r);
    balanceRepo.save.mockImplementation(async (b: LeaveBalance) => b);

    const updated = await service.approveRequest(1, { managerId: 4, action: 'APPROVED' });
    expect(updated.status).toBe(RequestStatus.APPROVED);
    expect(updated.hcmAcknowledged).toBe(true);
    expect(balanceRepo.save).toHaveBeenCalled();
  });

  it('approveRequest - throws 409 when HCM deduction fails', async () => {
    requestRepo.findOne.mockResolvedValue({
      id: 1,
      employeeId: 1,
      locationId: 'LOC-1',
      daysRequested: 3,
      status: RequestStatus.PENDING,
    } as LeaveRequest);
    balanceRepo.findOne.mockResolvedValue({
      employeeId: 1,
      locationId: 'LOC-1',
      totalDays: 15,
      usedDays: 0,
      availableDays: 15,
    } as LeaveBalance);
    (hcm.getBalance as jest.Mock).mockResolvedValue({ availableDays: 15, totalDays: 15, usedDays: 0 } as any);
    (hcm.deductDays as jest.Mock).mockResolvedValue(false);

    await expect(service.approveRequest(1, { managerId: 4, action: 'APPROVED' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('approveRequest - sets REJECTED status without HCM call', async () => {
    requestRepo.findOne.mockResolvedValue({
      id: 1,
      employeeId: 1,
      locationId: 'LOC-1',
      daysRequested: 3,
      status: RequestStatus.PENDING,
      hcmAcknowledged: false,
      managerId: null,
      managerNote: null,
    } as LeaveRequest);

    requestRepo.save.mockImplementation(async (r: LeaveRequest) => r);

    const updated = await service.approveRequest(1, { managerId: 4, action: 'REJECTED' });
    expect(updated.status).toBe(RequestStatus.REJECTED);
    expect(hcm.getBalance).not.toHaveBeenCalled();
    expect(hcm.deductDays).not.toHaveBeenCalled();
  });

  it('approveRequest - throws 404 when request not found', async () => {
    requestRepo.findOne.mockResolvedValue(null);
    await expect(service.approveRequest(1, { managerId: 4, action: 'APPROVED' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('approveRequest - throws 400 when request is not PENDING', async () => {
    requestRepo.findOne.mockResolvedValue({ status: RequestStatus.APPROVED } as LeaveRequest);
    await expect(service.approveRequest(1, { managerId: 4, action: 'APPROVED' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('cancelRequest - sets status to CANCELLED for PENDING request', async () => {
    requestRepo.findOne.mockResolvedValue({
      id: 1,
      employeeId: 1,
      status: RequestStatus.PENDING,
    } as LeaveRequest);
    requestRepo.save.mockImplementation(async (r: LeaveRequest) => r);

    await service.cancelRequest(1, 1);
    expect(requestRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: RequestStatus.CANCELLED }));
  });

  it('cancelRequest - throws 400 when request is already APPROVED', async () => {
    requestRepo.findOne.mockResolvedValue({ employeeId: 1, status: RequestStatus.APPROVED } as LeaveRequest);
    await expect(service.cancelRequest(1, 1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cancelRequest - throws 403 when employee does not own request', async () => {
    requestRepo.findOne.mockResolvedValue({ employeeId: 2, status: RequestStatus.PENDING } as LeaveRequest);
    await expect(service.cancelRequest(1, 1)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
