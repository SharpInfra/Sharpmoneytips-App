/**
 * OTA Engine
 * Silent update checks with debouncing and safe reload coordination.
 */

import { AppState, InteractionManager } from 'react-native';
import * as Updates from 'expo-updates';
import { useAuthStore } from '@store/authStore';
import { StorageService, STORAGE_KEYS } from './storage';

const DEFAULT_UPDATE_CHECK_DEBOUNCE_MS = 30_000;
const RELOAD_RETRY_DELAY_MS = 1_500;
const STARTUP_HEALTH_DELAY_MS = 10_000;
const ROLLBACK_RETRY_WINDOW_MS = 300_000;

type OtaHealthState = {
  pendingStartup: boolean;
  pendingUpdateId: string | null;
  pendingStartupAt: number;
  lastWorkingUpdateId: string | null;
  lastWorkingRuntimeVersion: string | null;
  consecutiveStartupFailures: number;
  quarantinedUpdateIds: string[];
  lastRollbackAttemptAt: number;
};

const DEFAULT_HEALTH_STATE: OtaHealthState = {
  pendingStartup: false,
  pendingUpdateId: null,
  pendingStartupAt: 0,
  lastWorkingUpdateId: null,
  lastWorkingRuntimeVersion: null,
  consecutiveStartupFailures: 0,
  quarantinedUpdateIds: [],
  lastRollbackAttemptAt: 0,
};

export class OTAEngine {
  private static instance: OTAEngine;
  private isInitialized = false;
  private checkInFlight: Promise<void> | null = null;
  private lastCheckAt = 0;
  private pendingReload = false;
  private reloadScheduled = false;
  private reloadInProgress = false;
  private criticalInteractionActive = false;
  private rollbackInProgress = false;

  private constructor() {}

  static getInstance(): OTAEngine {
    if (!OTAEngine.instance) {
      OTAEngine.instance = new OTAEngine();
    }

    return OTAEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    await this.prepareStartupHealth();
    await this.checkForUpdateInBackground({ force: true });
    this.scheduleStartupHealthyMark();
  }

