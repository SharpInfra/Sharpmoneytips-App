/**
 * Authentication store
 * Minimal stub for session management
 */

import { create } from 'zustand';
import { AuthSession } from '@types';

interface AuthStore {
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
  setSession: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  isLoading: false,
  error: null,

  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ session: null, error: null, isLoading: false }),
}));
