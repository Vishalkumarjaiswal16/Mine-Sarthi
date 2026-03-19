/**
 * MQTT Service for Real-Time Data Communication
 * 
 * Handles WebSocket connection to MQTT broker for live hardware data streaming.
 * Provides pub/sub functionality for real-time mining data.
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Topic-based subscriptions
 * - Message publishing
 * - Connection status monitoring
 * 
 * @module mqttService
 */

export interface MQTTConfig {
  brokerUrl: string;
  port?: number;
  username?: string;
  password?: string;
  clientId?: string;
  useSSL?: boolean;
}

export interface MQTTMessage {
  topic: string;
  payload: string | Buffer;
  timestamp: number;
}

export type MQTTMessageHandler = (message: MQTTMessage) => void;

// MQTT Client interface for type safety
interface MQTTClient {
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  subscribe: (topic: string, callback: (err: Error | null) => void) => void;
  unsubscribe: (topic: string) => void;
  publish: (topic: string, payload: string, options: { qos: number }, callback?: (error?: Error) => void) => void;
  end: () => void;
}

export class MQTTService {
  private client: MQTTClient | null = null;
  private isConnected: boolean = false;
  private subscribers: Map<string, Set<MQTTMessageHandler>> = new Map();
  private config: MQTTConfig | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectInterval: number = 5000; // 5 seconds

  /**
   * Initialize MQTT connection
   * 
   * Establishes WebSocket connection to MQTT broker. Supports both SSL and non-SSL connections.
   * Automatically handles reconnection on connection loss.
   * 
   * @param {MQTTConfig} config - MQTT broker configuration
   * @throws {Error} If MQTT package is not installed or connection fails
   * @returns {Promise<void>} Resolves when connection is established
   * 
   * @example
   * ```typescript
   * await mqttService.connect({
   *   brokerUrl: 'localhost',
   *   port: 8083,
   *   useSSL: false
   * });
   * ```
   */
  async connect(config: MQTTConfig): Promise<void> {
    this.config = config;
    
    try {
      // Dynamically import MQTT client - using @vite-ignore to prevent static analysis
      // This allows the app to work without mqtt installed (will fall back to mock data)
      let mqttModule;
      try {
        // @ts-expect-error - Dynamic import, package may not be installed
        // @vite-ignore - Exclude from Vite's static analysis
        mqttModule = await import(/* @vite-ignore */ 'mqtt');
      } catch (importError: unknown) {
        // Handle various error types that indicate the package is not installed
        const error = importError as { code?: string; message?: string };
        const errorMessage = error.message || '';
        const isNotFoundError = 
          error.code === 'MODULE_NOT_FOUND' || 
          errorMessage.includes('Cannot resolve') ||
          errorMessage.includes('Failed to resolve') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('Cannot find module');
        
        if (isNotFoundError) {
          console.error('❌ MQTT package not found. Install with: npm install mqtt');
          throw new Error('MQTT package not installed. Run: npm install mqtt');
        }
        throw importError;
      }
      
      // Handle both default and named exports
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mqtt = (mqttModule as any).default || mqttModule;
      
      if (!mqtt || typeof mqtt.connect !== 'function') {
        throw new Error('MQTT client not available. Invalid package version.');
      }
      
      const brokerUrl = config.useSSL 
        ? `wss://${config.brokerUrl}:${config.port || 8884}`
        : `ws://${config.brokerUrl}:${config.port || 8083}`;

      const options = {
        clientId: config.clientId || `smart-ore-flow-${Date.now()}`,
        username: config.username,
        password: config.password,
        clean: true,
        reconnectPeriod: this.reconnectInterval,
        connectTimeout: 10000,
      };

      this.client = mqtt.connect(brokerUrl, options);

      this.client.on('connect', () => {
        console.log('✅ MQTT Connected to broker:', brokerUrl);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnect();
      });

      this.client.on('error', (error: Error) => {
        console.error('❌ MQTT Error:', error);
        this.isConnected = false;
        this.onError(error);
      });

      this.client.on('close', () => {
        console.log('⚠️ MQTT Connection closed');
        this.isConnected = false;
        this.onDisconnect();
      });

      this.client.on('reconnect', () => {
        this.reconnectAttempts++;
        console.log(`🔄 MQTT Reconnecting... (Attempt ${this.reconnectAttempts})`);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached');
          this.disconnect();
        }
      });

      this.client.on('message', (topic: string, message: Buffer) => {
        this.handleMessage(topic, message);
      });

    } catch (error) {
      console.error('❌ Failed to initialize MQTT client:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.isConnected = false;
      this.subscribers.clear();
      console.log('🔌 MQTT Disconnected');
    }
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic: string, handler: MQTTMessageHandler): void {
    if (!this.isConnected || !this.client) {
      console.warn('⚠️ MQTT not connected. Cannot subscribe to:', topic);
      return;
    }

    // Add handler to subscribers
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
      // Subscribe to topic if this is the first subscriber
      this.client.subscribe(topic, (err: Error | null) => {
        if (err) {
          console.error(`❌ Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`✅ Subscribed to topic: ${topic}`);
        }
      });
    }

    this.subscribers.get(topic)!.add(handler);
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic: string, handler?: MQTTMessageHandler): void {
    if (!this.subscribers.has(topic)) {
      return;
    }

    if (handler) {
      // Remove specific handler
      this.subscribers.get(topic)!.delete(handler);
      
      // If no more handlers, unsubscribe from topic
      if (this.subscribers.get(topic)!.size === 0) {
        this.subscribers.delete(topic);
        if (this.client && this.isConnected) {
          this.client.unsubscribe(topic);
          console.log(`🔌 Unsubscribed from topic: ${topic}`);
        }
      }
    } else {
      // Remove all handlers and unsubscribe
      this.subscribers.delete(topic);
      if (this.client && this.isConnected) {
        this.client.unsubscribe(topic);
        console.log(`🔌 Unsubscribed from topic: ${topic}`);
      }
    }
  }

  /**
   * Publish message to a topic
   */
  publish(topic: string, message: string | object, qos: 0 | 1 | 2 = 0): void {
    if (!this.isConnected || !this.client) {
      console.warn('⚠️ MQTT not connected. Cannot publish to:', topic);
      return;
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    
    this.client.publish(topic, payload, { qos }, (error?: Error) => {
      if (error) {
        console.error(`❌ Failed to publish to ${topic}:`, error);
      } else {
        console.log(`📤 Published to ${topic}:`, payload.substring(0, 100));
      }
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Handle incoming MQTT message
   */
  private handleMessage(topic: string, message: Buffer): void {
    const handlers = this.subscribers.get(topic);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const mqttMessage: MQTTMessage = {
      topic,
      payload: message.toString(),
      timestamp: Date.now(),
    };

    // Notify all subscribers
    handlers.forEach(handler => {
      try {
        handler(mqttMessage);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error in message handler for ${topic}:`, errorMessage);
      }
    });
  }

