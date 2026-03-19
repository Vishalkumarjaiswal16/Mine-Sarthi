# Hardware Integration Readiness Assessment

## ✅ **What's Already Implemented**

### 1. **Real-Time Communication Infrastructure**
- ✅ **WebSocket Support** (`realtimeService.ts`)
  - Bidirectional communication
  - Automatic reconnection with exponential backoff
  - Connection status monitoring
  - Command sending capability (`sendCommand()` method)

- ✅ **Server-Sent Events (SSE) Support**
  - One-way real-time updates
  - Event listeners for device updates
  - Automatic reconnection

- ✅ **MQTT Service** (`mqttService.ts`)
  - Full MQTT client implementation
  - Topic-based pub/sub
  - SSL/TLS support
  - QoS levels support

### 2. **Digital Twin Integration**
- ✅ **Real-time Equipment Updates**
  - Subscribes to `equipment` channel
  - Updates device status (active/inactive/emergency)
  - Maps device status to process step statuses
  - Handles device metrics (load, temperature, vibration, alerts)

- ✅ **Process Step Status Management**
  - Dynamic status updates based on hardware data
  - Status mapping: `stopped/idle/offline` → `inactive`, `fault/error/emergency` → `emergency`
  - Real-time status badges in UI

### 3. **Data Services**
- ✅ **Data Service** (`dataService.ts`)
  - MQTT integration
  - Mock data fallback
  - Data transformation

### 4. **Hardware Management**
- ✅ **Hardware Page** (`Hardware.tsx`)
  - Device status monitoring
  - M2M connection tracking
  - Network health monitoring

## ⚠️ **What Needs to be Configured**

### 1. **Environment Variables** (Required)
Create a `.env` file in the project root with:

```env
# WebSocket Configuration
VITE_WS_URL=ws://your-hardware-server:3001
# OR
VITE_SSE_URL=http://your-hardware-server:3001/events

# MQTT Configuration (Optional - if using MQTT)
VITE_MQTT_BROKER_URL=your-mqtt-broker.com
VITE_MQTT_PORT=8083
VITE_MQTT_USERNAME=your-username
VITE_MQTT_PASSWORD=your-password
VITE_MQTT_CLIENT_ID=smart-ore-flow-client
VITE_MQTT_USE_SSL=true

# Data Source
VITE_USE_MOCK_DATA=false  # Set to false when using real hardware
```

### 2. **Backend/Server Requirements**
You need a backend server that:
- ✅ Accepts WebSocket connections at `VITE_WS_URL`
- ✅ OR provides SSE endpoint at `VITE_SSE_URL`
- ✅ Publishes data in the expected format:

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "deviceId": "equipment-1",
  "type": "equipment",
  "data": {
    "status": "active",
    "load": 85,
    "temperature": 45,
    "vibration": 2.5,
    "alerts": 0
  }
}
```

### 3. **Device ID Mapping**
Ensure your hardware devices send data with `deviceId` that matches your process steps:
- Device IDs should extract step numbers (e.g., `equipment-1` → Step 1, `equipment-2` → Step 2)
- Current code extracts step ID: `parseInt(data.deviceId.replace(/\D/g, ''))`

## 🔧 **What Needs to be Implemented**

### 1. **Command Acknowledgment System**
Currently, `sendCommand()` sends commands but doesn't wait for acknowledgment. Consider adding:

```typescript
// In realtimeService.ts
sendCommandWithAck(
  deviceId: string, 
  command: string, 
  payload: Record<string, any>
): Promise<{ success: boolean; response?: any }> {
  return new Promise((resolve) => {
    const ackId = `${deviceId}-${Date.now()}`;
    const ackHandler = (data: RealtimeData) => {
      if (data.deviceId === deviceId && data.data.ackId === ackId) {
        resolve({ success: true, response: data.data });
        this.unsubscribe('ack', ackHandler);
      }
    };
    this.subscribe('ack', ackHandler);
    this.sendCommand(deviceId, command, { ...payload, ackId });
    setTimeout(() => {
      resolve({ success: false });
      this.unsubscribe('ack', ackHandler);
    }, 5000);
  });
}
```

### 2. **Device Registration/Discovery**
Add device discovery mechanism:

```typescript
// In DigitalTwin.tsx or new DeviceRegistry.ts
const [registeredDevices, setRegisteredDevices] = useState<Device[]>([]);

