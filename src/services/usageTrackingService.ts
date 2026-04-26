/**
 * Usage tracking service
 * Tenant-scoped request/decision/feedback accounting with billing-ready metrics.
 */

import { StorageService, STORAGE_KEYS } from './storage';

export interface TenantUsageMetrics {
  tenantId: string;
  requests: number;
  decisionsServed: number;
  feedbackEvents: number;
  lastUpdatedAt: number;
}

type TenantUsageStore = Record<string, TenantUsageMetrics>;

const DEFAULT_METRICS = (tenantId: string): TenantUsageMetrics => ({
  tenantId,
  requests: 0,
  decisionsServed: 0,
  feedbackEvents: 0,
  lastUpdatedAt: Date.now(),
});

class UsageTrackingService {
  private cache: TenantUsageStore | null = null;

  private async load(): Promise<TenantUsageStore> {
    if (this.cache) {
      return this.cache;
    }

    const stored = await StorageService.getItem<TenantUsageStore>(STORAGE_KEYS.TENANT_USAGE_METRICS);
    this.cache = stored ?? {};
    return this.cache;
  }

  private async persist(): Promise<void> {
    if (!this.cache) {
      return;
    }

    await StorageService.setItem(STORAGE_KEYS.TENANT_USAGE_METRICS, this.cache);
  }

  private async mutate(tenantId: string, updater: (metrics: TenantUsageMetrics) => void): Promise<void> {
    const state = await this.load();

    if (!state[tenantId]) {
      state[tenantId] = DEFAULT_METRICS(tenantId);
    }

    updater(state[tenantId]);
    state[tenantId].lastUpdatedAt = Date.now();
    await this.persist();
  }

  async trackRequest(tenantId: string): Promise<void> {
    await this.mutate(tenantId, (metrics) => {
      metrics.requests += 1;
    });
  }

  async trackDecisionsServed(tenantId: string, count: number): Promise<void> {
    await this.mutate(tenantId, (metrics) => {
      metrics.decisionsServed += Math.max(0, count);
    });
  }

  async trackFeedbackEvents(tenantId: string, count: number): Promise<void> {
    await this.mutate(tenantId, (metrics) => {
      metrics.feedbackEvents += Math.max(0, count);
    });
  }

  async getTenantMetrics(tenantId: string): Promise<TenantUsageMetrics> {
    const state = await this.load();
    return state[tenantId] ?? DEFAULT_METRICS(tenantId);
  }

  async getBillingMetrics(tenantId: string): Promise<Record<string, number | string>> {
    const metrics = await this.getTenantMetrics(tenantId);

    return {
      tenantId,
      meter_requests: metrics.requests,
      meter_decisions_served: metrics.decisionsServed,
      meter_feedback_events: metrics.feedbackEvents,
      measuredAt: metrics.lastUpdatedAt,
    };
  }
}

export const usageTrackingService = new UsageTrackingService();