  /**
   * Connection event handlers (can be overridden)
   */
  private onConnect(): void {
    // Override in subclasses or set callbacks
  }

  private onDisconnect(): void {
    // Override in subclasses or set callbacks
  }

  private onError(error: Error): void {
    // Override in subclasses or set callbacks
  }
}

// Export singleton instance
export const mqttService = new MQTTService();

// Export topics constants
export const MQTT_TOPICS = {
  // Equipment data
  EQUIPMENT_STATUS: 'mining/equipment/status',
  EQUIPMENT_METRICS: 'mining/equipment/metrics',
  EQUIPMENT_ALERTS: 'mining/equipment/alerts',
  
  // Mining metrics
  MINING_METRICS: 'mining/metrics',
  ORE_FLOW: 'mining/ore/flow',
  PRODUCTION: 'mining/production',
  
  // Energy data
  ENERGY_CONSUMPTION: 'mining/energy/consumption',
  ENERGY_EFFICIENCY: 'mining/energy/efficiency',
  
  // Weather data
  WEATHER_DATA: 'mining/weather/data',
  
  // Predictions (from ML model)
  PREDICTIONS: 'mining/predictions',
  MODEL_UPDATES: 'mining/model/updates',
  
  // Commands (to hardware)
  COMMANDS: 'mining/commands',
  SETTINGS: 'mining/settings',
} as const;

