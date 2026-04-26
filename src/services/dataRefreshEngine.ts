/**
 * Data refresh engine
 * Centralized refresh scheduler for mount/focus/background/interval triggers.
 */

import { DEFAULT_TIPS_REFRESH_INTERVAL_MS, useTipsStore } from '@store/tipsStore';

type RefreshTrigger = 'mount' | 'focus' | 'interval' | 'manual' | 'background' | 'push';

type RefreshOptions = {
  trigger: RefreshTrigger;
  force?: boolean;
};

export class DataRefreshEngine {
  private static instance: DataRefreshEngine;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private intervalMs = DEFAULT_TIPS_REFRESH_INTERVAL_MS;
  private inFlightRefresh: Promise<void> | null = null;
  private pushConnected = false;
  private onBusyStateChange: ((busy: boolean) => void) | null = null;

  private constructor() {}

  static getInstance(): DataRefreshEngine {
    if (!DataRefreshEngine.instance) {
      DataRefreshEngine.instance = new DataRefreshEngine();
    }

    return DataRefreshEngine.instance;
  }

  initialize(options?: { intervalMs?: number }): void {
    const nextIntervalMs = options?.intervalMs ?? this.intervalMs;
    this.intervalMs = nextIntervalMs;

    this.syncPollingState();
  }

  setPushConnected(connected: boolean): void {
    this.pushConnected = connected;
    this.syncPollingState();
  }

  setBusyStateCallback(callback: ((busy: boolean) => void) | null): void {
    this.onBusyStateChange = callback;
  }

  private syncPollingState(): void {
    if (this.pushConnected) {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      void this.refresh({ trigger: 'interval' });
    }, this.intervalMs);
  }

  async refresh(options: RefreshOptions): Promise<void> {
    const { trigger, force = false } = options;

    if (this.inFlightRefresh && !force) {
      return this.inFlightRefresh;
    }

    const tipsStore = useTipsStore.getState();

    this.onBusyStateChange?.(true);

    const refreshPromise = tipsStore
      .refreshTips({
        trigger: trigger === 'background' ? 'interval' : trigger,
        force,
      })
      .finally(() => {
        this.onBusyStateChange?.(false);

        if (this.inFlightRefresh === refreshPromise) {
          this.inFlightRefresh = null;
        }
      });

    this.inFlightRefresh = refreshPromise;
    return refreshPromise;
  }

  async refreshInBackground(): Promise<void> {
    await this.refresh({ trigger: 'background' });
  }

  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.inFlightRefresh = null;
    this.pushConnected = false;
    this.onBusyStateChange = null;
  }
}
