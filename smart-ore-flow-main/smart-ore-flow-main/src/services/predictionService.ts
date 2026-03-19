/**
 * Prediction Service - ML Model Integration
 * Handles predictions from trained models and displays them in the UI
 */

export interface Prediction {
  id: string;
  type: 'equipment_failure' | 'energy_optimization' | 'production_forecast' | 'maintenance_schedule' | 'quality_prediction';
  timestamp: number;
  confidence: number; // 0-1
  prediction: any;
  recommendations?: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ModelMetrics {
  modelId: string;
  modelName: string;
  version: string;
  accuracy: number;
  lastUpdated: number;
  status: 'active' | 'training' | 'deployed' | 'error';
}

class PredictionService {
  private predictions: Map<string, Prediction> = new Map();
  private modelMetrics: Map<string, ModelMetrics> = new Map();
  private subscribers: Set<(predictions: Prediction[]) => void> = new Set();

  /**
   * Process prediction from MQTT or API
   */
  processPrediction(prediction: Prediction): void {
    this.predictions.set(prediction.id, prediction);
    this.notifySubscribers();
    console.log('📊 New prediction received:', prediction);
  }

  /**
   * Get all predictions
   */
  getPredictions(): Prediction[] {
    return Array.from(this.predictions.values());
  }

  /**
   * Get predictions by type
   */
  getPredictionsByType(type: Prediction['type']): Prediction[] {
    return this.getPredictions().filter(p => p.type === type);
  }

  /**
   * Get latest prediction
   */
  getLatestPrediction(type?: Prediction['type']): Prediction | null {
    const predictions = type 
      ? this.getPredictionsByType(type)
      : this.getPredictions();
    
    if (predictions.length === 0) {
      return null;
    }

    return predictions.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
  }

  /**
   * Get predictions with high confidence
   */
  getHighConfidencePredictions(threshold: number = 0.8): Prediction[] {
    return this.getPredictions().filter(p => p.confidence >= threshold);
  }

  /**
   * Get critical predictions
   */
  getCriticalPredictions(): Prediction[] {
    return this.getPredictions().filter(p => 
      p.severity === 'critical' || p.severity === 'high'
    );
  }

  /**
   * Update model metrics
   */
  updateModelMetrics(metrics: ModelMetrics): void {
    this.modelMetrics.set(metrics.modelId, metrics);
    console.log('📈 Model metrics updated:', metrics);
  }

  /**
   * Get model metrics
   */
  getModelMetrics(modelId?: string): ModelMetrics | ModelMetrics[] | null {
    if (modelId) {
      return this.modelMetrics.get(modelId) || null;
    }
    return Array.from(this.modelMetrics.values());
  }

  /**
   * Subscribe to prediction updates
   */
  subscribe(callback: (predictions: Prediction[]) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current predictions
    callback(this.getPredictions());

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify subscribers of prediction updates
   */
  private notifySubscribers(): void {
    const predictions = this.getPredictions();
    this.subscribers.forEach(callback => {
        try {
          callback(predictions);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('❌ Error in prediction callback:', errorMessage);
        }
    });
  }

  /**
   * Clear old predictions (older than specified time)
   */
  clearOldPredictions(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.predictions.forEach((prediction, id) => {
      if (now - prediction.timestamp > maxAge) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => this.predictions.delete(id));
    
    if (toDelete.length > 0) {
      console.log(`🗑️ Cleared ${toDelete.length} old predictions`);
      this.notifySubscribers();
    }
  }

  /**
   * Format prediction for display
   */
  formatPrediction(prediction: Prediction): {
    title: string;
    description: string;
    icon: string;
    color: string;
  } {
    const formats: Record<Prediction['type'], { title: string; icon: string; color: string }> = {
      equipment_failure: {
        title: 'Equipment Failure Prediction',
        icon: '⚠️',
        color: 'text-red-500',
      },
      energy_optimization: {
        title: 'Energy Optimization',
        icon: '⚡',
        color: 'text-yellow-500',
      },
      production_forecast: {
        title: 'Production Forecast',
        icon: '📈',
        color: 'text-blue-500',
      },
      maintenance_schedule: {
        title: 'Maintenance Schedule',
        icon: '🔧',
        color: 'text-green-500',
      },
      quality_prediction: {
        title: 'Quality Prediction',
        icon: '✨',
        color: 'text-purple-500',
      },
    };

    const format = formats[prediction.type];
    const description = prediction.recommendations?.join(', ') || 'No recommendations available';

    return {
      ...format,
      description,
    };
  }
}

// Export singleton instance
export const predictionService = new PredictionService();

