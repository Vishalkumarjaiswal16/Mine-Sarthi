/**
 * Data Service Layer - Abstraction for Mock vs Real Data
 * 
 * This service provides a unified interface for accessing mining data, automatically
 * switching between mock data (for development) and MQTT real-time data (for production).
 * 
 * Features:
 * - Automatic fallback to mock data if MQTT is unavailable
 * - Subscriber pattern for real-time updates
 * - Command publishing to hardware devices
 * - Connection status monitoring
 * 
 * @module dataService
 */

// Dynamic import to prevent Vite from analyzing mqttService when mqtt package is not installed
// Using proper types for better type safety
import type { MQTTService } from './mqttService';

interface MQTTServiceModule {
  mqttService: MQTTService;
  MQTT_TOPICS: Record<string, string>;
}

let mqttService: MQTTService | null = null;
let MQTT_TOPICS: Record<string, string> | null = null;

// Lazy load mqttService only when needed
async function loadMQTTService(): Promise<MQTTServiceModule> {
  if (mqttService && MQTT_TOPICS) {
    return { mqttService, MQTT_TOPICS };
  }
  
  try {
    // Dynamic import with vite-ignore to prevent static analysis
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const module = await import(/* @vite-ignore */ './mqttService') as any;
    mqttService = module.mqttService as MQTTService;
    MQTT_TOPICS = module.MQTT_TOPICS as Record<string, string>;
    
    if (!mqttService || !MQTT_TOPICS) {
      throw new Error('MQTT service module incomplete');
    }
    
    return { mqttService, MQTT_TOPICS };
  } catch (error) {
    console.warn('⚠️ Could not load MQTT service:', error);
    throw error;
  }
}

import type { MiningMetrics, EquipmentStatus, AIRecommendation } from '@/lib/mockData';
import { generateMiningMetrics, generateEquipmentStatus, generateAIRecommendations } from '@/lib/mockData';

export interface DataServiceConfig {
  useMockData: boolean;
  mqttConfig?: {
    brokerUrl: string;
    port?: number;
    username?: string;
    password?: string;
    clientId?: string;
    useSSL?: boolean;
  };
}

class DataService {
  private config: DataServiceConfig;
  private isInitialized: boolean = false;
  private dataCallbacks: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(config: DataServiceConfig) {
    this.config = config;
  }

  /**
   * Initialize data service
   * 
   * Attempts to connect to MQTT broker if configured, otherwise uses mock data.
   * This method is safe to call multiple times - it will only initialize once.
   * 
   * @throws {Error} If MQTT connection fails and fallback is disabled (should not happen)
   * @returns {Promise<void>} Resolves when initialization is complete
   * 
   * @example
   * ```typescript
   * await dataService.initialize();
   * const isUsingMock = dataService.isUsingMockData();
   * ```
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Only try to connect to MQTT if not using mock data and config is provided
    if (!this.config.useMockData && this.config.mqttConfig) {
      try {
        // Lazy load mqttService only when needed
        const { mqttService: service } = await loadMQTTService();
        
        // Try to connect - mqttService will handle the import check
        await service.connect(this.config.mqttConfig);
        this.setupMQTTSubscriptions();
        console.log('✅ Data Service initialized with MQTT');
      } catch (error: unknown) {
        // If MQTT package is not installed or connection fails, fall back to mock data
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('not installed') || 
            errorMessage.includes('not found') ||
            errorMessage.includes('Cannot resolve')) {
          console.warn('⚠️ MQTT package not installed. Install with: npm install mqtt');
          console.log('📦 Falling back to mock data');
        } else {
          console.error('❌ Failed to connect to MQTT, falling back to mock data:', error);
        }
        this.config.useMockData = true;
      }
    } else {
      console.log('✅ Data Service initialized with Mock Data');
    }

    this.isInitialized = true;
  }

  /**
   * Setup MQTT topic subscriptions
   */
  private setupMQTTSubscriptions(): void {
    if (!mqttService || !MQTT_TOPICS) {
      console.error('❌ MQTT service not loaded');
      return;
    }
    
    // Subscribe to equipment status
    mqttService.subscribe(MQTT_TOPICS.EQUIPMENT_STATUS, (message) => {
      try {
        const data = JSON.parse(message.payload as string);
        this.notifySubscribers('equipment', data);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error parsing equipment status:', errorMessage);
      }
    });

    // Subscribe to mining metrics
    mqttService.subscribe(MQTT_TOPICS.MINING_METRICS, (message) => {
      try {
        const data = JSON.parse(message.payload as string);
        this.notifySubscribers('metrics', data);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error parsing mining metrics:', errorMessage);
      }
    });

    // Subscribe to predictions
    mqttService.subscribe(MQTT_TOPICS.PREDICTIONS, (message) => {
      try {
        const data = JSON.parse(message.payload as string);
        this.notifySubscribers('predictions', data);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error parsing predictions:', errorMessage);
      }
    });

    // Subscribe to energy data
    mqttService.subscribe(MQTT_TOPICS.ENERGY_CONSUMPTION, (message) => {
      try {
        const data = JSON.parse(message.payload as string);
        this.notifySubscribers('energy', data);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error parsing energy data:', errorMessage);
      }
    });

    // Subscribe to weather data
    mqttService.subscribe(MQTT_TOPICS.WEATHER_DATA, (message) => {
      try {
        const data = JSON.parse(message.payload as string);
        this.notifySubscribers('weather', data);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error parsing weather data:', errorMessage);
      }
    });
  }

