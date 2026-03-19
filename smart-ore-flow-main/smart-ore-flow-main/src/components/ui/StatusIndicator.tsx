import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Info, Loader2, Wifi, Wrench } from 'lucide-react';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'loading' | 'online' | 'maintenance';

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, className = '' }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'info':
        return <Info className="w-4 h-4 text-primary" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'online':
        return <Wifi className="w-4 h-4 text-success" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-warning" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-success/10 text-success border-success';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive';
      case 'info':
        return 'bg-primary/10 text-primary border-primary';
      case 'loading':
        return 'bg-primary/10 text-primary border-primary';
      case 'online':
        return 'bg-success/10 text-success border-success';
      case 'maintenance':
        return 'bg-warning/10 text-warning border-warning';
    }
  };

  return (
    <Badge variant="outline" className={`${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      {label && <span className="ml-2">{label}</span>}
    </Badge>
  );
};

export default StatusIndicator;
