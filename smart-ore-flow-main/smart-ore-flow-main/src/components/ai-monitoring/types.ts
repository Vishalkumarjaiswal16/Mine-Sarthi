// Types for sensor data
export interface SensorData {
  device_id: string;
  ts: number;
  power_kw: number;
  rpm: number;
  feed_tph: number;
  feed_size_mm: number;
  ore_fines_pct: number;
  vibration: number;
  temperature_c: number;
  motor_current_a: number;
  hardness_index: number;
}

export interface AIFeatures {
  device_id: string;
  timestamp: number;
  avg_power_kw?: number;
  avg_rpm?: number;
  avg_feed_tph?: number;
  avg_feed_size_mm?: number;
  ore_hardness_prediction?: string;
  ore_hardness_confidence?: number;
  optimal_rpm_recommendation?: number;
  predicted_energy_kwh_per_t?: number;
  energy_savings_pct?: number;
}

export interface ControlServiceStatus {
  is_running: boolean;
  device_id: string;
  automatic_control_enabled?: boolean;
  mqtt_connected?: boolean;
  integration?: {
    monitoring?: boolean;
    predictions?: boolean;
    monitor?: {
      running?: boolean;
      healthy?: boolean;
    };
    pipeline?: {
      cached_predictions_count?: number;
    };
  };
  last_control_decision?: {
    target_rpm?: number;
    adjusted_rpm?: number;
    recommended_rpm?: number;
    current_rpm?: number;
    ore_type?: string;
    energy_savings_pct?: number;
    confidence?: number;
    timestamp?: string;
    rpm_change?: number;
    rpm_change_pct?: number;
    predicted_energy_kwh_per_ton?: number;
    reason?: string;
    source?: string;
  };
  command_history_count?: number;
}
