import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PowerFlowIndicatorProps {
  powerFlow: number; // kW (positive = charging, negative = discharging)
  className?: string;
}

export const PowerFlowIndicator: React.FC<PowerFlowIndicatorProps> = ({ powerFlow, className }) => {
  const isCharging = powerFlow > 0;
  const isDischarging = powerFlow < 0;
  const isIdle = powerFlow === 0;

  const colorClass = isCharging ? 'text-green-500' : isDischarging ? 'text-blue-500' : 'text-gray-500';
  const animationClass = isCharging || isDischarging ? 'animate-bounce-y' : '';

  return (
    <div className={cn("flex items-center gap-2", colorClass, className)}>
      {isCharging && <ArrowUp className={cn("w-4 h-4", animationClass)} />}
      {isDischarging && <ArrowDown className={cn("w-4 h-4", animationClass)} />}
      {isIdle && <Minus className="w-4 h-4" />}
      <span className="font-semibold">{Math.abs(powerFlow)} kW</span>
      <span className="text-xs text-muted-foreground">
        {isCharging ? 'Charging' : isDischarging ? 'Discharging' : 'Idle'}
      </span>
    </div>
  );
};