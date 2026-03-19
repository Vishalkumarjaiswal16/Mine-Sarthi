/**
 * Real-Time Data Service for Hardware Integration
 * 
 * This service provides WebSocket and Server-Sent Events (SSE) support
 * for real-time hardware data integration. It's designed to work with
 * IoT devices, sensors, and M2M communication systems.
 */

export interface RealtimeData {
  timestamp: Date;
  deviceId: string;
  data: Record<string, string | number | boolean | null | undefined>;
  type: 'sensor' | 'actuator' | 'gateway' | 'm2m' | 'status' | 'equipment' | 'process' | 'prediction' | 'ack';
}

export interface M2MConnectionData {
  from: string;
  to: string;
  type: 'data' | 'control' | 'monitoring';
  status: 'active' | 'inactive' | 'error';
  latency: number; // ms
  dataRate: number; // bytes/sec
  lastCommunication: Date;
  packetLoss?: number; // percentage
}

export interface DeviceRealtimeStatus {
  id: string;
  name: string;
  type: 'sensor' | 'controller' | 'gateway' | 'actuator';
  status: 'connected' | 'disconnected' | 'error';
  lastSeen: Date;
  signalStrength: number; // 0-100
  firmwareVersion: string;
  location?: string;
  metrics: {
    temperature?: number;
    powerConsumption?: number;
    efficiency?: number;
    [key: string]: string | number | boolean | null | undefined;
  };
}

export interface CommandResponse {
  success: boolean;
  response?: Record<string, string | number | boolean | null | undefined>;
  error?: string;
  timestamp: Date;
}

export interface PendingCommand {
  deviceId: string;
  command: string;
  payload: Record<string, string | number | boolean | null | undefined>;
  retries: number;
  timestamp: Date;
  ackId: string;
  resolve: (response: CommandResponse) => void;
  reject: (error: Error) => void;
}

class RealtimeService {
  private wsConnection: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private subscribers: Map<string, Set<(data: RealtimeData) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;
  private isConnected = false;
  private pendingCommands: Map<string, PendingCommand> = new Map();
  private maxRetries = 3;
  private commandTimeout = 5000;

