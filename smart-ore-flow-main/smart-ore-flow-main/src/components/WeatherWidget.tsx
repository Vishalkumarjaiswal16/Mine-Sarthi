import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Gauge, Thermometer, Zap } from "lucide-react";
import { generateWeatherData, type WeatherData } from "@/lib/mockData";

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData>(generateWeatherData());

  useEffect(() => {
    // Update weather data using the new generateWeatherData function
    const interval = setInterval(() => {
      setWeather(generateWeatherData());
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case "sunny":
        return <Sun className="w-8 h-8 text-warning animate-pulse-slow" />;
      case "cloudy":
        return <Cloud className="w-8 h-8 text-muted-foreground" />;
      case "rainy":
        return <CloudRain className="w-8 h-8 text-data-blue" />;
      case "stormy":
        return <CloudRain className="w-8 h-8 text-destructive animate-pulse" />;
      case "snowy":
        return <Cloud className="w-8 h-8 text-primary" />;
      default:
        return <Sun className="w-8 h-8 text-warning" />;
    }
  };

  const getConditionText = () => {
    return weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1);
  };

  return (
    <Card className="p-4 sm:p-6 bg-gradient-to-br from-card to-muted/20 border-border relative overflow-hidden" role="region" aria-labelledby="weather-widget-title">
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/5 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="min-w-0 flex-1">
            <h3 id="weather-widget-title" className="text-base sm:text-lg font-semibold truncate">Mining Site Weather</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Pilbara Region, WA</p>
          </div>
          <div className="animate-bounce-subtle ml-2 flex-shrink-0" aria-hidden="true">
            {getWeatherIcon()}
          </div>
        </div>

        <div className="flex items-baseline gap-1 sm:gap-2 mb-3 sm:mb-4">
          <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-data-blue bg-clip-text text-transparent">
            {weather.temperature}°
          </span>
          <span className="text-lg sm:text-xl text-muted-foreground">C</span>
          <span className="ml-1 sm:ml-2 text-sm sm:text-lg text-foreground truncate">{getConditionText()}</span>
          <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-muted-foreground">Feels like {weather.feelsLike}°</span>
        </div>

        {/* Primary Metrics - 3 columns */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-data-blue flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Humidity</p>
              <p className="text-xs sm:text-sm font-semibold">{weather.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Wind className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Wind</p>
              <p className="text-xs sm:text-sm font-semibold">{weather.windSpeed} km/h {weather.windDirection}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-steel-grey flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Visibility</p>
              <p className="text-xs sm:text-sm font-semibold">{weather.visibility} km</p>
            </div>
          </div>
        </div>

        {/* Additional Metrics - 3 columns */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 sm:gap-2">
            <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Pressure</p>
              <p className="text-xs sm:text-sm font-semibold">{weather.pressure} hPa</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">UV Index</p>
              <p className={`text-xs sm:text-sm font-semibold ${
                weather.uvIndex <= 2 ? 'text-success' :
                weather.uvIndex <= 5 ? 'text-warning' :
                'text-destructive'
              }`}>
                {weather.uvIndex}
              </p>
            </div>
          </div>
          {weather.precipitation > 0 && (
            <div className="flex items-center gap-1 sm:gap-2">
              <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-data-blue flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Precipitation</p>
                <p className="text-xs sm:text-sm font-semibold">{weather.precipitation} mm</p>
              </div>
            </div>
          )}
          {weather.precipitation === 0 && (
            <div className="flex items-center gap-1 sm:gap-2">
              <Thermometer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Forecast</p>
                <p className="text-xs sm:text-sm font-semibold">{weather.forecast.high}°/{weather.forecast.low}°</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default WeatherWidget;
