import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Settings,
  CheckCircle,
  Square,
  AlertTriangle,
  Play,
  Power,
  Send,
  Cpu,
  Gauge
} from "lucide-react";
import type { ControlServiceStatus } from "./types";

interface ControlServiceSectionProps {
  controlStatus: ControlServiceStatus | null;
  controlLoading: boolean;
  controlError: string | null;
  isStarting: boolean;
  isStopping: boolean;
  onStart: () => void;
  onStop: () => void;
}

const ControlServiceSection = React.memo<ControlServiceSectionProps>(({
  controlStatus,
  controlLoading,
  controlError,
  isStarting,
  isStopping,
  onStart,
  onStop
}) => {
  return (
    <Card className="p-6 shadow-lg border-2 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#26436C' }}>
          <Settings className="w-6 h-6" />
          Speed Control Service
        </h2>
        {controlStatus && (
          <Badge 
            variant={controlStatus.is_running ? "default" : "secondary"}
            className="gap-2"
          >
            {controlStatus.is_running ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Running
              </>
            ) : (
              <>
                <Square className="w-3 h-3" />
                Stopped
              </>
            )}
          </Badge>
        )}
      </div>

      {controlError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{controlError}</span>
          </div>
        </div>
      )}

      {controlLoading && !controlStatus ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-4 text-muted-foreground">Loading control service status...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Service Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Service Status</span>
                <Badge variant={controlStatus?.is_running ? "default" : "secondary"}>
                  {controlStatus?.is_running ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {controlStatus?.is_running ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
                <span className="font-semibold">
                  {controlStatus?.is_running ? "Monitoring & Controlling" : "Not Running"}
                </span>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">MQTT Connection</span>
                <Badge variant={controlStatus?.mqtt_connected ? "default" : "secondary"}>
                  {controlStatus?.mqtt_connected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {controlStatus?.mqtt_connected ? (
                  <Send className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                )}
                <span className="font-semibold">
                  {controlStatus?.mqtt_connected 
                    ? "Commands Publishing" 
                    : "No MQTT Connection"}
                </span>
              </div>
            </div>
          </div>

          {/* Control Actions */}
          <div className="flex items-center gap-3">
            {!controlStatus?.is_running ? (
              <Button
                onClick={onStart}
                disabled={isStarting}
                className="gap-2"
                variant="default"
              >
                <Play className="w-4 h-4" />
                {isStarting ? "Starting..." : "Start Control Service"}
              </Button>
            ) : (
              <Button
                onClick={onStop}
                disabled={isStopping}
                className="gap-2"
                variant="destructive"
              >
                <Square className="w-4 h-4" />
                {isStopping ? "Stopping..." : "Stop Control Service"}
              </Button>
            )}
            
            {controlStatus?.automatic_control_enabled !== undefined && (
              <Badge variant="outline" className="gap-2">
                <Power className="w-3 h-3" />
                Auto Control: {controlStatus.automatic_control_enabled ? "Enabled" : "Disabled"}
              </Badge>
            )}
          </div>

          {/* Model 1: Ore Hardness Classification */}
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border-2 border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-500" />
                Model 1: Ore Hardness Classification
              </h4>
              <Badge variant="outline" className="bg-blue-500/20 text-blue-700 border-blue-500/30">
                AI Model
              </Badge>
            </div>
            {controlStatus?.last_control_decision?.ore_type ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Predicted Ore Type:</span>
                  <Badge 
                    variant="default" 
                    className={
                      controlStatus.last_control_decision.ore_type.toLowerCase() === "hard" ? "bg-red-500" :
                      controlStatus.last_control_decision.ore_type.toLowerCase() === "medium" ? "bg-yellow-500" :
                      "bg-green-500"
                    }
                  >
                    {controlStatus.last_control_decision.ore_type.toUpperCase()}
                  </Badge>
                </div>
                {controlStatus.last_control_decision.confidence !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Confidence:</span>
                    <span className="text-sm font-bold">
                      {((controlStatus.last_control_decision.confidence ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Model 1 analyzes power consumption, feed rate, and feed size to classify ore hardness.
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {controlStatus?.is_running 
                  ? "Waiting for Model 1 prediction..." 
                  : "Start the service to see Model 1 predictions"}
              </div>
            )}
          </div>

          {/* Model 2: RPM Optimization */}
          <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border-2 border-green-500/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Gauge className="w-5 h-5 text-green-500" />
                Model 2: RPM Optimization
              </h4>
              <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-500/30">
                AI Model
              </Badge>
            </div>
            {controlStatus?.last_control_decision ? (
              <div className="space-y-2">
                {controlStatus.last_control_decision.recommended_rpm !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Recommended RPM:</span>
                    <span className="text-lg font-bold text-green-600">
                      {controlStatus.last_control_decision.recommended_rpm.toFixed(1)} RPM
                    </span>
                  </div>
                )}
                {controlStatus.last_control_decision.adjusted_rpm !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Adjusted RPM:</span>
                    <span className="text-sm font-medium">
                      {controlStatus.last_control_decision.adjusted_rpm.toFixed(1)} RPM
                    </span>
                  </div>
                )}
                {controlStatus.last_control_decision.current_rpm !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current RPM:</span>
                    <span className="text-sm font-medium">
                      {controlStatus.last_control_decision.current_rpm.toFixed(1)} RPM
                    </span>
                  </div>
                )}
                {controlStatus.last_control_decision.energy_savings_pct !== undefined && (
                  <div className="flex items-center justify-between mt-2 p-2 bg-green-500/10 rounded">
                    <span className="text-sm font-semibold text-green-700">Energy Savings:</span>
                    <span className="text-sm font-bold text-green-600">
                      {(controlStatus.last_control_decision.energy_savings_pct ?? 0).toFixed(1)}%
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Model 2 uses ore type from Model 1 to recommend optimal RPM for energy efficiency.
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {controlStatus?.is_running 
                  ? "Waiting for Model 2 prediction..." 
                  : "Start the service to see Model 2 predictions"}
              </div>
            )}
          </div>

          {/* Last Control Decision Summary */}
          {controlStatus?.last_control_decision && (
            <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-2">Last Control Decision Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {controlStatus.last_control_decision.target_rpm !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Target RPM:</span>
                    <span className="ml-2 font-bold">{controlStatus.last_control_decision.target_rpm}</span>
                  </div>
                )}
                {controlStatus.command_history_count !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Commands Sent:</span>
                    <span className="ml-2 font-bold">{controlStatus.command_history_count}</span>
                  </div>
                )}
                {controlStatus.last_control_decision.timestamp && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Last Update:</span>
                    <span className="ml-2 font-medium text-xs">
                      {new Date(controlStatus.last_control_decision.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Integration Status */}
          {controlStatus?.integration && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Integration Status</h4>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  {controlStatus.integration.monitoring ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span>Monitoring: {controlStatus.integration.monitoring ? "Active" : "Inactive"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {controlStatus.integration.predictions ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span>Predictions: {controlStatus.integration.predictions ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Info Message */}
          {!controlStatus?.is_running && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Speed Control Service</strong> automatically monitors sensor data, 
                runs ML predictions (Model 1 & Model 2), and publishes RPM adjustment commands 
                via MQTT to optimize crusher performance based on ore characteristics.
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
});

ControlServiceSection.displayName = "ControlServiceSection";

export default ControlServiceSection;
