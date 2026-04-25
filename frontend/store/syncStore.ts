'use client';

import { create } from 'zustand';
import toast from 'react-hot-toast';
import { getApiErrorMessage, getSyncLogsApi, triggerSyncApi } from '@/lib/api';
import type { SyncLog } from '@/types';

type SyncState = {
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncLogs: SyncLog[];
  triggerSync: () => Promise<void>;
  fetchLogs: () => Promise<void>;
};

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncTime: null,
  syncLogs: [],

  triggerSync: async () => {
    set({ isSyncing: true });
    try {
      const log = await triggerSyncApi();
      set((state) => ({
        isSyncing: false,
        lastSyncTime: log.createdAt,
        syncLogs: [log, ...state.syncLogs].slice(0, 20),
      }));
      toast.success('Batch sync triggered');
    } catch (error) {
      set({ isSyncing: false });
      toast.error(getApiErrorMessage(error));
    }
  },

  fetchLogs: async () => {
    try {
      const syncLogs = await getSyncLogsApi();
      set({ syncLogs, lastSyncTime: syncLogs[0]?.createdAt ?? null });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  },
}));
