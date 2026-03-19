import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "online" | "offline" | "warning" | "maintenance";
  label: string;
  className?: string;
}

export const StatusIndicator = ({ status, label, className }: StatusIndicatorProps) => {
  const statusConfig = {
    online: {
      color: "bg-success",
      text: "text-success",
      glow: "glow-energy",
    },
    offline: {
      color: "bg-destructive",
      text: "text-destructive",
      glow: "",
    },
    warning: {
      color: "bg-warning",
      text: "text-warning",
      glow: "",
    },
    maintenance: {
      color: "bg-muted",
      text: "text-muted-foreground",
      glow: "",
    },
  };

  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("w-2 h-2 rounded-full animate-pulse", config.color, config.glow)} />
      <span className={cn("text-sm font-medium", config.text)}>{label}</span>
    </div>
  );
};