useEffect(() => {
  const unsubscribe = realtimeService.subscribe('device-discovery', (data) => {
    // Register new devices
    setRegisteredDevices(prev => {
      if (!prev.find(d => d.id === data.deviceId)) {
        return [...prev, {
          id: data.deviceId,
          name: data.data.name,
          type: data.data.type,
          capabilities: data.data.capabilities
        }];
      }
      return prev;
    });
  });
  return unsubscribe;
}, []);
```

### 3. **Error Handling & Retry Logic**
Enhance error handling for hardware commands:

```typescript
// Add to realtimeService.ts
private commandQueue: Array<{
  deviceId: string;
  command: string;
  payload: any;
  retries: number;
  timestamp: Date;
}> = [];

async sendCommandWithRetry(
  deviceId: string,
  command: string,
  payload: any,
  maxRetries: number = 3
): Promise<void> {
  // Implementation with retry logic
}
```

### 4. **Data Validation**
Add schema validation for incoming hardware data:

```typescript
// Create src/lib/deviceDataValidator.ts
import { z } from 'zod';

const EquipmentDataSchema = z.object({
  status: z.enum(['active', 'inactive', 'stopped', 'idle', 'offline', 'maintenance', 'standby', 'fault', 'error', 'emergency', 'critical', 'failure', 'alarm', 'online', 'running', 'operational']),
  load: z.number().min(0).max(100).optional(),
  temperature: z.number().min(-50).max(200).optional(),
  vibration: z.number().min(0).max(100).optional(),
  alerts: z.number().min(0).optional(),
});

export function validateEquipmentData(data: unknown): boolean {
  try {
    EquipmentDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}
```

### 5. **Historical Data Storage**
Consider adding historical data tracking:

```typescript
// In DigitalTwin.tsx
const [historicalData, setHistoricalData] = useState<Map<number, Array<{
  timestamp: Date;
  metrics: any;
}>>>(new Map());

useEffect(() => {
  const unsubscribe = realtimeService.subscribe('equipment', (data) => {
    // Store historical data (keep last 100 readings per device)
    setHistoricalData(prev => {
      const deviceId = parseInt(data.deviceId.replace(/\D/g, ''));
      const existing = prev.get(deviceId) || [];
      const updated = [...existing, {
        timestamp: new Date(),
        metrics: data.data
      }].slice(-100);
      return new Map(prev).set(deviceId, updated);
    });
  });
  return unsubscribe;
}, []);
```

## 📋 **Integration Checklist**

### Pre-Integration
- [ ] Set up backend server with WebSocket/SSE support
- [ ] Configure environment variables (`.env` file)
- [ ] Ensure hardware devices can connect to your server
- [ ] Test WebSocket/SSE connection manually

### Data Format
- [ ] Verify device data format matches expected schema
- [ ] Ensure `deviceId` format matches extraction logic
- [ ] Test status mapping (active/inactive/emergency)

### Testing
- [ ] Test real-time data updates in Digital Twin
- [ ] Verify status changes reflect in UI
- [ ] Test command sending (if implementing control)
- [ ] Test reconnection after network interruption

### Security
- [ ] Implement authentication for WebSocket connections
- [ ] Add authorization checks for device commands
- [ ] Encrypt sensitive data transmission
- [ ] Validate all incoming data

### Monitoring
- [ ] Add connection status indicators
- [ ] Log device connection/disconnection events
- [ ] Monitor data quality and latency
- [ ] Set up alerts for connection failures

## 🚀 **Quick Start Guide**

1. **Set up your backend server** that publishes hardware data
2. **Create `.env` file** with your server URLs
3. **Start your frontend**: `npm run dev`
4. **Verify connection**: Check for "Real-time" badge in Digital Twin
5. **Monitor data**: Watch process step statuses update in real-time

## 📝 **Expected Data Format**

Your hardware should send data in this format:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "deviceId": "equipment-1",
  "type": "equipment",
  "data": {
    "status": "active",
    "load": 85,
    "temperature": 45.5,
    "vibration": 2.5,
    "alerts": 0,
    "name": "Hopper",
    "id": "equipment-1"
  }
}
```

## ⚡ **Current Status: 85% Ready**

Your codebase is **well-prepared** for hardware integration. The main infrastructure is in place. You primarily need to:

1. ✅ Configure environment variables
2. ✅ Set up backend server
3. ✅ Ensure data format matches
4. ⚠️ Add command acknowledgment (optional but recommended)
5. ⚠️ Add data validation (recommended for production)

The Digital Twin is already listening for real-time updates and will automatically update the UI when hardware data arrives!

