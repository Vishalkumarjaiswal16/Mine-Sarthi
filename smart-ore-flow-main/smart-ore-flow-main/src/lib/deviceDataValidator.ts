import { z } from 'zod';

const StatusSchema = z.enum([
  'active', 'inactive', 'stopped', 'idle', 'offline', 
  'maintenance', 'standby', 'fault', 'error', 'emergency', 
  'critical', 'failure', 'alarm', 'online', 'running', 'operational'
]);

export const EquipmentDataSchema = z.object({
  status: StatusSchema.optional(),
  load: z.number().min(0).max(100).optional(),
  temperature: z.number().min(-50).max(200).optional(),
  vibration: z.number().min(0).max(100).optional(),
  alerts: z.number().min(0).optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  power: z.number().min(0).optional(),
  efficiency: z.number().min(0).max(100).optional(),
  capacity: z.number().min(0).optional(),
  feedRate: z.number().min(0).optional(),
  level: z.number().min(0).max(100).optional(),
  frequency: z.number().min(0).optional(),
  amplitude: z.number().min(0).optional(),
  speed: z.number().min(0).optional(),
  cutSize: z.number().min(0).optional(),
  throughput: z.number().min(0).optional(),
  recovery: z.number().min(0).max(100).optional(),
  grade: z.number().min(0).max(100).optional(),
  p80: z.number().min(0).optional(),
  reductionRatio: z.number().min(0).optional(),
  length: z.number().min(0).optional(),
  solids: z.number().min(0).max(100).optional(),
});

export const RealtimeDataSchema = z.object({
  timestamp: z.union([z.string(), z.date()]).transform(val => val instanceof Date ? val : new Date(val)),
  deviceId: z.string(),
  type: z.enum(['sensor', 'actuator', 'gateway', 'm2m', 'status', 'equipment', 'process', 'ack']),
  data: EquipmentDataSchema.or(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))),
});

export type ValidatedEquipmentData = z.infer<typeof EquipmentDataSchema>;
export type ValidatedRealtimeData = z.infer<typeof RealtimeDataSchema>;

export interface ValidationResult {
  valid: boolean;
  data?: ValidatedEquipmentData | ValidatedRealtimeData;
  errors?: z.ZodError;
}

export function validateEquipmentData(data: unknown): ValidationResult {
  try {
    const validated = EquipmentDataSchema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn('[DeviceDataValidator] Validation failed:', error.errors);
      return { valid: false, errors: error };
    }
    return { valid: false };
  }
}

export function validateRealtimeData(data: unknown): ValidationResult {
  try {
    const validated = RealtimeDataSchema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn('[DeviceDataValidator] Realtime data validation failed:', error.errors);
      return { valid: false, errors: error };
    }
    return { valid: false };
  }
}

export function sanitizeEquipmentData(data: Record<string, unknown>): ValidatedEquipmentData {
  const sanitized: Record<string, unknown> = {};
  
  if (typeof data.status === 'string') {
    sanitized.status = StatusSchema.safeParse(data.status).success ? data.status : undefined;
  }
  
  if (typeof data.load === 'number' && data.load >= 0 && data.load <= 100) {
    sanitized.load = data.load;
  }
  
  if (typeof data.temperature === 'number' && data.temperature >= -50 && data.temperature <= 200) {
    sanitized.temperature = data.temperature;
  }
  
  if (typeof data.vibration === 'number' && data.vibration >= 0 && data.vibration <= 100) {
    sanitized.vibration = data.vibration;
  }
  
  if (typeof data.alerts === 'number' && data.alerts >= 0) {
    sanitized.alerts = data.alerts;
  }
  
  return sanitized as ValidatedEquipmentData;
}

