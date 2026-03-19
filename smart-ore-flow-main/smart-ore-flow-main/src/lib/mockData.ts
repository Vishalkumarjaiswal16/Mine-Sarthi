// Mock data and utilities for Smart Ore Flow application

export interface MiningMetrics {
  feedSize: number;
  oreHardness: number;
  equipmentLoad: number;
  moistureContent: number;
  temperature: number;
  vibration: number;
  powerFactor: number;
}

export interface EquipmentStatus {
  id: string;
  name: string;
  status: 'online' | 'warning' | 'maintenance';
  load: number;
  temperature: number;
  vibration: number;
  alerts: number;
}

export interface AIRecommendation {
  id: string;
  type: 'energy' | 'maintenance' | 'optimization' | 'renewable';
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
  energySavings?: number; // Percentage
  efficiencyGain?: number; // Percentage
  confidence?: number; // 0-100
  expectedImpact?: string;
}

// Ore types for simulation - Realistic values based on industry standards
const oreTypes = [
  { name: 'Iron Ore', hardness: 8.5, feedSize: 150, moisture: 8.5 }, // Typical: BWI 8-10, feed size 100-200mm, moisture 6-12%
  { name: 'Copper Ore', hardness: 12.5, feedSize: 120, moisture: 5.0 }, // Typical: BWI 10-15, feed size 80-150mm, moisture 3-8%
  { name: 'Gold Ore', hardness: 18.0, feedSize: 100, moisture: 9.0 }, // Typical: BWI 15-20, feed size 75-125mm, moisture 7-12%
  { name: 'Coal', hardness: 6.0, feedSize: 200, moisture: 15.0 }, // Typical: BWI 5-7, feed size 150-250mm, moisture 10-20%
  { name: 'Limestone', hardness: 7.5, feedSize: 180, moisture: 4.0 }, // Typical: BWI 6-9, feed size 120-200mm, moisture 2-6%
];

// Time of day factors - Realistic ambient temperatures for mining operations
const timeFactors = {
  morning: { efficiency: 0.95, temperature: 28 }, // Typical morning ambient: 25-30°C
  afternoon: { efficiency: 1.0, temperature: 35 }, // Typical afternoon ambient: 32-38°C
  evening: { efficiency: 0.98, temperature: 30 }, // Typical evening ambient: 28-32°C
  night: { efficiency: 0.92, temperature: 24 }, // Typical night ambient: 22-26°C
};

