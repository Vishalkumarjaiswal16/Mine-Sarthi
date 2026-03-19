import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface SensorCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string | number;
  unit: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const SensorCard = React.memo<SensorCardProps>(({ 
  icon: Icon, 
  iconColor, 
  label, 
  value, 
  unit, 
  subtitle,
  children 
}) => {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <Badge variant="outline">{label}</Badge>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{unit}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
      {children}
    </Card>
  );
});

SensorCard.displayName = "SensorCard";

export default SensorCard;
