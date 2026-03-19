import React from 'react';
import { cn } from '@/lib/utils';

interface HardwareStatusIndicatorProps {
  status: 'connected' | 'idle' | 'disconnected';
  label?: string;
  className?: string;
}

export const HardwareStatusIndicator: React.FC<HardwareStatusIndicatorProps> = ({ status, label, className }) => {
  const colorClass = {
    connected: 'bg-green-500',
    idle: 'bg-yellow-500',
    disconnected: 'bg-red-500',
  }[status];

  const pulseClass = status === 'connected' ? 'animate-pulse' : '';

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("w-3 h-3 rounded-full", colorClass, pulseClass)} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
};