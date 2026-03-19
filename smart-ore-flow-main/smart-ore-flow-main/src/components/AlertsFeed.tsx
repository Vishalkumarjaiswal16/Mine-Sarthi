import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Zap, 
  Thermometer, 
  Vibrate, 
  Activity,
  Clock,
  X,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface Alert {
  id: string;
  type: 'power' | 'temperature' | 'vibration' | 'maintenance' | 'system';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  equipment?: string;
  timestamp: Date;
  acknowledged?: boolean;
}

interface AlertsFeedProps {
  alerts?: Alert[];
  autoUpdate?: boolean;
  maxAlerts?: number;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'power',
    severity: 'warning',
    title: 'High Power Draw Detected',
    description: 'SAG Mill power consumption exceeded 95% of rated capacity',
    equipment: 'SAG Mill #1',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    acknowledged: false,
  },
  {
    id: '2',
    type: 'temperature',
    severity: 'critical',
    title: 'Elevated Temperature',
    description: 'Crusher motor temperature reached 85°C - above safe operating limit',
    equipment: 'Primary Crusher',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    acknowledged: false,
  },
  {
    id: '3',
    type: 'vibration',
    severity: 'warning',
    title: 'Increased Vibration',
    description: 'Ball mill vibration levels increased by 15% in the last hour',
    equipment: 'Ball Mill #2',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    acknowledged: true,
  },
  {
    id: '4',
    type: 'maintenance',
    severity: 'info',
    title: 'Scheduled Maintenance',
    description: 'Conveyor belt #3 maintenance scheduled for next shift',
    equipment: 'Conveyor Belt #3',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    acknowledged: false,
  },
  {
    id: '5',
    type: 'system',
    severity: 'info',
    title: 'System Update',
    description: 'Energy optimization algorithm updated successfully',
    equipment: 'System',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    acknowledged: false,
  },
];

export const AlertsFeed: React.FC<AlertsFeedProps> = ({ 
  alerts: externalAlerts,
  autoUpdate = true,
  maxAlerts = 10 
}) => {
  const [alerts, setAlerts] = useState<Alert[]>(externalAlerts || mockAlerts);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<'all' | 'unacknowledged'>('unacknowledged');

  // Simulate real-time updates
  useEffect(() => {
    if (!autoUpdate || externalAlerts) return undefined;

    const interval = setInterval(() => {
      // Randomly add new alerts
      if (Math.random() > 0.7) {
        const newAlert: Alert = {
          id: Date.now().toString(),
          type: ['power', 'temperature', 'vibration', 'maintenance'][Math.floor(Math.random() * 4)] as Alert['type'],
          severity: Math.random() > 0.7 ? 'critical' : Math.random() > 0.5 ? 'warning' : 'info',
          title: `New Alert ${Date.now()}`,
          description: 'System detected an anomaly',
          timestamp: new Date(),
          acknowledged: false,
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, maxAlerts));
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [autoUpdate, externalAlerts, maxAlerts]);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'power':
        return <Zap className="w-4 h-4" />;
      case 'temperature':
        return <Thermometer className="w-4 h-4" />;
      case 'vibration':
        return <Vibrate className="w-4 h-4" />;
      case 'maintenance':
        return <Activity className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'warning':
        return 'bg-warning/20 text-warning border-warning/30';
      default:
        return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== 'all' && alert.severity !== filter) return false;
    if (acknowledgedFilter === 'unacknowledged' && alert.acknowledged) return false;
    return true;
  });

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const warningCount = alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length;

  return (
    <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Real-Time Alerts
            {criticalCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && criticalCount === 0 && (
              <Badge variant="default" className="ml-2 bg-warning/20 text-warning border-warning/30">
                {warningCount} Warnings
              </Badge>
            )}
          </CardTitle>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2 mt-4">
          <Select value={filter} onValueChange={(value: string) => setFilter(value as 'all' | 'critical' | 'warning' | 'info')}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={acknowledgedFilter} onValueChange={(value: 'all' | 'unacknowledged') => setAcknowledgedFilter(value)}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Alerts</SelectItem>
              <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No alerts matching filters</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md ${
                    getSeverityColor(alert.severity)
                  } ${alert.acknowledged ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      alert.severity === 'critical' ? 'bg-destructive/20' :
                      alert.severity === 'warning' ? 'bg-warning/20' :
                      'bg-primary/20'
                    }`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-sm">{alert.title}</h4>
                        {!alert.acknowledged && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleAcknowledge(alert.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {alert.equipment && (
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              {alert.equipment}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(alert.timestamp)}
                          </span>
                        </div>
                        
                        {alert.acknowledged && (
                          <Badge variant="outline" className="text-xs">
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

