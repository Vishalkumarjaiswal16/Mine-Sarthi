import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Wifi, AlertTriangle, Cpu, Network, Clock, Signal, HardDrive, Radio, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { generateEquipmentStatus } from '@/lib/mockData';
import { realtimeService, DeviceRealtimeStatus, M2MConnectionData } from '@/lib/realtimeService';
import M2MNetwork from '@/components/hardware/M2MNetwork';

interface DeviceStatus {
  id: string;
  name: string;
  type: 'sensor' | 'controller' | 'gateway' | 'actuator';
  status: 'connected' | 'disconnected' | 'error';
  lastSeen: Date;
  signalStrength: number; // 0-100
  firmwareVersion: string;
  location?: string;
}

const HardwarePage: React.FC = () => {
  const [deviceStatuses, setDeviceStatuses] = useState<DeviceRealtimeStatus[]>([]);
  const [m2mConnections, setM2mConnections] = useState<M2MConnectionData[]>([]);
  const [networkHealth, setNetworkHealth] = useState({
    overall: 95,
    averageLatency: 35, // ms
    packetLoss: 0.1, // %
    uptime: 99.9, // %
  });
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [updateCount, setUpdateCount] = useState(0);

  // Initialize real-time service connection
  useEffect(() => {
    // Try to connect to WebSocket/SSE for real-time data
    const wsUrl = import.meta.env.VITE_WS_URL;
    const sseUrl = import.meta.env.VITE_SSE_URL;

    if (wsUrl) {
      realtimeService.connectWebSocket(wsUrl);
    } else if (sseUrl) {
      realtimeService.connectSSE(sseUrl);
    }

    // Subscribe to real-time device updates
    const unsubscribeDevices = realtimeService.subscribe('sensor', (data) => {
      setLastUpdateTime(new Date());
      setUpdateCount(prev => prev + 1);
      setDeviceStatuses(prev => {
        const index = prev.findIndex(d => d.id === data.deviceId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            ...data.data,
            lastSeen: new Date(),
          };
          return updated;
        }
        // Add new device if not found
        return [...prev, {
          id: data.deviceId,
          name: data.data.name || `Device ${data.deviceId}`,
          type: data.data.type || 'sensor',
          status: data.data.status || 'connected',
          lastSeen: new Date(),
          signalStrength: data.data.signalStrength || 85,
          firmwareVersion: data.data.firmwareVersion || '1.0.0',
          location: data.data.location,
          metrics: data.data.metrics || {},
        }];
      });
    });

    // Subscribe to M2M connection updates
    const unsubscribeM2M = realtimeService.subscribe('m2m', (data) => {
      setLastUpdateTime(new Date());
      setUpdateCount(prev => prev + 1);
      if (data.data.connections) {
        setM2mConnections(data.data.connections);
      }
    });

    // Subscribe to network health updates
    const unsubscribeHealth = realtimeService.subscribe('status', (data) => {
      setLastUpdateTime(new Date());
      setUpdateCount(prev => prev + 1);
      if (data.data.networkHealth) {
        setNetworkHealth(data.data.networkHealth);
      }
    });

    // Check connection status periodically
    const statusInterval = setInterval(() => {
      setIsRealtimeConnected(realtimeService.getConnectionStatus());
    }, 1000);

    // Fallback: Initialize with mock data if no real-time connection
    try {
      if (!realtimeService.getConnectionStatus()) {
        const mockDevices = generateEquipmentStatus().map(eq => ({
          id: eq.id,
          name: eq.name,
          type: 'sensor' as const,
          status: 'connected' as const,
          lastSeen: new Date(),
          signalStrength: Math.floor(70 + Math.random() * 30),
          firmwareVersion: '1.0.' + Math.floor(Math.random() * 10),
          metrics: {},
        }));
        setDeviceStatuses(mockDevices);

        // Generate mock M2M connections
        const mockConnections: M2MConnectionData[] = mockDevices.slice(0, 5).map((device, idx) => ({
          from: device.id,
          to: mockDevices[(idx + 1) % mockDevices.length]?.id || device.id,
          type: 'data' as const,
          status: 'active' as const,
          latency: Math.floor(20 + Math.random() * 50),
          dataRate: Math.floor(1000 + Math.random() * 5000),
          lastCommunication: new Date(),
          packetLoss: Math.random() * 0.5,
        }));
        setM2mConnections(mockConnections);
      }
    } catch (error) {
      console.error('Error initializing hardware data:', error);
      // Set empty arrays as fallback
      setDeviceStatuses([]);
      setM2mConnections([]);
    }

    return () => {
      unsubscribeDevices();
      unsubscribeM2M();
      unsubscribeHealth();
      clearInterval(statusInterval);
    };
  }, []);

  const connectedDevices = deviceStatuses.filter(d => d.status === 'connected').length;
  const disconnectedDevices = deviceStatuses.filter(d => d.status === 'disconnected' || d.status === 'error').length;
  const totalDevices = deviceStatuses.length;

  return (
    <div className="min-h-full space-y-6 p-4 sm:p-6 w-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#26436C' }}>
            <span>M2M</span>{' '}
            <span>Connectivity</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Monitor the status and communication health of all connected devices and M2M links.
          </p>
        </div>
        
        {/* Real-Time Connection Status Indicator */}
        <Card className="p-4 glass rounded-modern-xl shadow-depth-md border-2 border-primary/20 animate-scale-in-center hover-lift card-micro">
          <div className="flex items-center gap-3">
            <div className={`relative ${isRealtimeConnected ? 'animate-pulse' : ''}`}>
              {isRealtimeConnected ? (
                <CheckCircle2 className="w-6 h-6 text-success" />
              ) : (
                <XCircle className="w-6 h-6 text-muted-foreground" />
              )}
              {isRealtimeConnected && (
                <div className="absolute inset-0 w-6 h-6 bg-success/20 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {isRealtimeConnected ? 'Real-Time Active' : 'Using Mock Data'}
              </div>
              <div className="text-xs text-muted-foreground">
                {isRealtimeConnected ? (
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-success animate-pulse" />
                    {updateCount} updates received
                  </span>
                ) : (
                  'Configure VITE_WS_URL or VITE_SSE_URL'
                )}
              </div>
              {isRealtimeConnected && (
                <div className="text-xs text-muted-foreground mt-1">
                  Last: {lastUpdateTime.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="p-4 glass rounded-modern-xl shadow-depth-md animate-scale-in-center hover-lift card-micro">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Activity className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{connectedDevices}</div>
              <div className="text-sm text-muted-foreground">Connected Devices</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass rounded-modern-xl shadow-depth-md animate-scale-in-center hover-lift card-micro">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Wifi className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">{disconnectedDevices}</div>
              <div className="text-sm text-muted-foreground">Disconnected</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass rounded-modern-xl shadow-depth-md animate-scale-in-center hover-lift card-micro">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Network className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{networkHealth.overall}%</div>
              <div className="text-sm text-muted-foreground">Network Health</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass rounded-modern-xl shadow-depth-md animate-scale-in-center hover-lift card-micro">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">2</div>
              <div className="text-sm text-muted-foreground">Active Alerts</div>
            </div>
          </div>
        </Card>
      </div>

      {/* M2M Network Visualization */}
      <M2MNetwork 
        devices={deviceStatuses}
        connections={m2mConnections}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Status List */}
        <Card className="lg:col-span-2 p-6 glass rounded-modern-xl shadow-depth-xl animate-slide-up-fade hover-lift card-micro">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" /> Device Status
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isRealtimeConnected ? "default" : "outline"} 
                className={`text-xs flex items-center gap-1.5 ${isRealtimeConnected ? 'bg-success/20 text-success border-success animate-pulse' : 'bg-muted/50'}`}
              >
                {isRealtimeConnected ? (
                  <>
                    <Radio className="w-3 h-3 animate-pulse" />
                    Real-time Live
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    Mock Data
                  </>
                )}
              </Badge>
              {isRealtimeConnected && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary">
                  <Zap className="w-3 h-3 mr-1" />
                  {updateCount} updates
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {deviceStatuses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deviceStatuses.map(device => (
                  <Card key={device.id} className="p-4 bg-muted/50 border border-border hover:bg-muted/70 transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{device.name}</h4>
                        <p className="text-xs text-muted-foreground capitalize">{device.type}</p>
                      </div>
                      <Badge
                        variant={device.status === 'connected' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {device.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Signal className="w-3 h-3" />
                          Signal:
                        </span>
                        <span className={`font-medium ${
                          device.signalStrength > 80 ? 'text-success' :
                          device.signalStrength > 60 ? 'text-warning' :
                          'text-destructive'
                        }`}>
                          {device.signalStrength}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last Seen:
                        </span>
                        <span>{device.lastSeen.toLocaleTimeString()}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          Firmware:
                        </span>
                        <span>{device.firmwareVersion}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">No devices found.</div>
            )}
          </CardContent>
        </Card>

        {/* Network Health Panel */}
        <Card className="lg:col-span-1 p-6 glass rounded-modern-xl shadow-depth-xl animate-slide-up-fade hover-lift card-micro">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Network className="w-5 h-5 text-success" /> Network Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{networkHealth.overall}%</div>
                <div className="text-sm text-muted-foreground">Overall Health</div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Latency</span>
                  <span className={`font-medium ${
                    networkHealth.averageLatency < 50 ? 'text-success' :
                    networkHealth.averageLatency < 100 ? 'text-warning' :
                    'text-destructive'
                  }`}>
                    {networkHealth.averageLatency}ms
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Packet Loss</span>
                  <span className={`font-medium ${
                    networkHealth.packetLoss < 0.1 ? 'text-success' :
                    networkHealth.packetLoss < 0.5 ? 'text-warning' :
                    'text-destructive'
                  }`}>
                    {networkHealth.packetLoss}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="font-medium text-success">{networkHealth.uptime}%</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HardwarePage;
