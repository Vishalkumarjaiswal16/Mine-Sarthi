import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Layers,
  Grid3x3,
  Radio,
  MapPin
} from "lucide-react";
import HeatmapChart from "@/components/charts/HeatmapChart";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { realtimeService } from "@/lib/realtimeService";

// India-focused heatmap data with accurate coordinates
const mockHeatmapData = [
  {
    lat: 22.0300,
    lng: 85.4300,
    weight: 0.95,
    name: "Joda Iron Ore Mine",
    production: 1250,
    efficiency: 94.2,
    status: "Excellent",
    energyLoad: 2850,
    machineStatus: "excellent",
    equipmentEfficiency: 92,
    elevation: 485,
    area: 12500,
    workforce: 850,
    commodity: "Iron Ore",
    operator: "Tata Steel",
    lastInspection: "2025-01-15",
    nextMaintenance: "2025-03-20",
  },
  {
    lat: 22.1000,
    lng: 85.3500,
    weight: 0.88,
    name: "Barbil Mining Complex",
    production: 1100,
    efficiency: 89.5,
    status: "Optimal",
    energyLoad: 2650,
    machineStatus: "good",
    equipmentEfficiency: 87,
    elevation: 325,
    area: 8900,
    workforce: 620,
    commodity: "Iron Ore",
    operator: "SAIL",
    lastInspection: "2025-01-12",
    nextMaintenance: "2025-03-15",
  },
  {
    lat: 22.8000,
    lng: 86.1833,
    weight: 0.92,
    name: "Jamshedpur Steel Plant",
    production: 1180,
    efficiency: 91.8,
    status: "Excellent",
    energyLoad: 2680,
    machineStatus: "excellent",
    equipmentEfficiency: 89,
    elevation: 747,
    area: 14800,
    workforce: 920,
    commodity: "Iron & Steel",
    operator: "Tata Steel",
    lastInspection: "2025-01-16",
    nextMaintenance: "2025-03-22",
  },
  {
    lat: 22.5500,
    lng: 85.8000,
    weight: 0.82,
    name: "Chaibasa Mining District",
    production: 1020,
    efficiency: 86.7,
    status: "Good",
    energyLoad: 2350,
    machineStatus: "good",
    equipmentEfficiency: 84,
    elevation: 492,
    area: 13400,
    workforce: 780,
    commodity: "Iron Ore",
    operator: "Tata Steel",
    lastInspection: "2025-01-14",
    nextMaintenance: "2025-03-18",
  },
  {
    lat: 22.1500,
    lng: 85.5000,
    weight: 0.78,
    name: "Noamundi Iron Ore Mine",
    production: 980,
    efficiency: 83.2,
    status: "Good",
    energyLoad: 2280,
    machineStatus: "good",
    equipmentEfficiency: 81,
    elevation: 456,
    area: 11200,
    workforce: 650,
    commodity: "Iron Ore",
    operator: "Tata Steel",
    lastInspection: "2025-01-11",
    nextMaintenance: "2025-03-12",
  },
  {
    lat: 21.2000,
    lng: 81.4000,
    weight: 0.85,
    name: "Bhilai Steel Plant",
    production: 1050,
    efficiency: 88.1,
    status: "Optimal",
    energyLoad: 2450,
    machineStatus: "good",
    equipmentEfficiency: 86,
    elevation: 298,
    area: 10200,
    workforce: 720,
    commodity: "Steel",
    operator: "SAIL",
    lastInspection: "2025-01-13",
    nextMaintenance: "2025-03-16",
  },
  {
    lat: 15.1500,
    lng: 76.9333,
    weight: 0.75,
    name: "Bellary Iron Ore Mines",
    production: 950,
    efficiency: 85.3,
    status: "Good",
    energyLoad: 2200,
    machineStatus: "fair",
    equipmentEfficiency: 82,
    elevation: 528,
    area: 15600,
    workforce: 1200,
    commodity: "Iron Ore",
    operator: "NMDC",
    lastInspection: "2025-01-10",
    nextMaintenance: "2025-02-28",
  },
  {
    lat: 24.5800,
    lng: 73.6800,
    weight: 0.70,
    name: "Udaipur Zinc-Lead Mines",
    production: 850,
    efficiency: 80.5,
    status: "Good",
    energyLoad: 2050,
    machineStatus: "fair",
    equipmentEfficiency: 78,
    elevation: 412,
    area: 7800,
    workforce: 450,
    commodity: "Zinc & Lead",
    operator: "Hindustan Zinc",
    lastInspection: "2025-01-08",
    nextMaintenance: "2025-02-20",
  },
  {
    lat: 23.8000,
    lng: 86.4500,
    weight: 0.65,
    name: "Dhanbad Coal Mines",
    production: 800,
    efficiency: 78.1,
    status: "Fair",
    energyLoad: 1950,
    machineStatus: "poor",
    equipmentEfficiency: 75,
    elevation: 578,
    area: 9200,
    workforce: 380,
    commodity: "Coal",
    operator: "BCCL",
    lastInspection: "2025-01-05",
    nextMaintenance: "2025-02-10",
  },
  {
    lat: 22.0500,
    lng: 85.4000,
    weight: 0.72,
    name: "Koira Mining Zone",
    production: 880,
    efficiency: 82.4,
    status: "Good",
    energyLoad: 2100,
    machineStatus: "good",
    equipmentEfficiency: 79,
    elevation: 365,
    area: 6800,
    workforce: 520,
    commodity: "Iron Ore",
    operator: "OMC",
    lastInspection: "2025-01-09",
    nextMaintenance: "2025-02-25",
  },
  {
    lat: 18.7000,
    lng: 81.1000,
    weight: 0.72,
    name: "BIOM – Kirandul Complex",
    production: 800,
    efficiency: 83.0,
    status: "Good",
    energyLoad: 2150,
    machineStatus: "good",
    equipmentEfficiency: 81,
    elevation: 580,
    area: 7200,
    workforce: 650,
    commodity: "Iron Ore",
    operator: "NMDC",
    lastInspection: "2025-01-14",
    nextMaintenance: "2025-03-18",
  },
  {
    lat: 18.6000,
    lng: 81.0000,
    weight: 0.70,
    name: "BIOM – Bacheli Complex",
    production: 780,
    efficiency: 82.0,
    status: "Good",
    energyLoad: 2050,
    machineStatus: "good",
    equipmentEfficiency: 80,
    elevation: 560,
    area: 7000,
    workforce: 620,
    commodity: "Iron Ore",
    operator: "NMDC",
    lastInspection: "2025-01-13",
    nextMaintenance: "2025-03-17",
  },
  {
    lat: 15.2000,
    lng: 76.5000,
    weight: 0.68,
    name: "Donimalai Iron Ore Mine",
    production: 750,
    efficiency: 81.0,
    status: "Good",
    energyLoad: 2100,
    machineStatus: "good",
    equipmentEfficiency: 79,
    elevation: 520,
    area: 6800,
    workforce: 580,
    commodity: "Iron Ore",
    operator: "NMDC",
    lastInspection: "2025-01-12",
    nextMaintenance: "2025-03-16",
  },
  {
    lat: 15.3000,
    lng: 76.6000,
    weight: 0.65,
    name: "Kumaraswamy Iron Ore Mine",
    production: 720,
    efficiency: 80.0,
    status: "Good",
    energyLoad: 2000,
    machineStatus: "good",
    equipmentEfficiency: 78,
    elevation: 510,
    area: 6500,
    workforce: 550,
    commodity: "Iron Ore",
    operator: "NMDC",
    lastInspection: "2025-01-11",
    nextMaintenance: "2025-03-15",
  },
];

