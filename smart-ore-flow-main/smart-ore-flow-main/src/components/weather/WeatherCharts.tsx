import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Thermometer, Droplets, Gauge, Wind, BarChart3 } from 'lucide-react';
import { type WeatherData } from '@/lib/mockData';

interface WeatherChartsProps {
  weather: WeatherData;
}

export const WeatherCharts: React.FC<WeatherChartsProps> = ({ weather }) => {
  // Generate mock hourly data for the last 24 hours
  const generateHourlyData = () => {
    const hours = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      hours.push({
        time: hour.getHours(),
        temperature: weather.temperature + (Math.random() * 8 - 4),
        humidity: weather.humidity + (Math.random() * 20 - 10),
        pressure: weather.pressure + (Math.random() * 10 - 5),
        windSpeed: weather.windSpeed + (Math.random() * 10 - 5),
      });
    }
    return hours;
  };

  const hourlyData = generateHourlyData();
  const maxTemp = Math.max(...hourlyData.map(d => d.temperature));
  const minTemp = Math.min(...hourlyData.map(d => d.temperature));
  const maxHumidity = Math.max(...hourlyData.map(d => d.humidity));
  const minHumidity = Math.min(...hourlyData.map(d => d.humidity));
  const maxPressure = Math.max(...hourlyData.map(d => d.pressure));
  const minPressure = Math.min(...hourlyData.map(d => d.pressure));
  const maxWind = Math.max(...hourlyData.map(d => d.windSpeed));
  const minWind = Math.min(...hourlyData.map(d => d.windSpeed));

  const ChartBar: React.FC<{
    value: number;
    max: number;
    min: number;
    color: string;
    label: string;
  }> = ({ value, max, min, color, label }) => {
    const percentage = ((value - min) / (max - min)) * 100;
    return (
      <div className="flex flex-col items-center gap-1 flex-1">
        <div className="w-full h-32 bg-muted/30 rounded-lg relative overflow-hidden">
          <div
            className={`absolute bottom-0 w-full rounded-lg transition-all duration-500 ${color}`}
            style={{ height: `${Math.max(percentage, 5)}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold">{Math.round(value)}</span>
      </div>
    );
  };

  const LineChart: React.FC<{
    data: number[];
    color: string;
    label: string;
    unit: string;
    max: number;
    min: number;
  }> = ({ data, color, label, unit, max, min }) => {
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / (max - min)) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">
            {Math.round(data[data.length - 1])}{unit}
          </span>
        </div>
        <div className="h-32 w-full relative">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={points}
              fill={color}
              fillOpacity="0.15"
              stroke="none"
            />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Weather Trends (24 Hours)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Temperature Chart */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Thermometer className="w-4 h-4 text-warning" />
            <span className="text-sm font-semibold">Temperature Trend</span>
          </div>
          <LineChart
            data={hourlyData.map(d => d.temperature)}
            color="hsl(45 75% 58%)"
            label="Temperature"
            unit="°C"
            max={maxTemp}
            min={minTemp}
          />
        </div>

        {/* Humidity Chart */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Humidity Trend</span>
          </div>
          <LineChart
            data={hourlyData.map(d => d.humidity)}
            color="hsl(200 65% 55%)"
            label="Humidity"
            unit="%"
            max={maxHumidity}
            min={minHumidity}
          />
        </div>

        {/* Pressure Chart */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-success" />
            <span className="text-sm font-semibold">Pressure Trend</span>
          </div>
          <LineChart
            data={hourlyData.map(d => d.pressure)}
            color="hsl(140 45% 52%)"
            label="Pressure"
            unit=" hPa"
            max={maxPressure}
            min={minPressure}
          />
        </div>

        {/* Wind Speed Chart */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wind className="w-4 h-4 text-success" />
            <span className="text-sm font-semibold">Wind Speed Trend</span>
          </div>
          <LineChart
            data={hourlyData.map(d => d.windSpeed)}
            color="hsl(140 45% 52%)"
            label="Wind Speed"
            unit=" km/h"
            max={maxWind}
            min={minWind}
          />
        </div>

        {/* Hourly Bar Chart */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Hourly Overview</span>
          </div>
          <div className="flex gap-1 items-end">
            {hourlyData.slice(-12).map((data, index) => (
              <ChartBar
                key={index}
                value={data.temperature}
                max={maxTemp}
                min={minTemp}
                color="bg-gradient-to-t from-[hsl(45_75%_58%)] to-[hsl(45_75%_65%)]"
                label={`${data.time}:00`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

