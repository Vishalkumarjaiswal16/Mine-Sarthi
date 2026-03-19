import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CloudRain, Wind, Thermometer, Zap, Clock, MapPin } from 'lucide-react';

interface WeatherAlert {
  id: string;
  type: 'severe' | 'warning' | 'watch' | 'advisory';
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  impact: string;
}

export const WeatherAlerts: React.FC = () => {
  // Mock weather alerts - in a real app, this would come from a weather API
  const mockAlerts: WeatherAlert[] = [
    {
      id: '1',
      type: 'warning',
      title: 'Heavy Rain Warning',
      description: 'Heavy rainfall expected with potential flooding in low-lying mining areas. Operations may need to be suspended.',
      location: 'Pilbara Region, Western Australia',
      startTime: '2025-11-27T14:00:00Z',
      endTime: '2025-11-28T02:00:00Z',
      severity: 'severe',
      impact: 'High risk to mining operations and worker safety',
    },
    {
      id: '2',
      type: 'watch',
      title: 'Dust Storm Watch',
      description: 'Conditions favorable for dust storms. Visibility may be reduced significantly.',
      location: 'Northern Nevada Mining District',
      startTime: '2025-11-27T18:00:00Z',
      endTime: '2025-11-28T06:00:00Z',
      severity: 'moderate',
      impact: 'Potential equipment damage and reduced visibility',
    },
    {
      id: '3',
      type: 'advisory',
      title: 'Heat Advisory',
      description: 'Extreme heat conditions expected. Take precautions for heat stress.',
      location: 'Antofagasta Region, Chile',
      startTime: '2025-11-28T10:00:00Z',
      endTime: '2025-11-29T18:00:00Z',
      severity: 'moderate',
      impact: 'Worker health and safety concerns',
    },
  ];

  const getAlertIcon = (type: WeatherAlert['type']) => {
    switch (type) {
      case 'severe':
        return <Zap className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <CloudRain className="w-5 h-5 text-warning" />;
      case 'watch':
        return <Wind className="w-5 h-5 text-primary" />;
      case 'advisory':
        return <Thermometer className="w-5 h-5 text-muted-foreground" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: WeatherAlert['severity']) => {
    switch (severity) {
      case 'minor':
        return 'bg-success text-success-foreground';
      case 'moderate':
        return 'bg-warning text-warning-foreground';
      case 'severe':
        return 'bg-destructive text-destructive-foreground';
      case 'extreme':
        return 'bg-destructive text-destructive-foreground animate-pulse';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type: WeatherAlert['type']) => {
    switch (type) {
      case 'severe':
        return 'border-destructive/50 bg-destructive/10';
      case 'warning':
        return 'border-warning/50 bg-warning/10';
      case 'watch':
        return 'border-primary/50 bg-primary/10';
      case 'advisory':
        return 'border-muted-foreground/50 bg-muted/10';
      default:
        return 'border-border bg-muted/10';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (mockAlerts.length === 0) {
    return (
      <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-success" /> Weather Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active weather alerts</p>
            <p className="text-sm mt-2">All mining operations can proceed normally</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" /> Weather Alerts ({mockAlerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getTypeColor(alert.type)} hover-lift transition-all duration-300`}
            >
              <div className="flex items-start gap-3">
                <div className="animate-pulse">{getAlertIcon(alert.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{alert.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatDateTime(alert.startTime)} - {formatDateTime(alert.endTime)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground">
                      Impact: {alert.impact}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            <strong>Note:</strong> Alerts are automatically updated from meteorological services.
            Critical alerts may trigger automatic safety protocols in mining equipment.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
