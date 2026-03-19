import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Zap, 
  Gauge, 
  Thermometer, 
  Vibrate, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  Clock,
  Cpu,
  Settings
} from "lucide-react";
import SensorCard from "./SensorCard";
import type { SensorData } from "./types";

interface SensorDataGridProps {
  latestData: SensorData;
  optimalRPM: number | null;
  rpmDifference: number;
  formatTimestamp: (ts: number) => string;
}

const SensorDataGrid = React.memo<SensorDataGridProps>(({ 
  latestData, 
  optimalRPM, 
  rpmDifference,
  formatTimestamp 
}) => {
  return (
    <Card className="p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#26436C' }}>
          <Activity className="w-6 h-6 animate-pulse text-green-500" />
          Real-Time Data
        </h2>
        <Badge variant="outline" className="gap-2">
          <Clock className="w-3 h-3" />
          Last Update: {formatTimestamp(latestData.ts)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Device ID */}
        <div className="col-span-full">
          <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Device ID</p>
                <p className="text-xl font-bold">{latestData.device_id}</p>
              </div>
              <Badge variant="default" className="gap-2">
                <CheckCircle className="w-3 h-3" />
                Connected
              </Badge>
            </div>
          </div>
        </div>

        {/* Power */}
        <SensorCard
          icon={Zap}
          iconColor="text-yellow-500"
          label="Power"
          value={(latestData.power_kw ?? 0).toFixed(1)}
          unit="kW"
        />

        {/* RPM */}
        <SensorCard
          icon={Gauge}
          iconColor="text-blue-500"
          label="Current RPM"
          value={latestData.rpm ?? 0}
          unit="RPM"
          subtitle="→ Real-time"
        >
          {optimalRPM && (
            <div className="mt-2 flex items-center gap-2">
              {rpmDifference > 10 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : rpmDifference < -10 ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <span className="text-xs text-muted-foreground">
                Optimal: {optimalRPM} RPM
              </span>
            </div>
          )}
        </SensorCard>

        {/* Feed Rate */}
        <SensorCard
          icon={Activity}
          iconColor="text-green-500"
          label="Feed Rate"
          value={latestData.feed_tph ?? 0}
          unit="TPH"
          subtitle="→ Real-time"
        />

        {/* Feed Size */}
        <SensorCard
          icon={Settings}
          iconColor="text-purple-500"
          label="Feed Size"
          value={(latestData.feed_size_mm ?? 0).toFixed(1)}
          unit="mm"
          subtitle="→ Real-time"
        />

        {/* Temperature */}
        <SensorCard
          icon={Thermometer}
          iconColor="text-red-500"
          label="Temperature"
          value={(latestData.temperature_c ?? 0).toFixed(1)}
          unit="°C"
          subtitle="→ Real-time"
        />

        {/* Vibration */}
        <SensorCard
          icon={Vibrate}
          iconColor="text-orange-500"
          label="Vibration"
          value={(latestData.vibration ?? 0).toFixed(1)}
          unit="mm/s"
          subtitle="→ Real-time"
        />

        {/* Motor Current */}
        <SensorCard
          icon={Cpu}
          iconColor="text-indigo-500"
          label="Motor Current"
          value={(latestData.motor_current_a ?? 0).toFixed(1)}
          unit="A"
          subtitle="→ Real-time"
        />

        {/* Moisture Content */}
        <SensorCard
          icon={Activity}
          iconColor="text-teal-500"
          label="Moisture Content"
          value={((latestData.ore_fines_pct ?? 0) * 0.4).toFixed(1)}
          unit="%"
          subtitle="→ Real-time"
        />

        {/* Ore Hardness */}
        <SensorCard
          icon={Gauge}
          iconColor="text-pink-500"
          label="Ore Hardness"
          value={((latestData.hardness_index ?? 0) / 10).toFixed(1)}
          unit="BWI"
          subtitle="→ Real-time"
        />

        {/* Equipment Load */}
        <SensorCard
          icon={Zap}
          iconColor="text-green-500"
          label="Equipment Load"
          value={(((latestData.power_kw ?? 0) / 500) * 100).toFixed(1)}
          unit="%"
          subtitle="→ Real-time"
        />

        {/* Power Factor */}
        <SensorCard
          icon={Zap}
          iconColor="text-green-500"
          label="Power Factor"
          value={(() => {
            const power = latestData.power_kw ?? 0;
            const current = latestData.motor_current_a ?? 0;
            if (current === 0 || current === null) return 0.9;
            const factor = power / (current * 0.4);
            return isFinite(factor) ? factor : 0.9;
          })().toFixed(2)}
          unit=""
          subtitle="→ Real-time"
        />
      </div>
    </Card>
  );
});

SensorDataGrid.displayName = "SensorDataGrid";

export default SensorDataGrid;
