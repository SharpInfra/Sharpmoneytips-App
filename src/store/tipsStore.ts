import { create } from 'zustand';
import { tipsService } from '@services/tipsService';
import { StorageService, STORAGE_KEYS } from '@services/storage';

export const DEFAULT_TIPS_REFRESH_INTERVAL_MS = 30_000;

interface Tip {
  id: string;
  matchId: string;
  targetTeam: string;
  betType: string;
  betOption: string | null;
  odds: number;
  probability: number;
  ev: number;
  roi: number;
  strategyTag: string;
  riskLevel: string | null;
  packageName: string | null;
  showToUser: boolean;
  status: string;
  result: string;
  brandId: string;
  marketRegion: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface TipsStore {
  tips: Tip[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  isOffline: boolean;
  cacheHydrated: boolean;
  lastUpdatedAt: number | null;
  hydrateTipsCache: () => Promise<void>;
  setTips: (tips: Tip[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshTips: (options?: { trigger?: 'mount' | 'focus' | 'interval' | 'manual' | 'push'; force?: boolean }) => Promise<void>;
}

let inFlightRequest: Promise<void> | null = null;
let latestRequestId = 0;

export const useTipsStore = create<TipsStore>((set, get) => ({
  tips: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  isOffline: false,
  cacheHydrated: false,
  lastUpdatedAt: null,

  hydrateTipsCache: async () => {
    if (get().cacheHydrated) {
      return;
    }

    try {
      const cachedTips = await StorageService.getItem<Tip[]>(STORAGE_KEYS.TIPS_CACHE);

      if (cachedTips && cachedTips.length > 0) {
        set({
          tips: cachedTips,
          cacheHydrated: true,
          lastUpdatedAt: Date.now(),
        });
        return;
      }

      set({ cacheHydrated: true });
    } catch (error) {
      console.error('[TipsStore] Failed to hydrate tips cache:', error);
      set({ cacheHydrated: true });
    }
  },

  setTips: (tips) => set({ tips }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  refreshTips: async (options) => {
    const { force = false } = options ?? {};

    if (inFlightRequest && !force) {
      return inFlightRequest;
    }

    const requestId = ++latestRequestId;
    const hasExistingData = get().tips.length > 0;

    set({
      error: null,
      isLoading: !hasExistingData,
      isRefreshing: hasExistingData,
    });

    let requestRef: Promise<void>;

    requestRef = (async () => {
      const result = await tipsService.fetchVisibleTips('sharpmoney');

      // Ignore stale responses when a newer request has already started.
      if (requestId !== latestRequestId) {
        return;
      }

      if (result.error) {
        if (result.isNetworkError) {
          const cachedTips = await StorageService.getItem<Tip[]>(STORAGE_KEYS.TIPS_CACHE);

          if (cachedTips && cachedTips.length > 0) {
            set({
              tips: cachedTips,
              error: null,
              isOffline: true,
            });
            return;
          }
        }

        set({ error: result.error, isOffline: result.isNetworkError });
        return;
      }

      await StorageService.setItem(STORAGE_KEYS.TIPS_CACHE, result.tips);

      set({
        tips: result.tips,
        error: null,
        isOffline: false,
        lastUpdatedAt: Date.now(),
      });
    })()
      .catch((error) => {
        if (requestId !== latestRequestId) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to refresh tips';
        set({ error: message });
      })
      .finally(() => {
        if (requestId === latestRequestId) {
          set({ isLoading: false, isRefreshing: false });
        }

        if (inFlightRequest === requestRef) {
          inFlightRequest = null;
        }
      });

    inFlightRequest = requestRef;
    return requestRef;
  },
}));
