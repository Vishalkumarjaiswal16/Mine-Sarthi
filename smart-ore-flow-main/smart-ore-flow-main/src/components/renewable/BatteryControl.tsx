import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Battery, Zap } from 'lucide-react';
import { HardwareStatusIndicator } from './HardwareStatusIndicator';
import { PowerFlowIndicator } from './PowerFlowIndicator';
import { Progress } from '@/components/ui/progress';

interface BatteryControlProps {
  initialStatus?: 'charging' | 'discharging' | 'idle' | 'fault';
  initialConnected?: boolean;
  initialChargeLevel?: number; // %
  initialCapacity?: number; // kWh
  initialPowerFlow?: number; // kW
}

export const BatteryControl: React.FC<BatteryControlProps> = ({
  initialStatus = 'charging',
  initialConnected = true,
  initialChargeLevel = 87,
  initialCapacity = 2500, // 2.5 MWh
  initialPowerFlow = 75, // kW
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [connected, setConnected] = useState(initialConnected);
  const [chargeLevel, setChargeLevel] = useState(initialChargeLevel);
  const [powerFlow, setPowerFlow] = useState(initialPowerFlow);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      setStatus('charging');
      setPowerFlow(Math.abs(powerFlow)); // Ensure positive for charging
    } else {
      setStatus('idle');
      setPowerFlow(0);
    }
    console.log(`Battery set to ${checked ? 'charging' : 'idle'}`);
  };

  return (
    <Card className="glass rounded-modern-xl hover-lift transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Battery className="w-4 h-4 text-success" /> Battery Storage
        </CardTitle>
        <HardwareStatusIndicator status={connected ? (status === 'fault' ? 'disconnected' : 'connected') : 'disconnected'} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-baseline gap-1">
          {chargeLevel}% <span className="text-sm text-muted-foreground">Charged</span>
        </div>
        <Progress value={chargeLevel} className="h-2 mt-2" />
        <p className="text-xs text-muted-foreground mt-1">Capacity: {initialCapacity} kWh</p>
        <div className="flex items-center justify-between mt-4">
          <PowerFlowIndicator powerFlow={powerFlow} />
          <Switch
            id="battery-switch"
            checked={status === 'charging' || status === 'discharging'}
            onCheckedChange={handleToggle}
            disabled={!connected || status === 'fault'}
          />
        </div>
      </CardContent>
    </Card>
  );
};