'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { loginApi, setUnauthorizedHandler } from '@/lib/api';
import type { Employee } from '@/types';

type AuthState = {
  employee: Employee | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
};

const COOKIE_NAME = 'auth-storage';

const writeAuthCookie = (state: Pick<AuthState, 'employee' | 'isAuthenticated'>) => {
  if (typeof document === 'undefined') return;
  const encoded = encodeURIComponent(JSON.stringify({ state }));
  document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=2592000; samesite=lax`;
};

const clearAuthCookie = () => {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      employee: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const { employee } = await loginApi(email, password);
        const next = { employee, isAuthenticated: true };
        set(next);
        writeAuthCookie(next);
      },
      logout: () => {
        set({ employee: null, isAuthenticated: false });
        clearAuthCookie();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },
      hydrate: () => {
        useAuthStore.persist.rehydrate();
        const state = get();
        writeAuthCookie({
          employee: state.employee,
          isAuthenticated: state.isAuthenticated,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        employee: state.employee,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

setUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
});
