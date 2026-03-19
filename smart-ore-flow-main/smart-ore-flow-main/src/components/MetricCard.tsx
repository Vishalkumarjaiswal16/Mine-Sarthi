import { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";


interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  status?: "normal" | "warning" | "critical" | "success";
  className?: string;
  animate?: boolean;
}

export const MetricCard = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  status = "normal",
  className,
  animate = true,
}: MetricCardProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!animate) return;
    
    const interval = setInterval(() => {
      setIsAnimating(true);
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      const variance = numValue * 0.02; // 2% variance
      const newValue = numValue + (Math.random() - 0.5) * variance;
      
      setDisplayValue(
        typeof value === "string" 
          ? newValue.toFixed(1) 
          : Math.round(newValue * 10) / 10
      );
      
      setTimeout(() => setIsAnimating(false), 500);
    }, 3000);

    return () => clearInterval(interval);
  }, [value, animate]);
  
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);
  const statusColors = {
    normal: "text-foreground",
    warning: "text-warning",
    critical: "text-destructive",
    success: "text-success",
  };

  const trendColors = {
    up: "text-success",
    down: "text-destructive",
    stable: "text-muted-foreground",
  };

  const getStatusDescription = () => {
    switch (status) {
      case "success": return "Normal operating range";
      case "warning": return "Warning - requires attention";
      case "critical": return "Critical - immediate action required";
      default: return "Normal status";
    }
  };

  const getTrendDescription = () => {
    if (!trend || !trendValue) return "";
    const direction = trend === "up" ? "increased" : trend === "down" ? "decreased" : "stable";
    return `${direction} by ${trendValue} compared to last hour`;
  };

  return (
    <Card
      className={cn(
        "p-3 sm:p-4 bg-gradient-to-br from-card to-muted/20 border-border hover:border-primary/50 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] relative overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2 rounded-lg animate-slide-up-fade",
        className
      )}
      role="article"
      aria-labelledby={`metric-${title.replace(/\s+/g, '-').toLowerCase()}`}
      aria-describedby={`metric-desc-${title.replace(/\s+/g, '-').toLowerCase()}`}
      tabIndex={0}
    >
      <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-primary/5 rounded-full blur-2xl" aria-hidden="true" />

      <div className="relative">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-1.5 sm:p-2 rounded-lg bg-primary/10 transition-all",
                status === "success" && "glow-energy",
                status === "warning" && "glow-warning",
                isAnimating && "scale-110"
              )}
              aria-hidden="true"
            >
              <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all", statusColors[status])} />
            </div>
            <h3
              id={`metric-${title.replace(/\s+/g, '-').toLowerCase()}`}
              className="text-xs sm:text-sm font-medium text-muted-foreground truncate"
            >
              {title}
            </h3>
          </div>
        </div>

        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-2xl sm:text-3xl font-bold transition-all",
              statusColors[status],
              isAnimating && "scale-105"
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            {displayValue}
          </span>
          {unit && (
            <span className="text-sm sm:text-lg text-muted-foreground" aria-label={`unit: ${unit}`}>
              {unit}
            </span>
          )}
        </div>

        {trend && trendValue && (
          <div className="mt-1 sm:mt-2 flex items-center gap-1">
            <span
              className={cn("text-xs font-medium", trendColors[trend])}
              aria-label={`Trend: ${getTrendDescription()}`}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">vs last hour</span>
            <span className="text-xs text-muted-foreground sm:hidden">vs hr</span>
          </div>
        )}

        <div
          id={`metric-desc-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="sr-only"
        >
          {title}: {displayValue}{unit ? ` ${unit}` : ''}. Status: {getStatusDescription()}.
          {getTrendDescription() && ` ${getTrendDescription()}.`}
        </div>
      </div>
    </Card>
  );
};
