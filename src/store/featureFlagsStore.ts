import { create } from 'zustand';
import type { RuntimeConfig } from '@services/runtimeConfigService';

const stableHash = (input: string): number => {
  let hash = 5381;

  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash &= 0x7fffffff;
  }

  return hash;
};

interface FeatureFlagsStore {
  config: RuntimeConfig | null;
  isHydrated: boolean;
  setConfig: (config: RuntimeConfig) => void;
  isEnabled: (flagKey: string, userId?: string | null) => boolean;
}

export const useFeatureFlagsStore = create<FeatureFlagsStore>((set, get) => ({
  config: null,
  isHydrated: false,

  setConfig: (config) => set({ config, isHydrated: true }),

  isEnabled: (flagKey, userId) => {
    const config = get().config;
    if (!config) {
      return false;
    }

    const rule = config.featureFlags[flagKey];
    if (!rule?.enabled) {
      return false;
    }

    const rolloutPercentage = Math.max(0, Math.min(100, rule.rolloutPercentage ?? 0));
    if (rolloutPercentage >= 100) {
      return true;
    }

    if (!userId) {
      return false;
    }

    const bucket = stableHash(`${flagKey}:${userId}`) % 100;
    return bucket < rolloutPercentage;
  },
}));