// Heatmap data for mining operations visualization
export const heatmapData = [
  { lat: -25.2744, lng: 133.7751, weight: 0.8, name: "Alice Springs Mine", production: 450, efficiency: 87, status: "Excellent" }, // Alice Springs, Australia
  { lat: -23.7004, lng: 133.8751, weight: 0.6, name: "Tennant Creek Site", production: 380, efficiency: 82, status: "Good" }, // Tennant Creek, Australia
  { lat: -24.8667, lng: 134.2000, weight: 0.7, name: "Katherine Operations", production: 420, efficiency: 89, status: "Optimal" }, // Katherine, Australia
  { lat: -26.2000, lng: 133.3000, weight: 0.5, name: "Uluru Mining Complex", production: 350, efficiency: 78, status: "Fair" }, // Uluru area, Australia
  { lat: -25.8000, lng: 134.5000, weight: 0.4, name: "Simpson Desert Site", production: 280, efficiency: 75, status: "Fair" }, // Simpson Desert, Australia
  { lat: -24.5000, lng: 133.0000, weight: 0.9, name: "Barkly Tableland Mine", production: 520, efficiency: 92, status: "Excellent" }, // Barkly Tableland, Australia
  { lat: -26.5000, lng: 134.8000, weight: 0.3, name: "Oodnadatta Operations", production: 220, efficiency: 68, status: "Maintenance" }, // Oodnadatta, Australia
  { lat: -25.0000, lng: 132.5000, weight: 0.6, name: "Finke River Site", production: 390, efficiency: 84, status: "Good" }, // Finke River, Australia
  { lat: -24.2000, lng: 133.5000, weight: 0.8, name: "Tennant Creek Extension", production: 480, efficiency: 88, status: "Optimal" }, // Tennant Creek extension, Australia
  { lat: -26.8000, lng: 134.2000, weight: 0.5, name: "Andamooka Operations", production: 320, efficiency: 76, status: "Fair" }, // Andamooka, Australia
  { lat: -25.6000, lng: 132.8000, weight: 0.4, name: "Mount Isa Link", production: 290, efficiency: 72, status: "Maintenance" }, // Mount Isa link, Australia
  { lat: -24.8000, lng: 133.2000, weight: 0.7, name: "Barkly Highway Site", production: 410, efficiency: 85, status: "Good" }, // Barkly Highway, Australia
  { lat: -26.2000, lng: 134.6000, weight: 0.9, name: "Coober Pedy Extension", production: 550, efficiency: 91, status: "Excellent" }, // Coober Pedy extension, Australia
  { lat: -25.4000, lng: 132.2000, weight: 0.6, name: "Tanami Desert Mine", production: 360, efficiency: 80, status: "Good" }, // Tanami Desert, Australia
  { lat: -24.6000, lng: 133.8000, weight: 0.5, name: "Davenport Range Site", production: 330, efficiency: 77, status: "Fair" }, // Davenport Range, Australia
  { lat: -26.4000, lng: 133.6000, weight: 0.8, name: "Stuart Highway Operations", production: 470, efficiency: 86, status: "Optimal" }, // Stuart Highway, Australia
  { lat: -25.2000, lng: 134.4000, weight: 0.4, name: "Mataranka Link", production: 260, efficiency: 70, status: "Maintenance" }, // Mataranka link, Australia
  { lat: -24.4000, lng: 132.6000, weight: 0.7, name: "Roper River Site", production: 430, efficiency: 83, status: "Good" }, // Roper River, Australia
  { lat: -26.6000, lng: 133.4000, weight: 0.9, name: "Birdsville Operations", production: 510, efficiency: 90, status: "Excellent" }, // Birdsville, Australia
  { lat: -25.8000, lng: 133.6000, weight: 0.6, name: "Daly Waters Site", production: 370, efficiency: 81, status: "Good" }, // Daly Waters, Australia
];

// Generate random ore type
export function getRandomOreType() {
  return oreTypes[Math.floor(Math.random() * oreTypes.length)];
}

