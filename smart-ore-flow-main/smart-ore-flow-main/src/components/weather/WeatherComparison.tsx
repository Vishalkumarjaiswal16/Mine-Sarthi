import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Droplets, Wind, Gauge, Eye, Sun, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { generateWeatherData, type WeatherData } from '@/lib/mockData';

interface ComparisonLocation {
  id: string;
  name: string;
  weather: WeatherData;
}

export const WeatherComparison: React.FC = () => {
  const [locations, setLocations] = useState<ComparisonLocation[]>([
    {
      id: '1',
      name: 'Joda Iron Ore Mine',
      weather: generateWeatherData({ name: 'Joda Iron Ore Mine', lat: 22.03, lng: 85.43, timezone: 'IST' }),
    },
    {
      id: '2',
      name: 'Barbil Mining Complex',
      weather: generateWeatherData({ name: 'Barbil Mining Complex', lat: 22.10, lng: 85.35, timezone: 'IST' }),
    },
  ]);

  const addLocation = () => {
    const newLocation: ComparisonLocation = {
      id: Date.now().toString(),
      name: `Location ${locations.length + 1}`,
      weather: generateWeatherData(),
    };
    setLocations([...locations, newLocation]);
  };

  const removeLocation = (id: string) => {
    if (locations.length > 1) {
      setLocations(locations.filter(loc => loc.id !== id));
    }
  };

  const getConditionColor = (condition: WeatherData['condition']) => {
    switch (condition) {
      case 'sunny':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'cloudy':
        return 'bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30';
      case 'rainy':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'stormy':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'snowy':
        return 'bg-primary/20 text-primary border-primary/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-border';
    }
  };

  return (
    <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sun className="w-5 h-5 text-primary" /> Location Comparison
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={addLocation}
            className="h-8"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Location
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-2 font-semibold">Location</th>
                  <th className="text-center p-2 font-semibold">Temp</th>
                  <th className="text-center p-2 font-semibold">Condition</th>
                  <th className="text-center p-2 font-semibold">Humidity</th>
                  <th className="text-center p-2 font-semibold">Wind</th>
                  <th className="text-center p-2 font-semibold">Pressure</th>
                  <th className="text-center p-2 font-semibold">UV</th>
                  <th className="text-center p-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((location) => (
                  <tr key={location.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="p-2 font-medium">{location.name}</td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Thermometer className="w-3 h-3 text-warning" />
                        <span className="font-semibold">{location.weather.temperature}°C</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className={getConditionColor(location.weather.condition)}>
                        {location.weather.condition}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Droplets className="w-3 h-3 text-primary" />
                        <span>{location.weather.humidity}%</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Wind className="w-3 h-3 text-success" />
                        <span>{location.weather.windSpeed} km/h</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Gauge className="w-3 h-3 text-success" />
                        <span>{location.weather.pressure} hPa</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Sun className="w-3 h-3 text-warning" />
                        <span>{location.weather.uvIndex}</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      {locations.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => removeLocation(location.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Comparison Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Highest Temp</div>
              <div className="text-lg font-bold text-warning">
                {Math.max(...locations.map(l => l.weather.temperature)).toFixed(1)}°C
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {locations.find(l => l.weather.temperature === Math.max(...locations.map(loc => loc.weather.temperature)))?.name}
              </div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Lowest Temp</div>
              <div className="text-lg font-bold text-primary">
                {Math.min(...locations.map(l => l.weather.temperature)).toFixed(1)}°C
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {locations.find(l => l.weather.temperature === Math.min(...locations.map(loc => loc.weather.temperature)))?.name}
              </div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Avg Humidity</div>
              <div className="text-lg font-bold text-primary">
                {(locations.reduce((sum, l) => sum + l.weather.humidity, 0) / locations.length).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Avg Wind</div>
              <div className="text-lg font-bold text-success">
                {(locations.reduce((sum, l) => sum + l.weather.windSpeed, 0) / locations.length).toFixed(1)} km/h
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

