/**
 * App store
 * Global app state
 */

import { create } from 'zustand';
import { TenantContext, LoadingState } from '@types';

interface AppStore {
  tenantContext: TenantContext | null;
  appState: LoadingState;
  setTenantContext: (context: TenantContext | null) => void;
  setAppState: (state: LoadingState) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  tenantContext: null,
  appState: 'idle',

  setTenantContext: (tenantContext) => set({ tenantContext }),
  setAppState: (appState) => set({ appState }),
}));
