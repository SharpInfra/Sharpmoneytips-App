/**
 * Decision API service
 * Tenant-scoped API layer for SaaS endpoints with auth guard and client-side rate limiting.
 */

import { apiClient } from './apiClient';
import { useAuthStore } from '@store/authStore';
import { usageTrackingService } from './usageTrackingService';

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_WINDOW = 120;

type RateBucket = {
  count: number;
  windowStart: number;
};

const rateBuckets = new Map<string, RateBucket>();

const ensureAuthenticated = (): void => {
  const session = useAuthStore.getState().session;
  if (!session?.token) {
    throw new Error('AUTH_REQUIRED');
  }
};

const enforceRateLimit = (tenantId: string, endpoint: string): void => {
  const key = `${tenantId}:${endpoint}`;
  const now = Date.now();

  const existing = rateBuckets.get(key);
  if (!existing || now - existing.windowStart > RATE_WINDOW_MS) {
    rateBuckets.set(key, {
      count: 1,
      windowStart: now,
    });
    return;
  }

  if (existing.count >= RATE_LIMIT_PER_WINDOW) {
    throw new Error('CLIENT_RATE_LIMITED');
  }

  existing.count += 1;
  rateBuckets.set(key, existing);
};

export interface DecisionApiOutput {
  tenantId: string;
  strategy?: string;
  sections?: {
    type: string;
    score: number;
    reason?: string;
  }[];
  userSegment?: string | null;
  branding?: {
    appName?: string;
    primaryColor?: string;
    logoUrl?: string | null;
  };
}

export const decisionApiService = {
  async getDecisions(tenantId: string): Promise<DecisionApiOutput | null> {
    ensureAuthenticated();
    enforceRateLimit(tenantId, 'GET:/decisions');
    await usageTrackingService.trackRequest(tenantId);

    const response = await apiClient.get<DecisionApiOutput>('/decisions');

    if (response.error) {
      return null;
    }

    const sectionCount = response.data?.sections?.length ?? 0;
    await usageTrackingService.trackDecisionsServed(tenantId, sectionCount);

    return response.data;
  },

  async getUIConfig(tenantId: string): Promise<Record<string, unknown> | null> {
    ensureAuthenticated();
    enforceRateLimit(tenantId, 'GET:/ui-config');
    await usageTrackingService.trackRequest(tenantId);

    const response = await apiClient.get<Record<string, unknown>>('/ui-config');

    if (response.error) {
      return null;
    }

    return response.data;
  },

  async postFeedback(
    tenantId: string,
    payload: {
      events: unknown[];
      metrics: unknown;
      weightHints: unknown[];
      modelVersion: string;
      usage: Record<string, number | string>;
      billing: Record<string, number | string>;
    },
  ): Promise<boolean> {
    ensureAuthenticated();
    enforceRateLimit(tenantId, 'POST:/feedback');
    await usageTrackingService.trackRequest(tenantId);
    await usageTrackingService.trackFeedbackEvents(tenantId, payload.events.length);

    const response = await apiClient.post('/feedback', payload);

    return !response.error;
  },
};