  async checkForUpdateInBackground(options?: { force?: boolean }): Promise<void> {
    const { force = false } = options ?? {};

    if (!Updates.isEnabled) {
      return;
    }

    if (this.pendingReload) {
      this.scheduleSafeReload();
    }

    if (this.checkInFlight) {
      return this.checkInFlight;
    }

    const now = Date.now();
    if (!force && now - this.lastCheckAt < DEFAULT_UPDATE_CHECK_DEBOUNCE_MS) {
      return;
    }

    this.lastCheckAt = now;

    this.checkInFlight = (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();

        if (!result.isAvailable) {
          return;
        }

        const nextUpdateId = this.extractUpdateId(result);
        if (nextUpdateId && await this.isUpdateQuarantined(nextUpdateId)) {
          console.error('[OTAEngine] Skipping quarantined update:', nextUpdateId);
          return;
        }

        await Updates.fetchUpdateAsync();
        this.pendingReload = true;
        this.scheduleSafeReload();
      } catch (error) {
        // Silent mode: no user-facing alert.
        console.error('[OTAEngine] Silent update check failed:', error);
      } finally {
        this.checkInFlight = null;
      }
    })();

    return this.checkInFlight;
  }

  setCriticalInteractionActive(active: boolean): void {
    this.criticalInteractionActive = active;

    if (!active && this.pendingReload) {
      this.scheduleSafeReload();
    }
  }

  private scheduleSafeReload(): void {
    if (this.reloadInProgress || this.reloadScheduled || !this.pendingReload) {
      return;
    }

    this.reloadScheduled = true;

    InteractionManager.runAfterInteractions(() => {
      this.reloadScheduled = false;
      void this.executeSafeReload();
    });
  }

  private async executeSafeReload(): Promise<void> {
    if (this.reloadInProgress || !this.pendingReload) {
      return;
    }

    if (this.criticalInteractionActive) {
      setTimeout(() => this.scheduleSafeReload(), RELOAD_RETRY_DELAY_MS);
      return;
    }

    if (AppState.currentState !== 'active') {
      return;
    }

    const authState = useAuthStore.getState();
    if (authState.isHydrating || !authState.isHydrated || authState.isLoading) {
      setTimeout(() => this.scheduleSafeReload(), RELOAD_RETRY_DELAY_MS);
      return;
    }

    this.reloadInProgress = true;

    try {
      await authState.flushSessionPersist();
      this.pendingReload = false;
      await Updates.reloadAsync();
    } catch (error) {
      this.pendingReload = true;
      console.error('[OTAEngine] Safe reload failed:', error);
    } finally {
      this.reloadInProgress = false;
    }
  }

  private async prepareStartupHealth(): Promise<void> {
    if (!Updates.isEnabled) {
      return;
    }

    const currentUpdateId = this.getCurrentUpdateId();
    const healthState = await this.getHealthState();

    if (
      healthState.pendingStartup
      && healthState.pendingUpdateId
      && currentUpdateId
      && healthState.pendingUpdateId === currentUpdateId
    ) {
      const nextFailureCount = healthState.consecutiveStartupFailures + 1;
      const quarantined = new Set(healthState.quarantinedUpdateIds);

      if (nextFailureCount >= 2) {
        quarantined.add(currentUpdateId);
      }

      const failedState: OtaHealthState = {
        ...healthState,
        consecutiveStartupFailures: nextFailureCount,
        quarantinedUpdateIds: [...quarantined].slice(-8),
      };

      await this.setHealthState(failedState);

      if (nextFailureCount >= 2) {
        await this.attemptRollbackRecovery(failedState);
      }
    }

    const nextState: OtaHealthState = {
      ...(await this.getHealthState()),
      pendingStartup: true,
      pendingUpdateId: currentUpdateId,
      pendingStartupAt: Date.now(),
    };

    await this.setHealthState(nextState);
  }

  private scheduleStartupHealthyMark(): void {
    setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        void this.markStartupHealthy();
      });
    }, STARTUP_HEALTH_DELAY_MS);
  }

  private async markStartupHealthy(): Promise<void> {
    const healthState = await this.getHealthState();

    const nextState: OtaHealthState = {
      ...healthState,
      pendingStartup: false,
      pendingUpdateId: null,
      pendingStartupAt: 0,
      consecutiveStartupFailures: 0,
      lastWorkingUpdateId: this.getCurrentUpdateId(),
      lastWorkingRuntimeVersion: Updates.runtimeVersion ?? null,
    };

    await this.setHealthState(nextState);
  }

  private async attemptRollbackRecovery(healthState: OtaHealthState): Promise<void> {
    if (this.rollbackInProgress) {
      return;
    }

    const now = Date.now();
    if (now - healthState.lastRollbackAttemptAt < ROLLBACK_RETRY_WINDOW_MS) {
      return;
    }

    this.rollbackInProgress = true;

    try {
      await this.setHealthState({
        ...healthState,
        lastRollbackAttemptAt: now,
      });

      const rollbackCandidate = await Updates.checkForUpdateAsync();
      if (!rollbackCandidate.isAvailable) {
        return;
      }

      await Updates.fetchUpdateAsync();
      this.pendingReload = true;
      this.scheduleSafeReload();
    } catch (error) {
      console.error('[OTAEngine] Rollback recovery check failed:', error);
    } finally {
      this.rollbackInProgress = false;
    }
  }

  private extractUpdateId(checkResult: unknown): string | null {
    const candidate = (checkResult as { manifest?: { id?: string } })?.manifest?.id;
    return typeof candidate === 'string' && candidate.length > 0 ? candidate : null;
  }

  private getCurrentUpdateId(): string | null {
    if (typeof Updates.updateId !== 'string' || Updates.updateId.length === 0) {
      return null;
    }

    return Updates.updateId;
  }

  private async getHealthState(): Promise<OtaHealthState> {
    const stored = await StorageService.getItem<OtaHealthState>(STORAGE_KEYS.OTA_HEALTH);
    return stored ?? DEFAULT_HEALTH_STATE;
  }

  private async setHealthState(state: OtaHealthState): Promise<void> {
    await StorageService.setItem(STORAGE_KEYS.OTA_HEALTH, state);
  }

  private async isUpdateQuarantined(updateId: string): Promise<boolean> {
    const healthState = await this.getHealthState();
    return healthState.quarantinedUpdateIds.includes(updateId);
  }

  destroy(): void {
    this.checkInFlight = null;
    this.pendingReload = false;
    this.reloadScheduled = false;
    this.reloadInProgress = false;
    this.criticalInteractionActive = false;
    this.rollbackInProgress = false;
    this.isInitialized = false;
  }
}
