import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Wrench, Thermometer, Zap, Clock, Calendar } from 'lucide-react';

export interface EquipmentMaintenance {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'fault' | 'maintenance';
  health: {
    score: number; // 0-100
    wearLevel: number; // 0-100
    temperature: number; // Celsius
    powerConsumption: number; // kW
    lastMaintenance: string; // e.g., "12 days ago"
    nextMaintenance: string; // e.g., "18 days" or "Immediate"
  };
  alerts: number;
}

interface EquipmentCardProps {
  equipment: EquipmentMaintenance;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment }) => {
  const getStatusColor = (status: EquipmentMaintenance['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'idle':
        return 'bg-muted text-muted-foreground';
      case 'fault':
        return 'bg-destructive text-destructive-foreground';
      case 'maintenance':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card className="glass rounded-modern-xl shadow-depth-md hover-lift hover-glow transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{equipment.name}</CardTitle>
        <Badge className={getStatusColor(equipment.status)}>{equipment.status.toUpperCase()}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Health Score:</span>
          <span className={`font-bold ${getHealthColor(equipment.health.score)}`}>{equipment.health.score}%</span>
        </div>
        <Progress 
          value={equipment.health.score} 
          className="h-2"
          aria-label={`${equipment.name} health score: ${equipment.health.score}%`}
        />

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-warning" />
            <span>Temp: {equipment.health.temperature}°C</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span>Power: {equipment.health.powerConsumption} kW</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>Last Maint: {equipment.health.lastMaintenance}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Next Maint: {equipment.health.nextMaintenance}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-border/50 mt-3">
          <Button variant="outline" size="sm">View Details</Button>
          {equipment.alerts > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3" /> {equipment.alerts} Alerts
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
