/**
 * Predictive prefetch engine
 * Learns simple route transitions and prefetches likely next data.
 */

type PrefetchTask = () => Promise<void>;

type PrefetchRecord = {
  count: number;
  lastExecutedAt: number;
};

const PREFETCH_COOLDOWN_MS = 15_000;

export class PredictivePrefetchEngine {
  private static instance: PredictivePrefetchEngine;
  private transitions = new Map<string, Map<string, number>>();
  private tasks = new Map<string, PrefetchTask>();
  private prefetchRecords = new Map<string, PrefetchRecord>();

  private constructor() {}

  static getInstance(): PredictivePrefetchEngine {
    if (!PredictivePrefetchEngine.instance) {
      PredictivePrefetchEngine.instance = new PredictivePrefetchEngine();
    }

    return PredictivePrefetchEngine.instance;
  }

  registerTask(routeName: string, task: PrefetchTask): void {
    this.tasks.set(routeName, task);
  }

  recordTransition(fromRoute: string | null, toRoute: string): void {
    if (!fromRoute || fromRoute === toRoute) {
      return;
    }

    if (!this.transitions.has(fromRoute)) {
      this.transitions.set(fromRoute, new Map<string, number>());
    }

    const nextMap = this.transitions.get(fromRoute);
    if (!nextMap) {
      return;
    }

    const nextCount = (nextMap.get(toRoute) ?? 0) + 1;
    nextMap.set(toRoute, nextCount);
  }

  async prefetchLikelyNext(currentRoute: string): Promise<void> {
    const nextMap = this.transitions.get(currentRoute);

    if (!nextMap || nextMap.size === 0) {
      return;
    }

    const likelyNext = [...nextMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!likelyNext) {
      return;
    }

    const task = this.tasks.get(likelyNext);
    if (!task) {
      return;
    }

    const now = Date.now();
    const existing = this.prefetchRecords.get(likelyNext);

    if (existing && now - existing.lastExecutedAt < PREFETCH_COOLDOWN_MS) {
      return;
    }

    this.prefetchRecords.set(likelyNext, {
      count: (existing?.count ?? 0) + 1,
      lastExecutedAt: now,
    });

    try {
      await task();
    } catch (error) {
      console.error('[Prefetch] Prefetch task failed:', error);
    }
  }

  destroy(): void {
    this.transitions.clear();
    this.tasks.clear();
    this.prefetchRecords.clear();
  }
}
