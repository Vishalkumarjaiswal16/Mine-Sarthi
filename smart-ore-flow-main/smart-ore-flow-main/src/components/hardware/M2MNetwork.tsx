import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, Activity, AlertTriangle, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { realtimeService, M2MConnectionData, DeviceRealtimeStatus } from '@/lib/realtimeService';

interface M2MNode {
  id: string;
  name: string;
  type: 'sensor' | 'controller' | 'gateway' | 'actuator';
  x: number;
  y: number;
  status: 'connected' | 'disconnected' | 'error';
  connections: string[]; // IDs of connected nodes
}

interface M2MNetworkProps {
  devices?: DeviceRealtimeStatus[];
  connections?: M2MConnectionData[];
  width?: number;
  height?: number;
}

const M2MNetwork: React.FC<M2MNetworkProps> = ({
  devices = [],
  connections = [],
  width = 800,
  height = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [realtimeConnections, setRealtimeConnections] = useState<M2MConnectionData[]>(connections);
  const [realtimeDevices, setRealtimeDevices] = useState<DeviceRealtimeStatus[]>(devices);
  const [isConnected, setIsConnected] = useState(false);

  // Generate node positions in a network layout
  const generateNodes = useCallback((devices: DeviceRealtimeStatus[]): M2MNode[] => {
    const nodeCount = devices.length;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    return devices.map((device, index) => {
      const angle = (2 * Math.PI * index) / nodeCount;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // Find connections for this device
      const deviceConnections = realtimeConnections
        .filter(conn => conn.from === device.id || conn.to === device.id)
        .map(conn => conn.from === device.id ? conn.to : conn.from);

      return {
        id: device.id,
        name: device.name,
        type: device.type,
        x,
        y,
        status: device.status,
        connections: deviceConnections,
      };
    });
  }, [width, height, realtimeConnections]);

  // Subscribe to real-time M2M updates
  useEffect(() => {
    const unsubscribe = realtimeService.subscribe('m2m', (data) => {
      if (data.data.connections) {
        setRealtimeConnections(data.data.connections);
      }
    });

    const unsubscribeDevices = realtimeService.subscribe('sensor', (data) => {
      setRealtimeDevices(prev => {
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
        return prev;
      });
    });

    setIsConnected(realtimeService.getConnectionStatus());

    return () => {
      unsubscribe();
      unsubscribeDevices();
    };
  }, []);

  // Draw network on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const nodes = generateNodes(realtimeDevices);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw connections (lines)
    realtimeConnections.forEach((connection) => {
      const fromNode = nodes.find(n => n.id === connection.from);
      const toNode = nodes.find(n => n.id === connection.to);

      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);

        // Color based on connection status
        if (connection.status === 'active') {
          ctx.strokeStyle = connection.latency < 50 
            ? 'rgba(34, 197, 94, 0.6)' // Green for low latency
            : connection.latency < 100
            ? 'rgba(251, 191, 36, 0.6)' // Yellow for medium latency
            : 'rgba(239, 68, 68, 0.6)'; // Red for high latency
          ctx.lineWidth = Math.max(1, Math.min(4, connection.dataRate / 1000)); // Thickness based on data rate
        } else if (connection.status === 'error') {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
          ctx.setLineDash([5, 5]); // Dashed for errors
          ctx.lineWidth = 1;
        } else {
          ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
          ctx.lineWidth = 1;
        }

        ctx.stroke();
        ctx.setLineDash([]); // Reset dash

        // Draw data flow animation (small circles moving along the line)
        if (connection.status === 'active' && connection.dataRate > 0) {
          const progress = (Date.now() % 2000) / 2000; // Animation cycle
          const x = fromNode.x + (toNode.x - fromNode.x) * progress;
          const y = fromNode.y + (toNode.y - fromNode.y) * progress;

          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
          ctx.fill();
        }

        // Draw latency label
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '10px monospace';
        ctx.fillText(`${connection.latency}ms`, midX + 5, midY - 5);
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);

      // Color based on status
      if (node.status === 'connected') {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
      } else if (node.status === 'error') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      } else {
        ctx.fillStyle = 'rgba(156, 163, 175, 0.5)';
      }

      ctx.fill();
      ctx.strokeStyle = selectedNode === node.id ? 'rgba(59, 130, 246, 1)' : 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = selectedNode === node.id ? 3 : 1;
      ctx.stroke();

      // Node label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name.substring(0, 12), node.x, node.y + 35);

      // Status indicator
      ctx.beginPath();
      ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
      if (node.status === 'connected') {
        ctx.fillStyle = 'rgba(34, 197, 94, 1)';
      } else {
        ctx.fillStyle = 'rgba(239, 68, 68, 1)';
      }
      ctx.fill();

      // Pulsing animation for active connections
      if (node.status === 'connected' && node.connections.length > 0) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20 + Math.sin(Date.now() / 500) * 5, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Handle click detection
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const clickedNode = nodes.find(node => {
        const dx = x - node.x;
        const dy = y - node.y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
      });

      if (clickedNode) {
        setSelectedNode(clickedNode.id === selectedNode ? null : clickedNode.id);
      }
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [realtimeConnections, realtimeDevices, selectedNode, width, height, generateNodes]);

  const selectedDevice = realtimeDevices.find(d => d.id === selectedNode);
  const selectedConnections = realtimeConnections.filter(
    c => c.from === selectedNode || c.to === selectedNode
  );

  return (
    <Card className="glass rounded-modern-xl shadow-depth-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" />
          M2M Communication Network
        </CardTitle>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="bg-success/10 text-success border-success">
              <Activity className="w-3 h-3 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              <WifiOff className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Network Canvas */}
          <div className="relative border border-border rounded-lg bg-muted/20 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="w-full h-auto"
              style={{ maxHeight: '600px' }}
            />
          </div>

          {/* Selected Node Details */}
          {selectedDevice && (
            <Card className="p-4 bg-muted/50 border-border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-sm">{selectedDevice.name}</h4>
                  <p className="text-xs text-muted-foreground capitalize">{selectedDevice.type}</p>
                </div>
                <Badge
                  variant={selectedDevice.status === 'connected' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {selectedDevice.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Signal:</span>
                  <span className="ml-2 font-medium">{selectedDevice.signalStrength}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Firmware:</span>
                  <span className="ml-2 font-medium">{selectedDevice.firmwareVersion}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Seen:</span>
                  <span className="ml-2 font-medium">
                    {selectedDevice.lastSeen.toLocaleTimeString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Connections:</span>
                  <span className="ml-2 font-medium">{selectedConnections.length}</span>
                </div>
              </div>

              {/* Connection Details */}
              {selectedConnections.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-medium mb-2">Active Connections:</p>
                  <div className="space-y-1">
                    {selectedConnections.map((conn, idx) => {
                      const targetDevice = realtimeDevices.find(
                        d => d.id === (conn.from === selectedNode ? conn.to : conn.from)
                      );
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            → {targetDevice?.name || 'Unknown'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={conn.latency < 50 ? 'text-success' : 'text-warning'}>
                              {conn.latency}ms
                            </span>
                            {conn.status === 'active' ? (
                              <CheckCircle2 className="w-3 h-3 text-success" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-destructive" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Network Statistics */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {realtimeConnections.filter(c => c.status === 'active').length}
              </div>
              <div className="text-xs text-muted-foreground">Active Links</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-warning">
                {Math.round(
                  realtimeConnections
                    .filter(c => c.status === 'active')
                    .reduce((sum, c) => sum + c.latency, 0) /
                    realtimeConnections.filter(c => c.status === 'active').length || 0
                )}
              </div>
              <div className="text-xs text-muted-foreground">Avg Latency (ms)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-success">
                {realtimeDevices.filter(d => d.status === 'connected').length}
              </div>
              <div className="text-xs text-muted-foreground">Connected Devices</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default M2MNetwork;

