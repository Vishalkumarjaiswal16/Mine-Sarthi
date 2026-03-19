import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, Wind, Droplets, Clock } from 'lucide-react';
import { type WeatherData, type HourlyForecast as HourlyForecastType } from '@/lib/mockData';

interface HourlyForecastProps {
  weather: WeatherData | null;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({ weather }) => {
  if (!weather || !weather.hourly || weather.hourly.length === 0) {
    return (
      <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> 24-Hour Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Hourly forecast data not available
          </p>
        </CardContent>
      </Card>
    );
  }

  const getWeatherIcon = (condition: WeatherData['condition']) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="w-4 h-4 text-warning" />;
      case 'cloudy':
        return <Cloud className="w-4 h-4 text-muted-foreground" />;
      case 'rainy':
        return <CloudRain className="w-4 h-4 text-primary" />;
      case 'stormy':
        return <CloudRain className="w-4 h-4 text-destructive" />;
      case 'snowy':
        return <Cloud className="w-4 h-4 text-primary" />;
      default:
        return <Sun className="w-4 h-4 text-warning" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show next 12 hours for better visibility, or all 24 if space allows
  const displayHours = weather.hourly.slice(0, 12);

  return (
    <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> 24-Hour Forecast
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-max pb-2">
            {displayHours.map((hour, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300 min-w-[80px]"
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {formatTime(hour.time)}
                </div>
                <div className="flex-shrink-0">
                  {getWeatherIcon(hour.condition)}
                </div>
                <div className="text-sm font-semibold text-primary">
                  {hour.temperature}°
                </div>
                {hour.precipitation > 0 && (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Droplets className="w-3 h-3" />
                    {hour.precipitation.toFixed(1)}mm
                  </div>
                )}
                {hour.precipitation === 0 && hour.chanceOfRain > 30 && (
                  <div className="text-xs text-muted-foreground">
                    {hour.chanceOfRain}%
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Wind className="w-3 h-3" />
                  {hour.windSpeed} km/h
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            <strong>Note:</strong> Hourly forecast shows next 12 hours. Full 24-hour data available in detailed view.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

