import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface HcmBalance {
  employeeId: number;
  locationId: string;
  totalDays: number;
  usedDays: number;
  availableDays: number;
}

export type HcmBatchRecord = HcmBalance;

@Injectable()
export class HcmClientService {
  private readonly logger = new Logger(HcmClientService.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('HCM_URL') ?? 'http://localhost:3001';
  }

  async getBalance(employeeId: number, locationId: string): Promise<HcmBalance | null> {
    try {
      const res = await axios.get(`${this.baseUrl}/hcm/balance/${employeeId}`, {
        params: { locationId },
      });

      if (res.data?.success) return res.data.data as HcmBalance;
      return null;
    } catch (err) {
      this.logger.error(`getBalance failed`, err as any);
      return null;
    }
  }

  async deductDays(employeeId: number, locationId: string, days: number): Promise<boolean> {
    try {
      const res = await axios.post(`${this.baseUrl}/hcm/deduct`, {
        employeeId,
        locationId,
        days,
      });

      return Boolean(res.data?.success);
    } catch (err) {
      this.logger.error(`deductDays failed`, err as any);
      return false;
    }
  }

  async restoreDays(employeeId: number, locationId: string, days: number): Promise<boolean> {
    try {
      const res = await axios.post(`${this.baseUrl}/hcm/restore`, {
        employeeId,
        locationId,
        days,
      });

      return Boolean(res.data?.success);
    } catch (err) {
      this.logger.error(`restoreDays failed`, err as any);
      return false;
    }
  }

  async batchSync(): Promise<HcmBatchRecord[]> {
    try {
      const res = await axios.get(`${this.baseUrl}/hcm/batch`);
      if (res.data?.success) return (res.data.data ?? []) as HcmBatchRecord[];
      return [];
    } catch (err) {
      this.logger.error(`batchSync failed`, err as any);
      return [];
    }
  }

  async simulateBonus(employeeId: number, locationId: string, bonusDays: number): Promise<boolean> {
    try {
      const res = await axios.post(`${this.baseUrl}/hcm/simulate/bonus`, {
        employeeId,
        locationId,
        bonusDays,
      });

      return Boolean(res.data?.success);
    } catch (err) {
      this.logger.error(`simulateBonus failed`, err as any);
      return false;
    }
  }
}
