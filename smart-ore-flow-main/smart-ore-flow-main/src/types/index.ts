/**
 * Centralized Type Definitions for MINE SARTHI
 * 
 * This file contains shared types and interfaces used across the application.
 * Import from here to ensure type consistency.
 */

// ============================================================================
// Mining & Equipment Types
// ============================================================================

export interface MiningMetrics {
  feedSize: number;
  oreHardness: number;
  equipmentLoad: number;
  moistureContent: number;
  temperature: number;
  vibration: number;
  powerFactor: number;
}

export interface EquipmentStatus {
  id: string;
  name: string;
  status: 'online' | 'warning' | 'maintenance';
  load: number;
  temperature: number;
  vibration: number;
  alerts: number;
}

export interface AIRecommendation {
  id: string;
  type: 'energy' | 'maintenance' | 'optimization' | 'renewable';
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
  energySavings?: number; // Percentage
  efficiencyGain?: number; // Percentage
  confidence?: number; // 0-100
  expectedImpact?: string;
}

// ============================================================================
// Real-Time Data Types
// ============================================================================

export interface RealtimeData {
  timestamp: Date;
  deviceId: string;
  data: Record<string, string | number | boolean | null | undefined>;
  type: 'sensor' | 'actuator' | 'gateway' | 'm2m' | 'status';
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

// ============================================================================
// MQTT Types
// ============================================================================

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

// ============================================================================
// Prediction Types
// ============================================================================

export interface Prediction {
  id: string;
  type: 'equipment_failure' | 'energy_optimization' | 'production_forecast' | 'maintenance_schedule' | 'quality_prediction';
  timestamp: number;
  confidence: number; // 0-1
  prediction: unknown;
  recommendations?: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ModelMetrics {
  modelId: string;
  modelName: string;
  version: string;
  accuracy: number;
  lastUpdated: number;
  status: 'active' | 'training' | 'deployed' | 'error';
}

// ============================================================================
// Weather Types
// ============================================================================

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
export type Trend = 'rising' | 'falling' | 'stable';
export type ComfortLevel = 'comfortable' | 'uncomfortable' | 'very-uncomfortable';

export interface HourlyForecast {
  time: Date;
  temperature: number;
  condition: WeatherCondition;
  precipitation: number;
  chanceOfRain: number;
  windSpeed: number;
  windDirection: string;
  humidity: number;
}

export interface DailyForecast {
  date: Date;
  condition: WeatherCondition;
  high: number;
  low: number;
  precipitation: number;
  chanceOfRain: number;
  windSpeed: number;
  windDirection: string;
  humidity: number;
}

export interface WeatherData {
  location?: {
    name: string;
    coordinates: { lat: number; lng: number };
    timezone: string;
  };
  temperature: number;
  condition: WeatherCondition;
  humidity: number;
  dewPoint?: number;
  comfortLevel?: ComfortLevel;
  windSpeed: number;
  windGust?: number;
  windDirection: string;
  windChill?: number;
  windSpeedTrend?: Trend;
  pressure: number;
  pressureTrend?: Trend;
  pressureChangeRate?: number; // hPa/hour
  visibility: number;
  uvIndex: number;
  feelsLike: number;
  temperatureTrend?: Trend;
  historicalComparison?: {
    yesterday: number;
    lastWeek: number;
    average: number;
  };
  precipitation: number;
  dailyTotal?: number;
  forecast: {
    high: number;
    low: number;
    chanceOfRain: number;
  };
  hourly?: HourlyForecast[];
  daily?: DailyForecast[];
  timestamp?: Date;
}

// ============================================================================
// Energy Types
// ============================================================================

export interface EnergyData {
  timestamp: Date;
  consumption: number;
  baseline: number;
  renewable: number;
  cost: number;
}

// ============================================================================
// Maintenance Types
// ============================================================================

export interface MaintenanceTask {
  id: string;
  equipment: string;
  task: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate: Date;
  estimatedDuration: number; // hours
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed';
}

// ============================================================================
// Heatmap Types
// ============================================================================

export interface HeatmapDataPoint {
  lat: number;
  lng: number;
  weight: number;
  name: string;
  production: number;
  efficiency: number;
  status: string;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'page' | 'feature' | 'equipment' | 'metric' | 'report';
  path: string;
  keywords: string[];
  category?: string;
}

// ============================================================================
// User & Auth Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'viewer';
  avatar?: string;
  lastLogin?: Date;
}

export type UserRole = User['role'];

export type Permission = 
  | 'read:all'
  | 'write:all'
  | 'delete:all'
  | 'manage:users'
  | 'manage:settings'
  | 'export:data'
  | 'view:reports'
  | 'edit:reports'
  | 'read:dashboard'
  | 'read:equipment'
  | 'write:maintenance';

// ============================================================================
// Data Service Types
// ============================================================================

export interface DataServiceConfig {
  useMockData: boolean;
  mqttConfig?: MQTTConfig;
}

export type DataType = 'metrics' | 'equipment' | 'predictions' | 'energy' | 'weather';

// ============================================================================
// Utility Types
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

