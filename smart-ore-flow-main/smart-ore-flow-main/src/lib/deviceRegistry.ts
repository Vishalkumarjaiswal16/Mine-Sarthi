import { realtimeService, RealtimeData } from './realtimeService';

export interface RegisteredDevice {
  id: string;
  name: string;
  type: 'sensor' | 'controller' | 'gateway' | 'actuator' | 'equipment';
  status: 'connected' | 'disconnected' | 'error';
  lastSeen: Date;
  firstSeen: Date;
  capabilities: string[];
  location?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

class DeviceRegistry {
  private devices: Map<string, RegisteredDevice> = new Map();
  private listeners: Set<(devices: RegisteredDevice[]) => void> = new Set();
  private discoverySubscribed = false;

  constructor() {
    this.subscribeToDiscovery();
  }

  private subscribeToDiscovery(): void {
    if (this.discoverySubscribed) return;
    
    realtimeService.subscribe('device-discovery', (data: RealtimeData) => {
      this.registerDevice({
        id: data.deviceId,
        name: (data.data['name'] as string) || `Device ${data.deviceId}`,
        type: (data.data['type'] as RegisteredDevice['type']) || 'sensor',
        capabilities: (data.data['capabilities'] as string[]) || [],
        location: data.data['location'] as string | undefined,
        metadata: data.data as Record<string, string | number | boolean | null | undefined>,
      });
    });

    realtimeService.subscribe('equipment', (data: RealtimeData) => {
      const existing = this.devices.get(data.deviceId);
      if (!existing) {
        this.registerDevice({
          id: data.deviceId,
          name: (data.data['name'] as string) || `Equipment ${data.deviceId}`,
          type: 'equipment',
          capabilities: ['monitoring', 'status-updates'],
          location: data.data['location'] as string | undefined,
          metadata: data.data as Record<string, string | number | boolean | null | undefined>,
        });
      } else {
        this.updateDeviceStatus(data.deviceId, 'connected');
      }
    });

    this.discoverySubscribed = true;
  }

  registerDevice(device: Omit<RegisteredDevice, 'status' | 'lastSeen' | 'firstSeen'>): void {
    const existing = this.devices.get(device.id);
    
    if (existing) {
      existing.name = device.name;
      existing.type = device.type;
      existing.capabilities = device.capabilities;
      existing.location = device.location;
      existing.metadata = device.metadata;
      existing.lastSeen = new Date();
      existing.status = 'connected';
    } else {
      const now = new Date();
      this.devices.set(device.id, {
        ...device,
        status: 'connected',
        lastSeen: now,
        firstSeen: now,
      });
    }

    this.notifyListeners();
  }

  updateDeviceStatus(deviceId: string, status: RegisteredDevice['status']): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = status;
      device.lastSeen = new Date();
      this.notifyListeners();
    }
  }

  removeDevice(deviceId: string): void {
    if (this.devices.delete(deviceId)) {
      this.notifyListeners();
    }
  }

  getDevice(deviceId: string): RegisteredDevice | undefined {
    return this.devices.get(deviceId);
  }

  getAllDevices(): RegisteredDevice[] {
    return Array.from(this.devices.values());
  }

  getDevicesByType(type: RegisteredDevice['type']): RegisteredDevice[] {
    return Array.from(this.devices.values()).filter(d => d.type === type);
  }

  getConnectedDevices(): RegisteredDevice[] {
    return Array.from(this.devices.values()).filter(d => d.status === 'connected');
  }

  subscribe(listener: (devices: RegisteredDevice[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getAllDevices());
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const devices = this.getAllDevices();
    this.listeners.forEach(listener => {
      try {
        listener(devices);
      } catch (error) {
        console.error('[DeviceRegistry] Error in listener:', error);
      }
    });
  }

  clear(): void {
    this.devices.clear();
    this.notifyListeners();
  }
}

export const deviceRegistry = new DeviceRegistry();