interface HeatmapLayer {
  id: string;
  name: string;
  type: 'energy' | 'status' | 'efficiency' | 'production';
  visible: boolean;
  opacity: number;
  colorScheme: string;
}

const Heatmap = () => {
  useScrollAnimation();
  const navigate = useNavigate();
  const [selectedLayer, setSelectedLayer] = useState<string>('energy');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [allHeatmapData, setAllHeatmapData] = useState(mockHeatmapData);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('joda');
  const [layers, setLayers] = useState<HeatmapLayer[]>([
    { id: 'energy', name: 'Energy Load', type: 'energy', visible: true, opacity: 80, colorScheme: 'energy' },
    { id: 'status', name: 'Machine Status', type: 'status', visible: true, opacity: 70, colorScheme: 'status' },
    { id: 'efficiency', name: 'Equipment Efficiency', type: 'efficiency', visible: false, opacity: 60, colorScheme: 'efficiency' },
    { id: 'production', name: 'Production', type: 'production', visible: false, opacity: 75, colorScheme: 'production' },
  ]);
  const [showGrid, setShowGrid] = useState(false);

  // Map location names to IDs for matching
  const getLocationId = (siteName: string): string => {
    const locationIdMap: { [key: string]: string } = {
      'Joda Iron Ore Mine': 'joda',
      'Barbil Mining Complex': 'barbil',
      'Jamshedpur Steel Plant': 'jamshedpur',
      'Chaibasa Mining District': 'chaibasa',
      'Noamundi Iron Ore Mine': 'noamundi',
      'Bhilai Steel Plant': 'bhilai',
      'Bellary Iron Ore Mines': 'bellary',
      'Udaipur Zinc-Lead Mines': 'udaipur',
      'Dhanbad Coal Mines': 'dhanbad',
      'Koira Mining Zone': 'koira',
      'BIOM – Kirandul Complex': 'kirandul',
      'BIOM – Bacheli Complex': 'bacheli',
      'Donimalai Iron Ore Mine': 'donimalai',
      'Kumaraswamy Iron Ore Mine': 'kumaraswamy',
    };
    return locationIdMap[siteName] || siteName.toLowerCase().replace(/\s+/g, '-');
  };

  // Filter heatmap data to show only selected location
  const heatmapData = allHeatmapData.filter(site => {
    const siteId = getLocationId(site.name);
    return siteId === selectedLocationId;
  });

  // Subscribe to real-time heatmap data
  useEffect(() => {
    // Check if mock data mode is enabled
    const useMockData = import.meta.env['VITE_USE_MOCK_DATA'] === 'true' || 
                       import.meta.env['VITE_USE_MOCK_DATA'] === true;
    
    // Only try to connect if not using mock data
    if (!useMockData) {
      const wsUrl = import.meta.env['VITE_WS_URL'];
      const sseUrl = import.meta.env['VITE_SSE_URL'];

      if (wsUrl) {
        realtimeService.connectWebSocket(wsUrl);
      } else if (sseUrl) {
        realtimeService.connectSSE(sseUrl);
      }
    }

    // Subscribe to heatmap/site updates
    const unsubscribeHeatmap = realtimeService.subscribe('heatmap', (data) => {
      if (data.data['sites']) {
        setAllHeatmapData(data.data['sites'] as unknown as typeof mockHeatmapData);
      }
    });

    // Subscribe to site-specific updates
    const unsubscribeSites = realtimeService.subscribe('site', (data) => {
      setAllHeatmapData(prev => {
        const lat = data.data['lat'] as number | undefined;
        const lng = data.data['lng'] as number | undefined;
        if (lat === undefined || lng === undefined) return prev;
        
        const index = prev.findIndex(site => 
          site.lat === lat && site.lng === lng
        );
        if (index >= 0) {
          const updated = [...prev];
          const updateData = data.data as Partial<typeof mockHeatmapData[0]>;
          // Only update properties that are defined and preserve existing values
          updated[index] = {
            ...updated[index],
            ...(Object.fromEntries(
              Object.entries(updateData).filter(([_, value]) => value !== undefined)
            ) as Partial<typeof mockHeatmapData[0]>),
          } as typeof mockHeatmapData[0];
          return updated;
        }
        return prev;
      });
    });

    // Check connection status
    const statusInterval = setInterval(() => {
      setIsRealtimeConnected(realtimeService.getConnectionStatus());
    }, 1000);

    return () => {
      unsubscribeHeatmap();
      unsubscribeSites();
      clearInterval(statusInterval);
    };
  }, []);

  const toggleLayer = (layerId: string) => {
    setLayers(layers.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  // Debug: Log when selectedLayer changes
  useEffect(() => {
    console.log('Selected layer changed to:', selectedLayer);
  }, [selectedLayer]);

  const updateLayerOpacity = (layerId: string, opacity: number[]) => {
    setLayers(layers.map(layer => 
      layer.id === layerId ? { ...layer, opacity: opacity[0] ?? layer.opacity } : layer
    ));
  };

  // Handle site selection from heatmap - navigate to weather page
  const handleSiteSelect = (site: { lat: number; lng: number; name?: string }) => {
    const siteName = site.name || 'Unknown Site';
    navigate(`/weather?lat=${site.lat}&lng=${site.lng}&name=${encodeURIComponent(siteName)}`);
  };


  return (
    <div className="min-h-full space-y-6 p-4 sm:p-6 w-full">
      <div className="scroll-animate">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#26436C' }}>
              <span>India</span>{' '}
              <span>Mining</span>{' '}
              <span>Sites</span>{' '}
              <span>Heatmap</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Real-time visualization of mining operations across India with Google Maps-like quality
            </p>
          </div>
          {isRealtimeConnected && (
            <Badge variant="outline" className="flex items-center gap-1.5 bg-success/10 text-success border-success">
              <Radio className="w-3 h-3 animate-pulse" />
              Real-time
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Layer Selector Panel */}
        <div>
          <Card className="lg:col-span-1 p-4 bg-card border-border glass rounded-modern-xl">
            {/* Location Selector */}
            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Location</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location-select" className="text-sm font-medium">
                  Select Mining Site
                </Label>
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                  <SelectTrigger id="location-select" className="w-full">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {allHeatmapData.map((site) => {
                      const siteId = getLocationId(site.name);
                      return (
                        <SelectItem key={siteId} value={siteId}>
                          {site.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {heatmapData.length > 0 && heatmapData[0] && (
                  <div className="text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {heatmapData[0].name}
                    </div>
                    <div className="mt-1">
                      {heatmapData[0].lat.toFixed(4)}, {heatmapData[0].lng.toFixed(4)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Layer Controls</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { id: 'energy', label: 'Energy Load' },
                { id: 'status', label: 'Machine Status' },
                { id: 'efficiency', label: 'Efficiency' },
                { id: 'production', label: 'Production' }
              ].map(layer => (
                <Button
                  key={layer.id}
                  variant={selectedLayer === layer.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    console.log('Layer button clicked:', layer.id);
                    setSelectedLayer(layer.id);
                  }}
                  className="text-xs"
                >
                  {layer.label}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {layers.map((layer) => (
                <div key={layer.id} className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={layer.visible}
                        onCheckedChange={(checked) => {
                          if (checked !== "indeterminate") {
                            toggleLayer(layer.id);
                          }
                        }}
                      />
                      <label className="text-sm font-medium cursor-pointer">
                        {layer.name}
                      </label>
                    </div>
                  </div>
                  {layer.visible && (
                    <div className="space-y-2 pl-6">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Opacity</span>
                        <span className="font-medium">{layer.opacity}%</span>
                      </div>
                      <Slider
                        value={[layer.opacity]}
                        onValueChange={(value) => updateLayerOpacity(layer.id, value)}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  Grid Overlay
                </label>
                <Checkbox
                  checked={showGrid}
                  onCheckedChange={(checked) => setShowGrid(checked === true)}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Heatmap View */}
        <div className="lg:col-span-3">
          <Card className="p-4 bg-card border-border glass rounded-modern-xl">
            <div className="relative">
              <HeatmapChart
                key={`chart-${selectedLayer}`}
                heatmapData={heatmapData}
                title="Mining Sites Heatmap"
                height={700}
                className="w-full"
                selectedLayer={selectedLayer}
                onSiteSelect={handleSiteSelect}
              />

            </div>
          </Card>
        </div>
      </div>

    </div>
  );
};

export default Heatmap;

