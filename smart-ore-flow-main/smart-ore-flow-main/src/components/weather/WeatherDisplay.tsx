import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Thermometer, Gauge, Compass, Clock, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type WeatherData } from '@/lib/mockData';

interface WeatherDisplayProps {
  weather: WeatherData | null;
  locationName: string;
}

export const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ weather, locationName }) => {
  if (!weather) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>Select a location to view weather.</p>
      </Card>
    );
  }

  const getWeatherIcon = (condition: WeatherData['condition']) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="w-12 h-12 text-warning animate-pulse-glow" />;
      case 'cloudy':
        return <Cloud className="w-12 h-12 text-muted-foreground animate-bounce-subtle" />;
      case 'rainy':
        return <CloudRain className="w-12 h-12 text-primary animate-pulse" />;
      case 'stormy':
        return <Cloud className="w-12 h-12 text-destructive animate-flash" />;
      case 'snowy':
        return <Cloud className="w-12 h-12 text-primary animate-pulse" />;
      default:
        return <Sun className="w-12 h-12 text-warning" />;
    }
  };

  const getConditionColor = (condition: WeatherData['condition']) => {
    switch (condition) {
      case 'sunny':
        return 'text-warning';
      case 'cloudy':
        return 'text-muted-foreground';
      case 'rainy':
        return 'text-primary';
      case 'stormy':
        return 'text-destructive';
      case 'snowy':
        return 'text-primary';
      default:
        return 'text-warning';
    }
  };

  return (
    <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          {locationName}
        </CardTitle>
        <div className="animate-bounce-subtle">{getWeatherIcon(weather.condition)}</div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Temperature Section */}
        <div className="flex items-baseline gap-3">
          <span className="text-6xl font-bold text-primary">{weather.temperature}°</span>
          <span className="text-2xl text-muted-foreground">C</span>
          <div className="ml-auto text-right">
            <div className={`text-lg font-semibold capitalize ${getConditionColor(weather.condition)}`}>
              {weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Feels like {weather.feelsLike}°C
            </div>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Humidity</span>
            </div>
            <span className="text-lg font-semibold">{weather.humidity}%</span>
            {weather.dewPoint && (
              <span className="text-xs text-muted-foreground">Dew: {weather.dewPoint}°C</span>
            )}
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wind className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Wind</span>
            </div>
            <span className="text-lg font-semibold">{weather.windSpeed} km/h</span>
            <span className="text-xs text-muted-foreground">{weather.windDirection}</span>
            {weather.windGust && (
              <span className="text-xs text-muted-foreground">Gust: {weather.windGust} km/h</span>
            )}
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gauge className="w-4 h-4 text-success" />
              <span className="text-xs font-medium">Pressure</span>
            </div>
            <span className="text-lg font-semibold">{weather.pressure}</span>
            <span className="text-xs text-muted-foreground">hPa</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Visibility</span>
            </div>
            <span className="text-lg font-semibold">{weather.visibility}</span>
            <span className="text-xs text-muted-foreground">km</span>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
          {weather.dewPoint && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Dew Point</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{weather.dewPoint}°C</span>
                {weather.comfortLevel && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      weather.comfortLevel === 'comfortable' ? 'border-success text-success' :
                      weather.comfortLevel === 'uncomfortable' ? 'border-warning text-warning' :
                      'border-destructive text-destructive'
                    }`}
                  >
                    {weather.comfortLevel === 'comfortable' ? 'Comfortable' :
                     weather.comfortLevel === 'uncomfortable' ? 'Uncomfortable' :
                     'Very Uncomfortable'}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">UV Index</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{weather.uvIndex}</span>
              <Badge 
                variant="outline"
                className={`text-xs ${
                  weather.uvIndex <= 2 ? 'border-success text-success' :
                  weather.uvIndex <= 5 ? 'border-warning text-warning' :
                  'border-destructive text-destructive'
                }`}
              >
                {weather.uvIndex <= 2 ? 'Low' :
                 weather.uvIndex <= 5 ? 'Moderate' :
                 weather.uvIndex <= 7 ? 'High' : 'Very High'}
              </Badge>
            </div>
          </div>

          {weather.precipitation > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Precipitation</span>
              </div>
              <span className="text-sm font-semibold">
                {weather.precipitation} mm
                {weather.dailyTotal !== undefined && weather.dailyTotal > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">({weather.dailyTotal} total)</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Today's Forecast */}
        <div className="pt-4 border-t border-border/50">
          <h4 className="font-semibold mb-3 text-sm">Today's Forecast</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-primary/5">
              <div className="text-xs text-muted-foreground mb-1">High</div>
              <div className="text-xl font-bold text-primary">{weather.forecast.high}°C</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/5">
              <div className="text-xs text-muted-foreground mb-1">Low</div>
              <div className="text-xl font-bold text-primary">{weather.forecast.low}°C</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/5">
              <div className="text-xs text-muted-foreground mb-1">Rain Chance</div>
              <div className="text-xl font-bold text-primary">{weather.forecast.chanceOfRain}%</div>
            </div>
          </div>
        </div>

        {/* Historical Comparison */}
        {weather.historicalComparison && (
          <div className="pt-4 border-t border-border/50">
            <h4 className="font-semibold mb-3 text-sm">Historical Comparison</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-muted/20">
                <div className="text-xs text-muted-foreground">Yesterday</div>
                <div className="text-sm font-semibold mt-1">{weather.historicalComparison.yesterday.toFixed(1)}°C</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/20">
                <div className="text-xs text-muted-foreground">Last Week</div>
                <div className="text-sm font-semibold mt-1">{weather.historicalComparison.lastWeek.toFixed(1)}°C</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/20">
                <div className="text-xs text-muted-foreground">Average</div>
                <div className="text-sm font-semibold mt-1">{weather.historicalComparison.average.toFixed(1)}°C</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
