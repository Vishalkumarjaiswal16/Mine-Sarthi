import { useState } from "react";
import { Bell, AlertTriangle, Info, CheckCircle, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Mock alert data
const mockAlerts = [
  {
    id: 1,
    type: "critical",
    title: "SAG Mill Overload",
    message: "SAG Mill #1 is operating at 95% capacity. Immediate attention required.",
    timestamp: "2024-01-15T10:30:00Z",
    equipment: "SAG Mill #1",
    read: false,
  },
  {
    id: 2,
    type: "warning",
    title: "Energy Threshold Exceeded",
    message: "Grid power consumption exceeded 3,000 kWh threshold for 15 minutes.",
    timestamp: "2024-01-15T09:45:00Z",
    equipment: "Power Distribution",
    read: false,
  },
  {
    id: 3,
    type: "info",
    title: "Maintenance Reminder",
    message: "Scheduled maintenance for Ball Mill #2 due in 3 days.",
    timestamp: "2024-01-15T08:00:00Z",
    equipment: "Ball Mill #2",
    read: false,
  },
  {
    id: 4,
    type: "warning",
    title: "Temperature Alert",
    message: "Crusher bearing temperature at 85°C (threshold: 80°C).",
    timestamp: "2024-01-14T16:20:00Z",
    equipment: "Crusher #3",
    read: true,
  },
  {
    id: 5,
    type: "info",
    title: "Efficiency Milestone",
    message: "Energy efficiency improved by 12% this week. Great job!",
    timestamp: "2024-01-14T12:00:00Z",
    equipment: "System",
    read: true,
  },
];

const getAlertIcon = (type: string) => {
  switch (type) {
    case "critical":
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    case "info":
      return <Info className="w-4 h-4 text-info" />;
    default:
      return <Info className="w-4 h-4 text-muted-foreground" />;
  }
};

const getAlertColor = (type: string) => {
  switch (type) {
    case "critical":
      return "border-destructive/20 bg-destructive/5";
    case "warning":
      return "border-warning/20 bg-warning/5";
    case "info":
      return "border-info/20 bg-info/5";
    default:
      return "border-border bg-card";
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};

export const NotificationBell = () => {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = alerts.filter(alert => !alert.read).length;

  const markAsRead = (id: number) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map(alert => ({ ...alert, read: true })));
  };

  const dismissAlert = (id: number) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${!alert.read ? 'bg-muted/20' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-medium ${!alert.read ? 'font-semibold' : ''}`}>
                          {alert.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissAlert(alert.id)}
                          className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(alert.timestamp)}</span>
                        <span>•</span>
                        <span>{alert.equipment}</span>
                      </div>
                      {!alert.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(alert.id)}
                          className="mt-2 h-6 px-2 text-xs"
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
