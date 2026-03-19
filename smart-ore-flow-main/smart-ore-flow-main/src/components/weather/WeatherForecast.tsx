import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, Wind, Droplets, Calendar } from 'lucide-react';
import { type WeatherData } from '@/lib/mockData';

interface ForecastData {
  date: string;
  condition: WeatherData['condition'];
  high: number;
  low: number;
  precipitation: number;
  chanceOfRain: number;
  windSpeed: number;
}

interface WeatherForecastProps {
  weather: WeatherData | null;
}

export const WeatherForecast: React.FC<WeatherForecastProps> = ({ weather }) => {
  // Use 7-day forecast from weather data if available, otherwise generate mock
  const getForecastData = (): ForecastData[] => {
    if (weather?.daily && weather.daily.length >= 7) {
      const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      return weather.daily.slice(0, 7).map((day, index) => {
        const dateLabel = index === 0 ? 'Today' : 
                         index === 1 ? 'Tomorrow' : 
                         weekDays[day.date.getDay()] || 'Day ' + (index + 1);
        
        return {
          date: dateLabel,
          condition: day.condition,
          high: day.high,
          low: day.low,
          precipitation: day.precipitation,
          chanceOfRain: day.chanceOfRain,
          windSpeed: day.windSpeed,
        };
      });
    }
    
    // Fallback to mock data
    return [
      {
        date: 'Today',
        condition: weather?.condition || 'sunny',
        high: weather?.forecast.high || 28,
        low: weather?.forecast.low || 18,
        precipitation: weather?.precipitation || 0,
        chanceOfRain: weather?.forecast.chanceOfRain || 10,
        windSpeed: weather?.windSpeed || 15,
      },
      {
        date: 'Tomorrow',
        condition: 'cloudy',
        high: 26,
        low: 17,
        precipitation: 0,
        chanceOfRain: 20,
        windSpeed: 12,
      },
      {
        date: 'Day 3',
        condition: 'rainy',
        high: 24,
        low: 16,
        precipitation: 2.5,
        chanceOfRain: 70,
        windSpeed: 18,
      },
      {
        date: 'Day 4',
        condition: 'sunny',
        high: 27,
        low: 19,
        precipitation: 0,
        chanceOfRain: 5,
        windSpeed: 10,
      },
      {
        date: 'Day 5',
        condition: 'stormy',
        high: 23,
        low: 15,
        precipitation: 5.2,
        chanceOfRain: 85,
        windSpeed: 25,
      },
      {
        date: 'Day 6',
        condition: 'cloudy',
        high: 25,
        low: 16,
        precipitation: 0.5,
        chanceOfRain: 30,
        windSpeed: 14,
      },
      {
        date: 'Day 7',
        condition: 'sunny',
        high: 28,
        low: 18,
        precipitation: 0,
        chanceOfRain: 10,
        windSpeed: 11,
      },
    ];
  };

  const forecastData = getForecastData();

  const getWeatherIcon = (condition: WeatherData['condition']) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="w-6 h-6 text-warning" />;
      case 'cloudy':
        return <Cloud className="w-6 h-6 text-muted-foreground" />;
      case 'rainy':
        return <CloudRain className="w-6 h-6 text-primary" />;
      case 'stormy':
        return <Cloud className="w-6 h-6 text-destructive" />;
      case 'snowy':
        return <Cloud className="w-6 h-6 text-primary" />;
      default:
        return <Sun className="w-6 h-6 text-warning" />;
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
    <Card className="p-4 sm:p-6 glass rounded-modern-xl shadow-depth-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <span>7-Day Forecast</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="max-h-[600px] overflow-y-auto overflow-x-hidden">
          <div className="space-y-1.5 px-2 sm:px-3">
            <table className="w-full border-collapse">
              <tbody>
                {forecastData.map((day, index) => (
                  <tr
                    key={index}
                    className="bg-muted/30 hover:bg-muted/50 transition-all duration-300 border border-border/30 rounded-lg"
                  >
                    {/* Date Column */}
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 w-[75px] sm:w-[95px] align-middle first:rounded-l-lg">
                      <div className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {day.date}
                      </div>
                    </td>
                    
                    {/* Weather Icon Column */}
                    <td className="px-2 sm:px-3 py-2.5 sm:py-3 w-[50px] sm:w-[55px] align-middle text-center">
                      <div className="flex items-center justify-center">
                        {getWeatherIcon(day.condition)}
                      </div>
                    </td>
                    
                    {/* Condition Column */}
                    <td className="px-2 sm:px-3 py-2.5 sm:py-3 w-[90px] sm:w-[110px] align-middle">
                      <div className={`text-xs sm:text-sm font-medium capitalize truncate ${getConditionColor(day.condition)}`}>
                        {day.condition}
                      </div>
                    </td>
                    
                    {/* Details Column */}
                    <td className="px-2 sm:px-3 py-2.5 sm:py-3 align-middle">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {day.precipitation > 0 && (
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            <Droplets className="w-3 h-3 flex-shrink-0" />
                            <span>{day.precipitation.toFixed(1)}mm</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                          <Wind className="w-3 h-3 flex-shrink-0" />
                          <span>{day.windSpeed} km/h</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Temperature Column */}
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 w-[95px] sm:w-[115px] align-middle text-right last:rounded-r-lg">
                      <div className="flex flex-col items-end justify-center gap-0.5">
                        <div className="flex items-baseline gap-0.5 whitespace-nowrap">
                          <span className="text-sm sm:text-base font-bold text-primary">{day.high}°</span>
                          <span className="text-xs sm:text-sm text-muted-foreground">/</span>
                          <span className="text-xs sm:text-sm text-muted-foreground">{day.low}°</span>
                        </div>
                        {day.chanceOfRain > 0 && (
                          <div className="text-[10px] sm:text-xs text-primary font-medium whitespace-nowrap">
                            {day.chanceOfRain}%
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 pt-4 px-3 sm:px-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            <strong>Note:</strong> Forecast data is updated every 3 hours. Mining operations may be affected by severe weather conditions.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