  /**
   * Initialize WebSocket connection for real-time bidirectional communication
   */
  connectWebSocket(url?: string): void {
    // Get URL from parameter or environment
    const wsUrl = url || import.meta.env['VITE_WS_URL'];
    
    // Check if mock data mode is enabled - skip WebSocket connection if so
    const useMockData = import.meta.env['VITE_USE_MOCK_DATA'] === 'true' || 
                       import.meta.env['VITE_USE_MOCK_DATA'] === true;
    
    // If no URL provided or mock data enabled, skip connection
    if (!wsUrl || useMockData) {
      this.fallbackToPolling();
      return;
    }

    // Don't attempt connection to localhost if it's likely not available
    // This prevents browser console errors when server isn't running
    if (wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1')) {
      // Only attempt localhost connection if explicitly enabled for debugging
      if (import.meta.env['VITE_DEBUG_WS'] !== 'true') {
        // Silently fall back to polling for localhost connections
        this.fallbackToPolling();
        return;
      }
    }

    try {
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        console.log('[RealtimeService] WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifySubscribers('connection', {
          timestamp: new Date(),
          deviceId: 'system',
          data: { status: 'connected', type: 'connection' },
          type: 'status',
        });
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data: RealtimeData = JSON.parse(event.data);
          
          if (data.data['ackId']) {
            this.handleCommandAck(data);
          } else {
            this.notifySubscribers(data.type, data);
          }
        } catch (error) {
          console.error('[RealtimeService] Error parsing WebSocket message:', error);
        }
      };

      this.wsConnection.onerror = (error) => {
        // Suppress WebSocket connection errors - they're expected when server isn't running
        // The browser will log the error, but we don't need to log it again
        // Only log if explicitly debugging WebSocket connections
        if (import.meta.env['VITE_DEBUG_WS'] === 'true') {
          console.error('[RealtimeService] WebSocket error:', error);
        }
        this.isConnected = false;
        // Immediately fall back to polling on error
        this.fallbackToPolling();
      };

      this.wsConnection.onclose = () => {
        // Suppress close logging unless debugging
        if (import.meta.env['VITE_DEBUG_WS'] === 'true' && this.reconnectAttempts === 0) {
          console.log('[RealtimeService] WebSocket disconnected');
        }
        this.isConnected = false;
        this.attemptReconnect(wsUrl);
      };
    } catch (error) {
      // Suppress error - only log if explicitly debugging
      if (import.meta.env['VITE_DEBUG_WS'] === 'true') {
        console.error('[RealtimeService] Failed to create WebSocket connection:', error);
      }
      this.fallbackToPolling();
    }
  }

  /**
   * Initialize Server-Sent Events for one-way real-time updates
   */
  connectSSE(url: string = import.meta.env['VITE_SSE_URL'] || 'http://localhost:3001/events'): void {
    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('[RealtimeService] SSE connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data: RealtimeData = JSON.parse(event.data);
          this.notifySubscribers(data.type, data);
        } catch (error) {
          console.error('[RealtimeService] Error parsing SSE message:', error);
        }
      };

      this.eventSource.addEventListener('device-update', (event: MessageEvent) => {
        try {
          const data: RealtimeData = JSON.parse(event.data);
          this.notifySubscribers('sensor', data);
        } catch (error) {
          console.error('[RealtimeService] Error parsing device-update:', error);
        }
      });

      this.eventSource.addEventListener('m2m-update', (event: MessageEvent) => {
        try {
          const data: RealtimeData = JSON.parse(event.data);
          this.notifySubscribers('m2m', data);
        } catch (error) {
          console.error('[RealtimeService] Error parsing m2m-update:', error);
        }
      });

      this.eventSource.onerror = () => {
        console.error('[RealtimeService] SSE error');
        this.isConnected = false;
        this.eventSource?.close();
        this.attemptReconnectSSE(url);
      };
    } catch (error) {
      console.error('[RealtimeService] Failed to create SSE connection:', error);
      this.fallbackToPolling();
    }
  }

  /**
   * Subscribe to real-time data updates
   */
  subscribe(type: string, callback: (data: RealtimeData) => void): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(type)?.delete(callback);
    };
  }

  /**
   * Send command to hardware device via WebSocket
   */
  sendCommand(deviceId: string, command: string, payload: Record<string, string | number | boolean | null | undefined> = {}): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        deviceId,
        command,
        payload,
        timestamp: new Date().toISOString(),
      }));
    } else {
      console.warn('[RealtimeService] WebSocket not connected, cannot send command');
    }
  }

  /**
   * Send command with acknowledgment and retry logic
   */
  async sendCommandWithAck(
    deviceId: string,
    command: string,
    payload: Record<string, string | number | boolean | null | undefined> = {},
    timeout: number = this.commandTimeout
  ): Promise<CommandResponse> {
    return new Promise((resolve, reject) => {
      if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const ackId = `${deviceId}-${command}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const pendingCommand: PendingCommand = {
        deviceId,
        command,
        payload,
        retries: 0,
        timestamp: new Date(),
        ackId,
        resolve,
        reject,
      };

      this.pendingCommands.set(ackId, pendingCommand);

      const sendCommand = () => {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
          this.wsConnection.send(JSON.stringify({
            deviceId,
            command,
            payload: { ...payload, ackId },
            timestamp: new Date().toISOString(),
          }));

          const timeoutId = setTimeout(() => {
            const cmd = this.pendingCommands.get(ackId);
            if (cmd) {
              if (cmd.retries < this.maxRetries) {
                cmd.retries++;
                console.warn(`[RealtimeService] Command timeout, retrying (${cmd.retries}/${this.maxRetries})...`);
                sendCommand();
              } else {
                this.pendingCommands.delete(ackId);
                reject(new Error(`Command timeout after ${this.maxRetries} retries`));
              }
            }
          }, timeout);

          const originalResolve = pendingCommand.resolve;
          pendingCommand.resolve = (response: CommandResponse) => {
            clearTimeout(timeoutId);
            originalResolve(response);
          };
        } else {
          this.pendingCommands.delete(ackId);
          reject(new Error('WebSocket connection lost'));
        }
      };

      sendCommand();
    });
  }

  /**
   * Handle command acknowledgment
   */
  private handleCommandAck(data: RealtimeData): void {
    const ackId = data.data['ackId'] as string | undefined;
    if (!ackId) return;

    const pendingCommand = this.pendingCommands.get(ackId);
    if (pendingCommand) {
      this.pendingCommands.delete(ackId);
      
      const success = data.data['success'] !== false;
      const response: CommandResponse = {
        success,
        response: data.data['response'] as Record<string, string | number | boolean | null | undefined> | undefined,
        error: success ? undefined : (data.data['error'] as string | undefined) || 'Command failed',
        timestamp: new Date(),
      };

      if (success) {
        pendingCommand.resolve(response);
      } else {
        pendingCommand.reject(new Error(response.error || 'Command failed'));
      }
    }
  }

  /**
   * Send command with automatic retry on failure
   */
  async sendCommandWithRetry(
    deviceId: string,
    command: string,
    payload: Record<string, string | number | boolean | null | undefined> = {},
    maxRetries: number = this.maxRetries
  ): Promise<CommandResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.sendCommandWithAck(deviceId, command, payload);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.warn(`[RealtimeService] Command failed, retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Command failed after all retries');
  }

  /**
   * Notify all subscribers of a specific type
   */
  private notifySubscribers(type: string, data: RealtimeData): void {
    const callbacks = this.subscribers.get(type);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('[RealtimeService] Error in subscriber callback:', errorMessage);
        }
      });
    }

    // Also notify 'all' subscribers
    const allCallbacks = this.subscribers.get('all');
    if (allCallbacks) {
      allCallbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('[RealtimeService] Error in subscriber callback:', errorMessage);
        }
      });
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(url: string): void {
    // Check if mock data mode is enabled - skip reconnection attempts if so
    const useMockData = import.meta.env['VITE_USE_MOCK_DATA'] === 'true' || 
                       import.meta.env['VITE_USE_MOCK_DATA'] === true;
    
    if (useMockData) {
      this.fallbackToPolling();
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      // Only log first few attempts, then suppress
      if (this.reconnectAttempts <= 3 || import.meta.env['VITE_DEBUG_WS'] === 'true') {
        console.log(`[RealtimeService] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      }
      setTimeout(() => {
        this.connectWebSocket(url);
      }, this.reconnectDelay);
    } else {
      // Only log if explicitly debugging
      if (import.meta.env['VITE_DEBUG_WS'] === 'true') {
        console.error('[RealtimeService] Max reconnection attempts reached, falling back to polling');
      }
      this.fallbackToPolling();
    }
  }

  /**
   * Attempt to reconnect SSE
   */
  private attemptReconnectSSE(url: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connectSSE(url);
      }, this.reconnectDelay);
    } else {
      console.error('[RealtimeService] Max SSE reconnection attempts reached, falling back to polling');
      this.fallbackToPolling();
    }
  }

  /**
   * Fallback to polling if WebSocket/SSE unavailable
   */
  private fallbackToPolling(): void {
    console.log('[RealtimeService] Using polling fallback');
    // Polling implementation would go here
    // For now, components will use their existing polling mechanisms
  }

  /**
   * Disconnect all real-time connections
   */
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this.subscribers.clear();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Import React for hooks
import { useState, useEffect } from 'react';

// React hook for using real-time data
export function useRealtimeData<T = RealtimeData>(
  type: string,
  initialData?: T
): [T | undefined, boolean] {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = realtimeService.subscribe(type, (newData) => {
      setData(newData as T);
    });

    setIsConnected(realtimeService.getConnectionStatus());

    return () => {
      unsubscribe();
    };
  }, [type]);

  return [data, isConnected];
}