// Get current time of day
export function getTimeOfDay(): keyof typeof timeFactors {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

// Generate mining metrics based on ore type, time, and conditions
// Values are based on realistic iron ore mining industry standards
export function generateMiningMetrics(
  oreType: typeof oreTypes[0],
  timeOfDay: keyof typeof timeFactors,
  conditions: 'good' | 'fair' | 'poor' = 'good'
): MiningMetrics {
  const timeFactor = timeFactors[timeOfDay];
  const conditionMultiplier = conditions === 'good' ? 1 : conditions === 'fair' ? 0.9 : 0.8;

  const baseEfficiency = timeFactor.efficiency * conditionMultiplier;

  // Realistic ranges for iron ore mining:
  // Feed Size: 100-200mm (typical gyratory crusher feed)
  // Ore Hardness (BWI): 8-10 kWh/t for iron ore
  // Equipment Load: 65-85% (optimal operating range)
  // Moisture Content: 6-12% for iron ore
  // Temperature: Equipment operating temp 35-65°C (ambient + equipment heat)
  // Vibration: 0.5-2.5 mm/s (normal operating range, >2.5 is warning)
  // Power Factor: 0.90-0.98 (good power factor range)

  return {
    feedSize: oreType.feedSize * (0.90 + Math.random() * 0.15), // ±15% variation
    oreHardness: oreType.hardness * (0.95 + Math.random() * 0.10), // ±10% variation
    equipmentLoad: Math.floor(65 + Math.random() * 20) * baseEfficiency, // 65-85% range
    moistureContent: oreType.moisture * (0.85 + Math.random() * 0.30), // ±30% variation
    temperature: timeFactor.temperature + 10 + Math.random() * 20, // Equipment temp: ambient + 10-30°C
    vibration: 0.8 + Math.random() * 1.4, // 0.8-2.2 mm/s (normal range)
    powerFactor: 0.92 + Math.random() * 0.06, // 0.92-0.98 (good power factor)
  };
}

// Equipment status generation moved to the end of the file to avoid duplication

// Generate AI recommendations based on current metrics
export function generateAIRecommendations(metrics: MiningMetrics): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  // Energy optimization recommendations
  if (metrics.equipmentLoad > 85) {
    recommendations.push({
      id: 'energy-1',
      type: 'energy',
      title: 'Reduce SAG Mill Speed',
      description: 'Current ore hardness allows 5% speed reduction while maintaining throughput',
      impact: '-120 kWh/hr',
      priority: 'high',
      energySavings: 4.2,
      efficiencyGain: 0,
      confidence: 85,
      expectedImpact: 'Reduce energy consumption by 4.2% without affecting production',
    });
  }

  if (metrics.powerFactor < 0.9) {
    recommendations.push({
      id: 'energy-2',
      type: 'energy',
      title: 'Optimize Power Factor',
      description: 'Adjust capacitor banks to improve power factor above 0.95',
      impact: '-85 kWh/hr',
      priority: 'medium',
      energySavings: 3.0,
      efficiencyGain: 2.5,
      confidence: 78,
      expectedImpact: 'Improve power factor and reduce reactive power losses',
    });
  }

  // Maintenance recommendations
  if (metrics.vibration > 2.0) {
    recommendations.push({
      id: 'maintenance-1',
      type: 'maintenance',
      title: 'Vibration Analysis Required',
      description: 'High vibration detected - schedule bearing inspection',
      impact: 'Prevent downtime',
      priority: 'high',
      energySavings: 0,
      efficiencyGain: 0,
      confidence: 92,
      expectedImpact: 'Prevent potential equipment failure and unplanned downtime',
    });
  }

  if (metrics.temperature > 70) {
    recommendations.push({
      id: 'maintenance-2',
      type: 'maintenance',
      title: 'Cooling System Check',
      description: 'Equipment temperature elevated - verify cooling system',
      impact: 'Extend equipment life',
      priority: 'medium',
      energySavings: 1.5,
      efficiencyGain: 0,
      confidence: 75,
      expectedImpact: 'Improve cooling efficiency and reduce energy waste',
    });
  }

  // Process optimization recommendations
  if (metrics.moistureContent > 8) {
    recommendations.push({
      id: 'optimization-1',
      type: 'optimization',
      title: 'Adjust Media Size',
      description: 'Ball mill efficiency can improve with larger grinding media for current ore type',
      impact: '+12% efficiency',
      priority: 'medium',
      energySavings: 0,
      efficiencyGain: 12.0,
      confidence: 80,
      expectedImpact: 'Increase grinding efficiency by 12% with optimized media size',
    });
  }

  if (metrics.feedSize > 45) {
    recommendations.push({
      id: 'optimization-2',
      type: 'optimization',
      title: 'Optimize Feed Rate',
      description: 'Increase crusher feed rate by 8% during off-peak energy hours',
      impact: 'Schedule Ready',
      priority: 'low',
      energySavings: 2.8,
      efficiencyGain: 5.0,
      confidence: 70,
      expectedImpact: 'Optimize production schedule to reduce peak-hour energy costs',
    });
  }

  // Renewable energy recommendations
  if (metrics.equipmentLoad > 80) {
    recommendations.push({
      id: 'renewable-1',
      type: 'renewable',
      title: 'Shift Load to Solar Peak Hours',
      description: 'Schedule high-load operations during solar generation peaks (10AM-2PM)',
      impact: '+25% renewable utilization',
      priority: 'high',
    });
  }

  recommendations.push({
    id: 'renewable-2',
    type: 'renewable',
    title: 'Battery Storage Optimization',
    description: 'Charge batteries during low-tariff periods and discharge during peak demand',
    impact: '-15% energy costs',
    priority: 'medium',
  });

  // Return top 5 recommendations by priority
  return recommendations
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 5);
}

// Weather data for simulation - Enhanced per REDESIGN_PLAN.md
export interface HourlyForecast {
  time: Date;
  temperature: number;
  condition: WeatherData['condition'];
  precipitation: number;
  chanceOfRain: number;
  windSpeed: number;
  windDirection: string;
  humidity: number;
}

