import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Cpu } from "lucide-react";
import type { AIFeatures, SensorData } from "./types";

interface AIFeaturesSectionProps {
  aiFeatures: AIFeatures | null;
  aiLoading: boolean;
  optimalRPM: number | null;
  rpmDifference: number;
  latestData: SensorData | null;
  oreHardness: string;
  oreConfidence: number;
}

const AIFeaturesSection = React.memo<AIFeaturesSectionProps>(({
  aiFeatures,
  aiLoading,
  optimalRPM,
  rpmDifference,
  latestData,
  oreHardness,
  oreConfidence
}) => {
  return (
    <Card className="p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#26436C' }}>
        <Cpu className="w-5 h-5" />
        AI Features & Speed Control
      </h3>
      {aiLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Optimal RPM Recommendation */}
          {optimalRPM && latestData && (
            <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Optimal RPM Recommendation</span>
                <Badge variant={Math.abs(rpmDifference) < 10 ? "default" : "secondary"}>
                  {Math.abs(rpmDifference) < 10 ? "Optimal" : "Adjustment Needed"}
                </Badge>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold">{optimalRPM}</span>
                <span className="text-muted-foreground">RPM</span>
              </div>
              {Math.abs(rpmDifference) >= 10 && (
                <div className="mt-3 flex items-center gap-2">
                  {rpmDifference > 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Increase by {rpmDifference} RPM</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Decrease by {Math.abs(rpmDifference)} RPM</span>
                    </>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Based on feed size: {(latestData.feed_size_mm ?? 0).toFixed(1)}mm, 
                Hardness: {(latestData.hardness_index ?? 0).toFixed(1)}
              </p>
            </div>
          )}

          {/* Ore Hardness Prediction */}
          {oreHardness && oreHardness !== "unknown" && (
            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border-2 border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Ore Hardness Prediction</span>
                <Badge 
                  variant="default" 
                  className={
                    oreHardness === "hard" ? "bg-red-500" :
                    oreHardness === "medium" ? "bg-yellow-500" :
                    "bg-green-500"
                  }
                >
                  {oreHardness.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">Confidence:</span>
                <span className="text-sm font-bold">{((oreConfidence ?? 0) * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}

          {/* AI Features */}
          {aiFeatures && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Aggregated Features:</p>
              {aiFeatures.avg_power_kw !== undefined && (
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span className="text-sm">Avg Power</span>
                  <span className="text-sm font-medium">{(aiFeatures.avg_power_kw ?? 0).toFixed(2)} kW</span>
                </div>
              )}
              {aiFeatures.avg_rpm !== undefined && (
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span className="text-sm">Avg RPM</span>
                  <span className="text-sm font-medium">{(aiFeatures.avg_rpm ?? 0).toFixed(0)} RPM</span>
                </div>
              )}
              {aiFeatures.avg_feed_tph !== undefined && (
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span className="text-sm">Avg Feed Rate</span>
                  <span className="text-sm font-medium">{(aiFeatures.avg_feed_tph ?? 0).toFixed(2)} TPH</span>
                </div>
              )}
              {aiFeatures.avg_feed_size_mm !== undefined && (
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span className="text-sm">Avg Feed Size</span>
                  <span className="text-sm font-medium">{(aiFeatures.avg_feed_size_mm ?? 0).toFixed(1)} mm</span>
                </div>
              )}
              {aiFeatures.predicted_energy_kwh_per_t !== undefined && (
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span className="text-sm">Predicted Energy</span>
                  <span className="text-sm font-medium">{(aiFeatures.predicted_energy_kwh_per_t ?? 0).toFixed(2)} kWh/t</span>
                </div>
              )}
              {aiFeatures.energy_savings_pct !== undefined && aiFeatures.energy_savings_pct > 0 && (
                <div className="flex justify-between items-center p-2 bg-green-500/10 rounded border border-green-500/20">
                  <span className="text-sm font-semibold text-green-600">Energy Savings</span>
                  <span className="text-sm font-bold text-green-600">{(aiFeatures.energy_savings_pct ?? 0).toFixed(1)}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
});

AIFeaturesSection.displayName = "AIFeaturesSection";

export default AIFeaturesSection;
