import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, AlertTriangle, CheckCircle2, Clock, Wrench } from "lucide-react";
import { useState, useEffect } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { EquipmentCard, type EquipmentMaintenance } from "@/components/maintenance/EquipmentCard";
import { realtimeService } from "@/lib/realtimeService";

const initialMaintenanceSchedule = [
  {
    equipment: "Ball Mill Grinder",
    task: "Liner Replacement",
    date: "2025-10-05",
    priority: "high",
    completion: 0,
    status: "scheduled",
  },
  {
    equipment: "Gyratory Crusher",
    task: "Bearing Inspection",
    date: "2025-10-08",
    priority: "medium",
    completion: 0,
    status: "scheduled",
  },
  {
    equipment: "Vibrating Screen",
    task: "Routine Maintenance",
    date: "2025-10-02",
    priority: "low",
    completion: 75,
    status: "in-progress",
  },
];

const initialEquipmentHealth = [
  {
    name: "Hopper",
    health: 92,
    nextMaintenance: "45 days",
    alerts: 0,
  },
  {
    name: "Gyratory Crusher",
    health: 78,
    nextMaintenance: "4 days",
    alerts: 1,
  },
  {
    name: "Ball Mill Grinder",
    health: 85,
    nextMaintenance: "7 days",
    alerts: 0,
  },
  {
    name: "Magnetic Separator",
    health: 95,
    nextMaintenance: "In Progress",
    alerts: 0,
  },
  {
    name: "Vibrating Screen",
    health: 88,
    nextMaintenance: "12 days",
    alerts: 0,
  },
  {
    name: "Spiral Classifier",
    health: 82,
    nextMaintenance: "8 days",
    alerts: 0,
  },
];

// Equipment in correct material flow sequence: Hopper → Vibrating Feeder → Gyratory Crusher → Conveyor Belt → Vibrating Screen → Conveyor Belt → Ball Mill Grinder → Spiral Classifier → Magnetic Separator
const initialEquipmentGrid: EquipmentMaintenance[] = [
  {
    id: "ore-hopper",
    name: "Hopper",
    type: "Storage",
    status: "active",
    health: {
      score: 88,
      wearLevel: 35,
      temperature: 48,
      powerConsumption: 0,
      lastMaintenance: "12 days ago",
      nextMaintenance: "18 days",
    },
    alerts: 0,
  },
  {
    id: "vibrating-feeder",
    name: "Vibrating Feeder",
    type: "Feeding System",
    status: "active",
    health: {
      score: 82,
      wearLevel: 42,
      temperature: 52,
      powerConsumption: 95,
      lastMaintenance: "20 days ago",
      nextMaintenance: "10 days",
    },
    alerts: 1,
  },
  {
    id: "gyratory-crusher",
    name: "Gyratory Crusher",
    type: "Primary Crusher",
    status: "active",
    health: {
      score: 76,
      wearLevel: 58,
      temperature: 68,
      powerConsumption: 240,
      lastMaintenance: "35 days ago",
      nextMaintenance: "6 days",
    },
    alerts: 2,
  },
  {
    id: "conveyor-1",
    name: "Conveyor Belt",
    type: "Transport",
    status: "active",
    health: {
      score: 85,
      wearLevel: 45,
      temperature: 55,
      powerConsumption: 180,
      lastMaintenance: "15 days ago",
      nextMaintenance: "25 days",
    },
    alerts: 0,
  },
  {
    id: "vibrating-screen",
    name: "Vibrating Screen",
    type: "Classification",
    status: "active",
    health: {
      score: 91,
      wearLevel: 28,
      temperature: 45,
      powerConsumption: 140,
      lastMaintenance: "18 days ago",
      nextMaintenance: "24 days",
    },
    alerts: 0,
  },
  {
    id: "conveyor-2",
    name: "Conveyor Belt",
    type: "Transport",
    status: "active",
    health: {
      score: 87,
      wearLevel: 38,
      temperature: 52,
      powerConsumption: 175,
      lastMaintenance: "12 days ago",
      nextMaintenance: "22 days",
    },
    alerts: 0,
  },
  {
    id: "ball-mill-grinder",
    name: "Ball Mill Grinder",
    type: "Grinding",
    status: "active",
    health: {
      score: 84,
      wearLevel: 47,
      temperature: 62,
      powerConsumption: 320,
      lastMaintenance: "9 days ago",
      nextMaintenance: "15 days",
    },
    alerts: 1,
  },
  {
    id: "spiral-classifier",
    name: "Spiral Classifier",
    type: "Classification",
    status: "active",
    health: {
      score: 79,
      wearLevel: 52,
      temperature: 48,
      powerConsumption: 85,
      lastMaintenance: "22 days ago",
      nextMaintenance: "8 days",
    },
    alerts: 0,
  },
  {
    id: "magnetic-separator",
    name: "Magnetic Separator",
    type: "Separation",
    status: "active",
    health: {
      score: 86,
      wearLevel: 41,
      temperature: 58,
      powerConsumption: 195,
      lastMaintenance: "14 days ago",
      nextMaintenance: "20 days",
    },
    alerts: 0,
  },
];

