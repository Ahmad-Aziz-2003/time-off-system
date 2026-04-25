'use client';

import { create } from 'zustand';
import toast from 'react-hot-toast';
import {
  approveRequestApi,
  cancelRequestApi,
  forceSyncBalanceApi,
  getApiErrorMessage,
  getBalanceApi,
  getMyRequestsApi,
  getPendingAllApi,
  isNetworkError,
  submitRequestApi,
} from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { RequestStatus, type LeaveBalance, type LeaveRequest } from '@/types';

type LeaveState = {
  balance: LeaveBalance | null;
  requests: LeaveRequest[];
  pendingRequests: LeaveRequest[];
  isLoading: boolean;
  isSyncingBalance: boolean;
  networkWarning: string | null;
  error: string | null;
  fetchBalance: (employeeId: number) => Promise<void>;
  forceSyncBalance: (employeeId: number) => Promise<void>;
  submitRequest: (payload: {
    employeeId: number;
    locationId: string;
    daysRequested: number;
    reason: string;
  }) => Promise<void>;
  fetchMyRequests: (employeeId: number) => Promise<void>;
  cancelRequest: (requestId: number) => Promise<void>;
  fetchPendingAll: () => Promise<void>;
  approveRequest: (
    requestId: number,
    managerId: number,
    action: 'APPROVED' | 'REJECTED',
    note: string,
  ) => Promise<void>;
};

const setErrorAndToast = (error: unknown, set: (p: Partial<LeaveState>) => void) => {
  const message = getApiErrorMessage(error);
  const network = isNetworkError(error);

  set({
    error: message,
    networkWarning: network ? 'HCM offline - showing cached data' : null,
  });

  toast.error(network ? 'HCM offline - showing cached data' : message);
};

export const useLeaveStore = create<LeaveState>((set, get) => ({
  balance: null,
  requests: [],
  pendingRequests: [],
  isLoading: false,
  isSyncingBalance: false,
  networkWarning: null,
  error: null,

  fetchBalance: async (employeeId) => {
    set({ isLoading: true, error: null });
    try {
      const balance = await getBalanceApi(employeeId);
      set({ balance, isLoading: false, networkWarning: null });
    } catch (error) {
      set({ isLoading: false });
      setErrorAndToast(error, set);
    }
  },

  forceSyncBalance: async (employeeId) => {
    set({ isSyncingBalance: true, error: null });
    try {
      const balance = await forceSyncBalanceApi(employeeId);
      set({ balance, isSyncingBalance: false, networkWarning: null });
      toast.success('Balance synced');
    } catch (error) {
      set({ isSyncingBalance: false });
      setErrorAndToast(error, set);
    }
  },

  submitRequest: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const created = await submitRequestApi(payload);
      set((state) => ({
        requests: [created, ...state.requests],
        isLoading: false,
        networkWarning: null,
      }));
      toast.success('Leave request submitted!');
    } catch (error) {
      set({ isLoading: false });
      setErrorAndToast(error, set);
      throw error;
    }
  },

  fetchMyRequests: async (employeeId) => {
    set({ isLoading: true, error: null });
    try {
      const requests = await getMyRequestsApi(employeeId);
      set({ requests, isLoading: false, networkWarning: null });
    } catch (error) {
      set({ isLoading: false });
      setErrorAndToast(error, set);
    }
  },

  cancelRequest: async (requestId) => {
    const employeeId = useAuthStore.getState().employee?.id;
    if (!employeeId) return;

    try {
      await cancelRequestApi(requestId, employeeId);
      set((state) => ({
        requests: state.requests.map((request) =>
          request.id === requestId ? { ...request, status: RequestStatus.CANCELLED } : request,
        ),
      }));
      toast.success('Request cancelled');
    } catch (error) {
      setErrorAndToast(error, set);
    }
  },

  fetchPendingAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const pendingRequests = await getPendingAllApi();
      set({ pendingRequests, isLoading: false, networkWarning: null });
    } catch (error) {
      set({ isLoading: false });
      setErrorAndToast(error, set);
    }
  },

  approveRequest: async (requestId, managerId, action, note) => {
    const previous = get().pendingRequests;
    set({ pendingRequests: previous.filter((item) => item.id !== requestId), error: null });

    try {
      await approveRequestApi(requestId, {
        managerId,
        action,
        managerNote: note,
      });

      toast.success(action === 'APPROVED' ? 'Request approved' : 'Request rejected');
    } catch (error) {
      set({ pendingRequests: previous });
      setErrorAndToast(error, set);
    }
  },
}));
