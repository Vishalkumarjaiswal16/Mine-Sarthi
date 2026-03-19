import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Layers, Maximize2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type WeatherData } from '@/lib/mockData';

// Fix for default marker icons in Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface WeatherMapProps {
  weather: WeatherData;
  locationName: string;
  lat: number;
  lng: number;
  onLocationSelect?: (location: { name: string; lat: number; lng: number }) => void;
}

// Component to update map view when location changes
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
};


export const WeatherMap: React.FC<WeatherMapProps> = ({ 
  weather, 
  locationName: _locationName, 
  lat, 
  lng,
  onLocationSelect: _onLocationSelect 
}) => {
  const [mapCenter] = useState<[number, number]>([lat, lng]);
  const [mapZoom] = useState(11);
  const [isExpanded, setIsExpanded] = useState(false);

  const getWeatherIcon = (condition: WeatherData['condition']) => {
    switch (condition) {
      case 'sunny':
        return '☀️';
      case 'cloudy':
        return '☁️';
      case 'rainy':
        return '🌧️';
      case 'stormy':
        return '⛈️';
      case 'snowy':
        return '❄️';
      default:
        return '🌤️';
    }
  };

  const getConditionColor = (condition: WeatherData['condition']) => {
    switch (condition) {
      case 'sunny':
        return '#fbbf24'; // warning/yellow
      case 'cloudy':
        return '#6b7280'; // muted/gray
      case 'rainy':
        return '#3b82f6'; // primary/blue
      case 'stormy':
        return '#ef4444'; // destructive/red
      case 'snowy':
        return '#60a5fa'; // light blue
      default:
        return '#fbbf24';
    }
  };

  // Create enhanced custom icon with temperature
  const createCustomIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-weather-marker',
      html: `
        <div style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            background: linear-gradient(135deg, ${getConditionColor(weather.condition)} 0%, ${getConditionColor(weather.condition)}dd 100%);
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            border: 4px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 0 0 2px ${getConditionColor(weather.condition)}40;
            transition: all 0.3s ease;
          ">
            ${getWeatherIcon(weather.condition)}
          </div>
          <div style="
            margin-top: 4px;
            background: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            color: ${getConditionColor(weather.condition)};
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            white-space: nowrap;
          ">
            ${weather.temperature}°C
          </div>
        </div>
      `,
      iconSize: [56, 80],
      iconAnchor: [28, 56],
      popupAnchor: [0, -56],
    });
  }, [weather.condition, weather.temperature]);

  return (
    <Card className="p-4 sm:p-6 glass rounded-modern-xl shadow-depth-xl h-fit sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <span>Weather Map</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map Container */}
        <div 
          className="h-[320px] sm:h-[380px] w-full rounded-lg overflow-hidden border-2 border-border/50 shadow-lg relative cursor-pointer group"
          onClick={() => setIsExpanded(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsExpanded(true);
            }
          }}
        >
          {/* Expand Button Overlay */}
          <div className="absolute top-2 right-2 z-[1000] opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/90 backdrop-blur-sm shadow-lg"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Expand Map
            </Button>
          </div>
          
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <MapUpdater center={[lat, lng]} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Weather marker */}
            <Marker 
              position={[lat, lng]} 
              icon={createCustomIcon}
            />

            {/* Weather condition circle overlay with gradient */}
            <Circle
              center={[lat, lng]}
              radius={5000} // 5km radius
              pathOptions={{
                color: getConditionColor(weather.condition),
                fillColor: getConditionColor(weather.condition),
                fillOpacity: 0.15,
                weight: 3,
              }}
            />
          </MapContainer>
        </div>

        {/* Location Info Card */}
        <div className="p-3 rounded-lg bg-gradient-to-br from-primary/5 via-transparent to-success/5 border border-border/50">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Coordinates:</span>
              <div className="font-mono text-foreground">{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</div>
            </div>
            <div>
              <span className="text-muted-foreground">Area:</span>
              <div className="text-foreground">5 km radius</div>
            </div>
          </div>
        </div>

        {/* Enhanced Map Legend */}
        <div className="pt-2 border-t border-border/50">
          <div className="text-xs font-medium text-muted-foreground mb-2">Weather Conditions</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-1.5 rounded bg-muted/20">
              <div className="w-3 h-3 rounded-full bg-warning border border-white shadow-sm"></div>
              <span className="text-xs">Sunny</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded bg-muted/20">
              <div className="w-3 h-3 rounded-full bg-muted-foreground border border-white shadow-sm"></div>
              <span className="text-xs">Cloudy</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded bg-muted/20">
              <div className="w-3 h-3 rounded-full bg-primary border border-white shadow-sm"></div>
              <span className="text-xs">Rainy</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded bg-muted/20">
              <div className="w-3 h-3 rounded-full bg-destructive border border-white shadow-sm"></div>
              <span className="text-xs">Stormy</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Expanded Map Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-[800px] max-h-[600px] w-[90vw] h-[75vh] p-0 gap-0 flex flex-col !left-[50%] !top-[50%] !translate-x-[-50%] !translate-y-[-50%]">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Weather Map
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs sm:text-sm">
                  Interactive weather map showing current conditions and location details
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 p-4 sm:p-6 overflow-hidden min-h-0">
            <div className="h-full w-full rounded-lg overflow-hidden border-2 border-border/50 shadow-lg">
              <MapContainer
                center={[lat, lng]}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
                zoomControl={true}
                scrollWheelZoom={true}
              >
                <MapUpdater center={[lat, lng]} zoom={mapZoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Weather marker */}
                <Marker 
                  position={[lat, lng]} 
                  icon={createCustomIcon}
                />

                {/* Weather condition circle overlay */}
                <Circle
                  center={[lat, lng]}
                  radius={5000}
                  pathOptions={{
                    color: getConditionColor(weather.condition),
                    fillColor: getConditionColor(weather.condition),
                    fillOpacity: 0.15,
                    weight: 3,
                  }}
                />
              </MapContainer>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

