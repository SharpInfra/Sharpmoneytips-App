/**
 * Runtime Engine
 * Global orchestrator for session persistence, OTA updates, and real-time data refresh
 * 
 * Responsibilities:
 * - Orchestrate session restoration before app navigation
 * - Coordinate OTA checks (background + foreground)
 * - Trigger smart data refresh (mount, focus, interval)
 * - Prevent cascading update loops
 * - Handle offline scenarios gracefully
 */

import { AppState, type AppStateStatus } from 'react-native';
import { useAuthStore } from '@store/authStore';
import { useAppStore } from '@store/appStore';
import { useTipsStore } from '@store/tipsStore';
import { useFeatureFlagsStore } from '@store/featureFlagsStore';
import { useUIConfigStore } from '@store/uiConfigStore';
import { OTAEngine } from './otaEngine';
import { DataRefreshEngine } from './dataRefreshEngine';
import { RealtimeEventEngine } from './realtimeEventEngine';
import { PredictivePrefetchEngine } from './predictivePrefetchEngine';
import { runtimeConfigService, type RuntimeConfig } from './runtimeConfigService';
import { uiConfigService } from './uiConfigService';
import { apiClient } from './apiClient';
import { decisionApiService } from './decisionApiService';
import type { TenantContext } from '@types';

const DEFAULT_TENANT_CONTEXT: TenantContext = {
  id: 'default',
  brandId: 'sharpmoney',
  locale: 'en-US',
  timezone: 'UTC',
};

/**
 * RuntimeEngine singleton
 * Manages all runtime lifecycle events and state synchronization
 */
export class RuntimeEngine {
  private static instance: RuntimeEngine;
  private isInitialized = false;
  private initializePromise: Promise<void> | null = null;
  private appStateSubscription: any = null;
  private otaEngine: OTAEngine;
  private dataRefreshEngine: DataRefreshEngine;
  private realtimeEventEngine: RealtimeEventEngine;
  private predictivePrefetchEngine: PredictivePrefetchEngine;
  private runtimeConfig: RuntimeConfig | null = null;
  private currentRouteName: string | null = null;

  private constructor() {
    this.otaEngine = OTAEngine.getInstance();
    this.dataRefreshEngine = DataRefreshEngine.getInstance();
    this.realtimeEventEngine = RealtimeEventEngine.getInstance();
    this.predictivePrefetchEngine = PredictivePrefetchEngine.getInstance();
  }

  static getInstance(): RuntimeEngine {
    if (!RuntimeEngine.instance) {
      RuntimeEngine.instance = new RuntimeEngine();
    }
    return RuntimeEngine.instance;
  }

  /**
   * Initialize runtime on app startup
   * Orchestrates session restoration before any navigation
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializePromise) {
      return this.initializePromise;
    }

    this.initializePromise = (async () => {
      try {
        // CRITICAL: Restore session before rendering any navigation
        // This prevents auth screen flicker and race conditions
        const authStore = useAuthStore.getState();
        await authStore.hydrateSession();

        // Restore cached data immediately for offline-first startup.
        await useTipsStore.getState().hydrateTipsCache();

        const appStore = useAppStore.getState();
        const tenantContext = appStore.tenantContext ?? DEFAULT_TENANT_CONTEXT;
        if (!appStore.tenantContext) {
          appStore.setTenantContext(tenantContext);
        }

        // Tenant context is required for isolation headers on every request.
        apiClient.setTenantContext(tenantContext);

        // Remote config controls feature flags and runtime behavior.
        this.runtimeConfig = await runtimeConfigService.getConfig();
        useFeatureFlagsStore.getState().setConfig(this.runtimeConfig);

        // Server-driven UI config controls layout and personalization.
        const uiConfig = await uiConfigService.getConfig(tenantContext.id);
        useUIConfigStore.getState().setConfig(uiConfig);

        // Initialize data refresh scheduler (interval trigger)
        this.dataRefreshEngine.setBusyStateCallback((busy) => {
          this.otaEngine.setCriticalInteractionActive(busy);
        });

        this.dataRefreshEngine.initialize({ intervalMs: this.runtimeConfig.tipsRefreshIntervalMs });

        this.setupPrefetchTasks();

        // Initialize OTA engine (will NOT show alerts, runs silently)
        await this.otaEngine.initialize();

        // Initialize push-driven updates with safe polling fallback.
        this.initializeRealtimeChannel();

        // Setup AppState listener for background/foreground events
        this.setupAppStateListener();

        this.isInitialized = true;

        if (__DEV__) {
          console.log('[RuntimeEngine] Initialization complete');
        }
      } catch (error) {
        console.error('[RuntimeEngine] Initialization failed:', error);
        throw error;
      } finally {
        this.initializePromise = null;
      }
    })();

    return this.initializePromise;
  }

  /**
   * Setup AppState listener for background/foreground transitions
   * Triggers OTA checks and data refresh when app comes to foreground
   */
  private setupAppStateListener(): void {
    try {
      this.appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
        this.handleAppStateChange(state);
      });