  /**
   * Get mining metrics (mock or real-time)
   */
  getMiningMetrics(): MiningMetrics | null {
    if (this.config.useMockData) {
      // Return mock data - in real implementation, this would be cached
      return null; // Will be generated by hooks
    }
    // Real-time data comes through MQTT subscriptions
    return null;
  }

  /**
   * Get equipment status (mock or real-time)
   */
  getEquipmentStatus(): EquipmentStatus[] | null {
    if (this.config.useMockData) {
      return null; // Will be generated by hooks
    }
    // Real-time data comes through MQTT subscriptions
    return null;
  }

  /**
   * Subscribe to data updates
   * 
   * Registers a callback function to receive updates for a specific data type.
   * The callback will be called whenever new data is received for that type.
   * 
   * @param {string} dataType - Type of data to subscribe to ('metrics' | 'equipment' | 'predictions' | 'energy' | 'weather')
   * @param {Function} callback - Function to call when data is received
   * @returns {Function} Unsubscribe function - call to stop receiving updates
   * 
   * @example
   * ```typescript
   * const unsubscribe = dataService.subscribe('metrics', (data) => {
   *   console.log('New metrics:', data);
   * });
   * 
   * // Later, to stop receiving updates:
   * unsubscribe();
   * ```
   */
  subscribe(dataType: 'metrics' | 'equipment' | 'predictions' | 'energy' | 'weather', callback: (data: unknown) => void): () => void {
    // Ensure service is initialized
    if (!this.isInitialized) {
      console.warn('⚠️ Data service not initialized yet. Initializing...');
      this.initialize().catch(console.error);
    }

    if (!this.dataCallbacks.has(dataType)) {
      this.dataCallbacks.set(dataType, new Set());
    }

    this.dataCallbacks.get(dataType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.dataCallbacks.get(dataType)?.delete(callback);
    };
  }

  /**
   * Notify subscribers of data updates
   */
  private notifySubscribers(dataType: string, data: unknown): void {
    const callbacks = this.dataCallbacks.get(dataType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ Error in ${dataType} callback:`, errorMessage);
        }
      });
    }
  }

  /**
   * Send command to hardware via MQTT
   */
  sendCommand(command: string, payload: Record<string, string | number | boolean | null | undefined>): void {
    if (this.config.useMockData) {
      console.log('📤 [MOCK] Command:', command, payload);
      return;
    }

    const topic = `${MQTT_TOPICS.COMMANDS}/${command}`;
    mqttService.publish(topic, payload);
  }

  /**
   * Update settings via MQTT
   */
  updateSettings(settings: Record<string, string | number | boolean | null | undefined>): void {
    if (this.config.useMockData) {
      console.log('📤 [MOCK] Settings update:', settings);
      return;
    }

    mqttService.publish(MQTT_TOPICS.SETTINGS, settings);
  }

  /**
   * Check if using mock data
   */
  isUsingMockData(): boolean {
    // Default to true if not initialized to be safe
    if (!this.isInitialized) {
      return true;
    }
    return this.config.useMockData;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    if (this.config.useMockData) {
      return true; // Mock data is always "connected"
    }
    return mqttService.getConnectionStatus();
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.dataCallbacks.clear();
    if (!this.config.useMockData && mqttService) {
      try {
        mqttService.disconnect();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error disconnecting MQTT:', errorMessage);
      }
    }
    this.isInitialized = false;
  }
}

// Create singleton instance
// Default to mock data - only use MQTT if explicitly configured
const useMockData = import.meta.env.VITE_USE_MOCK_DATA !== 'false' || !import.meta.env.VITE_MQTT_BROKER_URL;

export const dataService = new DataService({
  useMockData: useMockData, // Default to mock data unless explicitly disabled AND broker URL provided
  mqttConfig: import.meta.env.VITE_MQTT_BROKER_URL ? {
    brokerUrl: import.meta.env.VITE_MQTT_BROKER_URL,
    port: parseInt(import.meta.env.VITE_MQTT_PORT || '8083'),
    username: import.meta.env.VITE_MQTT_USERNAME,
    password: import.meta.env.VITE_MQTT_PASSWORD,
    clientId: import.meta.env.VITE_MQTT_CLIENT_ID || `smart-ore-flow-${Date.now()}`,
    useSSL: import.meta.env.VITE_MQTT_USE_SSL === 'true',
  } : undefined,
});

