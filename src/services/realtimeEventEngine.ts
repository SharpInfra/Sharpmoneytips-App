/**
 * Realtime event engine
 * WebSocket connection with safe reconnect and exponential backoff.
 */

type RealtimeEventEngineOptions = {
  wsUrl: string;
  eventNames: string[];
  initialBackoffMs: number;
  maxBackoffMs: number;
  onTipsUpdate: () => void;
  onEvent?: (eventName: string, payload: Record<string, unknown>) => void;
  onConnectionChange?: (connected: boolean) => void;
};

export class RealtimeEventEngine {
  private static instance: RealtimeEventEngine;
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private isDestroyed = false;
  private isConnected = false;
  private options: RealtimeEventEngineOptions | null = null;

  private constructor() {}

  static getInstance(): RealtimeEventEngine {
    if (!RealtimeEventEngine.instance) {
      RealtimeEventEngine.instance = new RealtimeEventEngine();
    }

    return RealtimeEventEngine.instance;
  }

  initialize(options: RealtimeEventEngineOptions): void {
    this.options = options;
    this.isDestroyed = false;
    this.connect();
  }

  private connect(): void {
    if (this.isDestroyed || !this.options || this.ws) {
      return;
    }

    try {
      this.ws = new WebSocket(this.options.wsUrl);
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event.data);
      this.ws.onerror = () => this.handleSocketFailure();
      this.ws.onclose = () => this.handleSocketFailure();
    } catch (error) {
      console.error('[RealtimeEvent] Failed to connect:', error);
      this.handleSocketFailure();
    }
  }

  private handleOpen(): void {
    this.reconnectAttempt = 0;
    this.setConnectionState(true);
  }

  private handleSocketFailure(): void {
    this.cleanupSocket();
    this.setConnectionState(false);

    if (this.isDestroyed) {
      return;
    }

    this.scheduleReconnect();
  }

  private handleMessage(rawData: unknown): void {
    if (!this.options) {
      return;
    }

    if (typeof rawData !== 'string') {
      return;
    }

    try {
      const payload = JSON.parse(rawData) as Record<string, unknown>;
      const eventName = this.extractEventName(payload);

      if (eventName) {
        this.options.onEvent?.(eventName, payload);
      }

      if (eventName && this.options.eventNames.includes(eventName)) {
        this.options.onTipsUpdate();
      }
    } catch (error) {
      if (__DEV__) {
        console.log('[RealtimeEvent] Ignoring non-JSON message');
      }
    }
  }

  private extractEventName(payload: Record<string, unknown>): string | null {
    const candidate = payload.type ?? payload.event ?? payload.name;

    if (typeof candidate !== 'string') {
      return null;
    }

    return candidate;
  }

  private scheduleReconnect(): void {
    if (!this.options || this.reconnectTimer) {
      return;
    }

    const backoffBase = Math.min(
      this.options.initialBackoffMs * 2 ** this.reconnectAttempt,
      this.options.maxBackoffMs,
    );

    const jitter = Math.floor(Math.random() * Math.max(200, Math.floor(backoffBase * 0.2)));
    const delayMs = backoffBase + jitter;

    this.reconnectAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delayMs);
  }

  private setConnectionState(connected: boolean): void {
    if (this.isConnected === connected) {
      return;
    }

    this.isConnected = connected;
    this.options?.onConnectionChange?.(connected);
  }

  private cleanupSocket(): void {
    if (!this.ws) {
      return;
    }

    this.ws.onopen = null;
    this.ws.onmessage = null;
    this.ws.onerror = null;
    this.ws.onclose = null;

    try {
      this.ws.close();
    } catch {
      // no-op
    }

    this.ws = null;
  }

  destroy(): void {
    this.isDestroyed = true;
    this.setConnectionState(false);

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.cleanupSocket();
    this.options = null;
    this.reconnectAttempt = 0;
  }
}
