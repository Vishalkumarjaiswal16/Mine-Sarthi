import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileX, Search, Database } from 'lucide-react';

export type EmptyStateType = 'no-data' | 'no-results' | 'error' | 'loading';

export interface EmptyStateProps {
  type?: EmptyStateType;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  const getDefaultIcon = () => {
    switch (type) {
      case 'no-data':
        return <Database className="w-12 h-12 text-muted-foreground" />;
      case 'no-results':
        return <Search className="w-12 h-12 text-muted-foreground" />;
      case 'error':
        return <FileX className="w-12 h-12 text-destructive" />;
      default:
        return <Database className="w-12 h-12 text-muted-foreground" />;
    }
  };

  return (
    <Card className={`p-8 text-center ${className}`}>
      <div className="flex flex-col items-center gap-4">
        {icon || getDefaultIcon()}

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-muted-foreground max-w-md">{description}</p>
          )}
        </div>

        {action && (
          <Button onClick={action.onClick} className="mt-4">
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default EmptyState;
