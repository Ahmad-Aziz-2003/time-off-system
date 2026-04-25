import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HcmBalance, HcmClientService } from '../common/hcm-client.service';
import { LeaveBalance } from '../entities/leave-balance.entity';
import { LeaveRequest, RequestStatus } from '../entities/leave-request.entity';

type SubmitLeaveRequestInput = {
  employeeId: number;
  locationId: string;
  daysRequested: number;
  reason?: string;
};

type ApproveLeaveRequestInput = {
  managerId: number;
  action: 'APPROVED' | 'REJECTED';
  managerNote?: string;
};

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(LeaveBalance) private readonly balanceRepo: Repository<LeaveBalance>,
    @InjectRepository(LeaveRequest) private readonly requestRepo: Repository<LeaveRequest>,
    private readonly hcmClient: HcmClientService,
  ) {}

  private applyHcmBalance(local: LeaveBalance, hcm: HcmBalance) {
    local.totalDays = hcm.totalDays;
    local.usedDays = hcm.usedDays;
    local.availableDays = hcm.availableDays;
  }

  async getBalance(employeeId: number) {
    const local = await this.balanceRepo.findOne({ where: { employeeId } });
    if (!local) throw new NotFoundException('Leave balance not found');

    const last = local.lastSyncedAt ? new Date(local.lastSyncedAt).getTime() : 0;
    const stale = Date.now() - last > 15 * 60 * 1000;
    if (!stale) return local;

    const hcm = await this.hcmClient.getBalance(employeeId, local.locationId);
    if (!hcm) return local;

    this.applyHcmBalance(local, hcm);
    return await this.balanceRepo.save(local);
  }

  async forceSyncBalance(employeeId: number) {
    const local = await this.balanceRepo.findOne({ where: { employeeId } });
    if (!local) throw new NotFoundException('Leave balance not found');

    const hcm = await this.hcmClient.getBalance(employeeId, local.locationId);
    if (!hcm) throw new ConflictException('HCM unavailable');

    this.applyHcmBalance(local, hcm);
    return await this.balanceRepo.save(local);
  }

  async submitRequest(input: SubmitLeaveRequestInput) {
    const local = await this.balanceRepo.findOne({
      where: { employeeId: input.employeeId, locationId: input.locationId },
    });
    if (!local) throw new NotFoundException('Leave balance not found');

    if (local.availableDays < input.daysRequested) {
      throw new BadRequestException('Insufficient balance');
    }

    const hcm = await this.hcmClient.getBalance(input.employeeId, input.locationId);
    if (!hcm) throw new ConflictException('HCM unavailable');

    if (hcm.availableDays < local.availableDays) {
      this.applyHcmBalance(local, hcm);
      await this.balanceRepo.save(local);
    }

    if (local.availableDays < input.daysRequested) {
      throw new BadRequestException('Insufficient balance');
    }

    const request = this.requestRepo.create({
      employeeId: input.employeeId,
      locationId: input.locationId,
      daysRequested: input.daysRequested,
      reason: input.reason ?? null,
      status: RequestStatus.PENDING,
      managerId: null,
      hcmAcknowledged: false,
      managerNote: null,
    });

    return await this.requestRepo.save(request);
  }

  async getRequestsForEmployee(employeeId: number) {
    return await this.requestRepo.find({
      where: { employeeId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllPending() {
    return await this.requestRepo.find({
      where: { status: RequestStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async approveRequest(requestId: number, input: ApproveLeaveRequestInput) {
    const request = await this.requestRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== RequestStatus.PENDING) throw new BadRequestException('Request is not PENDING');

    request.managerId = input.managerId;
    request.managerNote = input.managerNote ?? null;

    if (input.action === 'REJECTED') {
      request.status = RequestStatus.REJECTED;
      return await this.requestRepo.save(request);
    }

    const local = await this.balanceRepo.findOne({
      where: { employeeId: request.employeeId, locationId: request.locationId },
    });
    if (!local) throw new NotFoundException('Leave balance not found');

    const hcm = await this.hcmClient.getBalance(request.employeeId, request.locationId);
    if (!hcm) throw new ConflictException('HCM unavailable');

    if (hcm.availableDays < request.daysRequested) {
      if (hcm.availableDays < local.availableDays) {
        this.applyHcmBalance(local, hcm);
        await this.balanceRepo.save(local);
      }
      throw new BadRequestException('Insufficient balance');
    }

    const ok = await this.hcmClient.deductDays(request.employeeId, request.locationId, request.daysRequested);
    if (!ok) throw new ConflictException('HCM rejected the deduction');

    local.availableDays = Math.max(0, local.availableDays - request.daysRequested);
    local.usedDays = local.usedDays + request.daysRequested;
    await this.balanceRepo.save(local);

    request.hcmAcknowledged = true;
    request.status = RequestStatus.APPROVED;
    return await this.requestRepo.save(request);
  }

  async cancelRequest(requestId: number, employeeId: number) {
    const request = await this.requestRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.employeeId !== employeeId) throw new ForbiddenException('Not allowed');
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only PENDING requests can be cancelled');
    }

    request.status = RequestStatus.CANCELLED;
    await this.requestRepo.save(request);
  }
}
