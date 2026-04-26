/**
 * Runtime config service
 * Fetches remote config and falls back to cached/default values.
 */

import { apiClient } from './apiClient';
import { StorageService, STORAGE_KEYS } from './storage';

export interface FeatureFlagRule {
  enabled: boolean;
  rolloutPercentage: number;
}

export interface RuntimeConfig {
  tipsRefreshIntervalMs: number;
  websocketEnabled: boolean;
  websocketPath: string;
  websocketEventNames: string[];
  uiConfigEventNames: string[];
  runtimeConfigEventNames: string[];
  websocketInitialBackoffMs: number;
  websocketMaxBackoffMs: number;
  predictivePrefetchEnabled: boolean;
  featureFlags: Record<string, FeatureFlagRule>;
}

type RuntimeConfigResponse = Partial<RuntimeConfig>;

const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  tipsRefreshIntervalMs: 30_000,
  websocketEnabled: true,
  websocketPath: '/events',
  websocketEventNames: ['tips.updated', 'tips:updated', 'pipeline.updated'],
  uiConfigEventNames: ['ui.config.updated', 'home.config.updated', 'decision_update'],
  runtimeConfigEventNames: ['runtime.config.updated', 'feature-flags.updated'],
  websocketInitialBackoffMs: 1_000,
  websocketMaxBackoffMs: 30_000,
  predictivePrefetchEnabled: true,
  featureFlags: {},
};

const sanitizeStringArray = (value: string[] | undefined, fallback: string[]): string[] => {
  if (!value || value.length === 0) {
    return fallback;
  }

  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
};

const sanitizeInterval = (value: number | undefined, fallback: number): number => {
  if (!value || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, 5_000), 300_000);
};

const mergeConfig = (remote: RuntimeConfigResponse | null, cached: RuntimeConfig | null): RuntimeConfig => {
  const base = cached ?? DEFAULT_RUNTIME_CONFIG;
  const mergedFeatureFlags = {
    ...base.featureFlags,
    ...(remote?.featureFlags ?? {}),
  };

  return {
    tipsRefreshIntervalMs: sanitizeInterval(remote?.tipsRefreshIntervalMs, base.tipsRefreshIntervalMs),
    websocketEnabled: remote?.websocketEnabled ?? base.websocketEnabled,
    websocketPath: remote?.websocketPath ?? base.websocketPath,
    websocketEventNames: sanitizeStringArray(remote?.websocketEventNames, base.websocketEventNames),
    uiConfigEventNames: sanitizeStringArray(remote?.uiConfigEventNames, base.uiConfigEventNames),
    runtimeConfigEventNames: sanitizeStringArray(remote?.runtimeConfigEventNames, base.runtimeConfigEventNames),
    websocketInitialBackoffMs: sanitizeInterval(remote?.websocketInitialBackoffMs, base.websocketInitialBackoffMs),
    websocketMaxBackoffMs: sanitizeInterval(remote?.websocketMaxBackoffMs, base.websocketMaxBackoffMs),
    predictivePrefetchEnabled: remote?.predictivePrefetchEnabled ?? base.predictivePrefetchEnabled,
    featureFlags: mergedFeatureFlags,
  };
};

export const runtimeConfigService = {
  async getConfig(): Promise<RuntimeConfig> {
    const cachedConfig = await StorageService.getItem<RuntimeConfig>(STORAGE_KEYS.RUNTIME_CONFIG);

    try {
      const response = await apiClient.get<RuntimeConfigResponse>('/runtime/config');

      if (response.error) {
        return cachedConfig ?? DEFAULT_RUNTIME_CONFIG;
      }

      const merged = mergeConfig(response.data ?? null, cachedConfig);
      await StorageService.setItem(STORAGE_KEYS.RUNTIME_CONFIG, merged);
      return merged;
    } catch (error) {
      console.error('[RuntimeConfig] Failed to fetch remote config:', error);
      return cachedConfig ?? DEFAULT_RUNTIME_CONFIG;
    }
  },
};
