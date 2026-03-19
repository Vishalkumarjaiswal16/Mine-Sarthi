import { Gauge, Droplets, Weight, Zap, TrendingDown, AlertTriangle, Activity, Thermometer, Vibrate, Settings } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { EnhancedAIRecommendations } from "@/components/EnhancedAIRecommendations";
import { Suspense, lazy, type ComponentType } from "react";

// Lazy load heavy components for better performance
const EnergyChart = lazy(() => import("@/components/EnergyChart"));
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useRealtimeMetrics, useRealtimeEquipment, useConnectionStatus } from "@/hooks/useRealtimeData";
import { usePredictions } from "@/hooks/usePredictions";
import {
  generateAIRecommendations,
  type MiningMetrics,
  type EquipmentStatus,
  type AIRecommendation
} from "@/lib/mockData";

const Dashboard = () => {
  // Initialize scroll animations
  useScrollAnimation();

  // Use real-time data hooks (automatically switches between MQTT and mock data)
  const { metrics, isLoading: metricsLoading } = useRealtimeMetrics();
  const { equipment, isLoading: equipmentLoading } = useRealtimeEquipment();
  const { isConnected, isUsingMockData } = useConnectionStatus();
  const { predictions } = usePredictions();

  const [previousMetrics, setPreviousMetrics] = useState<MiningMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);

  // Dashboard layout customization
  const [layout, setLayout] = useState({
    showMetrics: true,
    showEnergyChart: true,
    showEquipment: true,
    showRecommendations: true,
  });

  // No local search - using global search from header

  // Update recommendations when metrics change
  useEffect(() => {
    if (metrics) {
      // Save current metrics as previous before updating
      setPreviousMetrics(prev => prev ? prev : metrics);
      setRecommendations(generateAIRecommendations(metrics));
    }
  }, [metrics]);

  // Equipment display - no filtering needed (use global search in header)
  const filteredEquipment = equipment;

  return (
    <div className="w-full space-y-6 sm:space-y-8 p-4 sm:p-6 pb-12 bg-gradient-to-br from-background via-background to-muted/30" style={{ minHeight: '100vh' }}>
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-3xl blur-2xl" />
        <div className="relative glass rounded-modern-xl shadow-depth-xl hover:shadow-glow transition-all duration-500 animate-fade-in-scale hover-lift p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3" style={{ color: '#26436C' }}>
                <span>Control</span>{' '}
                <span>Dashboard</span>
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 text-base sm:text-lg" aria-live="polite">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse text-success flex-shrink-0" aria-hidden="true" />
                <span>Real-time monitoring and AI-powered insights</span>
              </p>
            </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 focus-ring w-full sm:w-auto">
                <Settings className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Customize</span>
                <span className="sm:hidden">Layout</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Dashboard Layout</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-metrics" className="text-sm">Real-Time Metrics</Label>
                    <Switch
                      id="show-metrics"
                      checked={layout.showMetrics}
                      onCheckedChange={(checked) => setLayout(prev => ({ ...prev, showMetrics: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-energy" className="text-sm">Energy Chart</Label>
                    <Switch
                      id="show-energy"
                      checked={layout.showEnergyChart}
                      onCheckedChange={(checked) => setLayout(prev => ({ ...prev, showEnergyChart: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-equipment" className="text-sm">Equipment Status</Label>
                    <Switch
                      id="show-equipment"
                      checked={layout.showEquipment}
                      onCheckedChange={(checked) => setLayout(prev => ({ ...prev, showEquipment: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-recommendations" className="text-sm">AI Recommendations</Label>
                    <Switch
                      id="show-recommendations"
                      checked={layout.showRecommendations}
                      onCheckedChange={(checked) => setLayout(prev => ({ ...prev, showRecommendations: checked }))}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Badge 
            variant="outline" 
            className={`${isConnected ? 'bg-success/10 text-success border-success' : 'bg-warning/10 text-warning border-warning'} animate-pulse shadow-lg w-full sm:w-auto justify-center`}
            aria-label={`System status: ${isConnected ? 'Connected' : 'Disconnected'}`}
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-warning'} mr-2 animate-pulse`} aria-hidden="true" />
            <span className="hidden sm:inline">
              {isUsingMockData ? 'System Active' : isConnected ? 'MQTT Connected' : 'MQTT Disconnected'}
            </span>
            <span className="sm:hidden">
              {isUsingMockData ? 'Mock' : isConnected ? 'Connected' : 'Offline'}
            </span>
          </Badge>
          </div>
        </div>
        </div>
      </header>

      {/* Real-Time Metrics */}
      {layout.showMetrics && (
        <section aria-labelledby="metrics-section" className="relative scroll-animate">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-3xl blur-xl" />
          <div className="relative glass rounded-modern-xl shadow-depth-xl hover:shadow-glow transition-all duration-500 animate-slide-up-fade hover-lift p-4 sm:p-6">
            <h2 id="metrics-section" className="sr-only">Real-Time Metrics</h2>
            {metricsLoading || !metrics ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Loading metrics...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
                {/* Add stagger animation delay to each card */}
          <MetricCard
            title="Feed Size"
            value={metrics?.feedSize?.toFixed(1) || "0.0"}
            unit="mm"
            icon={Gauge}
            trend="stable"
            trendValue="0.2%"
            status="normal"
          />
          <MetricCard
            title="Ore Hardness"
            value={metrics?.oreHardness?.toFixed(1) || "0.0"}
            unit="BWI"
            icon={Weight}
            trend="up"
            trendValue="3.1%"
            status={(metrics?.oreHardness || 0) > 8 ? "warning" : "normal"}
          />
          <MetricCard
            title="Equipment Load"
            value={metrics?.equipmentLoad !== undefined ? metrics.equipmentLoad.toFixed(1) : "0.0"}
            unit="%"
            icon={Zap}
            trend="down"
            trendValue="5.4%"
            status={(metrics?.equipmentLoad || 0) > 90 ? "warning" : "success"}
          />
          <MetricCard
            title="Moisture Content"
            value={metrics?.moistureContent?.toFixed(1) || "0.0"}
            unit="%"
            icon={Droplets}
            trend="stable"
            trendValue="0.1%"
            status={(metrics?.moistureContent || 0) > 10 ? "warning" : "normal"}
          />
          <MetricCard
            title="Temperature"
            value={metrics?.temperature !== undefined ? metrics.temperature.toFixed(1) : "0.0"}
            unit="°C"
            icon={Thermometer}
            trend="up"
            trendValue="2.1%"
            status={(metrics?.temperature || 0) > 80 ? "critical" : (metrics?.temperature || 0) > 70 ? "warning" : "normal"}
          />
          <MetricCard
            title="Vibration"
            value={metrics?.vibration?.toFixed(1) || "0.0"}
            unit="mm/s"
            icon={Vibrate}
            trend="stable"
            trendValue="1.2%"
            status={(metrics?.vibration || 0) > 2.5 ? "critical" : (metrics?.vibration || 0) > 2.0 ? "warning" : "normal"}
          />
          <MetricCard
            title="Power Factor"
            value={metrics?.powerFactor?.toFixed(2) || "0.00"}
            unit=""
            icon={Zap}
            trend="up"
            trendValue="2.1%"
            status={(metrics?.powerFactor || 0) < 0.9 ? "warning" : "success"}
          />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Energy Chart Section */}
      {layout.showEnergyChart && (
        <div className="scroll-animate">
          <Suspense fallback={
            <Card className="p-6 glass rounded-modern-xl shadow-depth-xl animate-pulse">
              <div className="h-64 bg-muted/20 rounded-lg" />
            </Card>
          }>
            <EnergyChart />
          </Suspense>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Equipment Status */}
          {layout.showEquipment && (
          <Card className="p-6 sm:p-8 glass rounded-modern-xl shadow-depth-xl hover:shadow-glow-success transition-all duration-500 animate-float scroll-animate">
          <h3 className="text-lg font-semibold mb-4 sm:mb-6 flex items-center gap-2">
            Equipment Status
            <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/30 animate-pulse">Live</Badge>
          </h3>
          <div className="space-y-3 sm:space-y-5">
            {equipmentLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Loading equipment...</p>
              </div>
            ) : filteredEquipment.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No equipment available</p>
              </div>
            ) : (
              filteredEquipment.map((equip) => (
                <div 
                  key={equip.id} 
                  className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/30 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover-lift focus-ring cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={`${equip.name} - ${equip.status} - ${equip.alerts} alerts`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{equip.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{equip.status}</p>
                  </div>
                  <div className="relative group ml-2">
                    <span className={`inline-block px-2 sm:px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-lg whitespace-nowrap ${
                      equip.alerts > 0 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-green-600'
                    }`}>
                      Alerts: {equip.alerts}
                    </span>
                    {equip.alerts > 0 && (
                      <div className="absolute bottom-full mb-3 hidden group-hover:block bg-red-700 text-white text-xs rounded-lg p-3 w-48 shadow-xl z-10 border border-red-600/30 animate-in">
                        <p>There are {equip.alerts} active alerts for this equipment.</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
        )}

        {/* AI Recommendations */}
        {layout.showRecommendations && (
          <EnhancedAIRecommendations
            recommendations={recommendations}
            onApply={(id) => {
              console.log('Applying recommendation:', id);
              // You can add logic here to actually apply the recommendation
            }}
          />
        )}
      </div>


    </div>
  );
};

export default Dashboard;
