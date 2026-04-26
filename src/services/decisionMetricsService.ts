/**
 * Decision metrics service
 * Builds aggregate learning signals from raw UI feedback events.
 */

import type { UIFeedbackEvent } from './uiFeedbackService';

export interface DecisionMetrics {
  engagementScore: number;
  conversionScore: number;
  retentionSignal: number;
  eventCount: number;
  sectionPerformance: Record<string, {
    impressions: number;
    clicks: number;
    conversions: number;
    avgViewDurationMs: number;
    avgScrollDepth: number;
    blendedScore: number;
  }>;
}

export interface DecisionWeightHint {
  sectionType: string;
  weightDelta: number;
  reason: string;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const normalizeDuration = (durationMs: number): number => {
  // 45s view duration saturates retention contribution.
  return clamp01(durationMs / 45_000);
};

export const decisionMetricsService = {
  compute(events: UIFeedbackEvent[]): DecisionMetrics {
    if (events.length === 0) {
      return {
        engagementScore: 0,
        conversionScore: 0,
        retentionSignal: 0,
        eventCount: 0,
        sectionPerformance: {},
      };
    }

    let clickCount = 0;
    let interactionCount = 0;
    let conversionCount = 0;
    let totalViewDuration = 0;
    let totalScrollDepth = 0;
    let scrollDepthSamples = 0;

    const sectionStats = new Map<string, {
      impressions: number;
      clicks: number;
      conversions: number;
      totalViewDurationMs: number;
      totalScrollDepth: number;
      scrollDepthSamples: number;
    }>();

    for (const event of events) {
      const key = event.sectionType;
      if (!sectionStats.has(key)) {
        sectionStats.set(key, {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          totalViewDurationMs: 0,
          totalScrollDepth: 0,
          scrollDepthSamples: 0,
        });
      }

      const bucket = sectionStats.get(key);
      if (!bucket) {
        continue;
      }

      bucket.impressions += 1;

      if (event.eventType === 'click') {
        clickCount += 1;
        bucket.clicks += 1;
      }

      if (event.eventType === 'interaction') {
        interactionCount += 1;
      }

      if (event.eventType === 'conversion') {
        conversionCount += 1;
        bucket.conversions += 1;
      }

      if (typeof event.durationMs === 'number' && event.durationMs > 0) {
        totalViewDuration += event.durationMs;
        bucket.totalViewDurationMs += event.durationMs;
      }

      if (typeof event.scrollDepth === 'number') {
        const depth = clamp01(event.scrollDepth);
        totalScrollDepth += depth;
        scrollDepthSamples += 1;
        bucket.totalScrollDepth += depth;
        bucket.scrollDepthSamples += 1;
      }
    }

    const avgViewDuration = totalViewDuration > 0 ? totalViewDuration / events.length : 0;
    const avgScrollDepth = scrollDepthSamples > 0 ? totalScrollDepth / scrollDepthSamples : 0;

    const engagementScore = clamp01(
      (clickCount / Math.max(events.length, 1)) * 0.35
      + (interactionCount / Math.max(events.length, 1)) * 0.2
      + normalizeDuration(avgViewDuration) * 0.25
      + avgScrollDepth * 0.2,
    );

    const conversionScore = clamp01(conversionCount / Math.max(events.length, 1));
    const retentionSignal = clamp01(
      normalizeDuration(avgViewDuration) * 0.6 + avgScrollDepth * 0.4,
    );

    const sectionPerformance: DecisionMetrics['sectionPerformance'] = {};

    for (const [sectionType, stats] of sectionStats.entries()) {
      const avgSectionView = stats.impressions > 0 ? stats.totalViewDurationMs / stats.impressions : 0;
      const avgSectionDepth = stats.scrollDepthSamples > 0 ? stats.totalScrollDepth / stats.scrollDepthSamples : 0;

      const blendedScore = clamp01(
        (stats.clicks / Math.max(stats.impressions, 1)) * 0.4
        + (stats.conversions / Math.max(stats.impressions, 1)) * 0.4
        + normalizeDuration(avgSectionView) * 0.1
        + avgSectionDepth * 0.1,
      );

      sectionPerformance[sectionType] = {
        impressions: stats.impressions,
        clicks: stats.clicks,
        conversions: stats.conversions,
        avgViewDurationMs: avgSectionView,
        avgScrollDepth: avgSectionDepth,
        blendedScore,
      };
    }

    return {
      engagementScore,
      conversionScore,
      retentionSignal,
      eventCount: events.length,
      sectionPerformance,
    };
  },

  buildWeightHints(metrics: DecisionMetrics): DecisionWeightHint[] {
    const hints: DecisionWeightHint[] = [];

    for (const [sectionType, perf] of Object.entries(metrics.sectionPerformance)) {
      const centered = perf.blendedScore - 0.5;
      const weightDelta = Number((centered * 0.2).toFixed(4));

      if (Math.abs(weightDelta) < 0.01) {
        continue;
      }

      hints.push({
        sectionType,
        weightDelta,
        reason: weightDelta > 0 ? 'positive_performance' : 'negative_performance',
      });
    }

    return hints;
  },
};