export interface DailyForecast {
  date: Date;
  condition: WeatherData['condition'];
  high: number;
  low: number;
  precipitation: number;
  chanceOfRain: number;
  windSpeed: number;
  windDirection: string;
  humidity: number;
}

export interface WeatherData {
  location?: {
    name: string;
    coordinates: { lat: number; lng: number };
    timezone: string;
  };
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  humidity: number;
  dewPoint?: number; // New
  comfortLevel?: 'comfortable' | 'uncomfortable' | 'very-uncomfortable'; // New
  windSpeed: number;
  windGust?: number; // New
  windDirection: string;
  windChill?: number; // New
  windSpeedTrend?: 'rising' | 'falling' | 'stable'; // New
  pressure: number;
  pressureTrend?: 'rising' | 'falling' | 'stable'; // New
  pressureChangeRate?: number; // hPa/hour - New
  visibility: number;
  uvIndex: number;
  feelsLike: number;
  temperatureTrend?: 'rising' | 'falling' | 'stable'; // New
  historicalComparison?: {
    yesterday: number;
    lastWeek: number;
    average: number;
  }; // New
  precipitation: number;
  dailyTotal?: number; // New - daily total rainfall
  forecast: {
    high: number;
    low: number;
    chanceOfRain: number;
  };
  hourly?: HourlyForecast[]; // New - 24-hour forecast
  daily?: DailyForecast[]; // New - 7-day forecast
  timestamp?: Date; // New
}

