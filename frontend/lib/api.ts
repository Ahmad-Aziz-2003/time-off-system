import axios, { AxiosError } from 'axios';
import type { Employee, LeaveBalance, LeaveRequest, SyncLog } from '@/types';

const API_BASE_URL = 'http://localhost:3002';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type LoginResponse = {
  employee: Employee;
  token: string;
};

let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }

    return Promise.reject(error);
  },
);

const extractError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error ?? error.message ?? 'Request failed';
  }

  return 'Unknown error';
};

const unwrap = <T>(payload: ApiResponse<T>): T => {
  if (!payload.success || payload.data === undefined) {
    throw new Error(payload.error ?? 'Request failed');
  }

  return payload.data;
};

export const isNetworkError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;
  return !error.response;
};

export const getApiErrorMessage = (error: unknown): string => extractError(error);

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  try {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
    return unwrap(data);
  } catch (error) {
    throw new Error(extractError(error));
  }
}

export async function getBalanceApi(employeeId: number): Promise<LeaveBalance> {
  const { data } = await api.get<ApiResponse<LeaveBalance>>(`/leave/balance/${employeeId}`);
  return unwrap(data);
}

export async function forceSyncBalanceApi(employeeId: number): Promise<LeaveBalance> {
  const { data } = await api.get<ApiResponse<LeaveBalance>>(`/leave/balance/${employeeId}/sync`);
  return unwrap(data);
}

export async function submitRequestApi(payload: {
  employeeId: number;
  locationId: string;
  daysRequested: number;
  reason: string;
}): Promise<LeaveRequest> {
  const { data } = await api.post<ApiResponse<LeaveRequest>>('/leave/request', payload);
  return unwrap(data);
}

export async function getMyRequestsApi(employeeId: number): Promise<LeaveRequest[]> {
  const { data } = await api.get<ApiResponse<LeaveRequest[]>>(`/leave/requests/${employeeId}`);
  return unwrap(data);
}

export async function cancelRequestApi(requestId: number, employeeId: number): Promise<void> {
  await api.delete<ApiResponse<undefined>>(`/leave/request/${requestId}`, { data: { employeeId } });
}

export async function getPendingAllApi(): Promise<LeaveRequest[]> {
  const { data } = await api.get<ApiResponse<LeaveRequest[]>>('/leave/requests/pending/all');
  return unwrap(data);
}

export async function approveRequestApi(
  requestId: number,
  payload: { managerId: number; action: 'APPROVED' | 'REJECTED'; managerNote?: string },
): Promise<LeaveRequest> {
  const { data } = await api.post<ApiResponse<LeaveRequest>>(`/leave/approve/${requestId}`, payload);
  return unwrap(data);
}

export async function triggerSyncApi(): Promise<SyncLog> {
  const { data } = await api.post<ApiResponse<SyncLog>>('/sync/trigger');
  return unwrap(data);
}

export async function getSyncLogsApi(): Promise<SyncLog[]> {
  const { data } = await api.get<ApiResponse<SyncLog[]>>('/sync/logs');
  return unwrap(data);
}
