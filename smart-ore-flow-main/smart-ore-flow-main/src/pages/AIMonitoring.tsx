import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { 
  Activity, 
  AlertTriangle
} from "lucide-react";
import SensorDataGrid from "@/components/ai-monitoring/SensorDataGrid";
import AIFeaturesSection from "@/components/ai-monitoring/AIFeaturesSection";
import ControlServiceSection from "@/components/ai-monitoring/ControlServiceSection";
import type { SensorData, AIFeatures, ControlServiceStatus } from "@/components/ai-monitoring/types";

// FastAPI Backend URL - Use proxy to avoid CORS and browser extension blocking
// In development, Vite proxy routes /api/* to http://localhost:8000/*
const API_BASE_URL = import.meta.env.DEV ? "/api" : "http://localhost:8000";
// ML Service URL (port 8001) - Use proxy to avoid CORS issues
// In development, Vite proxy routes /ml-api/* to http://localhost:8001/*
const ML_SERVICE_URL = import.meta.env.DEV ? "/ml-api" : "http://localhost:8001";
const DEVICE_ID = "crusher_01";

const AIMonitoring = () => {
  const [sensorData, setSensorData] = useState<SensorData[] | null>(null);
  const [sensorLoading, setSensorLoading] = useState(true);
  const [sensorError, setSensorError] = useState<Error | null>(null);
  
  // Speed Control Service state
  const [controlStatus, setControlStatus] = useState<ControlServiceStatus | null>(null);
  const [controlLoading, setControlLoading] = useState(false);
  const [controlError, setControlError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  
  // Fetch sensor data with auto-refresh (no flickering - only show loading on initial load)
  const sensorInitialLoad = useRef(true);
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        // Only show loading spinner on initial load
        if (sensorInitialLoad.current) {
          setSensorLoading(true);
        }
        const response = await fetch(`${API_BASE_URL}/timeseries/${DEVICE_ID}?limit=1&_t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!response.ok) throw new Error("Failed to fetch sensor data");
        const data = await response.json();
        const result = Array.isArray(data) ? data : [data];
        // Log received data for debugging (only first few times)
        if (result.length > 0) {
          const latest = result[0];
          if (sensorInitialLoad.current) {
            console.log('Received sensor data (full):', latest);
            console.log('Field values:', {
              motor_current_a: latest.motor_current_a,
              vibration: latest.vibration,
              temperature_c: latest.temperature_c,
              ore_fines_pct: latest.ore_fines_pct,
              hardness_index: latest.hardness_index
            });
          }
          // Check if critical fields are null/undefined and log warning
          const missingFields = [];
          if (latest.motor_current_a == null) missingFields.push('motor_current_a');
          if (latest.vibration == null) missingFields.push('vibration');
          if (latest.temperature_c == null) missingFields.push('temperature_c');
          if (latest.ore_fines_pct == null) missingFields.push('ore_fines_pct');
          if (latest.hardness_index == null) missingFields.push('hardness_index');
          if (missingFields.length > 0) {
            console.warn('⚠️ Missing/null fields in received data:', missingFields, '- These will display as 0. Check if data pipeline is writing all fields to InfluxDB.');
          }
        }
        setSensorData(result);
        setSensorError(null);
        sensorInitialLoad.current = false;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setSensorError(err);
        console.error('Error fetching sensor data:', err);
      } finally {
        setSensorLoading(false);
      }
    };

    // Initial fetch
    fetchSensorData();
    // Set up polling every 3 seconds (matches simulated data interval)
    const interval = setInterval(fetchSensorData, 3000);
    return () => clearInterval(interval);
  }, []);


  // Fetch AI features with auto-refresh (no flickering)
  const [aiFeatures, setAiFeatures] = useState<AIFeatures | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const aiInitialLoad = useRef(true);
  
  useEffect(() => {
    const fetchAIFeatures = async () => {
      try {
        // Only show loading spinner on initial load
        if (aiInitialLoad.current) {
          setAiLoading(true);
        }
        const response = await fetch(`${API_BASE_URL}/ai/features/${DEVICE_ID}?_t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!response.ok) throw new Error("Failed to fetch AI features");
        const data = await response.json();
        setAiFeatures(data);
        aiInitialLoad.current = false;
      } catch (error) {
        console.error('Error fetching AI features:', error);
      } finally {
        setAiLoading(false);
      }
    };

    fetchAIFeatures();
    // Poll every 3 seconds (matches sensor data interval)
    const interval = setInterval(fetchAIFeatures, 3000);
    return () => clearInterval(interval);
  }, []);

  // Get latest sensor reading - memoized
  const latestData = useMemo((): SensorData | null => {
    if (!sensorData || sensorData.length === 0) return null;
    const first = sensorData[0];
    return first ?? null;
  }, [sensorData]);

  // Use AI predictions from backend (ML Service) - memoized
  const optimalRPM = useMemo(() => {
    return aiFeatures?.optimal_rpm_recommendation || null;
  }, [aiFeatures?.optimal_rpm_recommendation]);

  const rpmDifference = useMemo(() => {
    if (!latestData || !optimalRPM) return 0;
    return optimalRPM - (latestData.rpm ?? 0);
  }, [latestData, optimalRPM]);
  
  // Get ore hardness prediction from AI - memoized
  const oreHardness = useMemo(() => {
    return aiFeatures?.ore_hardness_prediction || "unknown";
  }, [aiFeatures?.ore_hardness_prediction]);

  const oreConfidence = useMemo(() => {
    return aiFeatures?.ore_hardness_confidence || 0;
  }, [aiFeatures?.ore_hardness_confidence]);

  // Fetch Control Service Status (manual refresh only - no auto-loading)
  const controlInitialLoad = useRef(true);
  useEffect(() => {
    const fetchControlStatus = async () => {
      try {
        // Only show loading spinner on initial load
        if (controlInitialLoad.current) {
          setControlLoading(true);
        }
        const response = await fetch(`${ML_SERVICE_URL}/api/v1/control/status/${DEVICE_ID}?_t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!response.ok) {
          // Service might not be started yet, that's OK
          setControlStatus(null);
          return;
        }
        const data = await response.json();
        // Normalize response format - handle both "running" and "is_running"
        const normalizedData: ControlServiceStatus = {
          ...data,
          is_running: data.is_running ?? data.running ?? false,
          // Normalize integration status
          integration: data.integration ? {
            monitoring: data.integration.monitor?.running ?? false,
            predictions: data.integration.pipeline?.cached_predictions_count !== undefined
          } : undefined
        };
        setControlStatus(normalizedData);
        setControlError(null);
        controlInitialLoad.current = false;
      } catch (error) {
        // Service might not be running, that's OK
        setControlStatus(null);
        console.error('Error fetching control status:', error);
      } finally {
        setControlLoading(false);
      }
    };

    // Only fetch on mount, no auto-refresh
    fetchControlStatus();
  }, []);

  // Start Control Service - memoized with useCallback
  const handleStartControl = useCallback(async () => {
    setIsStarting(true);
    setControlError(null);
    try {
      const response = await fetch(`${ML_SERVICE_URL}/api/v1/control/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: DEVICE_ID,
          analysis_interval: 30.0,
          poll_interval: 5.0,
          enable_automatic_control: true,
          min_confidence: 0.7
        })
      });
      
      // Always try to parse response, even if status is not OK
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        // If JSON parsing fails, check if it's a network error
        if (!response.ok) {
          throw new Error('Cannot connect to ML service. Please ensure the ML service is running on port 8001.');
        }
        responseData = {
          status: "started",
          device_id: DEVICE_ID,
          message: "Service started"
        };
      }
      
      // If response indicates success (status: "started" or "already_running"), treat as success
      if (responseData.status === "started" || responseData.status === "already_running") {
        // Clear any previous errors
        setControlError(null);
        // Refresh status after starting
        setTimeout(async () => {
          try {
            const statusResponse = await fetch(`${ML_SERVICE_URL}/api/v1/control/status/${DEVICE_ID}`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              setControlStatus(statusData);
            }
          } catch (e) {
            console.error('Error refreshing status:', e);
          }
        }, 1000);
      } else if (!response.ok) {
        // Only show error if status is explicitly "error" or response is not OK
        const errorMessage = responseData.detail || responseData.message || 'Failed to start service';
        setControlError(errorMessage);
      } else {
        // Response OK but status field might be missing - treat as success
        setControlError(null);
        setTimeout(async () => {
          try {
            const statusResponse = await fetch(`${ML_SERVICE_URL}/api/v1/control/status/${DEVICE_ID}`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              setControlStatus(statusData);
            }
          } catch (e) {
            console.error('Error refreshing status:', e);
          }
        }, 1000);
      }
    } catch (error) {
      // Network error or other exception
      const errorMessage = error instanceof Error ? error.message : 'Failed to start control service';
      // Check if it's a network error (ML service might not be running)
      if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setControlError('Cannot connect to ML service. Please ensure the ML service is running on port 8001.');
      } else {
        setControlError(errorMessage);
      }
      console.error('Error starting control service:', error);
    } finally {
      setIsStarting(false);
    }
  }, []);

  // Stop Control Service - memoized with useCallback
  const handleStopControl = useCallback(async () => {
    setIsStopping(true);
    setControlError(null);
    try {
      const response = await fetch(`${ML_SERVICE_URL}/api/v1/control/stop/${DEVICE_ID}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to stop service' }));
        throw new Error(errorData.detail || 'Failed to stop service');
      }
      
      // Refresh status after stopping
      setTimeout(() => {
        const fetchStatus = async () => {
          try {
            const statusResponse = await fetch(`${ML_SERVICE_URL}/api/v1/control/status/${DEVICE_ID}`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              setControlStatus(statusData);
            } else {
              setControlStatus(null);
            }
          } catch (e) {
            setControlStatus(null);
            console.error('Error refreshing status:', e);
          }
        };
        fetchStatus();
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop control service';
      setControlError(errorMessage);
      console.error('Error stopping control service:', error);
    } finally {
      setIsStopping(false);
    }
  }, []);

  // Format timestamp - memoized with useCallback
  const formatTimestamp = useCallback((ts: number): string => {
    return new Date(ts * 1000).toLocaleTimeString();
  }, []);

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 pb-12 bg-gradient-to-br from-background via-background to-muted/30 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-3xl blur-2xl" />
        <Card className="relative p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#26436C' }}>
                AI Monitoring - Real-Time Speed Control
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 animate-pulse text-green-500" />
                <span>Real-time monitoring based on feed material characteristics</span>
                {latestData && (
                  <span className="text-xs text-green-600 ml-2">
                    Last update: {formatTimestamp(latestData.ts)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Error Display */}
      {sensorError && (
        <Card className="p-4 border-red-500 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span>Error connecting to backend: {sensorError instanceof Error ? sensorError.message : 'Unknown error'}</span>
            <span className="text-sm text-muted-foreground">Make sure FastAPI is running on {API_BASE_URL}</span>
          </div>
        </Card>
      )}

      {/* Real-Time Data Container */}
      {sensorLoading ? (
        <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="ml-4 text-muted-foreground">Loading sensor data...</span>
          </div>
        </Card>
      ) : latestData ? (
        <SensorDataGrid
          latestData={latestData}
          optimalRPM={optimalRPM}
          rpmDifference={rpmDifference}
          formatTimestamp={formatTimestamp}
        />
      ) : (
        <Card className="p-6 shadow-lg">
          <div className="text-center py-12 text-muted-foreground">
            No sensor data available. Make sure the data pipeline is running.
          </div>
        </Card>
      )}

      {/* AI Features & Speed Control */}
      <div className="grid grid-cols-1 gap-6">
        <AIFeaturesSection
          aiFeatures={aiFeatures}
          aiLoading={aiLoading}
          optimalRPM={optimalRPM}
          rpmDifference={rpmDifference}
          latestData={latestData}
          oreHardness={oreHardness}
          oreConfidence={oreConfidence}
        />
      </div>

      {/* Speed Control Service Container */}
      <ControlServiceSection
        controlStatus={controlStatus}
        controlLoading={controlLoading}
        controlError={controlError}
        isStarting={isStarting}
        isStopping={isStopping}
        onStart={handleStartControl}
        onStop={handleStopControl}
      />

      {/* Raw JSON Data (for debugging) */}
      {latestData && (
        <Card className="p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4" style={{ color: '#26436C' }}>
            Raw Sensor Data (JSON)
          </h3>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
            {JSON.stringify(latestData, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default AIMonitoring;