export function generateWeatherData(location?: { name: string; lat: number; lng: number; timezone: string }): WeatherData {
  const conditions: WeatherData['condition'][] = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];

  const baseTemp = 25 + Math.random() * 15;
  const humidity = 40 + Math.random() * 50;
  const windSpeed = Math.random() * 20;
  const windGust = windSpeed + Math.random() * 10; // Wind gust is higher than wind speed
  const windDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const windDirection = windDirections[Math.floor(Math.random() * windDirections.length)];
  const pressure = 980 + Math.random() * 40; // 980-1020 hPa
  const visibility = 5 + Math.random() * 15; // 5-20 km
  const uvIndex = Math.floor(Math.random() * 11); // 0-10
  const feelsLike = baseTemp + (Math.random() * 5 - 2.5); // ±2.5°C from actual temp
  const precipitation = condition === 'rainy' || condition === 'stormy' ? Math.random() * 10 : 0;
  
  // Calculate dew point (approximate formula)
  const dewPoint = baseTemp - ((100 - humidity) / 5);
  
  // Determine comfort level based on temperature and humidity
  let comfortLevel: 'comfortable' | 'uncomfortable' | 'very-uncomfortable' = 'comfortable';
  if (baseTemp > 30 && humidity > 70) comfortLevel = 'very-uncomfortable';
  else if (baseTemp > 28 && humidity > 60) comfortLevel = 'uncomfortable';
  
  // Calculate wind chill (simplified formula for temperatures above 10°C, it's less significant)
  const windChill = baseTemp < 10 ? baseTemp - (windSpeed * 0.7) : baseTemp;
  
  // Determine trends (random for now, in real app would compare with previous values)
  const trends: ('rising' | 'falling' | 'stable')[] = ['rising', 'falling', 'stable'];
  const temperatureTrend = trends[Math.floor(Math.random() * trends.length)];
  const windSpeedTrend = trends[Math.floor(Math.random() * trends.length)];
  const pressureTrend = trends[Math.floor(Math.random() * trends.length)];
  const pressureChangeRate = (Math.random() * 2 - 1) * 0.5; // -0.5 to 0.5 hPa/hour
  
  const high = baseTemp + 3 + Math.random() * 5;
  const low = baseTemp - 5 - Math.random() * 5;
  const chanceOfRain = condition === 'rainy' || condition === 'stormy' 
    ? 60 + Math.random() * 40 
    : Math.random() * 30;
  
  const dailyTotal = precipitation + (condition === 'rainy' || condition === 'stormy' ? Math.random() * 5 : 0);
  
  // Historical comparison (mock data)
  const historicalComparison = {
    yesterday: baseTemp + (Math.random() * 4 - 2),
    lastWeek: baseTemp + (Math.random() * 6 - 3),
    average: 28 + Math.random() * 4,
  };

  // Generate 24-hour hourly forecast
  const hourly: HourlyForecast[] = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const hourTime = new Date(now.getTime() + i * 60 * 60 * 1000);
    const hourCondition = i < 6 || i > 18 ? 'cloudy' : conditions[Math.floor(Math.random() * conditions.length)];
    hourly.push({
      time: hourTime,
      temperature: Math.round(baseTemp + Math.sin(i / 12 * Math.PI) * 5 + (Math.random() * 4 - 2)),
      condition: hourCondition,
      precipitation: hourCondition === 'rainy' || hourCondition === 'stormy' ? Math.random() * 2 : 0,
      chanceOfRain: hourCondition === 'rainy' || hourCondition === 'stormy' ? 50 + Math.random() * 40 : Math.random() * 20,
      windSpeed: Math.round((windSpeed + Math.random() * 5 - 2.5) * 10) / 10,
      windDirection: windDirections[Math.floor(Math.random() * windDirections.length)],
      humidity: Math.round(humidity + Math.random() * 10 - 5),
    });
  }

  // Generate 7-day daily forecast
  const daily: DailyForecast[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dayCondition = conditions[Math.floor(Math.random() * conditions.length)];
    daily.push({
      date: dayDate,
      condition: dayCondition,
      high: Math.round(high + Math.random() * 4 - 2),
      low: Math.round(low + Math.random() * 4 - 2),
      precipitation: dayCondition === 'rainy' || dayCondition === 'stormy' ? Math.random() * 8 : 0,
      chanceOfRain: dayCondition === 'rainy' || dayCondition === 'stormy' ? 60 + Math.random() * 30 : Math.random() * 30,
      windSpeed: Math.round((windSpeed + Math.random() * 5 - 2.5) * 10) / 10,
      windDirection: windDirections[Math.floor(Math.random() * windDirections.length)],
      humidity: Math.round(humidity + Math.random() * 15 - 7.5),
    });
  }

  const weatherData: WeatherData = {
    location: location ? {
      name: location.name,
      coordinates: { lat: location.lat, lng: location.lng },
      timezone: location.timezone,
    } : undefined,
    temperature: Math.round(baseTemp),
    condition,
    humidity: Math.round(humidity),
    dewPoint: Math.round(dewPoint * 10) / 10,
    comfortLevel,
    windSpeed: Math.round(windSpeed * 10) / 10,
    windGust: Math.round(windGust * 10) / 10,
    windDirection,
    windChill: Math.round(windChill * 10) / 10,
    windSpeedTrend,
    pressure: Math.round(pressure),
    pressureTrend,
    pressureChangeRate: Math.round(pressureChangeRate * 100) / 100,
    visibility: Math.round(visibility * 10) / 10,
    uvIndex,
    feelsLike: Math.round(feelsLike),
    temperatureTrend,
    historicalComparison,
    precipitation: Math.round(precipitation * 10) / 10,
    dailyTotal: Math.round(dailyTotal * 10) / 10,
    forecast: {
      high: Math.round(high),
      low: Math.round(low),
      chanceOfRain: Math.round(chanceOfRain),
    },
    hourly,
    daily,
    timestamp: new Date(),
  };

  return weatherData;
}

// Energy consumption data
export interface EnergyData {
  timestamp: Date;
  consumption: number;
  baseline: number;
  renewable: number;
  cost: number;
}

export function generateEnergyData(hours: number = 24): EnergyData[] {
  const data: EnergyData[] = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = timestamp.getHours();

    // Base consumption varies by time of day
    let baseConsumption = 2500;
    if (hour >= 6 && hour <= 18) {
      baseConsumption = 2800; // Daytime higher consumption
    } else if (hour >= 22 || hour <= 4) {
      baseConsumption = 2000; // Nighttime lower consumption
    }

    const consumption = baseConsumption + (Math.random() - 0.5) * 500;
    const baseline = baseConsumption * 1.1; // 10% above average
    const renewable = consumption * (0.3 + Math.random() * 0.4); // 30-70% renewable
    const cost = consumption * 0.12; // $0.12 per kWh

    data.push({
      timestamp,
      consumption: Math.round(consumption),
      baseline: Math.round(baseline),
      renewable: Math.round(renewable),
      cost: Math.round(cost * 100) / 100,
    });
  }

  return data;
}

