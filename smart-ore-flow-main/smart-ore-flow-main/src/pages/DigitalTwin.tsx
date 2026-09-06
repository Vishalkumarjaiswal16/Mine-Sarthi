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
  const [simulationResults, setSimulationResults] = useState<{[stepId: number]: any}>({});
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

  // Subscribe to real-time conveyor data
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
      if (data.data['stepId'] && data.data['metrics']) {
        // Update process step metrics from real-time data
        const stepId = Number(data.data['stepId']);
        if (stepId >= 1 && stepId <= 5) {
          const metrics = data.data['metrics'] as Record<string, string | number>;
          setProcessParameters(prev => ({
            ...prev,
            [stepId]: { ...(prev[stepId] || {}), ...metrics }
          }));
        }
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
  const [pendingParameters, setPendingParameters] = useState<ProcessParameters>({});
  
  // ═══════════════════════════════════════════════════════════════════
  // CONVEYOR BELT SYSTEM — Parameter Definitions (IoT Sensor Inputs)
  // ═══════════════════════════════════════════════════════════════════
  const parameterDefinitions = {
    1: [ // Loading Zone
      { key: 'feedRate', label: 'Feed Rate (tph)', type: 'number', default: '1200', unit: 'tph' },
      { key: 'impactForce', label: 'Impact Force (kN)', type: 'number', default: '15', unit: 'kN' },
      { key: 'materialSize', label: 'Material Size (mm)', type: 'number', default: '150', unit: 'mm' },
    ],
    2: [ // Belt Splices & Joints
      { key: 'spliceHealth', label: 'Splice Health (%)', type: 'number', default: '95', unit: '%' },
      { key: 'spliceTemperature', label: 'Splice Temperature (°C)', type: 'number', default: '45', unit: '°C' },
      { key: 'crackWidth', label: 'Crack Width (mm)', type: 'number', default: '0', unit: 'mm' },
    ],
    3: [ // Drive System
      { key: 'motorPower', label: 'Motor Power (kW)', type: 'number', default: '250', unit: 'kW' },
      { key: 'motorCurrent', label: 'Motor Current (A)', type: 'number', default: '480', unit: 'A' },
      { key: 'driveTemperature', label: 'Drive Temperature (°C)', type: 'number', default: '55', unit: '°C' },
    ],
    4: [ // Carrying Span
      { key: 'beltSpeed', label: 'Belt Speed (m/s)', type: 'number', default: '3.5', unit: 'm/s' },
      { key: 'trackingOffset', label: 'Tracking Offset (mm)', type: 'number', default: '0', unit: 'mm' },
      { key: 'beltTension', label: 'Belt Tension (kN)', type: 'number', default: '80', unit: 'kN' },
    ],
    5: [ // Return & Tail Section
      { key: 'tailTension', label: 'Tail Tension (kN)', type: 'number', default: '40', unit: 'kN' },
      { key: 'returnVibration', label: 'Return Vibration (mm/s)', type: 'number', default: '2.5', unit: 'mm/s' },
      { key: 'takeUpPosition', label: 'Take-Up Position (mm)', type: 'number', default: '500', unit: 'mm' },
    ],
  };

  // ═══════════════════════════════════════════════════════════════════
  // CONVEYOR BELT SYSTEM — 5 Monitoring Zones
  // ═══════════════════════════════════════════════════════════════════
  const processSteps = [
    {
      id: 1,
      title: "Loading Zone",
      icon: Package,
      description: "Material feed point with impact idlers and skirt boards",
      details: "The Loading Zone is where raw iron ore is fed onto the conveyor belt from hoppers or transfer chutes. This zone is equipped with impact idlers to absorb the shock of falling material and skirt boards to contain material spillage. High impact forces from large ore chunks can damage the belt surface, create indentations, and accelerate splice deterioration. Monitoring feed rate, impact force, and material size is critical for preventing belt damage at the loading point. Excessive impact forces or oversized material can cause immediate belt damage or gradual weakening of the belt structure.",
      equipment: ["Impact Idlers", "Skirt Boards", "Load Cells", "Impact Sensors"],
      defaultMetrics: [
        { label: "Feed Rate", value: "1,200 tph", icon: TrendingDown },
        { label: "Impact Force", value: "15 kN", icon: Activity },
        { label: "Material Size", value: "150 mm", icon: Gauge },
      ],
      duration: "Continuous",
      status: "active" as const,
      output: "Material loaded at 1,200 tph",
    },
    {
      id: 2,
      title: "Belt Splices & Joints",
      icon: AlertTriangle,
      description: "Critical failure point — splice health and joint integrity monitoring",
      details: "Belt Splices & Joints are the most critical points in the conveyor system and the primary focus of NMDC's predictive maintenance initiative. Belt joints are continuously exposed to heavy loads, high tension, dust, moisture, and frequent start-stop operations. These conditions gradually cause cracks, wear, edge damage, rubber weakening, and splice failure. The monitoring system uses thermal cameras, acoustic emission sensors, and AI-based vision systems to detect early signs of splice deterioration. Splice health below 60% indicates the need for planned maintenance, while health below 40% signals imminent rupture risk requiring emergency intervention.",
      equipment: ["Thermal Cameras", "Acoustic Sensors", "Vision AI System", "Crack Detectors"],
      defaultMetrics: [
        { label: "Splice Health", value: "95%", icon: Gauge },
        { label: "Splice Temp", value: "45 °C", icon: Thermometer },
        { label: "Crack Width", value: "0 mm", icon: AlertTriangle },
      ],
      duration: "24/7 Monitoring",
      status: "active" as const,
      output: "Splice Health: 95% | Risk: Low",
    },
    {
      id: 3,
      title: "Drive System",
      icon: Zap,
      description: "Head pulley, motor, gearbox, and coupling monitoring",
      details: "The Drive System powers the entire conveyor belt operation through the head pulley, electric motor, gearbox, and coupling assembly. It is the heart of the conveyor system — if the drive fails, the entire belt stops. Monitoring motor power consumption, current draw, and drive temperature provides early warning of bearing wear, gearbox issues, or electrical faults. Abnormal current spikes can indicate belt slippage, overloading, or mechanical binding. Drive temperature elevation above 80°C signals friction issues or cooling system problems. Predictive maintenance of the drive system prevents catastrophic unplanned shutdowns.",
      equipment: ["Electric Motor", "Gearbox", "Head Pulley", "Current Transformers", "Temperature Sensors"],
      defaultMetrics: [
        { label: "Motor Power", value: "250 kW", icon: Zap },
        { label: "Motor Current", value: "480 A", icon: Activity },
        { label: "Drive Temp", value: "55 °C", icon: Thermometer },
      ],
      duration: "24/7 Operation",
      status: "active" as const,
      output: "Drive Power: 250 kW | Efficiency: 94%",
    },
    {
      id: 4,
      title: "Carrying Span",
      icon: Activity,
      description: "Belt body, carrying idlers, and tracking alignment",
      details: "The Carrying Span is the main working length of the conveyor belt where ore is transported. This zone monitors belt speed, lateral tracking (alignment), and belt tension using encoders, proximity sensors, and tension load cells. Misalignment (tracking offset) is one of the most common and damaging issues — if the belt drifts more than ±15mm, edge wear accelerates; beyond ±30mm, the belt can contact the frame and suffer rapid edge damage or complete failure. Belt tension must be maintained within optimal range — too low causes slippage and material spillage, too high accelerates splice fatigue and belt stretching. Speed variations indicate drive issues or load surges.",
      equipment: ["Belt Encoders", "Proximity Sensors", "Tension Load Cells", "Tracking Sensors"],
      defaultMetrics: [
        { label: "Belt Speed", value: "3.5 m/s", icon: Gauge },
        { label: "Tracking Offset", value: "0 mm", icon: Activity },
        { label: "Belt Tension", value: "80 kN", icon: TrendingDown },
      ],
      duration: "Continuous",
      status: "active" as const,
      output: "Belt Speed: 3.5 m/s | Tracking: Centered",
    },
    {
      id: 5,
      title: "Return & Tail Section",
      icon: RotateCcw,
      description: "Tail pulley, return idlers, and take-up tensioner",
      details: "The Return & Tail Section manages belt return path, tail pulley operation, and automatic tensioning. The take-up system maintains proper belt tension to prevent slippage and ensure splice integrity. Return idler vibration monitoring detects bearing wear or idler seizure — a seized idler can rapidly burn through the belt rubber. The tail tension must be balanced with head tension for optimal belt tracking. Take-up position monitoring shows belt stretch over time — increasing take-up travel indicates belt elongation due to aging or overloading. This section is critical for maintaining the overall health and longevity of the conveyor belt system.",
      equipment: ["Tail Pulley", "Return Idlers", "Take-Up Tensioner", "Vibration Sensors", "Position Sensors"],
      defaultMetrics: [
        { label: "Tail Tension", value: "40 kN", icon: Activity },
        { label: "Return Vibration", value: "2.5 mm/s", icon: Gauge },
        { label: "Take-Up Position", value: "500 mm", icon: Settings },
      ],
      duration: "Continuous",
      status: "active" as const,
      output: "Tail Tension: 40 kN | Vibration: Normal",
    },
  ];

  // ═══════════════════════════════════════════════════════════════════
  // Compute Dynamic KPIs based on current parameters
  // ═══════════════════════════════════════════════════════════════════
  const computeKPIs = () => {
    const getParam = (stepId: number, key: string, defaultVal: number): number => {
      const val = processParameters[stepId]?.[key];
      if (val === undefined || val === null || val === '') return defaultVal;
      const parsed = typeof val === 'number' ? val : parseFloat(String(val));
      return isNaN(parsed) ? defaultVal : parsed;
    };

    const spliceHealth = getParam(2, 'spliceHealth', 95);
    const spliceTemp = getParam(2, 'spliceTemperature', 45);
    const crackWidth = getParam(2, 'crackWidth', 0);
    const trackingOffset = Math.abs(getParam(4, 'trackingOffset', 0));
    const returnVibration = getParam(5, 'returnVibration', 2.5);
    const motorPower = getParam(3, 'motorPower', 250);
    const feedRate = getParam(1, 'feedRate', 1200);
    const beltTension = getParam(4, 'beltTension', 80);

    // Belt Health Index (0-100) — weighted composite score
    const spliceScore = Math.max(0, spliceHealth);
    const trackingScore = Math.max(0, 100 - (trackingOffset / 30) * 100);
    const vibrationScore = Math.max(0, 100 - Math.max(0, (returnVibration - 2.5) / 7.5) * 100);
    const tempScore = Math.max(0, 100 - Math.max(0, (spliceTemp - 45) / 75) * 100);
    const crackScore = Math.max(0, 100 - (crackWidth / 5) * 100);
    const tensionScore = Math.max(0, 100 - Math.abs(beltTension - 80) / 40 * 100);

    const healthIndex = Math.max(0, Math.min(100,
      spliceScore * 0.30 +
      trackingScore * 0.15 +
      vibrationScore * 0.15 +
      tempScore * 0.15 +
      crackScore * 0.15 +
      tensionScore * 0.10
    ));

    // MTBF (hours) — based on health index
    const mtbf = Math.round(healthIndex * 12);

    // Predicted next maintenance
    let nextMaintenance = '30+ days';
    if (healthIndex <= 40) nextMaintenance = 'Immediate';
    else if (healthIndex <= 60) nextMaintenance = '1-3 days';
    else if (healthIndex <= 75) nextMaintenance = '7-14 days';
    else if (healthIndex <= 85) nextMaintenance = '14-30 days';

    // Energy Efficiency (kWh per ton-km)
    const beltLength = 1.5; // km
    const frictionFactor = 1 + (trackingOffset / 100) + Math.max(0, (returnVibration - 2.5) / 10);
    const energyEfficiency = feedRate > 0 ? ((motorPower * frictionFactor) / feedRate / beltLength) : 0;

    // Belt Availability (%)
    let availability = 99.5;
    if (healthIndex <= 40) availability = 70;
    else if (healthIndex <= 60) availability = 85;
    else if (healthIndex <= 75) availability = 92;
    else if (healthIndex <= 85) availability = 96;

    return {
      healthIndex: healthIndex.toFixed(1),
      spliceIntegrity: spliceHealth.toFixed(1),
      mtbf: `${mtbf} hrs`,
      nextMaintenance,
      energyEfficiency: `${energyEfficiency.toFixed(3)} kWh/t·km`,
      availability: `${availability.toFixed(1)}%`,
    };
  };

  // Get current metrics for a step (user-configured or default)
  const getStepMetrics = (step: typeof processSteps[0]) => {
    const userParams = processParameters[step.id];
    if (!userParams || Object.keys(userParams).length === 0) return step.defaultMetrics;

    return step.defaultMetrics.map((metric, idx) => {
      const paramDef = parameterDefinitions[step.id as keyof typeof parameterDefinitions]?.[idx];
      if (!paramDef) return metric;

      const userValue = userParams[paramDef.key];
      if (userValue !== undefined && userValue !== null && userValue !== '') {
        const numValue = typeof userValue === 'number' ? userValue : parseFloat(userValue.toString());
        if (!isNaN(numValue)) {
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

  // ═══════════════════════════════════════════════════════════════════
  // CONVEYOR ENERGY MODEL — Dynamic output based on parameters
  // ═══════════════════════════════════════════════════════════════════
  const getStepOutput = (step: typeof processSteps[0]) => {
    const userParams = processParameters[step.id];
    if (!userParams || Object.keys(userParams).length === 0) return step.output;

    const getParamValue = (key: string, defaultValue: number): number => {
      const value = userParams[key];
      if (value === undefined || value === null || value === '') return defaultValue;
      const strValue = value.toString().trim();
      const numMatch = strValue.match(/[\d.]+/);
      if (numMatch) {
        const parsed = parseFloat(numMatch[0]);
        return isNaN(parsed) ? defaultValue : parsed;
      }
      const parsed = typeof value === 'number' ? value : parseFloat(strValue);
      return isNaN(parsed) ? defaultValue : parsed;
    };

    switch (step.id) {
      case 1: { // Loading Zone
        const feedRate = getParamValue('feedRate', 1200);
        const impactForce = getParamValue('impactForce', 15);
        const materialSize = getParamValue('materialSize', 150);

        // Impact risk assessment
        let impactRisk = 'Normal';
        if (impactForce > 25) impactRisk = 'HIGH — Belt Damage Risk';
        else if (impactForce > 20) impactRisk = 'Elevated';

        // Oversize material warning
        let sizeWarning = '';
        if (materialSize > 300) sizeWarning = ' | ⚠️ OVERSIZE material detected';
        else if (materialSize > 200) sizeWarning = ' | Material size above optimal';

        const formattedRate = feedRate >= 1000 ? feedRate.toLocaleString() : feedRate.toString();
        const loadPower = (feedRate / 1200) * 15 * (impactForce / 15); // kW
        return `Material loaded at ${formattedRate} tph | Impact: ${impactRisk} (${impactForce} kN) | Load Power: ${loadPower.toFixed(1)} kW${sizeWarning}`;
      }
      
      case 2: { // Belt Splices & Joints
        const spliceHealth = getParamValue('spliceHealth', 95);
        const spliceTemp = getParamValue('spliceTemperature', 45);
        const crackWidth = getParamValue('crackWidth', 0);

        // Risk assessment based on splice health
        let riskLevel = 'Low';
        let riskEmoji = '✅';
        if (spliceHealth < 40 || crackWidth > 5 || spliceTemp > 120) {
          riskLevel = 'CRITICAL — Rupture Imminent';
          riskEmoji = '🚨';
        } else if (spliceHealth < 60 || crackWidth > 2 || spliceTemp > 80) {
          riskLevel = 'HIGH — Schedule Maintenance';
          riskEmoji = '⚠️';
        } else if (spliceHealth < 80 || crackWidth > 1 || spliceTemp > 65) {
          riskLevel = 'Medium — Monitor Closely';
          riskEmoji = '🔶';
        }

        // Remaining life estimate
        const degradationRate = (100 - spliceHealth) / 100; // per day simplified
        const remainingLife = spliceHealth > 40 ? Math.round((spliceHealth - 40) / Math.max(degradationRate * 5, 0.5)) : 0;

        return `${riskEmoji} Splice Health: ${spliceHealth}% | Risk: ${riskLevel} | Temp: ${spliceTemp}°C | Crack: ${crackWidth}mm | Est. Life: ${remainingLife} days`;
      }
      
      case 3: { // Drive System
        const motorPower = getParamValue('motorPower', 250);
        const motorCurrent = getParamValue('motorCurrent', 480);
        const driveTemp = getParamValue('driveTemperature', 55);

        // Drive efficiency calculation
        const ratedPower = 250;
        const ratedCurrent = 480;
        const powerFactor = Math.min(1, ratedPower / Math.max(motorPower, 1));
        const currentRatio = motorCurrent / ratedCurrent;
        const efficiency = Math.max(70, Math.min(99, 94 * powerFactor * (1 - Math.max(0, (driveTemp - 55) / 200))));

        // Status assessment
        let driveStatus = 'Normal';
        if (currentRatio > 1.5 || driveTemp > 100) driveStatus = 'CRITICAL — Overload/Overheat';
        else if (currentRatio > 1.2 || driveTemp > 80) driveStatus = 'Warning — Elevated Load';

        return `Drive Power: ${motorPower} kW | Current: ${motorCurrent}A (${(currentRatio * 100).toFixed(0)}% rated) | Efficiency: ${efficiency.toFixed(1)}% | Status: ${driveStatus}`;
      }
      
      case 4: { // Carrying Span
        const beltSpeed = getParamValue('beltSpeed', 3.5);
        const trackingOffset = getParamValue('trackingOffset', 0);
        const beltTension = getParamValue('beltTension', 80);

        // Tracking assessment
        const absOffset = Math.abs(trackingOffset);
        let trackingStatus = 'Centered';
        let trackingEmoji = '✅';
        if (absOffset > 30) { trackingStatus = 'SEVERE MISALIGNMENT'; trackingEmoji = '🚨'; }
        else if (absOffset > 15) { trackingStatus = 'Misaligned — Edge Wear Risk'; trackingEmoji = '⚠️'; }
        else if (absOffset > 5) { trackingStatus = 'Slight Drift'; trackingEmoji = '🔶'; }

        // Tension assessment
        const tensionDev = Math.abs(beltTension - 80) / 80 * 100;
        let tensionStatus = '';
        if (tensionDev > 30) tensionStatus = ' | ⚠️ Tension anomaly';
        else if (tensionDev > 15) tensionStatus = ' | Tension variation noted';

        // Speed assessment
        const speedDev = Math.abs(beltSpeed - 3.5) / 3.5 * 100;
        let speedStatus = '';
        if (speedDev > 20) speedStatus = ' | ⚠️ Speed deviation';

        // Energy impact from misalignment
        const frictionIncrease = absOffset > 0 ? (absOffset / 100 * 100) : 0;
        const energyNote = frictionIncrease > 5 ? ` | ⚡ +${frictionIncrease.toFixed(1)}% friction loss` : '';

        return `${trackingEmoji} Belt Speed: ${beltSpeed} m/s | Tracking: ${trackingStatus} (${trackingOffset >= 0 ? '+' : ''}${trackingOffset}mm) | Tension: ${beltTension} kN${tensionStatus}${speedStatus}${energyNote}`;
      }
      
      case 5: { // Return & Tail Section
        const tailTension = getParamValue('tailTension', 40);
        const returnVibration = getParamValue('returnVibration', 2.5);
        const takeUpPosition = getParamValue('takeUpPosition', 500);

        // Vibration assessment
        let vibStatus = 'Normal';
        let vibEmoji = '✅';
        if (returnVibration > 7.5) { vibStatus = 'CRITICAL — Bearing Failure Likely'; vibEmoji = '🚨'; }
        else if (returnVibration > 5.0) { vibStatus = 'HIGH — Inspect Idlers'; vibEmoji = '⚠️'; }
        else if (returnVibration > 3.5) { vibStatus = 'Elevated'; vibEmoji = '🔶'; }

        // Take-up position assessment (high value = belt stretching)
        let takeUpStatus = '';
        if (takeUpPosition > 800) takeUpStatus = ' | ⚠️ Belt stretched — consider replacement';
        else if (takeUpPosition > 650) takeUpStatus = ' | Belt elongation detected';

        // Tension balance
        const headTension = 80; // reference
        const tensionRatio = tailTension / headTension;
        let balanceStatus = '';
        if (tensionRatio < 0.3 || tensionRatio > 0.7) balanceStatus = ' | ⚠️ Tension imbalance';

        return `${vibEmoji} Tail Tension: ${tailTension} kN | Vibration: ${returnVibration} mm/s (${vibStatus}) | Take-Up: ${takeUpPosition}mm${takeUpStatus}${balanceStatus}`;
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
    const newParams: ProcessParameters = { ...processParameters };
    
    Object.keys(pendingParameters).forEach(stepId => {
      const stepIdNum = parseInt(stepId);
      const pendingStepParams = pendingParameters[stepIdNum];
      
      const filteredParams: {[key: string]: string | number} = {};
      if (pendingStepParams) {
        Object.keys(pendingStepParams).forEach(key => {
          const value = pendingStepParams[key];
          if (value !== undefined && value !== null && value !== '') {
            filteredParams[key] = value;
          }
        });
      }
      
      if (Object.keys(filteredParams).length > 0) {
        newParams[stepIdNum] = {
          ...(newParams[stepIdNum] || {}),
          ...filteredParams
        };
      } else {
        delete newParams[stepIdNum];
      }
    });
    
    Object.keys(newParams).forEach(stepId => {
      const stepIdNum = parseInt(stepId);
      if (!newParams[stepIdNum] || Object.keys(newParams[stepIdNum]).length === 0) {
        delete newParams[stepIdNum];
      }
    });
    
    setProcessParameters({ ...newParams });
    if (isSimulationRunning) {
      setIsSimulationRunning(false);
      setSimulationResults({});
    }
  };

  // Check if there are pending changes
  const hasPendingChanges = () => {
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

  // ═══════════════════════════════════════════════════════════════════
  // CONVEYOR BELT SIMULATION ENGINE — Failure Mode Detection
  // ═══════════════════════════════════════════════════════════════════
  const startSimulation = () => {
    if (isSimulationRunning) {
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

    setIsSimulationRunning(true);
    
    const results: {[stepId: number]: any} = {};
    const newStatuses: {[stepId: number]: 'active' | 'inactive' | 'emergency'} = {};
    
    // Merge pending + applied parameters
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
    
    const getVal = (stepId: number, key: string, def: number) => {
      const v = allParameters[stepId]?.[key];
      if (v === undefined || v === null || v === '') return def;
      const p = typeof v === 'number' ? v : parseFloat(String(v));
      return isNaN(p) ? def : p;
    };

    // ── Zone 1: Loading Zone ──
    (() => {
      const feedRate = getVal(1, 'feedRate', 1200);
      const impactForce = getVal(1, 'impactForce', 15);
      const materialSize = getVal(1, 'materialSize', 150);
      
      const alerts: string[] = [];
      let status: 'active' | 'inactive' | 'emergency' = 'active';
      
      if (impactForce > 25) { alerts.push('CRITICAL: Impact force exceeds belt rating — belt damage risk'); status = 'emergency'; }
      else if (impactForce > 20) alerts.push('Warning: Elevated impact force — monitor belt surface');
      
      if (materialSize > 300) { alerts.push('CRITICAL: Oversize material detected — screen or reduce size'); status = 'emergency'; }
      else if (materialSize > 200) alerts.push('Warning: Material size above optimal range');
      
      if (feedRate > 1500) alerts.push('Warning: Feed rate exceeds design capacity');
      
      const efficiency = Math.max(60, 95 - Math.abs(feedRate - 1200) / 1200 * 15 - Math.max(0, impactForce - 15) * 2);
      
      results[1] = { status: alerts.some(a => a.startsWith('CRITICAL')) ? 'critical' : alerts.length > 0 ? 'warning' : 'normal', efficiency, alerts, notes: `Loading zone operating at ${efficiency.toFixed(1)}% efficiency. Feed rate: ${feedRate} tph.` };
      newStatuses[1] = status;
    })();

    // ── Zone 2: Belt Splices & Joints (CRITICAL ZONE) ──
    (() => {
      const spliceHealth = getVal(2, 'spliceHealth', 95);
      const spliceTemp = getVal(2, 'spliceTemperature', 45);
      const crackWidth = getVal(2, 'crackWidth', 0);
      
      const alerts: string[] = [];
      let status: 'active' | 'inactive' | 'emergency' = 'active';
      
      // Splice health thresholds
      if (spliceHealth < 40) { alerts.push('🚨 CRITICAL: Splice health below 40% — BELT RUPTURE IMMINENT. Stop belt and repair immediately.'); status = 'emergency'; }
      else if (spliceHealth < 60) alerts.push('⚠️ Warning: Splice health below 60% — Schedule maintenance within 1-3 days');
      else if (spliceHealth < 80) alerts.push('🔶 Caution: Splice health degrading — plan inspection');
      
      // Temperature thresholds
      if (spliceTemp > 120) { alerts.push('🚨 CRITICAL: Splice temperature above 120°C — FIRE RISK from friction heating'); status = 'emergency'; }
      else if (spliceTemp > 80) alerts.push('⚠️ Warning: Splice overheating — check for friction or misalignment');
      else if (spliceTemp > 65) alerts.push('🔶 Caution: Splice temperature elevated');
      
      // Crack detection
      if (crackWidth > 5) { alerts.push('🚨 CRITICAL: Crack width exceeds 5mm — structural failure imminent'); status = 'emergency'; }
      else if (crackWidth > 2) alerts.push('⚠️ Warning: Visible crack detected at splice — deterioration in progress');
      else if (crackWidth > 0.5) alerts.push('🔶 Caution: Minor crack detected — monitor progression');
      
      const efficiency = Math.max(30, spliceHealth * 0.9 - crackWidth * 5 - Math.max(0, (spliceTemp - 45) / 2));
      
      results[2] = { status: status === 'emergency' ? 'critical' : alerts.length > 0 ? 'warning' : 'normal', efficiency, alerts, notes: `Splice integrity at ${spliceHealth}%. ${status === 'emergency' ? 'IMMEDIATE ACTION REQUIRED.' : 'Monitoring active.'}` };
      newStatuses[2] = status;
    })();

    // ── Zone 3: Drive System ──
    (() => {
      const motorPower = getVal(3, 'motorPower', 250);
      const motorCurrent = getVal(3, 'motorCurrent', 480);
      const driveTemp = getVal(3, 'driveTemperature', 55);
      
      const alerts: string[] = [];
      let status: 'active' | 'inactive' | 'emergency' = 'active';
      const currentRatio = motorCurrent / 480;
      
      if (currentRatio > 1.5) { alerts.push('🚨 CRITICAL: Motor current at 150%+ of rated — immediate overload shutdown risk'); status = 'emergency'; }
      else if (currentRatio > 1.2) alerts.push('⚠️ Warning: Motor current elevated — check for mechanical binding or overload');
      
      if (driveTemp > 100) { alerts.push('🚨 CRITICAL: Drive temperature above 100°C — bearing failure or cooling failure'); status = 'emergency'; }
      else if (driveTemp > 80) alerts.push('⚠️ Warning: Drive temperature elevated — inspect cooling system');
      
      if (motorPower > 350) alerts.push('⚠️ Warning: Motor power demand exceeds 140% of rated — check belt loading');
      
      const efficiency = Math.max(50, 94 - Math.max(0, (currentRatio - 1) * 30) - Math.max(0, (driveTemp - 55) / 5));
      
      results[3] = { status: status === 'emergency' ? 'critical' : alerts.length > 0 ? 'warning' : 'normal', efficiency, alerts, notes: `Drive system at ${efficiency.toFixed(1)}% efficiency. Current: ${(currentRatio * 100).toFixed(0)}% rated.` };
      newStatuses[3] = status;
    })();

    // ── Zone 4: Carrying Span ──
    (() => {
      const beltSpeed = getVal(4, 'beltSpeed', 3.5);
      const trackingOffset = getVal(4, 'trackingOffset', 0);
      const beltTension = getVal(4, 'beltTension', 80);
      
      const alerts: string[] = [];
      let status: 'active' | 'inactive' | 'emergency' = 'active';
      const absOffset = Math.abs(trackingOffset);
      
      // Tracking / alignment
      if (absOffset > 30) { alerts.push('🚨 CRITICAL: Belt misalignment >30mm — edge damage and belt runoff risk. Stop and realign.'); status = 'emergency'; }
      else if (absOffset > 15) alerts.push('⚠️ Warning: Belt tracking offset >15mm — accelerated edge wear');
      else if (absOffset > 5) alerts.push('🔶 Caution: Minor belt drift detected');
      
      // Tension
      const tensionDev = Math.abs(beltTension - 80) / 80 * 100;
      if (tensionDev > 40) { alerts.push('🚨 CRITICAL: Belt tension anomaly >40% — splice stress and slippage risk'); status = 'emergency'; }
      else if (tensionDev > 20) alerts.push('⚠️ Warning: Belt tension deviation — check take-up system');
      
      // Speed
      const speedDev = Math.abs(beltSpeed - 3.5) / 3.5 * 100;
      if (speedDev > 30) { alerts.push('🚨 CRITICAL: Belt speed anomaly — drive malfunction or belt slippage'); status = 'emergency'; }
      else if (speedDev > 15) alerts.push('⚠️ Warning: Belt speed variation detected');
      
      const efficiency = Math.max(50, 95 - absOffset * 1.5 - tensionDev * 0.5 - speedDev * 0.3);
      
      results[4] = { status: status === 'emergency' ? 'critical' : alerts.length > 0 ? 'warning' : 'normal', efficiency, alerts, notes: `Carrying span tracking: ${absOffset < 5 ? 'centered' : 'offset ' + trackingOffset + 'mm'}. Tension: ${beltTension} kN.` };
      newStatuses[4] = status;
    })();

    // ── Zone 5: Return & Tail Section ──
    (() => {
      const tailTension = getVal(5, 'tailTension', 40);
      const returnVibration = getVal(5, 'returnVibration', 2.5);
      const takeUpPosition = getVal(5, 'takeUpPosition', 500);
      
      const alerts: string[] = [];
      let status: 'active' | 'inactive' | 'emergency' = 'active';
      
      // Vibration
      if (returnVibration > 7.5) { alerts.push('🚨 CRITICAL: Return idler vibration >7.5 mm/s — bearing seizure likely, belt burn-through risk'); status = 'emergency'; }
      else if (returnVibration > 5.0) alerts.push('⚠️ Warning: Elevated return idler vibration — inspect bearings');
      else if (returnVibration > 3.5) alerts.push('🔶 Caution: Return vibration slightly elevated');
      
      // Tension balance (tail should be ~50% of head)
      const headTension = getVal(4, 'beltTension', 80);
      const tensionRatio = tailTension / Math.max(headTension, 1);
      if (tensionRatio < 0.3 || tensionRatio > 0.7) {
        alerts.push('⚠️ Warning: Head-to-tail tension imbalance — belt tracking affected');
      }
      
      // Take-up position (belt stretch indicator)
      if (takeUpPosition > 900) { alerts.push('🚨 CRITICAL: Take-up at maximum travel — belt needs replacement'); status = 'emergency'; }
      else if (takeUpPosition > 750) alerts.push('⚠️ Warning: Belt elongation detected — approaching take-up limit');
      else if (takeUpPosition > 650) alerts.push('🔶 Caution: Belt stretching noted — monitor');
      
      const efficiency = Math.max(50, 95 - Math.max(0, (returnVibration - 2.5) * 8) - Math.max(0, (takeUpPosition - 500) / 50));
      
      results[5] = { status: status === 'emergency' ? 'critical' : alerts.length > 0 ? 'warning' : 'normal', efficiency, alerts, notes: `Return section vibration: ${returnVibration} mm/s. Take-up: ${takeUpPosition}mm.` };
      newStatuses[5] = status;
    })();

    // ═══ CONVEYOR CASCADE LOGIC ═══
    // Drive System (Zone 3) failure → ENTIRE belt stops
    if (newStatuses[3] === 'emergency') {
      [1, 2, 4, 5].forEach(id => {
        if (newStatuses[id] !== 'emergency') {
          newStatuses[id] = 'inactive';
          results[id].alerts.push('⏹️ STOPPED: Drive system failure — belt halted');
        }
      });
    }
    
    // Splice (Zone 2) emergency → Loading Zone warning (material on damaged belt)
    if (newStatuses[2] === 'emergency' && newStatuses[1] === 'active') {
      results[1].alerts.push('⚠️ Warning: Belt splice critical — loading may worsen damage');
    }
    
    // Carrying span misalignment → accelerates splice wear
    if (newStatuses[4] === 'emergency' && newStatuses[2] !== 'emergency') {
      results[2].alerts.push('⚠️ Warning: Belt misalignment accelerating splice wear');
    }
    
    setStepStatuses(newStatuses);
    setSimulationResults(results);
  };


  return (
    <div className="min-h-full space-y-6 p-4 sm:p-6 w-full">
      {/* Header Section */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#26436C' }}>
              <span>Conveyor Belt</span>{' '}
              <span>Digital Twin</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Intelligent Health Monitoring & Predictive Maintenance — Belt Joint Rupture and Conveyor Belt Damage Detection for Iron Ore Mining
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
                {registeredDevices.length} Sensor{registeredDevices.length !== 1 ? 's' : ''}
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
              {showParameterConfig ? 'Hide' : 'Show'} Sensors
            </Button>
            <Button
              variant={isSimulationRunning ? "destructive" : "default"}
              size="sm"
              onClick={() => startSimulation()}
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

      {/* Sensor / Parameter Configuration Panel */}
      {showParameterConfig && (
        <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">IoT Sensor Configuration — Conveyor Belt Monitoring</h3>
            </div>
            <div className="flex items-center gap-2">
              {hasPendingChanges() && (
                <Badge variant="secondary" className="text-xs bg-warning/20 text-warning-foreground">
                  Pending Changes
                </Badge>
              )}
              <Badge variant="outline">
                {Object.keys(processParameters).length} Zone(s) Configured
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Configure sensor readings for each monitoring zone. Adjust values to simulate different conveyor operating conditions and detect failure scenarios. Click "Apply Changes" to update.
          </p>
          
          {/* Apply Button */}
          {hasPendingChanges() && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">You have unsaved sensor parameter changes</span>
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
                      const pendingValue = pendingParameters[step.id]?.[param.key];
                      const appliedValue = processParameters[step.id]?.[param.key];
                      
                      let currentValue: string;
                      if (pendingValue !== undefined) {
                        currentValue = String(pendingValue);
                      } else if (appliedValue !== undefined && appliedValue !== null && appliedValue !== '') {
                        currentValue = String(appliedValue);
                      } else {
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
                                handleParameterChange(step.id, param.key, e.target.value);
                              }}
                              onFocus={(e) => {
                                if (currentValue === param.default && !pendingParameters[step.id]?.[param.key] && !processParameters[step.id]?.[param.key]) {
                                  e.target.select();
                                }
                              }}
                              onBlur={(e) => {
                                handleParameterChange(step.id, param.key, e.target.value);
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
          {/* Conveyor Belt Visualization */}
          <ErrorBoundary fallback={
            <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
              <div className="h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                  <h3 className="text-lg font-semibold mb-2">Visualization Unavailable</h3>
                  <p className="text-sm text-muted-foreground">
                    The conveyor belt visualization will be available when simulation is integrated.
                  </p>
                </div>
              </div>
            </Card>
          }>
            <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-primary" />
                  Conveyor Belt — Real-time Health Monitor
                </h3>
                {isSimulationRunning ? (
                  <Badge variant="default" className="text-xs bg-success animate-pulse">
                    <Activity className="w-3 h-3 mr-1 animate-spin" />
                    Monitoring Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Ready to Start
                  </Badge>
                )}
              </div>
              
              {/* Conveyor Belt Schematic — Animated SVG Visualization */}
              <div className="mb-4 relative w-full rounded-xl overflow-hidden border border-border/50" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
                <div className="p-6" style={{ minHeight: '320px' }}>
                  {/* Title */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-white/90 text-sm font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Conveyor Belt System Schematic
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span><span className="text-white/60">Active</span></span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span><span className="text-white/60">Inactive</span></span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span><span className="text-white/60">Emergency</span></span>
                    </div>
                  </div>

                  {/* Conveyor SVG */}
                  <svg viewBox="0 0 900 200" className="w-full" style={{ maxHeight: '220px' }}>
                    {/* Belt path - main conveyor belt */}
                    <defs>
                      <linearGradient id="beltGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#475569" />
                        <stop offset="50%" stopColor="#64748b" />
                        <stop offset="100%" stopColor="#475569" />
                      </linearGradient>
                      <linearGradient id="oreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#b45309" />
                        <stop offset="100%" stopColor="#78350f" />
                      </linearGradient>
                    </defs>

                    {/* Ground/Frame */}
                    <rect x="50" y="150" width="800" height="6" rx="3" fill="#334155" />
                    <rect x="50" y="160" width="10" height="30" rx="2" fill="#475569" />
                    <rect x="840" y="160" width="10" height="30" rx="2" fill="#475569" />
                    <rect x="280" y="160" width="6" height="25" rx="2" fill="#475569" />
                    <rect x="500" y="160" width="6" height="25" rx="2" fill="#475569" />
                    <rect x="680" y="160" width="6" height="25" rx="2" fill="#475569" />

                    {/* Top belt (carrying side) */}
                    <rect x="60" y="90" width="780" height="10" rx="3" fill="url(#beltGrad)" />
                    
                    {/* Bottom belt (return side) */}
                    <rect x="60" y="140" width="780" height="6" rx="3" fill="#334155" opacity="0.6" />

                    {/* Ore material on belt */}
                    {isSimulationRunning && stepStatuses[3] !== 'emergency' && (
                      <>
                        <path d="M 120 90 Q 150 65 180 90" fill="url(#oreGrad)" opacity="0.9">
                          <animateTransform attributeName="transform" type="translate" values="0,0;600,0" dur="8s" repeatCount="indefinite" />
                        </path>
                        <path d="M 140 90 Q 165 70 190 90" fill="url(#oreGrad)" opacity="0.7">
                          <animateTransform attributeName="transform" type="translate" values="0,0;600,0" dur="8s" begin="2s" repeatCount="indefinite" />
                        </path>
                        <path d="M 100 90 Q 125 72 150 90" fill="url(#oreGrad)" opacity="0.8">
                          <animateTransform attributeName="transform" type="translate" values="0,0;600,0" dur="8s" begin="4.5s" repeatCount="indefinite" />
                        </path>
                      </>
                    )}

                    {/* Head Pulley (Drive - Zone 3) */}
                    <circle cx="830" cy="115" r="28" fill="none" stroke={stepStatuses[3] === 'emergency' ? '#ef4444' : stepStatuses[3] === 'active' ? '#10b981' : '#f59e0b'} strokeWidth="3" />
                    <circle cx="830" cy="115" r="18" fill="#1e293b" stroke="#475569" strokeWidth="2">
                      {isSimulationRunning && stepStatuses[3] === 'active' && (
                        <animateTransform attributeName="transform" type="rotate" values="0 830 115;360 830 115" dur="2s" repeatCount="indefinite" />
                      )}
                    </circle>
                    <circle cx="830" cy="115" r="4" fill={stepStatuses[3] === 'emergency' ? '#ef4444' : '#10b981'} />

                    {/* Tail Pulley (Return - Zone 5) */}
                    <circle cx="70" cy="115" r="28" fill="none" stroke={stepStatuses[5] === 'emergency' ? '#ef4444' : stepStatuses[5] === 'active' ? '#10b981' : '#f59e0b'} strokeWidth="3" />
                    <circle cx="70" cy="115" r="18" fill="#1e293b" stroke="#475569" strokeWidth="2">
                      {isSimulationRunning && stepStatuses[5] === 'active' && (
                        <animateTransform attributeName="transform" type="rotate" values="0 70 115;360 70 115" dur="2.5s" repeatCount="indefinite" />
                      )}
                    </circle>
                    <circle cx="70" cy="115" r="4" fill={stepStatuses[5] === 'emergency' ? '#ef4444' : '#10b981'} />

                    {/* Carrying Idlers (Zone 4) */}
                    {[200, 320, 440, 560, 680].map((x, i) => (
                      <g key={`idler-${i}`}>
                        <circle cx={x} cy="105" r="8" fill="#1e293b" stroke={stepStatuses[4] === 'emergency' ? '#ef4444' : '#475569'} strokeWidth="2">
                          {isSimulationRunning && stepStatuses[4] === 'active' && (
                            <animateTransform attributeName="transform" type="rotate" values={`0 ${x} 105;360 ${x} 105`} dur="1s" repeatCount="indefinite" />
                          )}
                        </circle>
                      </g>
                    ))}

                    {/* Loading Zone Hopper (Zone 1) */}
                    <path d="M 130 30 L 110 80 L 190 80 L 170 30 Z" fill="none" stroke={stepStatuses[1] === 'emergency' ? '#ef4444' : stepStatuses[1] === 'active' ? '#10b981' : '#f59e0b'} strokeWidth="2.5" />
                    <path d="M 135 35 L 120 72 L 180 72 L 165 35 Z" fill="#1e293b" opacity="0.5" />
                    {/* Ore in hopper */}
                    <path d="M 125 55 L 135 72 L 165 72 L 175 55 Z" fill="url(#oreGrad)" opacity="0.6" />
                    {/* Feed chute */}
                    <rect x="145" y="75" width="10" height="15" fill="#475569" />

                    {/* Splice/Joint markers (Zone 2) */}
                    {[250, 450, 650].map((x, i) => (
                      <g key={`splice-${i}`}>
                        <rect x={x - 3} y="88" width="6" height="14" rx="1" fill={stepStatuses[2] === 'emergency' ? '#ef4444' : stepStatuses[2] === 'active' ? '#10b981' : '#f59e0b'} opacity="0.9" />
                        {stepStatuses[2] === 'emergency' && (
                          <rect x={x - 5} y="86" width="10" height="18" rx="2" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.8">
                            <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
                          </rect>
                        )}
                      </g>
                    ))}

                    {/* Motor (Drive System) */}
                    <rect x="848" y="95" width="40" height="40" rx="6" fill="#1e293b" stroke={stepStatuses[3] === 'emergency' ? '#ef4444' : stepStatuses[3] === 'active' ? '#10b981' : '#f59e0b'} strokeWidth="2" />
                    <text x="868" y="118" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">M</text>
                    {stepStatuses[3] === 'active' && isSimulationRunning && (
                      <circle cx="868" cy="108" r="3" fill="#10b981">
                        <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Zone Labels */}
                    <text x="150" y="22" textAnchor="middle" fill={stepStatuses[1] === 'emergency' ? '#ef4444' : '#94a3b8'} fontSize="10" fontWeight="600">① Loading</text>
                    <text x="350" y="78" textAnchor="middle" fill={stepStatuses[2] === 'emergency' ? '#ef4444' : '#94a3b8'} fontSize="10" fontWeight="600">② Splices</text>
                    <text x="868" y="88" textAnchor="middle" fill={stepStatuses[3] === 'emergency' ? '#ef4444' : '#94a3b8'} fontSize="10" fontWeight="600">③ Drive</text>
                    <text x="500" y="78" textAnchor="middle" fill={stepStatuses[4] === 'emergency' ? '#ef4444' : '#94a3b8'} fontSize="10" fontWeight="600">④ Carrying</text>
                    <text x="70" y="175" textAnchor="middle" fill={stepStatuses[5] === 'emergency' ? '#ef4444' : '#94a3b8'} fontSize="10" fontWeight="600">⑤ Return</text>

                    {/* Direction arrows */}
                    {isSimulationRunning && stepStatuses[3] !== 'emergency' && (
                      <>
                        <polygon points="380,82 395,88 380,94" fill="#10b981" opacity="0.6">
                          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.5s" repeatCount="indefinite" />
                        </polygon>
                        <polygon points="580,82 595,88 580,94" fill="#10b981" opacity="0.6">
                          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                        </polygon>
                      </>
                    )}
                  </svg>

                  {/* Bottom status bar */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                    <div className="text-white/60 text-xs">
                      {isSimulationRunning ? '● System Monitoring Active' : '○ Click "Start Simulation" to begin monitoring'}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>Belt Length: 1.5 km</span>
                      <span>Speed: 3.5 m/s</span>
                      <span>Capacity: 1,200 tph</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="h-[400px] bg-muted/20 rounded-lg border border-border relative overflow-auto">
                <div className="p-4 space-y-3">
                  {processSteps.map((step) => {
                    const status = stepStatuses[step.id] || 'inactive';
                    const stepEquipment = equipmentData.find((eq: { id: string; name: string }) => eq.id === `unity-${step.title}` || eq.name === step.title);
                    const Icon = step.icon;
                    const simResult = simulationResults[step.id];
                    
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
                              {simResult && isSimulationRunning && (
                                <Badge variant="outline" className={`text-xs ${
                                  simResult.efficiency >= 85 ? 'bg-success/10 text-success border-success/30' :
                                  simResult.efficiency >= 70 ? 'bg-warning/10 text-warning border-warning/30' :
                                  'bg-destructive/10 text-destructive border-destructive/30'
                                }`}>
                                  {simResult.efficiency.toFixed(0)}% eff.
                                </Badge>
                              )}
                            </div>
                            {/* Show realtime sensor data */}
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
                            {/* Show simulation alerts */}
                            {simResult && isSimulationRunning && simResult.alerts.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {simResult.alerts.slice(0, 2).map((alert: string, idx: number) => (
                                  <div key={idx} className="text-xs text-muted-foreground truncate max-w-[400px]">{alert}</div>
                                ))}
                                {simResult.alerts.length > 2 && (
                                  <div className="text-xs text-muted-foreground">+{simResult.alerts.length - 2} more alerts</div>
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
                              const deviceId = `conveyor-${step.title.toLowerCase().replace(/\s+/g, '-')}`;
                              setStepStatuses(prev => ({ ...prev, [step.id]: 'active' }));
                              try {
                                await realtimeService.sendCommand(deviceId, 'start', {});
                              } catch (error) {
                                console.error(`Error starting ${step.title}:`, error);
                                setStepStatuses(prev => ({ ...prev, [step.id]: 'inactive' }));
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
                              const deviceId = `conveyor-${step.title.toLowerCase().replace(/\s+/g, '-')}`;
                              setStepStatuses(prev => ({ ...prev, [step.id]: 'inactive' }));
                              try {
                                await realtimeService.sendCommand(deviceId, 'stop', {});
                              } catch (error) {
                                console.error(`Error stopping ${step.title}:`, error);
                                setStepStatuses(prev => ({ ...prev, [step.id]: 'active' }));
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

          {/* Monitoring Zone Details — Summary / Detailed View */}
          <Card className="p-6 glass rounded-modern-xl shadow-depth-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Conveyor Monitoring Zones
              </h3>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{processSteps.length} Zones</Badge>
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
                      <TableHead>Zone</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sensor Readings</TableHead>
                      <TableHead>Assessment</TableHead>
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
                                const currentStatus = stepStatuses[step.id] || 'inactive';
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
                const stepOutput = getStepOutput(step);
                const simResult = simulationResults[step.id];
                
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
                              Zone {step.id}
                            </Badge>
                            <h4 className="text-base font-semibold">{step.title}</h4>
                            {(() => {
                              const currentStatus = stepStatuses[step.id] || 'inactive';
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

                        {/* Sensor Metrics */}
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

                        {/* Simulation Alerts */}
                        {simResult && isSimulationRunning && simResult.alerts.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="text-xs font-semibold mb-1 text-destructive">Simulation Alerts:</div>
                            {simResult.alerts.map((alert: string, idx: number) => (
                              <div key={idx} className="text-xs text-muted-foreground mb-0.5">{alert}</div>
                            ))}
                          </div>
                        )}

                        {/* Output */}
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-2 text-sm">
                            <ArrowRight className="w-4 h-4 text-success" />
                            <span className="text-muted-foreground">Assessment:</span>
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
                  <h3 className="text-lg font-semibold">Conveyor Health</h3>
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
                  This Digital Twin monitors a conveyor belt system in an iron ore mine. 
                  It detects early signs of belt joint deterioration, splice failures, misalignment, 
                  and equipment wear to prevent unplanned downtime.
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="text-xs text-muted-foreground mb-1">Monitoring Zones</div>
                    <div className="text-2xl font-bold text-primary">{processSteps.length}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-success/5 border border-success/10">
                    <div className="text-xs text-muted-foreground mb-1">Configured Zones</div>
                    <div className="text-2xl font-bold text-success">
                      {Object.keys(processParameters).length}
                    </div>
                  </div>
                </div>

                {/* Dynamic KPIs */}
                {(() => {
                  const kpis = computeKPIs();
                  const healthVal = parseFloat(kpis.healthIndex);
                  const healthColor = healthVal > 80 ? 'text-success' : healthVal > 60 ? 'text-warning' : 'text-destructive';
                  
                  return (
                    <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <h4 className="font-medium text-sm mb-2">Belt Health KPIs</h4>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Belt Health Index</span>
                          <span className={`font-semibold ${healthColor}`}>{kpis.healthIndex}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Splice Integrity</span>
                          <span className="font-semibold">{kpis.spliceIntegrity}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">MTBF</span>
                          <span className="font-semibold">{kpis.mtbf}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Next Maintenance</span>
                          <span className={`font-semibold ${kpis.nextMaintenance === 'Immediate' ? 'text-destructive' : kpis.nextMaintenance.includes('1-3') ? 'text-warning' : ''}`}>{kpis.nextMaintenance}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Energy Efficiency</span>
                          <span className="font-semibold">{kpis.energyEfficiency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Belt Availability</span>
                          <span className="font-semibold">{kpis.availability}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Problem Context */}
                <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                  <h4 className="font-medium text-sm mb-2">NMDC Problem Context</h4>
                  <p className="text-xs text-muted-foreground">
                    Belt joint rupture and conveyor belt damage are major operational challenges in iron ore mining. 
                    This system uses IoT sensors, AI vision, and predictive analytics to detect early deterioration 
                    and prevent catastrophic failures.
                  </p>
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
