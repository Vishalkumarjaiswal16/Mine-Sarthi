import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sun, Zap } from 'lucide-react';
import { HardwareStatusIndicator } from './HardwareStatusIndicator';

interface SolarControlProps {
  initialStatus?: 'on' | 'off' | 'fault';
  initialConnected?: boolean;
  initialPowerOutput?: number;
  initialEfficiency?: number;
}

export const SolarControl: React.FC<SolarControlProps> = ({
  initialStatus = 'on',
  initialConnected = true,
  initialPowerOutput = 612,
  initialEfficiency = 94.2,
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [connected, setConnected] = useState(initialConnected);
  const [powerOutput, setPowerOutput] = useState(initialPowerOutput);
  const [efficiency, setEfficiency] = useState(initialEfficiency);

  const handleToggle = (checked: boolean) => {
    setStatus(checked ? 'on' : 'off');
    // Simulate API call or hardware command
    console.log(`Solar array turned ${checked ? 'ON' : 'OFF'}`);
  };

  return (
    <Card className="glass rounded-modern-xl hover-lift transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sun className="w-4 h-4 text-warning" /> Solar Array
        </CardTitle>
        <HardwareStatusIndicator status={connected ? (status === 'on' ? 'connected' : 'idle') : 'disconnected'} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-baseline gap-1">
          {powerOutput} <span className="text-sm text-muted-foreground">kWh/hr</span>
        </div>
        <p className="text-xs text-muted-foreground">Efficiency: {efficiency}%</p>
        <div className="flex items-center justify-between mt-4">
          <Label htmlFor="solar-switch" className="text-sm">Status: {status.toUpperCase()}</Label>
          <Switch
            id="solar-switch"
            checked={status === 'on'}
            onCheckedChange={handleToggle}
            disabled={!connected}
          />
        </div>
      </CardContent>
    </Card>
  );
};