// Maintenance schedule data
export interface MaintenanceTask {
  id: string;
  equipment: string;
  task: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate: Date;
  estimatedDuration: number; // hours
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed';
}

export function generateMaintenanceTasks(): MaintenanceTask[] {
  const tasks = [
    {
      id: 'maint-1',
      equipment: 'SAG Mill',
      task: 'Bearing lubrication and inspection',
      priority: 'high' as const,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      estimatedDuration: 4,
      status: 'pending' as const,
    },
    {
      id: 'maint-2',
      equipment: 'Ball Mill',
      task: 'Grinding media replacement',
      priority: 'medium' as const,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      estimatedDuration: 8,
      status: 'scheduled' as const,
    },
    {
      id: 'maint-3',
      equipment: 'Primary Crusher',
      task: 'Jaw plate inspection',
      priority: 'low' as const,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      estimatedDuration: 2,
      status: 'pending' as const,
    },
    {
      id: 'maint-4',
      equipment: 'Hydrocyclone',
      task: 'Apex replacement',
      priority: 'critical' as const,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
      estimatedDuration: 6,
      status: 'in-progress' as const,
    },
  ];

  return tasks;
}

// Report data
export interface ReportData {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalProduction: number;
    averageEfficiency: number;
    totalEnergyConsumption: number;
    maintenanceHours: number;
    downtime: number;
  };
  insights: string[];
}

// Correlation data for heatmap visualization
export interface CorrelationData {
  variables: string[];
  matrix: number[][];
}

export function generateReportData(): ReportData {
  const now = new Date();
  const reportTypes: ReportData['type'][] = ['daily', 'weekly', 'monthly'];

  return {
    id: `report-${Date.now()}`,
    title: 'Production Performance Report',
    type: reportTypes[Math.floor(Math.random() * reportTypes.length)],
    generatedAt: now,
    period: {
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: now,
    },
    metrics: {
      totalProduction: Math.round(15000 + Math.random() * 5000),
      averageEfficiency: Math.round(85 + Math.random() * 10),
      totalEnergyConsumption: Math.round(150000 + Math.random() * 30000),
      maintenanceHours: Math.round(20 + Math.random() * 30),
      downtime: Math.round(Math.random() * 10),
    },
    insights: [
      'Energy consumption reduced by 8% compared to last period',
      'Equipment availability improved to 92%',
      'Production target exceeded by 5%',
      'Maintenance costs decreased by 12%',
    ],
  };
}

// Generate correlation data for heatmap visualization
export function generateCorrelationData(): CorrelationData {
  const variables = ['Energy', 'Efficiency', 'Throughput', 'Temperature', 'Vibration', 'Load'];

  // Mock correlation matrix (symmetric, diagonal = 1)
  const matrix: number[][] = [
    [1.0, 0.85, 0.78, 0.45, 0.32, 0.67], // Energy correlations
    [0.85, 1.0, 0.92, 0.38, 0.28, 0.71], // Efficiency
    [0.78, 0.92, 1.0, 0.41, 0.35, 0.74], // Throughput
    [0.45, 0.38, 0.41, 1.0, 0.62, 0.53], // Temperature
    [0.32, 0.28, 0.35, 0.62, 1.0, 0.48], // Vibration
    [0.67, 0.71, 0.74, 0.53, 0.48, 1.0], // Load
  ];

  // Add some randomness to make it more realistic
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (i !== j) {
        matrix[i][j] += (Math.random() - 0.5) * 0.1; // ±0.05 variation
        matrix[i][j] = Math.max(-1, Math.min(1, matrix[i][j])); // Clamp to [-1, 1]
      }
    }
  }

  return { variables, matrix };
}

// Renewable Energy Mock Data

