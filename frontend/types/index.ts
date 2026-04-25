export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  locationId: string;
}

export interface LeaveBalance {
  totalDays: number;
  usedDays: number;
  availableDays: number;
  lastSyncedAt: string;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  locationId: string;
  daysRequested: number;
  reason: string | null;
  status: RequestStatus;
  managerId: number | null;
  hcmAcknowledged: boolean;
  managerNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncLog {
  id: number;
  syncType: 'REALTIME' | 'BATCH' | 'MANUAL';
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  employeesProcessed: number;
  errorDetails: string | null;
  createdAt: string;
}
