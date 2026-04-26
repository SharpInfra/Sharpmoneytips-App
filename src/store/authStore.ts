/**
 * Authentication store
 * Session management with persistence and hydration
 */

import { create } from 'zustand';
import { AuthSession } from '@types';
import { apiClient } from '@services/apiClient';
import { StorageService, STORAGE_KEYS } from '@services/storage';

const SESSION_TTL_SKEW_MS = 5_000;

let persistQueue: Promise<void> = Promise.resolve();
let hydratePromise: Promise<void> | null = null;

const isSessionValid = (session: AuthSession): boolean => {
  if (!session.token || !session.userId || !session.expiresAt) {
    return false;
  }

  return session.expiresAt > Date.now() + SESSION_TTL_SKEW_MS;
};

const enqueueSessionPersist = (session: AuthSession | null): void => {
  persistQueue = persistQueue
    .then(async () => {
      if (session) {
        await StorageService.setItem(STORAGE_KEYS.AUTH_SESSION, session);
        return;
      }

      await StorageService.removeItem(STORAGE_KEYS.AUTH_SESSION);
    })
    .catch((error) => {
      console.error('[AuthStore] Failed to persist session:', error);
    });
};

interface AuthStore {
  session: AuthSession | null;
  isHydrating: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrateSession: () => Promise<void>;
  flushSessionPersist: () => Promise<void>;
  setSession: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  isHydrating: true,
  isHydrated: false,
  isLoading: false,
  error: null,

  hydrateSession: async () => {
    if (get().isHydrated || !get().isHydrating) {
      return;
    }

    if (hydratePromise) {
      return hydratePromise;
    }

    hydratePromise = (async () => {
      try {
        const storedSession = await StorageService.getItem<AuthSession>(STORAGE_KEYS.AUTH_SESSION);

        if (storedSession && isSessionValid(storedSession)) {
          apiClient.setAuthSession(storedSession);
          set({ session: storedSession, error: null });
        } else {
          apiClient.setAuthSession(null);
          set({ session: null });

          if (storedSession) {
            enqueueSessionPersist(null);
          }
        }
      } catch (error) {
        console.error('[AuthStore] Session hydration failed:', error);
        apiClient.setAuthSession(null);
        set({ session: null, error: null });
      } finally {
        set({ isHydrating: false, isHydrated: true });
        hydratePromise = null;
      }
    })();

    return hydratePromise;
  },

  flushSessionPersist: async () => {
    await persistQueue.catch(() => undefined);
  },

  setSession: (session) => {
    apiClient.setAuthSession(session);
    set({ session });
    enqueueSessionPersist(session);
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => {
    apiClient.setAuthSession(null);
    set({ session: null, error: null, isLoading: false });
    enqueueSessionPersist(null);
  },
}));