export interface RenewableGeneration {
  timestamp: Date;
  solar: number; // kW
  wind: number; // kW
  total: number; // kW
  efficiency: number; // %
  capacityFactor: number; // %
}

export function generateRenewableGeneration(hours: number = 24): RenewableGeneration[] {
  const data: RenewableGeneration[] = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = timestamp.getHours();

    // Solar generation peaks midday, zero at night
    const solarBase = hour >= 6 && hour <= 18 ? (Math.sin((hour - 6) * Math.PI / 12) * 800) : 0;
    const solar = solarBase + (Math.random() - 0.5) * 100;

    // Wind generation varies more randomly
    const wind = 200 + Math.random() * 400 + (Math.sin(hour * Math.PI / 12) * 100);

    const total = solar + wind;
    const efficiency = 85 + Math.random() * 10;
    const capacityFactor = (total / 1200) * 100; // Assuming 1.2 MW total capacity

    data.push({
      timestamp,
      solar: Math.round(solar),
      wind: Math.round(wind),
      total: Math.round(total),
      efficiency: Math.round(efficiency),
      capacityFactor: Math.round(capacityFactor * 10) / 10,
    });
  }

  return data;
}

export interface BatteryMetrics {
  soc: number; // State of Charge %
  power: number; // kW (positive=charging, negative=discharging)
  chargeRate: number; // kW
  dischargeRate: number; // kW
  health: number; // % remaining capacity
  cycles: number;
  temperature: number; // °C
}

export function generateBatteryMetrics(): BatteryMetrics {
  const soc = 65 + Math.random() * 30; // 65-95%
  const isCharging = Math.random() > 0.5;
  const power = isCharging ? (50 + Math.random() * 100) : -(50 + Math.random() * 100);
  const chargeRate = isCharging ? Math.abs(power) : 0;
  const dischargeRate = !isCharging ? Math.abs(power) : 0;
  const health = 92 + Math.random() * 6; // 92-98%
  const cycles = Math.floor(1250 + Math.random() * 250); // 1250-1500 cycles
  const temperature = 25 + Math.random() * 15; // 25-40°C

  return {
    soc: Math.round(soc),
    power: Math.round(power),
    chargeRate: Math.round(chargeRate),
    dischargeRate: Math.round(dischargeRate),
    health: Math.round(health),
    cycles,
    temperature: Math.round(temperature),
  };
}

export interface RenewableMix {
  solar: number; // %
  wind: number; // %
  grid: number; // %
  battery: number; // %
  total: number; // Total consumption kWh
  renewablePercentage: number; // % renewable in mix
}

export function generateRenewableMix(): RenewableMix {
  const total = 2800 + Math.random() * 400; // Base load
  const solar = Math.random() * 0.4; // Up to 40% solar
  const wind = Math.random() * 0.3; // Up to 30% wind
  const battery = Math.random() * 0.2; // Up to 20% battery
  const grid = 1 - solar - wind - battery;

  const renewable = solar + wind + battery;
  const renewablePercentage = renewable * 100;

  return {
    solar: Math.round(solar * 100),
    wind: Math.round(wind * 100),
    grid: Math.round(grid * 100),
    battery: Math.round(battery * 100),
    total: Math.round(total),
    renewablePercentage: Math.round(renewablePercentage),
  };
}

export interface CarbonOffset {
  co2Saved: number; // kg CO2
  equivalentTrees: number; // trees planted
  equivalentCars: number; // cars off road for a year
  equivalentFlights: number; // flights avoided
}

export function calculateCarbonOffset(renewableKwh: number): CarbonOffset {
  // Average: 0.7 kg CO2 per kWh for coal-based grid
  const co2Saved = renewableKwh * 0.7;
  
  // 1 tree absorbs ~22 kg CO2/year
  const equivalentTrees = Math.round(co2Saved / 22);
  
  // 1 car emits ~4.6 tons CO2/year = 4600 kg
  const equivalentCars = Math.round(co2Saved / 4600);
  
  // 1 flight Sydney-Melbourne ~0.25 tons CO2 = 250 kg
  const equivalentFlights = Math.round(co2Saved / 250);

  return {
    co2Saved: Math.round(co2Saved * 100) / 100,
    equivalentTrees,
    equivalentCars,
    equivalentFlights,
  };
}