      if (__DEV__) {
        console.log('[RuntimeEngine] AppState listener configured');
      }
    } catch (error) {
      console.error('[RuntimeEngine] Failed to setup AppState listener:', error);
    }
  }

  /**
   * Handle AppState changes (foreground/background)
   */
  private async handleAppStateChange(state: AppStateStatus): Promise<void> {
    if (state === 'active') {
      if (__DEV__) {
        console.log('[RuntimeEngine] App came to foreground, triggering background checks');
      }

      this.initializeRealtimeChannel();

      // Non-blocking background operations
      setTimeout(() => {
        // OTA check (silent, non-blocking)
        this.otaEngine.checkForUpdateInBackground().catch((error) => {
          console.error('[RuntimeEngine] Background OTA check failed:', error);
        });

        this.refreshRuntimeConfigInBackground().catch((error) => {
          console.error('[RuntimeEngine] Background runtime config refresh failed:', error);
        });

        this.refreshUIConfigInBackground().catch((error) => {
          console.error('[RuntimeEngine] Background UI config refresh failed:', error);
        });

        // Data refresh (should already be debounced)
        this.dataRefreshEngine.refreshInBackground().catch((error) => {
          console.error('[RuntimeEngine] Background data refresh failed:', error);
        });
      }, 0);
      return;
    }

    this.realtimeEventEngine.destroy();
    this.dataRefreshEngine.setPushConnected(false);
  }

  /**
   * Trigger data refresh mount (screen init)
   * Used by screens on mount or focus
   */
  async refreshDataOnMount(): Promise<void> {
    try {
      await this.dataRefreshEngine.refresh({ trigger: 'mount' });
    } catch (error) {
      console.error('[RuntimeEngine] Data refresh on mount failed:', error);
    }
  }

  /**
   * Trigger data refresh on screen focus
   * Used by useFocusEffect hooks
   */
  async refreshDataOnFocus(): Promise<void> {
    try {
      await this.dataRefreshEngine.refresh({ trigger: 'focus' });
    } catch (error) {
      console.error('[RuntimeEngine] Data refresh on focus failed:', error);
    }
  }

  trackRouteChange(nextRouteName: string): void {
    this.predictivePrefetchEngine.recordTransition(this.currentRouteName, nextRouteName);
    this.currentRouteName = nextRouteName;

    if (this.runtimeConfig?.predictivePrefetchEnabled) {
      void this.predictivePrefetchEngine.prefetchLikelyNext(nextRouteName);
    }
  }

  private setupPrefetchTasks(): void {
    this.predictivePrefetchEngine.registerTask('Home', async () => {
      await this.dataRefreshEngine.refresh({ trigger: 'interval' });
    });
  }

  private initializeRealtimeChannel(): void {
    if (!this.runtimeConfig?.websocketEnabled) {
      this.dataRefreshEngine.setPushConnected(false);
      return;
    }

    const wsUrl = this.toWebSocketUrl(apiClient.getBaseUrl(), this.runtimeConfig.websocketPath);

    this.realtimeEventEngine.initialize({
      wsUrl,
      eventNames: this.runtimeConfig.websocketEventNames,
      initialBackoffMs: this.runtimeConfig.websocketInitialBackoffMs,
      maxBackoffMs: this.runtimeConfig.websocketMaxBackoffMs,
      onTipsUpdate: () => {
        void this.dataRefreshEngine.refresh({ trigger: 'push' });
      },
      onEvent: (eventName, payload) => {
        if (!this.runtimeConfig) {
          return;
        }

        if (this.runtimeConfig.uiConfigEventNames.includes(eventName)) {
          void this.refreshUIConfigInBackground(payload);
        }

        if (this.runtimeConfig.runtimeConfigEventNames.includes(eventName)) {
          void this.refreshRuntimeConfigInBackground();
        }
      },
      onConnectionChange: (connected) => {
        this.dataRefreshEngine.setPushConnected(connected);

        if (connected) {
          void this.dataRefreshEngine.refresh({ trigger: 'interval' });
          void this.refreshUIConfigInBackground();
        }
      },
    });
  }

  private async refreshRuntimeConfigInBackground(): Promise<void> {
    try {
      const latestRuntimeConfig = await runtimeConfigService.getConfig();
      this.runtimeConfig = latestRuntimeConfig;
      useFeatureFlagsStore.getState().setConfig(latestRuntimeConfig);
      this.dataRefreshEngine.initialize({ intervalMs: latestRuntimeConfig.tipsRefreshIntervalMs });
      this.initializeRealtimeChannel();
    } catch (error) {
      console.error('[RuntimeEngine] Runtime config refresh failed:', error);
    }
  }

  private async refreshUIConfigInBackground(payload?: Record<string, unknown>): Promise<void> {
    const tenantId = useAppStore.getState().tenantContext?.id ?? DEFAULT_TENANT_CONTEXT.id;

    if (payload) {
      const existingConfig = useUIConfigStore.getState().config;
      const payloadConfig = uiConfigService.normalizePayload(payload.uiConfig ?? payload, existingConfig);

      if (payloadConfig) {
        useUIConfigStore.getState().setConfig(payloadConfig);

        if (payload.type === 'decision_update' || payload.event === 'decision_update' || payload.name === 'decision_update') {
          return;
        }
      }

      if (payload.type === 'decision_update' || payload.event === 'decision_update' || payload.name === 'decision_update') {
        try {
          const decisionOutput = await decisionApiService.getDecisions(tenantId);

          if (decisionOutput) {
            const merged = uiConfigService.normalizePayload({
              tenantId,
              home: {
                sections: decisionOutput.sections,
                strategy: decisionOutput.strategy,
              },
              userSegment: decisionOutput.userSegment,
              branding: decisionOutput.branding,
            }, existingConfig);

            if (merged) {
              useUIConfigStore.getState().setConfig(merged);
              return;
            }
          }
        } catch (error) {
          console.error('[RuntimeEngine] Decision endpoint refresh failed:', error);
        }
      }
    }

    try {
      const latestUIConfig = await uiConfigService.getConfig(tenantId);
      useUIConfigStore.getState().setConfig(latestUIConfig);
    } catch (error) {
      console.error('[RuntimeEngine] UI config refresh failed:', error);
    }
  }

  private toWebSocketUrl(baseUrl: string, path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    if (normalizedBase.startsWith('ws://') || normalizedBase.startsWith('wss://')) {
      return `${normalizedBase}${normalizedPath}`;
    }

    if (normalizedBase.startsWith('https://')) {
      return `${normalizedBase.replace('https://', 'wss://')}${normalizedPath}`;
    }

    if (normalizedBase.startsWith('http://')) {
      return `${normalizedBase.replace('http://', 'ws://')}${normalizedPath}`;
    }

    return `wss://${normalizedBase}${normalizedPath}`;
  }

  /**
   * Cleanup on app termination
   */
  destroy(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.realtimeEventEngine.destroy();
    this.dataRefreshEngine.destroy();
    this.otaEngine.destroy();
    this.predictivePrefetchEngine.destroy();
    this.isInitialized = false;
    this.initializePromise = null;
    this.runtimeConfig = null;
    this.currentRouteName = null;
  }
}

/**
 * Global runtime engine instance
 */
export const runtimeEngine = RuntimeEngine.getInstance();
