/**
 * UI feedback service
 * Sends local interaction telemetry for backend decision learning.
 */

import { decisionMetricsService } from './decisionMetricsService';
import { useUIConfigStore } from '@store/uiConfigStore';
import { decisionApiService } from './decisionApiService';
import { usageTrackingService } from './usageTrackingService';

type UIFeedbackEventType = 'click' | 'view_duration' | 'interaction' | 'conversion';

export interface UIFeedbackEvent {
  screen: string;
  sectionType: string;
  eventType: UIFeedbackEventType;
  strategy?: string;
  reason?: string;
  score?: number;
  durationMs?: number;
  scrollDepth?: number;
  userSegment?: string | null;
  timestamp: number;
}

const FLUSH_DEBOUNCE_MS = 2_500;
const MAX_BUFFER_SIZE = 100;

class UIFeedbackService {
  private queue: UIFeedbackEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private inFlight: Promise<void> | null = null;

  track(event: UIFeedbackEvent): void {
    this.queue.push(event);

    if (this.queue.length > MAX_BUFFER_SIZE) {
      this.queue = this.queue.slice(this.queue.length - MAX_BUFFER_SIZE);
    }

    this.scheduleFlush();
  }

  async flush(): Promise<void> {
    if (this.inFlight || this.queue.length === 0) {
      return this.inFlight ?? Promise.resolve();
    }

    const payload = this.queue.slice(0);
    this.queue = [];

    this.inFlight = (async () => {
      try {
        const metrics = decisionMetricsService.compute(payload);
        const weightHints = decisionMetricsService.buildWeightHints(metrics);
        const tenantId = useUIConfigStore.getState().config.tenantId;
        const usage = await usageTrackingService.getTenantMetrics(tenantId);
        const billing = await usageTrackingService.getBillingMetrics(tenantId);
        const usagePayload: Record<string, number | string> = {
          tenantId: usage.tenantId,
          requests: usage.requests,
          decisionsServed: usage.decisionsServed,
          feedbackEvents: usage.feedbackEvents,
          lastUpdatedAt: usage.lastUpdatedAt,
        };

        await decisionApiService.postFeedback(tenantId, {
          events: payload,
          metrics,
          weightHints,
          modelVersion: 'decision-model-v1',
          usage: usagePayload,
          billing,
        });
      } catch (error) {
        console.error('[UIFeedback] Failed to send feedback:', error);
        this.queue = [...payload, ...this.queue].slice(-MAX_BUFFER_SIZE);
      } finally {
        this.inFlight = null;
      }
    })();

    return this.inFlight;
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, FLUSH_DEBOUNCE_MS);
  }
}

export const uiFeedbackService = new UIFeedbackService();