// Generate renewable AI recommendations
export function generateRenewableRecommendations(renewableMix: RenewableMix, battery: BatteryMetrics): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  if (renewableMix.renewablePercentage < 40) {
    recommendations.push({
      id: 'renewable-opt-1',
      type: 'renewable',
      title: 'Increase Solar Capacity',
      description: 'Add 500kW solar panels to boost daytime renewable generation',
      impact: '+25% renewable penetration',
      priority: 'high',
    });
  }

  if (battery.soc < 30) {
    recommendations.push({
      id: 'renewable-opt-2',
      type: 'renewable',
      title: 'Battery Charge Optimization',
      description: 'Charge batteries during solar peak (10AM-2PM) for evening discharge',
      impact: '+15% renewable utilization',
      priority: 'medium',
    });
  }

  if (renewableMix.grid > 60) {
    recommendations.push({
      id: 'renewable-opt-3',
      type: 'renewable',
      title: 'Wind Farm Expansion',
      description: 'Install 2MW wind turbines to reduce grid dependency during low solar periods',
      impact: '-30% grid usage',
      priority: 'high',
    });
  }

  if (battery.health < 95) {
    recommendations.push({
      id: 'renewable-opt-4',
      type: 'renewable',
      title: 'Battery Health Maintenance',
      description: 'Schedule deep discharge cycle and thermal management check',
      impact: 'Extend battery life by 2 years',
      priority: 'medium',
    });
  }

  recommendations.push({
    id: 'renewable-opt-5',
    type: 'renewable',
    title: 'Energy Storage Arbitrage',
    description: 'Store excess renewable energy and sell back to grid during peak pricing',
    impact: '+12% revenue from renewables',
    priority: 'low',
  });

  return recommendations.slice(0, 3);
}

// Generate mock equipment status data for hardware monitoring
// Values based on realistic iron ore mining equipment operating parameters
export const generateEquipmentStatus = (): EquipmentStatus[] => {
  return [
    {
      id: 'eq-001',
      name: 'Gyratory Crusher #1',
      status: 'online',
      load: 72, // Typical: 65-80% load
      temperature: 58, // Typical: 50-65°C (ambient + friction heat)
      vibration: 1.8, // Typical: 1.5-2.0 mm/s (normal range)
      alerts: 0,
    },
    {
      id: 'eq-002',
      name: 'Conveyor Belt #1',
      status: 'online',
      load: 68, // Typical: 60-75% load
      temperature: 42, // Typical: 35-50°C (lower than crushers)
      vibration: 1.2, // Typical: 0.8-1.5 mm/s (conveyors have lower vibration)
      alerts: 0,
    },
    {
      id: 'eq-003',
      name: 'Ball Mill Grinder',
      status: 'warning',
      load: 78, // Typical: 70-85% load (higher load indicates good throughput)
      temperature: 62, // Typical: 55-70°C (grinding generates heat)
      vibration: 2.1, // Typical: 1.8-2.5 mm/s (approaching warning threshold)
      alerts: 1,
    },
    {
      id: 'eq-004',
      name: 'Vibrating Screen',
      status: 'online',
      load: 65, // Typical: 60-75% load
      temperature: 48, // Typical: 40-55°C
      vibration: 1.9, // Typical: 1.5-2.2 mm/s (vibrating screens naturally have higher vibration)
      alerts: 0,
    },
    {
      id: 'eq-005',
      name: 'Magnetic Separator',
      status: 'maintenance',
      load: 0, // Maintenance mode
      temperature: 35, // Cooled down during maintenance
      vibration: 0.3, // Minimal vibration when off
      alerts: 2,
    },
    {
      id: 'eq-006',
      name: 'Hopper',
      status: 'online',
      load: 58, // Typical: 50-70% capacity
      temperature: 38, // Typical: 30-45°C (static equipment, lower temp)
      vibration: 0.6, // Typical: 0.3-1.0 mm/s (very low for static equipment)
      alerts: 0,
    },
  ];
};