import { create } from 'zustand';
import type { HomeSectionDecision, HomeSectionKey, HomeStrategy, UIConfig } from '@services/uiConfigService';
import { uiConfigService } from '@services/uiConfigService';

interface UIConfigStore {
  config: UIConfig;
  isHydrated: boolean;
  setConfig: (config: UIConfig) => void;
  getResolvedHomeDecisions: () => HomeSectionDecision[];
  getResolvedStrategy: () => HomeStrategy;
}

const DEFAULT_STRATEGY: HomeStrategy = 'maximize_engagement';

export const useUIConfigStore = create<UIConfigStore>((set, get) => ({
  config: uiConfigService.getDefaultConfig(),
  isHydrated: false,

  setConfig: (config) => {
    set({
      config,
      isHydrated: true,
    });
  },

  getResolvedHomeDecisions: () => {
    const config = get().config;

    const filtered = config.home.sections.filter((section) => section.score >= 0 && section.score <= 1);
    const deduped = new Map<HomeSectionKey, HomeSectionDecision>();

    for (const section of filtered) {
      const existing = deduped.get(section.type);
      if (!existing || section.score > existing.score) {
        deduped.set(section.type, section);
      }
    }

    const resolved = [...deduped.values()].sort((a, b) => b.score - a.score);
    if (resolved.length > 0) {
      return resolved;
    }

    return uiConfigService.getDefaultConfig().home.sections;
  },

  getResolvedStrategy: () => {
    const strategy = get().config.home.strategy;

    if (strategy === 'maximize_conversion' || strategy === 'minimize_risk' || strategy === 'maximize_engagement') {
      return strategy;
    }

    return DEFAULT_STRATEGY;
  },
}));
