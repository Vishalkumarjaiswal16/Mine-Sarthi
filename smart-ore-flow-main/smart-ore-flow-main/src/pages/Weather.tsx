import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LocationSelector } from '@/components/weather/LocationSelector';
import { WeatherDisplay } from '@/components/weather/WeatherDisplay';
import { WeatherForecast } from '@/components/weather/WeatherForecast';
import { HourlyForecast } from '@/components/weather/HourlyForecast';
import { WeatherAlerts } from '@/components/weather/WeatherAlerts';
import { WeatherMap } from '@/components/weather/WeatherMap';
import { WeatherComparison } from '@/components/weather/WeatherComparison';
import { generateWeatherData, type WeatherData } from '@/lib/mockData';
import { realtimeService } from '@/lib/realtimeService';
import { Radio } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  timezone: string;
}

const WeatherPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(() => {
    // Check if location is passed from heatmap via URL params
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const name = searchParams.get('name');
    if (lat && lng && name) {
      return {
        id: `heatmap-${lat}-${lng}`,
        name: decodeURIComponent(name),
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        timezone: 'IST', // Default to IST for India
      };
    }
    // Default location (India - Joda)
    return {
      id: 'default-joda',
      name: 'Joda Iron Ore Mine',
      lat: 22.03,
      lng: 85.43,
      timezone: 'IST',
    };
  });
  const [currentWeather, setCurrentWeather] = useState<WeatherData>(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const name = searchParams.get('name');
    if (lat && lng && name) {
      return generateWeatherData({
        name: decodeURIComponent(name),
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        timezone: 'IST',
      });
    }
    return generateWeatherData();
  });
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Subscribe to real-time weather data
  useEffect(() => {
    // Try to connect to real-time service
    const wsUrl = import.meta.env['VITE_WS_URL'];
    const sseUrl = import.meta.env['VITE_SSE_URL'];

    if (wsUrl) {
      realtimeService.connectWebSocket(wsUrl);
    } else if (sseUrl) {
      realtimeService.connectSSE(sseUrl);
    }

    // Subscribe to weather updates
    const unsubscribeWeather = realtimeService.subscribe('weather', (data) => {
      const weatherData = data.data['weather'];
      const locationData = data.data['location'];
      
      if (weatherData && locationData && selectedLocation && 
          typeof locationData === 'object' && !Array.isArray(locationData)) {
        const location = locationData as { lat?: number; lng?: number };
        // Update weather if location matches
        if (location.lat === selectedLocation.lat && 
            location.lng === selectedLocation.lng) {
          if (typeof weatherData === 'object' && !Array.isArray(weatherData)) {
            setCurrentWeather(weatherData as WeatherData);
          }
        }
      }
    });

    // Check connection status
    const statusInterval = setInterval(() => {
      setIsRealtimeConnected(realtimeService.getConnectionStatus());
    }, 1000);

    // Fallback: Auto-update with mock data if no real-time connection
    const interval = setInterval(() => {
      if (!realtimeService.getConnectionStatus() && selectedLocation) {
        const newWeather = generateWeatherData({
          name: selectedLocation.name,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          timezone: selectedLocation.timezone,
        });
        setCurrentWeather(newWeather);
      }
    }, 30000); // Update weather every 30 seconds

    return () => {
      unsubscribeWeather();
      clearInterval(statusInterval);
      clearInterval(interval);
    };
  }, [selectedLocation]);

  // Update weather when location changes (only if not using real-time)
  useEffect(() => {
    if (!isRealtimeConnected && selectedLocation) {
      const newWeather = generateWeatherData({
        name: selectedLocation.name,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        timezone: selectedLocation.timezone,
      });
      setCurrentWeather(newWeather);
    }
  }, [selectedLocation, isRealtimeConnected]);

  return (
    <div className="min-h-full space-y-6 p-4 sm:p-6 w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#26436C' }}>
            <span>Global</span>{' '}
            <span>Weather</span>{' '}
            <span>Monitoring</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Real-time weather conditions and forecasts for your mining operations worldwide.
          </p>
        </div>
        {isRealtimeConnected && (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-success/10 text-success border-success w-fit">
            <Radio className="w-3 h-3 animate-pulse" />
            Real-time Weather
          </Badge>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Weather Map */}
        <div className="lg:col-span-3 space-y-6">
          <WeatherMap
            weather={currentWeather}
            locationName={selectedLocation?.name || "Sample Location"}
            lat={selectedLocation?.lat || 22.03}
            lng={selectedLocation?.lng || 85.43}
          />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* Location Selector */}
          <Card className="p-4 glass rounded-modern-xl shadow-depth-xl">
            <h3 className="text-base font-semibold mb-3">Select Location</h3>
            <LocationSelector onLocationSelect={setSelectedLocation} />
          </Card>

          {/* Current Weather Display */}
          <WeatherDisplay weather={currentWeather} locationName={selectedLocation?.name || "Sample Location"} />
          
          {/* Forecasts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HourlyForecast weather={currentWeather} />
            <WeatherForecast weather={currentWeather} />
          </div>

          {/* Comparison and Alerts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeatherComparison />
            <WeatherAlerts />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherPage;
