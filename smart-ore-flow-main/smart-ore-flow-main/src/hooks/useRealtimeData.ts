/**
 * React Hook for Real-Time Data
 * 
 * Provides real-time data from MQTT or falls back to mock data.
 * Automatically handles connection status and error states.
 * 
 * @module useRealtimeData
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { dataService } from '@/services/dataService';
import { generateMiningMetrics, generateEquipmentStatus, getRandomOreType, getTimeOfDay } from '@/lib/mockData';
import type { MiningMetrics, EquipmentStatus } from '@/lib/mockData';

export interface UseRealtimeDataOptions {
  dataType: 'metrics' | 'equipment' | 'energy' | 'weather';
  updateInterval?: number; // For mock data polling
}

/**
 * Hook for real-time mining metrics
 * 
 * Fetches and updates mining metrics at specified intervals (mock data)
 * or subscribes to real-time MQTT updates.
 * 
 * @param {number} updateInterval - Update interval in milliseconds (default: 5000ms)
 * @returns {Object} Object containing metrics, loading state, and error
 * 
 * @example
 * ```typescript
 * const { metrics, isLoading, error } = useRealtimeMetrics(5000);
 * 
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error.message} />;
 * 
 * return <MetricsDisplay data={metrics} />;
 * ```
 */
export function useRealtimeMetrics(updateInterval: number = 5000) {
  const [metrics, setMetrics] = useState<MiningMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const updateMetrics = () => {
      try {
        if (dataService.isUsingMockData()) {
          // Generate mock data
          const oreType = getRandomOreType();
          const timeOfDay = getTimeOfDay();
          const conditions: ("good" | "fair" | "poor")[] = ["good", "good", "good", "fair", "poor"];
          const condition = conditions[Math.floor(Math.random() * conditions.length)];
          const newMetrics = generateMiningMetrics(oreType, timeOfDay, condition);
          setMetrics(newMetrics);
          setIsLoading(false);
        } else {
          // Subscribe to real-time data
          unsubscribe = dataService.subscribe('metrics', (data: MiningMetrics) => {
            setMetrics(data);
            setIsLoading(false);
            setError(null);
          });
        }
      } catch (error: unknown) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        console.error('Error updating metrics:', errorObj.message);
        setError(errorObj);
        setIsLoading(false);
      }
    };

    // Initial load
    updateMetrics();

    // Set up polling for mock data
    if (dataService.isUsingMockData()) {
      intervalRef.current = setInterval(updateMetrics, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [updateInterval]);

  return { metrics, isLoading, error };
}

/**
 * Hook for real-time equipment status
 */
export function useRealtimeEquipment(updateInterval: number = 8000) {
  const [equipment, setEquipment] = useState<EquipmentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const updateEquipment = () => {
      try {
        if (dataService.isUsingMockData()) {
          // Generate mock data
          const newEquipment = generateEquipmentStatus();
          setEquipment(newEquipment);
          setIsLoading(false);
        } else {
          // Subscribe to real-time data
          unsubscribe = dataService.subscribe('equipment', (data: EquipmentStatus[]) => {
            setEquipment(data);
            setIsLoading(false);
            setError(null);
          });
        }
      } catch (error: unknown) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        console.error('Error updating equipment:', errorObj.message);
        setError(errorObj);
        setIsLoading(false);
      }
    };

    // Initial load
    updateEquipment();

    // Set up polling for mock data
    if (dataService.isUsingMockData()) {
      intervalRef.current = setInterval(updateEquipment, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [updateInterval]);

  return { equipment, isLoading, error };
}

/**
 * Hook for real-time energy data
 */
interface EnergyData {
  consumption: number;
  efficiency: number;
  timestamp: number;
  [key: string]: string | number | boolean | null | undefined;
}

export function useRealtimeEnergy() {
  const [energyData, setEnergyData] = useState<EnergyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (dataService.isUsingMockData()) {
      // Mock energy data
      setEnergyData({
        consumption: Math.random() * 1000 + 500,
        efficiency: Math.random() * 20 + 80,
        timestamp: Date.now(),
      });
      setIsLoading(false);
    } else {
      // Subscribe to real-time data
      unsubscribe = dataService.subscribe('energy', (data: EnergyData) => {
        setEnergyData(data);
        setIsLoading(false);
        setError(null);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { energyData, isLoading, error };
}

/**
 * Hook for real-time weather data
 */
interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  [key: string]: string | number | boolean | null | undefined;
}

export function useRealtimeWeather() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (dataService.isUsingMockData()) {
      // Mock weather data would be generated here
      setIsLoading(false);
    } else {
      // Subscribe to real-time data
      unsubscribe = dataService.subscribe('weather', (data: WeatherData) => {
        setWeatherData(data);
        setIsLoading(false);
        setError(null);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { weatherData, isLoading, error };
}

/**
 * Hook to get connection status
 */
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(dataService.getConnectionStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(dataService.getConnectionStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { isConnected, isUsingMockData: dataService.isUsingMockData() };
}