const Maintenance = () => {
  // Initialize scroll animations
  useScrollAnimation();
  
  const [, setIsRealtimeConnected] = useState(false);
  const [equipmentGrid, setEquipmentGrid] = useState<EquipmentMaintenance[]>(initialEquipmentGrid);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState(initialMaintenanceSchedule);
  const [equipmentHealth, setEquipmentHealth] = useState(initialEquipmentHealth);

  // Subscribe to real-time maintenance data
  useEffect(() => {
    // Try to connect to real-time service
    const wsUrl = import.meta.env['VITE_WS_URL'];
    const sseUrl = import.meta.env['VITE_SSE_URL'];

    if (wsUrl) {
      realtimeService.connectWebSocket(wsUrl);
    } else if (sseUrl) {
      realtimeService.connectSSE(sseUrl);
    }

    // Subscribe to maintenance updates
    const unsubscribeMaintenance = realtimeService.subscribe('maintenance', (data) => {
      const equipment = data.data['equipment'];
      const schedule = data.data['schedule'];
      const health = data.data['health'];
      
      if (equipment && Array.isArray(equipment)) {
        setEquipmentGrid(equipment as EquipmentMaintenance[]);
      }
      if (schedule && Array.isArray(schedule)) {
        setMaintenanceSchedule(schedule as typeof initialMaintenanceSchedule);
      }
      if (health && Array.isArray(health)) {
        setEquipmentHealth(health as typeof initialEquipmentHealth);
      }
    });

    // Subscribe to equipment health updates
    const unsubscribeEquipment = realtimeService.subscribe('equipment', (data) => {
      setEquipmentGrid(prev => {
        const index = prev.findIndex(eq => eq.id === data.deviceId);
        if (index >= 0) {
          const updated = [...prev];
          const existing = updated[index];
          const healthData = data.data['health'];
          const statusData = data.data['status'];
          const alertsData = data.data['alerts'];
          
          if (existing) {
            if (healthData && typeof healthData === 'object' && !Array.isArray(healthData)) {
              const currentHealth = existing.health;
              updated[index] = {
                ...existing,
                health: {
                  ...currentHealth,
                  ...(healthData as Partial<typeof currentHealth>),
                }
              };
            }
            
            if (statusData && typeof statusData === 'string' && 
                ['active', 'idle', 'fault', 'maintenance'].includes(statusData)) {
              updated[index] = {
                ...existing,
                status: statusData as 'active' | 'idle' | 'fault' | 'maintenance'
              };
            }
            
            if (typeof alertsData === 'number') {
              updated[index] = {
                ...existing,
                alerts: alertsData
              };
            }
          }
          
          return updated;
        }
        return prev;
      });
    });

    // Check connection status
    const statusInterval = setInterval(() => {
      setIsRealtimeConnected(realtimeService.getConnectionStatus());
    }, 1000);

    return () => {
      unsubscribeMaintenance();
      unsubscribeEquipment();
      clearInterval(statusInterval);
    };
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      case "low":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="w-4 h-4" />;
      case "in-progress":
        return <Wrench className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return "text-success";
    if (health >= 75) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="min-h-full space-y-6 p-4 sm:p-6 w-full">
      <div className="scroll-animate">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#26436C' }}>
          <span>AI</span>{' '}
          <span>Monitoring</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">AI-powered equipment monitoring and maintenance scheduling</p>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 scroll-animate">
        <Card className="p-4 sm:p-6 bg-card border-border glass rounded-modern-xl hover-lift hover-glow transition-all duration-300 animate-scale-in-center card-micro">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Alerts</p>
              <p className="text-2xl sm:text-3xl font-bold text-warning">1</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-warning animate-alert-pulse" aria-hidden="true" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-card border-border glass rounded-modern-xl hover-lift hover-glow transition-all duration-300 animate-scale-in-center card-micro">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Scheduled Tasks</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">3</p>
            </div>
            <Calendar className="w-8 h-8 text-primary animate-pulse-glow" aria-hidden="true" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-card border-border glass rounded-modern-xl hover-lift hover-glow transition-all duration-300 animate-scale-in-center card-micro">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg. Equipment Health</p>
              <p className="text-2xl sm:text-3xl font-bold text-success">87.5%</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-success animate-pulse-glow" aria-hidden="true" />
          </div>
        </Card>
      </div>

      <div className="scroll-animate space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Equipment Health Grid</h3>
            <p className="text-sm text-muted-foreground">
              Detailed status for crushers, mills, pumps, and auxiliary systems
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {equipmentGrid.map((equipment) => (
            <EquipmentCard key={equipment.id} equipment={equipment} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 scroll-animate">
        {/* Maintenance Schedule */}
        <Card className="p-4 sm:p-6 bg-card border-border glass rounded-modern-xl hover-lift transition-all duration-300">
          <h3 className="text-lg font-semibold mb-4">Maintenance Schedule</h3>
          <div className="space-y-4">
            {maintenanceSchedule.map((item, index) => (
              <div key={index} className="p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 transition-all duration-300 hover-lift">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(item.status)}
                      <h4 className="font-semibold">{item.equipment}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.task}</p>
                  </div>
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                </div>

                {item.status === "in-progress" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{item.completion}%</span>
                    </div>
                    <Progress 
                      value={item.completion} 
                      className="h-2"
                      aria-label={`${item.equipment} ${item.task} completion: ${item.completion}%`}
                    />
                  </div>
                )}

                {item.status === "scheduled" && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-2 focus-ring hover-lift"
                    onClick={() => {
                      console.log('View maintenance details for:', item.equipment);
                      alert(`Maintenance Details:\nEquipment: ${item.equipment}\nTask: ${item.task}\nScheduled: ${item.date}\nPriority: ${item.priority}`);
                    }}
                  >
                    View Details
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Equipment Health */}
        <Card className="p-4 sm:p-6 bg-card border-border glass rounded-modern-xl hover-lift transition-all duration-300">
          <h3 className="text-lg font-semibold mb-4">Equipment Health Monitor</h3>
          <div className="space-y-4">
            {equipmentHealth.map((equipment, index) => (
              <div key={index} className="p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 transition-all duration-300 hover-lift">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{equipment.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Next maintenance: {equipment.nextMaintenance}
                    </p>
                  </div>
                  {equipment.alerts > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                      {equipment.alerts}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Health Score</span>
                    <span className={`font-bold ${getHealthColor(equipment.health)}`}>
                      {equipment.health}%
                    </span>
                  </div>
                  <Progress 
                    value={equipment.health} 
                    className="h-2"
                    aria-label={`${equipment.name} health score: ${equipment.health}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Predictions */}
      <Card className="p-4 sm:p-6 bg-card border-border glass rounded-modern-xl hover-lift transition-all duration-300 scroll-animate">
        <h3 className="text-lg font-semibold mb-4">AI Maintenance Predictions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 hover:bg-warning/15 transition-all duration-300 hover-lift">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-1 animate-alert-pulse" aria-hidden="true" />
              <div>
                <p className="font-medium text-warning mb-1">SAG Mill Liner Wear</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Predicted liner replacement needed in 4-6 days based on current wear patterns
                </p>
                <Badge variant="outline" className="text-xs">High Confidence: 94%</Badge>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-success/10 border border-success/20 hover:bg-success/15 transition-all duration-300 hover-lift">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-1 animate-pulse-glow" aria-hidden="true" />
              <div>
                <p className="font-medium text-success mb-1">Optimal Performance</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Primary crusher operating within optimal parameters. No maintenance required
                </p>
                <Badge variant="outline" className="text-xs">Next Check: 45 days</Badge>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all duration-300 hover-lift">
            <div className="flex items-start gap-3">
              <Wrench className="w-5 h-5 text-primary flex-shrink-0 mt-1 animate-pulse-glow" aria-hidden="true" />
              <div>
                <p className="font-medium text-primary mb-1">Preventive Opportunity</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Ball mill bearing inspection recommended to prevent future issues
                </p>
                <Badge variant="outline" className="text-xs">Schedule Soon</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Maintenance;
