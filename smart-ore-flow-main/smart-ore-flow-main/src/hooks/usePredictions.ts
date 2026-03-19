/**
 * React Hook for ML Predictions
 * 
 * Provides real-time predictions from trained ML models.
 * Subscribes to MQTT prediction topics or uses mock data.
 * 
 * @module usePredictions
 */

import { useState, useEffect } from 'react';
import { predictionService, type Prediction } from '@/services/predictionService';
import { dataService } from '@/services/dataService';
import { realtimeService, type RealtimeData } from '@/lib/realtimeService';
import type { MQTTMessage } from '@/services/mqttService';

// Lazy load mqttService to prevent Vite from analyzing it when mqtt package is not installed
async function getMQTTService() {
  try {
    const module = await import(/* @vite-ignore */ '@/services/mqttService');
    return { mqttService: module.mqttService, MQTT_TOPICS: module.MQTT_TOPICS };
  } catch (error) {
    console.warn('⚠️ Could not load MQTT service:', error);
    return null;
  }
}

/**
 * Hook for real-time predictions
 */
export function usePredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Subscribe to prediction updates
    const unsubscribe = predictionService.subscribe((newPredictions) => {
      setPredictions(newPredictions);
      setIsLoading(false);
      setError(null);
    });

    // Subscribe to real-time predictions via WebSocket/SSE
    const unsubscribeRealtime = realtimeService.subscribe('prediction', (data: RealtimeData) => {
      try {
        const predictionData = data.data;
        const prediction: Prediction = {
          id: (predictionData['id'] as string) || `pred-${Date.now()}`,
          type: (predictionData['type'] as Prediction['type']) || 'equipment_failure',
          timestamp: data.timestamp.getTime(),
          confidence: (predictionData['confidence'] as number) || 0.5,
          prediction: predictionData['prediction'] || predictionData,
          recommendations: predictionData['recommendations'] as string[] | undefined,
          severity: (predictionData['severity'] as Prediction['severity']) || 'medium',
        };
        predictionService.processPrediction(prediction);
      } catch (error: unknown) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        console.error('❌ Error processing real-time prediction:', errorObj.message);
        setError(errorObj);
      }
    });

    // Subscribe to MQTT predictions topic if not using mock data
    if (!dataService.isUsingMockData()) {
      getMQTTService().then((mqtt) => {
        if (mqtt) {
          mqtt.mqttService.subscribe(mqtt.MQTT_TOPICS.PREDICTIONS, (message: MQTTMessage) => {
            try {
              const prediction = JSON.parse(message.payload as string) as Prediction;
              predictionService.processPrediction(prediction);
            } catch (error: unknown) {
              const errorObj = error instanceof Error ? error : new Error(String(error));
              console.error('❌ Error parsing prediction:', errorObj.message);
              setError(errorObj);
            }
          });
        }
      }).catch((error) => {
        console.warn('⚠️ Could not subscribe to MQTT predictions:', error);
      });
    }

    // Cleanup old predictions periodically
    const cleanupInterval = setInterval(() => {
      predictionService.clearOldPredictions();
    }, 60 * 60 * 1000); // Every hour

    return () => {
      unsubscribe();
      unsubscribeRealtime();
      clearInterval(cleanupInterval);
    };
  }, []);

  return { predictions, isLoading, error };
}

/**
 * Hook for predictions by type
 */
export function usePredictionsByType(type: Prediction['type']) {
  const { predictions, isLoading, error } = usePredictions();
  const filteredPredictions = predictions.filter(p => p.type === type);

  return { predictions: filteredPredictions, isLoading, error };
}

/**
 * Hook for critical predictions
 */
export function useCriticalPredictions() {
  const { predictions, isLoading, error } = usePredictions();
  const criticalPredictions = predictions.filter(p => 
    p.severity === 'critical' || p.severity === 'high'
  );

  return { predictions: criticalPredictions, isLoading, error };
}

/**
 * Hook for latest prediction
 */
export function useLatestPrediction(type?: Prediction['type']) {
  const { predictions, isLoading, error } = usePredictions();
  
  const latest = predictions.length > 0
    ? predictions.reduce((latest, current) => 
        current.timestamp > latest.timestamp ? current : latest
      )
    : null;

  const filteredLatest = type && latest
    ? (latest.type === type ? latest : null)
    : latest;

  return { prediction: filteredLatest, isLoading, error };
}

