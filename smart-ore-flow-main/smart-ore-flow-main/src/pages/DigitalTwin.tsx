import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Box, 
  TrendingDown, 
  Zap, 
  Activity, 
  AlertTriangle, 
  AlertCircle,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Clock,
  Gauge,
  Package,
  Settings,
  Save,
  RotateCcw,
  Play,
  Pause,
  Radio,
  Table2,
  List,
  Monitor,
  Thermometer
} from "lucide-react";
import { useState, useEffect } from "react";
import { generateEquipmentStatus } from "@/lib/mockData";
import { AlertsFeed } from "@/components/AlertsFeed";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { realtimeService, RealtimeData } from "@/lib/realtimeService";
import { validateEquipmentData, sanitizeEquipmentData } from "@/lib/deviceDataValidator";
import { deviceRegistry } from "@/lib/deviceRegistry";
import { usePredictions } from "@/hooks/usePredictions";
import { Sparkles, Lightbulb } from "lucide-react";

// Parameter configuration interface
interface ProcessParameters {
  [stepId: number]: {
    [key: string]: string | number;
  };
}

const DigitalTwin = () => {
  const [equipmentData, setEquipmentData] = useState(generateEquipmentStatus());
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [selectedProcessStep, setSelectedProcessStep] = useState<number | null>(null);
  const [showProcessGuide, setShowProcessGuide] = useState(true);
  const [showParameterConfig, setShowParameterConfig] = useState(false);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [_simulationResults, setSimulationResults] = useState<{[stepId: number]: any}>({});
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [stepStatuses, setStepStatuses] = useState<{[stepId: number]: 'active' | 'inactive' | 'emergency'}>(() => {
    const initialStatuses: {[stepId: number]: 'active' | 'inactive' | 'emergency'} = {};
    for (let i = 1; i <= 5; i++) {
      initialStatuses[i] = 'inactive';
    }
    return initialStatuses;
  });

  const [, setHistoricalData] = useState<Map<number, Array<{
    timestamp: Date;
    metrics: Record<string, string | number | boolean | null | undefined>;
  }>>>(new Map());

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [registeredDevices, setRegisteredDevices] = useState(deviceRegistry.getAllDevices());
  
  // Subscribe to AI predictions
  const { predictions } = usePredictions();
  
  // Store AI recommendations for each step
  const [aiRecommendations, setAIRecommendations] = useState<{
    [stepId: number]: {
      parameterRecommendations?: { [paramKey: string]: { recommended: number; reason: string; impact?: string } };
      failurePrediction?: { timeToFailure: string; severity: 'low' | 'medium' | 'high' | 'critical'; confidence: number };
      recommendations?: string[];
    };
  }>({});
  
  // Process AI predictions and map to process steps
  useEffect(() => {
    const stepRecommendations: typeof aiRecommendations = {};
    
    predictions.forEach((prediction) => {
      const predictionData = prediction.prediction as any;
      const stepId = predictionData?.stepId || predictionData?.equipmentId;
      
      if (stepId && stepId >= 1 && stepId <= 5) {
        if (!stepRecommendations[stepId]) {
          stepRecommendations[stepId] = {};
        }
        
        // Extract parameter recommendations
        if (predictionData?.parameterRecommendations) {
          stepRecommendations[stepId].parameterRecommendations = predictionData.parameterRecommendations;
        }
        
        // Extract failure predictions
        if (prediction.type === 'equipment_failure' && predictionData?.timeToFailure) {
          stepRecommendations[stepId].failurePrediction = {
            timeToFailure: predictionData.timeToFailure,
            severity: prediction.severity || 'medium',
            confidence: prediction.confidence,
          };
        }
        
        // Extract general recommendations
        if (prediction.recommendations && prediction.recommendations.length > 0) {
          stepRecommendations[stepId].recommendations = prediction.recommendations;
        }
      }
    });
    
    setAIRecommendations(stepRecommendations);
  }, [predictions]);

  // Subscribe to real-time digital twin data
  useEffect(() => {
    // Try to connect to real-time service
    const wsUrl = import.meta.env['VITE_WS_URL'];
    const sseUrl = import.meta.env['VITE_SSE_URL'];

    if (wsUrl) {
      realtimeService.connectWebSocket(wsUrl);
    } else if (sseUrl) {
      realtimeService.connectSSE(sseUrl);
    }

    // Subscribe to process step updates
    const unsubscribeProcess = realtimeService.subscribe('process', (data) => {
      // Update process step metrics if data received
      if (data.data['stepId'] && data.data['metrics']) {
        // This could update the defaultMetrics for process steps
        // For now, we'll keep the parameter-based system
      }
    });

    // Subscribe to equipment updates with validation
    const unsubscribeEquipment = realtimeService.subscribe('equipment', (data: RealtimeData) => {
      try {
        const validation = validateEquipmentData(data.data);
        
        if (!validation.valid) {
          console.warn('[DigitalTwin] Invalid equipment data received, sanitizing...', data.deviceId);
          const sanitized = sanitizeEquipmentData(data.data as Record<string, unknown>);
          data.data = sanitized as Record<string, string | number | boolean | null | undefined>;
        }

        setConnectionError(null);
        
        setEquipmentData(prev => {
          const index = prev.findIndex(eq => eq.id === data.deviceId);
          if (index >= 0) {
            const updated = [...prev];
            const existing = updated[index];
            const newData = data.data;
            if (existing && newData) {
              const idValue = newData['id'];
              const nameValue = newData['name'];
              const statusValue = newData['status'];
              const loadValue = newData['load'];
              const tempValue = newData['temperature'];
              const vibValue = newData['vibration'];
              const alertsValue = newData['alerts'];
              
              updated[index] = {
                ...existing,
                ...(idValue && typeof idValue === 'string' ? { id: idValue } : {}),
                ...(nameValue && typeof nameValue === 'string' ? { name: nameValue } : {}),
                ...(statusValue && typeof statusValue === 'string' ? { status: statusValue as 'online' | 'warning' | 'maintenance' } : {}),
                ...(loadValue !== undefined && typeof loadValue === 'number' ? { load: loadValue } : {}),
                ...(tempValue !== undefined && typeof tempValue === 'number' ? { temperature: tempValue } : {}),
                ...(vibValue !== undefined && typeof vibValue === 'number' ? { vibration: vibValue } : {}),
                ...(alertsValue !== undefined && typeof alertsValue === 'number' ? { alerts: alertsValue } : {}),
              };
            }
            return updated;
          }
          return prev;
        });
        
        if (data.data['status']) {
          const stepId = parseInt(data.deviceId.replace(/\D/g, '')) || 0;
          if (stepId > 0 && stepId <= 5) {
            let newStatus: 'active' | 'inactive' | 'emergency' = 'active';
            const status = String(data.data['status']).toLowerCase();
            
            if (status === 'stopped' || status === 'idle' || status === 'offline' || status === 'maintenance' || status === 'standby') {
              newStatus = 'inactive';
            } else if (status === 'fault' || status === 'error' || status === 'emergency' || status === 'critical' || status === 'failure' || status === 'alarm') {
              newStatus = 'emergency';
            } else if (status === 'active' || status === 'online' || status === 'running' || status === 'operational') {
              newStatus = 'active';
            }
            
            setStepStatuses(prev => ({
              ...prev,
              [stepId]: newStatus
            }));

            setHistoricalData(prev => {
              const existing = prev.get(stepId) || [];
              const updated = [...existing, {
                timestamp: new Date(),
                metrics: data.data as Record<string, string | number | boolean | null | undefined>,
              }].slice(-100);
              return new Map(prev).set(stepId, updated);
            });
          }
        }
      } catch (error) {
        console.error('[DigitalTwin] Error processing equipment data:', error);
        setConnectionError(error instanceof Error ? error.message : 'Unknown error processing equipment data');
      }
    });

    // Subscribe to device registry updates
    const unsubscribeRegistry = deviceRegistry.subscribe((devices) => {
      setRegisteredDevices(devices);
    });

    // Check connection status
    const statusInterval = setInterval(() => {
      setIsRealtimeConnected(realtimeService.getConnectionStatus());
    }, 1000);

    // Subscribe to connection status changes
    const unsubscribeConnection = realtimeService.subscribe('connection', (data: RealtimeData) => {
      if (data.data['status'] === 'connected') {
        setConnectionError(null);
      } else if (data.data['status'] === 'disconnected' || data.data['status'] === 'error') {
        setConnectionError('Connection lost. Attempting to reconnect...');
      }
    });

    return () => {
      unsubscribeProcess();
      unsubscribeEquipment();
      unsubscribeRegistry();
      unsubscribeConnection();
      clearInterval(statusInterval);
    };
  }, []);
  
  // Store user-configured parameters for each process step (applied values)
  const [processParameters, setProcessParameters] = useState<ProcessParameters>({});
  
  // Store pending parameter changes (before applying)
  // Initialize with applied parameters so editing works immediately
  const [pendingParameters, setPendingParameters] = useState<ProcessParameters>(() => {
    // Initialize with empty object - users can start editing immediately
    return {};
  });
  
  // Default parameter definitions for each step
  const parameterDefinitions = {
    1: [ // Hopper
      { key: 'feedRate', label: 'Feed Rate (tph)', type: 'number', default: '1200', unit: 'tph' },
      { key: 'level', label: 'Level (%)', type: 'number', default: '75', unit: '%' },
      { key: 'capacity', label: 'Capacity (tons)', type: 'number', default: '500', unit: 'tons' }
    ],
    2: [ // Vibrating Feeder
      { key: 'feedRate', label: 'Feed Rate (tph)', type: 'number', default: '1200', unit: 'tph' },
      { key: 'frequency', label: 'Frequency (Hz)', type: 'number', default: '50', unit: 'Hz' },
      { key: 'amplitude', label: 'Amplitude (mm)', type: 'number', default: '5', unit: 'mm' }
    ],
    3: [ // Gyratory Crusher
      { key: 'capacity', label: 'Capacity (tph)', type: 'number', default: '1200', unit: 'tph' },
      { key: 'power', label: 'Power (kW)', type: 'number', default: '1200', unit: 'kW' },
      { key: 'reductionRatio', label: 'Reduction Ratio', type: 'number', default: '5', unit: ':1' }
    ],
    4: [ // Conveyor Belt
      { key: 'speed', label: 'Speed (m/s)', type: 'number', default: '2.5', unit: 'm/s' },
      { key: 'capacity', label: 'Capacity (tph)', type: 'number', default: '1200', unit: 'tph' },
      { key: 'length', label: 'Length (m)', type: 'number', default: '150', unit: 'm' }
    ],
    5: [ // Secondary Crusher
      { key: 'capacity', label: 'Capacity (tph)', type: 'number', default: '1200', unit: 'tph' },
      { key: 'power', label: 'Power (kW)', type: 'number', default: '800', unit: 'kW' },
      { key: 'reductionRatio', label: 'Reduction Ratio', type: 'number', default: '3', unit: ':1' }
    ]
  };

  // Process steps data - Detailed written descriptions matching simulation flow
  const processSteps = [
    {
      id: 1,
      title: "Hopper",
      icon: Package,
      description: "Raw ore storage and initial feed point",
      details: "The hopper serves as the primary storage and feed point for raw iron ore. It receives ore from mining operations and provides controlled discharge to the downstream processing equipment. The hopper is designed with a capacity to handle surge loads and ensure continuous feed to the vibrating feeder. Material is stored at an optimal angle to prevent bridging and ensure smooth flow.",
      equipment: ["Storage Hopper", "Level Sensors", "Discharge Gate"],
      defaultMetrics: [
        { label: "Capacity", value: "500 tons", icon: Package },
        { label: "Feed Rate", value: "1,200 tph", icon: TrendingDown },
        { label: "Level", value: "75%", icon: Gauge }
      ],
      duration: "Continuous",
      status: "active",
      output: "Raw ore feed (1,200 tph)"
    },
    {
      id: 2,
      title: "Vibrating Feeder",
      icon: Activity,
      description: "Controlled material feeding with vibration",
      details: "The vibrating feeder receives material from the hopper and provides controlled, uniform feed to the gyratory crusher. It uses electromagnetic or mechanical vibration to ensure consistent material flow and prevent blockages. The feeder can be adjusted to control feed rate, ensuring optimal crusher performance and preventing overloading. Vibration frequency and amplitude are optimized for iron ore characteristics.",
      equipment: ["Vibrating Feeder", "Feed Rate Controller", "Vibration Motor"],
      defaultMetrics: [
        { label: "Feed Rate", value: "1,200 tph", icon: TrendingDown },
        { label: "Frequency", value: "50 Hz", icon: Activity },
        { label: "Amplitude", value: "5 mm", icon: Gauge }
      ],
      duration: "Continuous",
      status: "active",
      output: "Controlled feed (1,200 tph)"
    },
    {
      id: 3,
      title: "Gyratory Crusher",
      icon: Box,
      description: "Primary size reduction of large ore pieces",
      details: "The gyratory crusher performs primary crushing of raw iron ore, reducing large boulders (up to 1.5m) to smaller pieces (150-300mm). It operates with a gyrating motion that creates compressive forces to break down the ore. The crusher features a conical head that gyrates within a concave bowl, providing high capacity and efficient size reduction. The discharge setting can be adjusted to control product size distribution.",
      equipment: ["Gyratory Crusher", "Main Shaft", "Eccentric Assembly", "Discharge Setting"],
      defaultMetrics: [
        { label: "Capacity", value: "1,200 tph", icon: Activity },
        { label: "Power", value: "1,200 kW", icon: Zap },
        { label: "Reduction Ratio", value: "5:1", icon: TrendingDown }
      ],
      duration: "24/7 Operation",
      status: "active",
      output: "Crushed ore (150-300mm)"
    },
    {
      id: 4,
      title: "Conveyor Belt",
      icon: TrendingDown,
      description: "Material transport from primary crusher",
      details: "The conveyor belt transports crushed ore from the gyratory crusher to the secondary crusher. It operates at an optimized speed for material flow rate and features impact-resistant belting to handle sharp, abrasive iron ore particles. The conveyor includes safety systems, dust suppression, and monitoring equipment to ensure reliable operation and material tracking throughout the process.",
      equipment: ["Conveyor Belt", "Drive Motor", "Idlers", "Dust Suppression"],
      defaultMetrics: [
        { label: "Speed", value: "2.5 m/s", icon: Activity },
        { label: "Capacity", value: "1,200 tph", icon: TrendingDown },
        { label: "Length", value: "150 m", icon: Gauge }
      ],
      duration: "Continuous",
      status: "active",
      output: "Transported ore (1,200 tph)"
    },
    {
      id: 5,
      title: "Secondary Crusher",
      icon: Box,
      description: "Secondary size reduction for finer particles",
      details: "The secondary crusher performs further size reduction of the crushed ore from the primary crusher, reducing particle size from 150-300mm to 50-100mm. It operates with a different crushing mechanism optimized for secondary crushing, providing additional size reduction and better particle size distribution. The crusher can be adjusted to control the final product size for optimal downstream processing.",
      equipment: ["Secondary Crusher", "Crushing Chamber", "Adjustable Discharge", "Drive System"],
      defaultMetrics: [
        { label: "Capacity", value: "1,200 tph", icon: Activity },
        { label: "Power", value: "800 kW", icon: Zap },
        { label: "Reduction Ratio", value: "3:1", icon: TrendingDown }
      ],
      duration: "24/7 Operation",
      status: "active",
      output: "Secondary crushed ore (50-100mm)"
    }
  ];

  // Get current metrics for a step (user-configured or default)
  const getStepMetrics = (step: typeof processSteps[0]) => {
    const userParams = processParameters[step.id];
    if (!userParams || Object.keys(userParams).length === 0) return step.defaultMetrics;

    return step.defaultMetrics.map((metric, idx) => {
      const paramDef = parameterDefinitions[step.id as keyof typeof parameterDefinitions]?.[idx];
      if (!paramDef) return metric;

      const userValue = userParams[paramDef.key];
      if (userValue !== undefined && userValue !== null && userValue !== '') {
        // Format the value properly
        const numValue = typeof userValue === 'number' ? userValue : parseFloat(userValue.toString());
        if (!isNaN(numValue)) {
          // Format numbers with commas for large values
          const formattedValue = numValue >= 1000 ? numValue.toLocaleString() : numValue.toString();
          return {
            ...metric,
            value: `${formattedValue}${paramDef.unit ? ' ' + paramDef.unit : ''}`
          };
        }
      }
      return metric;
    });
  };

  // Get dynamic output for a step based on configured parameters
  const getStepOutput = (step: typeof processSteps[0]) => {
    const userParams = processParameters[step.id];
    
    // Debug: Log to see what parameters we have
    // console.log(`Step ${step.id} - userParams:`, userParams, 'processParameters:', processParameters);
    
    // If no parameters configured, return default output
    if (!userParams || Object.keys(userParams).length === 0) {
      return step.output;
    }

    // Helper to safely parse and format numbers
    const getParamValue = (key: string, defaultValue: number): number => {
      const value = userParams[key];
      if (value === undefined || value === null || value === '') {
        return defaultValue;
      }
      // Handle string values - remove any units or extra characters
      const strValue = value.toString().trim();
      // Extract number from string (handles cases like "1200 tph" -> 1200)
      const numMatch = strValue.match(/[\d.]+/);
      if (numMatch) {
        const parsed = parseFloat(numMatch[0]);
        return isNaN(parsed) ? defaultValue : parsed;
      }
      const parsed = typeof value === 'number' ? value : parseFloat(strValue);
      return isNaN(parsed) ? defaultValue : parsed;
    };

    // Helper to calculate energy savings percentage
    const calculateEnergySavings = (currentValue: number, defaultValue: number, isPower: boolean = false): number => {
      if (isPower) {
        // For power, lower is better (savings)
        const savings = ((defaultValue - currentValue) / defaultValue) * 100;
        return savings;
      } else {
        // For efficiency, higher is better
        const improvement = ((currentValue - defaultValue) / defaultValue) * 100;
        return improvement;
      }
    };

    // Helper to format energy metrics
    const formatEnergyOutput = (processOutput: string, energyConsumption: number, energySavings: number, power?: number): string => {
      const savingsText = energySavings > 0 
        ? `⚡ Energy Saved: ${energySavings.toFixed(1)}%` 
        : energySavings < 0 
        ? `⚠️ Energy Increase: ${Math.abs(energySavings).toFixed(1)}%`
        : `⚡ Energy: Baseline`;
      
      const powerText = power ? ` | Power: ${power >= 1000 ? (power / 1000).toFixed(1) + ' MW' : power.toFixed(0) + ' kW'}` : '';
      const consumptionText = ` | Consumption: ${energyConsumption.toFixed(1)} kWh/t`;
      
      return `${processOutput} | ${savingsText}${powerText}${consumptionText}`;
    };

    // Calculate output based on step type and configured parameters with energy metrics
    switch (step.id) {
      case 1: { // Hopper
        const feedRate = getParamValue('feedRate', 1200);
        const level = getParamValue('level', 75);
        const defaultFeedRate = 1200;
        const defaultLevel = 75;
        
        // Energy calculation: Optimal level reduces energy for material handling
        const levelEfficiency = level / defaultLevel; // Higher level = better efficiency
        const feedRateEfficiency = feedRate / defaultFeedRate; // Optimal feed rate
        const energyEfficiency = (levelEfficiency * 0.6 + feedRateEfficiency * 0.4);
        const energyConsumption = 2.5 / energyEfficiency; // kWh per ton
        const energySavings = calculateEnergySavings(energyEfficiency, 1.0) * 100;
        const power = 50 * energyEfficiency; // kW
        
        const formattedRate = feedRate >= 1000 ? feedRate.toLocaleString() : feedRate.toString();
        return formatEnergyOutput(
          `Raw ore feed (${formattedRate} tph)`,
          energyConsumption,
          energySavings,
          power
        );
      }
      
      case 2: { // Vibrating Feeder
        const feederRate = getParamValue('feedRate', 1200);
        const frequency = getParamValue('frequency', 50);
        const amplitude = getParamValue('amplitude', 5);
        const defaultFreq = 50;
        const defaultAmp = 5;
        
        // Energy calculation: Optimal frequency and amplitude reduce energy
        const freqEfficiency = 1 - Math.abs(frequency - defaultFreq) / defaultFreq * 0.3;
        const ampEfficiency = 1 - Math.abs(amplitude - defaultAmp) / defaultAmp * 0.2;
        const energyEfficiency = (freqEfficiency + ampEfficiency) / 2;
        const energyConsumption = 1.8 / energyEfficiency;
        const energySavings = calculateEnergySavings(energyEfficiency, 1.0) * 100;
        const power = 25 * energyEfficiency;
        
        const formattedRate = feederRate >= 1000 ? feederRate.toLocaleString() : feederRate.toString();
        return formatEnergyOutput(
          `Controlled feed (${formattedRate} tph)`,
          energyConsumption,
          energySavings,
          power
        );
      }
      
      case 3: { // Gyratory Crusher
        const capacity = getParamValue('capacity', 1200);
        const power = getParamValue('power', 1200);
        const reduction = getParamValue('reductionRatio', 5);
        const defaultPower = 1200;
        const defaultCapacity = 1200;
        
        // Energy calculation: Higher reduction ratio with same power = better efficiency
        const capacityUtilization = capacity / defaultCapacity;
        const powerEfficiency = defaultPower / power; // Lower power for same capacity = better
        const reductionEfficiency = reduction / 5; // Higher reduction = better
        const energyEfficiency = (capacityUtilization * 0.4 + powerEfficiency * 0.4 + reductionEfficiency * 0.2);
        const energyConsumption = (power / capacity) / energyEfficiency; // kWh per ton
        const energySavings = calculateEnergySavings(powerEfficiency, 1.0) * 100;
        
        const maxSize = Math.round(1500 / reduction);
        const minSize = Math.round(maxSize * 0.5);
        return formatEnergyOutput(
          `Crushed ore (${minSize}-${maxSize}mm)`,
          energyConsumption,
          energySavings,
          power
        );
      }
      
      case 4: { // Conveyor Belt
        const convCapacity = getParamValue('capacity', 1200);
        const speed = getParamValue('speed', 2.5);
        const defaultSpeed = 2.5;
        const defaultCapacity = 1200;
        
        // Energy calculation: Optimal speed reduces energy consumption
        const speedEfficiency = 1 - Math.abs(speed - defaultSpeed) / defaultSpeed * 0.25;
        const capacityEfficiency = convCapacity / defaultCapacity;
        const energyEfficiency = (speedEfficiency * 0.5 + capacityEfficiency * 0.5);
        const energyConsumption = 0.8 / energyEfficiency;
        const energySavings = calculateEnergySavings(energyEfficiency, 1.0) * 100;
        const power = 150 * energyEfficiency;
        
        const formattedCapacity = convCapacity >= 1000 ? convCapacity.toLocaleString() : convCapacity.toString();
        return formatEnergyOutput(
          `Transported ore (${formattedCapacity} tph)`,
          energyConsumption,
          energySavings,
          power
        );
      }
      
      case 5: { // Secondary Crusher
        const capacity = getParamValue('capacity', 1200);
        const power = getParamValue('power', 800);
        const reduction = getParamValue('reductionRatio', 3);
        const defaultPower = 800;
        const defaultCapacity = 1200;
        
        // Energy calculation: Higher reduction ratio with same power = better efficiency
        const capacityUtilization = capacity / defaultCapacity;
        const powerEfficiency = defaultPower / power; // Lower power for same capacity = better
        const reductionEfficiency = reduction / 3; // Higher reduction = better
        const energyEfficiency = (capacityUtilization * 0.4 + powerEfficiency * 0.4 + reductionEfficiency * 0.2);
        const energyConsumption = (power / capacity) / energyEfficiency; // kWh per ton
        const energySavings = calculateEnergySavings(powerEfficiency, 1.0) * 100;
        
        const maxSize = Math.round(150 / reduction);
        const minSize = Math.round(maxSize * 0.5);
        return formatEnergyOutput(
          `Secondary crushed ore (${minSize}-${maxSize}mm)`,
          energyConsumption,
          energySavings,
          power
        );
      }
      
      default:
        return step.output;
    }
  };

  // Handle parameter change (updates pending parameters)
  const handleParameterChange = (stepId: number, key: string, value: string) => {
    setPendingParameters(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        [key]: value
      }
    }));
  };

  // Apply pending parameters to actual process parameters
  const applyParameters = () => {
    // Merge pending parameters with existing applied parameters
    // This ensures we don't lose previously applied parameters
    const newParams: ProcessParameters = { ...processParameters };
    
    // Apply all pending parameters
    Object.keys(pendingParameters).forEach(stepId => {
      const stepIdNum = parseInt(stepId);
      const pendingStepParams = pendingParameters[stepIdNum];
      
      // Filter out empty values and merge
      const filteredParams: {[key: string]: string | number} = {};
      if (pendingStepParams) {
        Object.keys(pendingStepParams).forEach(key => {
          const value = pendingStepParams[key];
          // Only include non-empty values
          if (value !== undefined && value !== null && value !== '') {
            filteredParams[key] = value;
          }
        });
      }
      
      // Merge filtered params with existing params for this step
      if (Object.keys(filteredParams).length > 0) {
        newParams[stepIdNum] = {
          ...(newParams[stepIdNum] || {}),
          ...filteredParams
        };
      } else {
        // If no valid params, remove this step from newParams
        delete newParams[stepIdNum];
      }
    });
    
    // Remove empty parameter objects
    Object.keys(newParams).forEach(stepId => {
      const stepIdNum = parseInt(stepId);
      if (!newParams[stepIdNum] || Object.keys(newParams[stepIdNum]).length === 0) {
        delete newParams[stepIdNum];
      }
    });
    
    // Force a new object reference to trigger re-render
    setProcessParameters({ ...newParams });
    // Reset simulation if running
    if (isSimulationRunning) {
      setIsSimulationRunning(false);
      setSimulationResults({});
    }
  };

  // Check if there are pending changes
  const hasPendingChanges = () => {
    // Normalize both objects for comparison (handle empty strings, null, undefined)
    const normalize = (obj: ProcessParameters) => {
      const normalized: ProcessParameters = {};
      for (const stepId in obj) {
        const step = obj[stepId];
        const normalizedStep: {[key: string]: string | number} = {};
        for (const key in step) {
          const value = step[key];
          if (value !== undefined && value !== null && value !== '') {
            normalizedStep[key] = value;
          }
        }
        if (Object.keys(normalizedStep).length > 0) {
          normalized[parseInt(stepId)] = normalizedStep;
        }
      }
      return normalized;
    };

    const normalizedPending = normalize(pendingParameters);
    const normalizedApplied = normalize(processParameters);
    
    return JSON.stringify(normalizedPending) !== JSON.stringify(normalizedApplied);
  };

  // Reset parameters for a step
  const resetStepParameters = (stepId: number) => {
    setProcessParameters(prev => {
      const newParams = { ...prev };
      delete newParams[stepId];
      return newParams;
    });
    setPendingParameters(prev => {
      const newParams = { ...prev };
      delete newParams[stepId];
      return newParams;
    });
  };

  // Reset all parameters
  const resetAllParameters = () => {
    setProcessParameters({});
    setPendingParameters({});
    setIsSimulationRunning(false);
    setSimulationResults({});
  };

  // Start simulation with configured parameters
  const startSimulation = () => {
    console.log('[DigitalTwin] startSimulation called, current state:', isSimulationRunning);
    
    if (isSimulationRunning) {
      // Stop simulation - reset all statuses to inactive
      console.log('[DigitalTwin] Stopping simulation...');
      setIsSimulationRunning(false);
      setStepStatuses(() => {
        const resetStatuses: {[stepId: number]: 'active' | 'inactive' | 'emergency'} = {};
        for (let i = 1; i <= 5; i++) {
          resetStatuses[i] = 'inactive';
        }
        return resetStatuses;
      });
      setSimulationResults({});
      return;
    }

    // Start simulation
    console.log('[DigitalTwin] Starting simulation...');
    setIsSimulationRunning(true);
    
    // Calculate simulation results based on configured parameters
    const results: {[stepId: number]: any} = {};
    const newStatuses: {[stepId: number]: 'active' | 'inactive' | 'emergency'} = {};
    
    // Merge pending parameters with applied parameters for checking
    const allParameters: ProcessParameters = { ...processParameters };
    Object.keys(pendingParameters).forEach(stepId => {
      const stepIdNum = parseInt(stepId);
      const pendingStepParams = pendingParameters[stepIdNum];
      if (pendingStepParams && Object.keys(pendingStepParams).length > 0) {
        allParameters[stepIdNum] = {
          ...(allParameters[stepIdNum] || {}),
          ...pendingStepParams
        };
      }
    });
    
    console.log('[DigitalTwin] Starting simulation with parameters:', allParameters);
    
    processSteps.forEach((step) => {
      const params = parameterDefinitions[step.id as keyof typeof parameterDefinitions] || [];
      const stepParams = allParameters[step.id] || {};
      
      // Check if any parameters are configured for this step (check for non-empty values)
      const hasParameters = Object.keys(stepParams).some(key => {
        const value = stepParams[key];
        return value !== undefined && value !== null && value !== '' && String(value).trim() !== '';
      });
      
      console.log(`[DigitalTwin] Step ${step.id} (${step.title}): hasParameters=${hasParameters}, params=`, stepParams, 'allParameters keys:', Object.keys(allParameters));
      
      // Calculate outcomes based on parameters
      const stepResult: any = {
        status: 'normal',
        metrics: [],
        efficiency: 95,
        alerts: [],
        notes: ''
      };

      let hasCriticalIssue = false;
      let maxDeviation = 0;

      params.forEach((param) => {
        const userValue = stepParams[param.key];
        const defaultValue = parseFloat(param.default);
        const currentValue = userValue ? parseFloat(userValue.toString()) : defaultValue;
        
        // Calculate efficiency and status based on parameter values
        let change = 0;
        if (userValue) {
          change = ((currentValue - defaultValue) / defaultValue) * 100;
          maxDeviation = Math.max(maxDeviation, Math.abs(change));
        }

        stepResult.metrics.push({
          label: param.label,
          value: `${currentValue} ${param.unit}`,
          change: userValue ? (change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`) : undefined,
          trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable'
        });

        // Generate alerts based on parameter changes
        if (Math.abs(change) > 30) {
          hasCriticalIssue = true;
          stepResult.status = 'critical';
          stepResult.alerts.push(`${param.label} is ${Math.abs(change).toFixed(0)}% ${change > 0 ? 'above' : 'below'} normal - CRITICAL`);
        } else if (Math.abs(change) > 20) {
          if (stepResult.status !== 'critical') {
            stepResult.status = 'warning';
          }
          stepResult.alerts.push(`${param.label} is ${Math.abs(change).toFixed(0)}% ${change > 0 ? 'above' : 'below'} normal`);
        }
      });

      // Calculate overall efficiency
      const avgChange = stepResult.metrics
        .filter((m: any) => m.change)
        .reduce((sum: number, m: any) => {
          const changeVal = parseFloat(m.change?.replace('%', '') || '0');
          return sum + Math.abs(changeVal);
        }, 0) / (stepResult.metrics.filter((m: any) => m.change).length || 1);

      stepResult.efficiency = Math.max(70, Math.min(99, 95 - (avgChange * 0.3)));
      
      if (stepResult.efficiency < 70) {
        hasCriticalIssue = true;
        stepResult.status = 'critical';
      } else if (stepResult.efficiency < 80) {
        if (stepResult.status !== 'critical') {
          stepResult.status = 'warning';
        }
      }

      stepResult.notes = `Simulation running with configured parameters. Efficiency: ${stepResult.efficiency.toFixed(1)}%`;
      
      results[step.id] = stepResult;
      
      // Determine machine status based on parameters and calculations
      // DEFAULT: All machines are ACTIVE when simulation starts
      // Only set to EMERGENCY if parameters are configured AND there are critical issues
      if (hasParameters && (hasCriticalIssue || stepResult.status === 'critical' || stepResult.efficiency < 60 || maxDeviation > 70)) {
        // Parameters configured AND critical issues detected - set to emergency
        newStatuses[step.id] = 'emergency';
        console.log(`[DigitalTwin] Step ${step.id} (${step.title}): CRITICAL (deviation: ${maxDeviation.toFixed(1)}%, efficiency: ${stepResult.efficiency.toFixed(1)}%) → EMERGENCY`);
      } else {
        // Default: All machines are ACTIVE when simulation starts
        // Whether parameters are configured or not, machine becomes active
        newStatuses[step.id] = 'active';
        if (hasParameters) {
          console.log(`[DigitalTwin] Step ${step.id} (${step.title}): Parameters configured → ACTIVE (deviation: ${maxDeviation.toFixed(1)}%, efficiency: ${stepResult.efficiency.toFixed(1)}%)`);
        } else {
          console.log(`[DigitalTwin] Step ${step.id} (${step.title}): No parameters (using defaults) → ACTIVE`);
        }
      }
    });

    // Apply cascade effect: If upstream machine has emergency, downstream machines become inactive
    // Process flow: 1→2→3→4→5→6→7→8→9
    // Only apply cascade if there's actually an emergency upstream
    const hasAnyEmergency = Object.values(newStatuses).some(status => status === 'emergency');
    if (hasAnyEmergency) {
      console.log('[DigitalTwin] Emergency detected, applying cascade effect. Statuses before cascade:', newStatuses);
      for (let i = 2; i <= 5; i++) {
        // Check if any upstream machine (with lower ID) has emergency
        let upstreamEmergency = false;
        let emergencyStepId = 0;
        for (let j = 1; j < i; j++) {
          if (newStatuses[j] === 'emergency') {
            upstreamEmergency = true;
            emergencyStepId = j;
            break;
          }
        }
        
        // If upstream has emergency, set downstream to inactive (but don't override if it's already emergency)
        if (upstreamEmergency && newStatuses[i] !== 'emergency') {
          newStatuses[i] = 'inactive';
          console.log(`[DigitalTwin] Step ${i} (${processSteps.find(s => s.id === i)?.title}): Upstream step ${emergencyStepId} has emergency → INACTIVE (cascade effect)`);
        }
      }
      console.log('[DigitalTwin] Statuses after cascade effect:', newStatuses);
    } else {
      console.log('[DigitalTwin] No emergencies detected, skipping cascade effect');
    }
    
    // Set statuses based on parameter analysis
    setStepStatuses(newStatuses);
    console.log('[DigitalTwin] Machine statuses set based on parameters:', newStatuses);
    
    setSimulationResults(results);
  };


  return (
    <div className="min-h-full space-y-6 p-4 sm:p-6 w-full">
      {/* Header Section */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#26436C' }}>
              <span>Digital Twin</span>{' '}
              <span>Control</span>{' '}
              <span>System</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Supervisory Control and Data Acquisition - Configure process parameters and monitor iron ore processing operations
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {isRealtimeConnected ? (
              <Badge variant="outline" className="flex items-center gap-1.5 bg-success/10 text-success border-success">
                <Radio className="w-3 h-3 animate-pulse" />
                Real-time Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1.5 bg-destructive/10 text-destructive border-destructive">
                <Radio className="w-3 h-3" />
                Offline
              </Badge>
            )}
            {registeredDevices.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {registeredDevices.length} Device{registeredDevices.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {connectionError && (
              <Badge variant="outline" className="flex items-center gap-1.5 bg-warning/10 text-warning border-warning">
                <AlertTriangle className="w-3 h-3" />
                {connectionError}
              </Badge>
            )}
            <Button
              variant={showParameterConfig ? "default" : "outline"}
              size="sm"
              onClick={() => setShowParameterConfig(!showParameterConfig)}
              className="transition-all duration-300 hover:scale-105"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showParameterConfig ? 'Hide' : 'Show'} Parameters
            </Button>
            <Button
              variant={isSimulationRunning ? "destructive" : "default"}
              size="sm"
              onClick={() => {
                console.log('[DigitalTwin] Start Simulation button clicked, isSimulationRunning:', isSimulationRunning);
                startSimulation();
              }}
              className="transition-all duration-300 hover:scale-105"
            >
              {isSimulationRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Simulation
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Simulation
                </>
              )}
            </Button>
            {Object.keys(processParameters).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllParameters}
                className="transition-all duration-300 hover:scale-105"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Parameter Configuration Panel */}
      {showParameterConfig && (
        <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Process Parameters Configuration</h3>
            </div>
            <div className="flex items-center gap-2">
              {hasPendingChanges() && (
                <Badge variant="secondary" className="text-xs bg-warning/20 text-warning-foreground">
                  Pending Changes
                </Badge>
              )}
              <Badge variant="outline">
                {Object.keys(processParameters).length} Step(s) Applied
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Set custom parameters for each process step. Click "Apply Changes" to update the Process Flow Steps below.
          </p>
          
          {/* Apply Button */}
          {hasPendingChanges() && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">You have unsaved parameter changes</span>
                </div>
                <Button
                  onClick={applyParameters}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Apply Changes
                </Button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processSteps.map((step) => {
              const params = parameterDefinitions[step.id as keyof typeof parameterDefinitions] || [];
              const hasCustomParams = Object.keys(processParameters[step.id] || {}).length > 0;
              const hasPendingForStep = Object.keys(pendingParameters[step.id] || {}).length > 0;

              return (
                <Card key={step.id} className={`p-4 border-2 transition-colors ${
                  hasPendingForStep && !processParameters[step.id] 
                    ? 'border-warning/50 hover:border-warning bg-warning/5' 
                    : hasCustomParams 
                      ? 'border-primary/50 hover:border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <step.icon className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-semibold">{step.title}</h4>
                      {hasPendingForStep && !processParameters[step.id] && (
                        <Badge variant="outline" className="text-xs bg-warning/20 text-warning-foreground">
                          Pending
                        </Badge>
                      )}
                    </div>
                    {hasCustomParams && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetStepParameters(step.id)}
                        className="h-6 w-6 p-0"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {params.map((param) => {
                      // Get value from pending first, then applied, then default
                      // Allow empty string in pending to enable full clearing
                      const pendingValue = pendingParameters[step.id]?.[param.key];
                      const appliedValue = processParameters[step.id]?.[param.key];
                      
                      // If pendingValue exists (including empty string), use it
                      // This allows user to clear the field completely
                      let currentValue: string;
                      if (pendingValue !== undefined) {
                        // Pending value exists (could be empty string) - use it for full control
                        currentValue = String(pendingValue);
                      } else if (appliedValue !== undefined && appliedValue !== null && appliedValue !== '') {
                        // Use applied value if exists
                        currentValue = String(appliedValue);
                      } else {
                        // Use default as initial value (user can completely replace it)
                        currentValue = param.default;
                      }
                      
                      const aiRec = aiRecommendations[step.id]?.parameterRecommendations?.[param.key];
                      
                      return (
                        <div key={param.key} className={aiRec ? "p-2 rounded-lg bg-primary/5 border border-primary/20" : ""}>
                          <div className="flex items-center justify-between mb-1">
                            <Label htmlFor={`${step.id}-${param.key}`} className="text-xs">
                              {param.label}
                            </Label>
                            {aiRec && (
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI Recommended
                              </Badge>
                            )}
                          </div>
                          {aiRec && (
                            <div className="text-xs text-muted-foreground mb-1 px-1">
                              <span className="font-medium">AI suggests:</span> {aiRec.recommended} {param.unit}
                              {aiRec.reason && <span className="block text-xs mt-0.5">({aiRec.reason})</span>}
                              {aiRec.impact && <span className="block text-success text-xs mt-0.5">Impact: {aiRec.impact}</span>}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              id={`${step.id}-${param.key}`}
                              type="text"
                              value={currentValue}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                // Allow any input - user can type freely, no restrictions
                                handleParameterChange(step.id, param.key, newValue);
                              }}
                              onFocus={(e) => {
                                // When user focuses on a field showing default value, select all text
                                // This makes it easy to completely replace the value in one go
                                if (currentValue === param.default && !pendingParameters[step.id]?.[param.key] && !processParameters[step.id]?.[param.key]) {
                                  e.target.select();
                                }
                              }}
                              onBlur={(e) => {
                                // Keep whatever user typed - don't trim or modify
                                // Allow empty strings so user can clear and type fresh value
                                const value = e.target.value;
                                handleParameterChange(step.id, param.key, value);
                              }}
                              className="h-8 text-sm"
                              placeholder={param.default}
                            />
                            {param.unit && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{param.unit}</span>
                            )}
                            {aiRec && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  handleParameterChange(step.id, param.key, aiRec.recommended.toString());
                                }}
                              >
                                <Lightbulb className="w-3 h-3 mr-1" />
                                Apply AI
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {(() => {
                      const stepRecs = aiRecommendations[step.id]?.recommendations;
                      return stepRecs && stepRecs.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-semibold text-primary">AI Recommendations</span>
                          </div>
                          <ul className="space-y-1">
                            {stepRecs.map((rec, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Process Flow Section - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3D Visualization */}
          <ErrorBoundary fallback={
            <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
              <div className="h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                  <h3 className="text-lg font-semibold mb-2">3D View Unavailable</h3>
                  <p className="text-sm text-muted-foreground">
                    The 3D visualization will be available when simulation is integrated.
                  </p>
                </div>
              </div>
            </Card>
          }>
            <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-primary" />
                  Digital Twin Process Visualization
                </h3>
                {isSimulationRunning ? (
                  <Badge variant="default" className="text-xs bg-success animate-pulse">
                    <Activity className="w-3 h-3 mr-1 animate-spin" />
                    Simulation Running
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Ready to Start
                  </Badge>
                )}
              </div>
              
              {/* Digital Twin Video */}
              <div className="mb-4 relative w-full rounded-lg overflow-hidden bg-muted/20 border border-border/50">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto max-h-[500px] object-contain"
                  style={{ display: 'block' }}
                >
                  <source src="/digital-twin-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-md text-sm font-medium backdrop-blur-sm">
                  Digital Twin - Real-time Process Flow
                </div>
              </div>
              
              <div className="h-[400px] bg-muted/20 rounded-lg border border-border relative overflow-auto">
                <div className="p-4 space-y-3">
                  {processSteps.map((step) => {
                    const status = stepStatuses[step.id] || 'inactive';
                    const stepEquipment = equipmentData.find((eq: { id: string; name: string }) => eq.id === `unity-${step.title}` || eq.name === step.title);
                    const Icon = step.icon;
                    
                    return (
                      <div
                        key={step.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            status === 'active' ? 'bg-success/20 text-success' :
                            status === 'emergency' ? 'bg-destructive/20 text-destructive' :
                            'bg-warning/20 text-warning'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{step.title}</h4>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  status === 'active' ? 'bg-success text-success-foreground border-success' :
                                  status === 'emergency' ? 'bg-destructive text-destructive-foreground border-destructive' :
                                  'bg-warning text-warning-foreground border-warning'
                                }`}
                              >
                                {status === 'active' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {status === 'emergency' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                {status === 'inactive' && <AlertCircle className="w-3 h-3 mr-1" />}
                                {status.toUpperCase()}
                              </Badge>
                            </div>
                            {step.id !== 5 && (
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {stepEquipment?.load !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <Gauge className="w-3 h-3" />
                                    <span>Load: {stepEquipment.load.toFixed(1)}%</span>
                                  </div>
                                )}
                                {stepEquipment?.temperature !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <Thermometer className="w-3 h-3" />
                                    <span>Temp: {stepEquipment.temperature.toFixed(1)}°C</span>
                                  </div>
                                )}
                                {stepEquipment?.vibration !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    <span>Vib: {stepEquipment.vibration.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const deviceId = `unity-${step.title}`;
                              console.log(`[Digital Twin] Starting ${step.title} (${deviceId})`);
                              
                              // Optimistically update status
                              setStepStatuses(prev => ({
                                ...prev,
                                [step.id]: 'active'
                              }));
                              
                              try {
                                await realtimeService.sendCommand(deviceId, 'start', {});
                                console.log(`[Digital Twin] Start command sent successfully for ${step.title}`);
                              } catch (error) {
                                console.error(`Error starting ${step.title}:`, error);
                                // Revert status on error
                                setStepStatuses(prev => ({
                                  ...prev,
                                  [step.id]: 'inactive'
                                }));
                              }
                            }}
                            disabled={status === 'active' || !isSimulationRunning}
                            className="h-8"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              const deviceId = `unity-${step.title}`;
                              console.log(`[Digital Twin] Stopping ${step.title} (${deviceId})`);
                              
                              // Optimistically update status
                              setStepStatuses(prev => ({
                                ...prev,
                                [step.id]: 'inactive'
                              }));
                              
                              try {
                                await realtimeService.sendCommand(deviceId, 'stop', {});
                                console.log(`[Digital Twin] Stop command sent successfully for ${step.title}`);
                              } catch (error) {
                                console.error(`Error stopping ${step.title}:`, error);
                                // Revert status on error (keep as active if stop failed)
                                setStepStatuses(prev => ({
                                  ...prev,
                                  [step.id]: 'active'
                                }));
                              }
                            }}
                            disabled={status === 'inactive' || status === 'emergency' || !isSimulationRunning}
                            className="h-8"
                          >
                            <Pause className="w-3 h-3 mr-1" />
                            Stop
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </ErrorBoundary>

          {/* Process Flow Steps - Written Description */}
          <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Process Flow Steps
              </h3>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{processSteps.length} Steps</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'summary' ? 'detailed' : 'summary')}
                  className="flex items-center gap-2"
                >
                  {viewMode === 'summary' ? (
                    <>
                      <List className="w-4 h-4" />
                      Detailed View
                    </>
                  ) : (
                    <>
                      <Table2 className="w-4 h-4" />
                      Summary View
                    </>
                  )}
                </Button>
              </div>
            </div>

            {viewMode === 'summary' ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Step</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Key Metrics</TableHead>
                      <TableHead>Output</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processSteps.map((step) => {
                      const Icon = step.icon;
                      const stepMetrics = getStepMetrics(step);
                      const stepOutput = getStepOutput(step);
                      const stepParams = processParameters[step.id];
                      const hasCustomParams = stepParams && Object.keys(stepParams).length > 0;
                      
                      return (
                        <TableRow 
                          key={step.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            const stepIndex = processSteps.findIndex(s => s.id === step.id);
                            setSelectedProcessStep(stepIndex === selectedProcessStep ? null : stepIndex);
                          }}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                              {step.id}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-primary" />
                              <span className="font-semibold">{step.title}</span>
                              {hasCustomParams && (
                                <Badge variant="secondary" className="text-xs">
                                  <Settings className="w-3 h-3 mr-1" />
                                  Configured
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{step.description}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {(() => {
                                const currentStatus = stepStatuses[step.id] || 'active';
                                if (currentStatus === 'active') {
                                  return (
                                    <Badge variant="default" className="bg-success text-success-foreground">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Active
                                    </Badge>
                                  );
                                } else if (currentStatus === 'inactive') {
                                  return (
                                    <Badge variant="default" className="bg-warning text-warning-foreground">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Inactive
                                    </Badge>
                                  );
                                } else {
                                  return (
                                    <Badge variant="default" className="bg-destructive text-destructive-foreground">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Emergency
                                    </Badge>
                                  );
                                }
                              })()}
                              {aiRecommendations[step.id]?.failurePrediction && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs flex items-center gap-1 ${
                                    aiRecommendations[step.id]?.failurePrediction?.severity === 'critical' || 
                                    aiRecommendations[step.id]?.failurePrediction?.severity === 'high'
                                      ? 'bg-destructive/10 text-destructive border-destructive/30'
                                      : 'bg-warning/10 text-warning border-warning/30'
                                  }`}
                                >
                                  <Sparkles className="w-3 h-3" />
                                  AI: {aiRecommendations[step.id]?.failurePrediction?.timeToFailure}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {stepMetrics.slice(0, 2).map((metric, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {metric.label}: {metric.value}
                                </Badge>
                              ))}
                              {stepMetrics.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{stepMetrics.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <ArrowRight className="w-3 h-3 text-success" />
                              <span className="text-muted-foreground truncate max-w-[200px]">{stepOutput}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="space-y-4">
                {processSteps.map((step, index) => {
                const Icon = step.icon;
                const isSelected = selectedProcessStep === index;
                const stepMetrics = getStepMetrics(step);
                const stepParams = processParameters[step.id];
                const hasCustomParams = stepParams ? Object.keys(stepParams).length > 0 : false;
                // Calculate output for this step - this will update when processParameters changes
                const stepOutput = getStepOutput(step);
                
                return (
                  <div
                    key={`step-${step.id}-${JSON.stringify(processParameters[step.id] || {})}`}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-lg'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
                    }`}
                    onClick={() => {
                      setSelectedProcessStep(isSelected ? null : index);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Step Number & Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Step {step.id}
                            </Badge>
                            <h4 className="text-base font-semibold">{step.title}</h4>
                            {(() => {
                              const currentStatus = stepStatuses[step.id] || 'active';
                              if (currentStatus === 'active') {
                                return (
                                  <Badge variant="default" className="text-xs bg-success text-success-foreground">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Active
                                  </Badge>
                                );
                              } else if (currentStatus === 'inactive') {
                                return (
                                  <Badge variant="default" className="text-xs bg-warning text-warning-foreground">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Inactive
                                  </Badge>
                                );
                              } else {
                                return (
                                  <Badge variant="default" className="text-xs bg-destructive text-destructive-foreground">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Emergency
                                  </Badge>
                                );
                              }
                            })()}
                            {hasCustomParams && (
                              <Badge variant="secondary" className="text-xs">
                                <Settings className="w-3 h-3 mr-1" />
                                Configured
                              </Badge>
                            )}
                          </div>
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">{step.description}</p>

                        {/* Metrics - Using configured or default values */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {stepMetrics.map((metric, idx) => {
                            const MetricIcon = metric.icon;
                            return (
                              <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                                <MetricIcon className="w-4 h-4 text-primary flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-xs text-muted-foreground truncate">{metric.label}</div>
                                  <div className="text-sm font-semibold truncate">{metric.value}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Equipment Tags */}
                        <div className="flex flex-wrap gap-2">
                          {step.equipment.map((eq, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {eq}
                            </Badge>
                          ))}
                        </div>

                        {/* Output */}
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-2 text-sm">
                            <ArrowRight className="w-4 h-4 text-success" />
                            <span className="text-muted-foreground">Output:</span>
                            <span className="font-medium" key={`output-${step.id}-${JSON.stringify(processParameters[step.id] || {})}`}>
                              {stepOutput}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Process Guide & Alerts */}
        <div className="space-y-6">
          {/* Process Guide */}
          {showProcessGuide && (
            <Card className="p-6 glass rounded-modern-xl shadow-depth-xl border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Process Overview</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProcessGuide(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  This visualization demonstrates the complete iron ore processing workflow. 
                  Click on any step to view detailed information and configure parameters.
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="text-xs text-muted-foreground mb-1">Total Steps</div>
                    <div className="text-2xl font-bold text-primary">{processSteps.length}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-success/5 border border-success/10">
                    <div className="text-xs text-muted-foreground mb-1">Configured Steps</div>
                    <div className="text-2xl font-bold text-success">
                      {Object.keys(processParameters).length}
                    </div>
                  </div>
                </div>

                {/* Key Performance Indicators */}
                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <h4 className="font-medium text-sm mb-2">Key Performance Indicators</h4>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overall Recovery</span>
                      <span className="font-semibold">95.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product Grade</span>
                      <span className="font-semibold">67% Fe</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Throughput</span>
                      <span className="font-semibold">1,200 tph</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Energy Use</span>
                      <span className="font-semibold">12 kWh/ton</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Water Recovery</span>
                      <span className="font-semibold">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operating Cost</span>
                      <span className="font-semibold">$15/ton</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Alerts Feed */}
          <AlertsFeed autoUpdate={true} />
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin;
