import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { TrendingDown, Zap, Calendar, Clock, Radio } from "lucide-react";
import { useState, useEffect } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { realtimeService } from "@/lib/realtimeService";

const energyByEquipment = [
  { name: "SAG Mill", value: 1200, color: "hsl(var(--energy-green))" },
  { name: "Ball Mill", value: 950, color: "hsl(var(--data-blue))" },
  { name: "Crusher", value: 450, color: "hsl(var(--warning))" },
  { name: "Conveyors", value: 180, color: "hsl(var(--steel))" },
  { name: "Pumps", value: 120, color: "hsl(280, 70%, 60%)" },
];

const hourlyData = [
  { hour: "00", grid: 2200 },
  { hour: "04", grid: 2400 },
  { hour: "08", grid: 1800 },
  { hour: "12", grid: 1200 },
  { hour: "16", grid: 1600 },
  { hour: "20", grid: 2100 },
];

// Historical data for different time ranges
const dailyData = [
  { date: "2024-01-01", consumption: 68400, efficiency: 12.8, cost: 1.95 },
  { date: "2024-01-02", consumption: 67200, efficiency: 12.6, cost: 1.92 },
  { date: "2024-01-03", consumption: 69800, efficiency: 13.1, cost: 1.98 },
  { date: "2024-01-04", consumption: 65800, efficiency: 12.3, cost: 1.89 },
  { date: "2024-01-05", consumption: 67500, efficiency: 12.7, cost: 1.93 },
  { date: "2024-01-06", consumption: 68900, efficiency: 12.9, cost: 1.96 },
  { date: "2024-01-07", consumption: 66200, efficiency: 12.4, cost: 1.91 },
];

const weeklyData = [
  { week: "Week 1", consumption: 475800, efficiency: 12.7, cost: 1.93, renewable: 28.1 },
  { week: "Week 2", consumption: 468200, efficiency: 12.5, cost: 1.91, renewable: 29.3 },
  { week: "Week 3", consumption: 482100, efficiency: 12.8, cost: 1.95, renewable: 27.8 },
  { week: "Week 4", consumption: 459800, efficiency: 12.2, cost: 1.88, renewable: 30.2 },
];

const monthlyData = [
  { month: "Oct", consumption: 1980000, efficiency: 13.1, cost: 1.98, renewable: 26.8 },
  { month: "Nov", consumption: 1920000, efficiency: 12.8, cost: 1.94, renewable: 28.9 },
  { month: "Dec", consumption: 1890000, efficiency: 12.6, cost: 1.92, renewable: 29.7 },
  { month: "Jan", consumption: 1850000, efficiency: 12.4, cost: 1.89, renewable: 31.2 },
];

const EnergyUsage = () => {
  // Initialize scroll animations
  useScrollAnimation();

  const [timeRange, setTimeRange] = useState("daily");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  
  // Real-time energy data state
  const [currentConsumption, setCurrentConsumption] = useState(2847);
  const [previousConsumption, setPreviousConsumption] = useState(2900);
  const [energyByEquipment, setEnergyByEquipment] = useState([
    { name: "Ball Mill Grinder", value: 1100, color: "hsl(var(--energy-green))" },
    { name: "Gyratory Crusher", value: 850, color: "hsl(var(--data-blue))" },
    { name: "Vibrating Screen", value: 420, color: "hsl(var(--warning))" },
    { name: "Magnetic Separator", value: 280, color: "hsl(var(--steel))" },
    { name: "Conveyor Belts", value: 150, color: "hsl(280, 70%, 60%)" },
    { name: "Vibrating Feeder", value: 35, color: "hsl(200, 65%, 55%)" },
    { name: "Spiral Classifier", value: 12, color: "hsl(140, 45%, 52%)" },
  ]);
  const [hourlyData, setHourlyData] = useState([
    { hour: "00", grid: 2200 },
    { hour: "04", grid: 2400 },
    { hour: "08", grid: 1800 },
    { hour: "12", grid: 1200 },
    { hour: "16", grid: 1600 },
    { hour: "20", grid: 2100 },
  ]);

  // Subscribe to real-time energy data
  useEffect(() => {
    // Try to connect to real-time service
    const wsUrl = import.meta.env.VITE_WS_URL;
    const sseUrl = import.meta.env.VITE_SSE_URL;

    if (wsUrl) {
      realtimeService.connectWebSocket(wsUrl);
    } else if (sseUrl) {
      realtimeService.connectSSE(sseUrl);
    }

    // Subscribe to energy consumption updates
    const unsubscribeEnergy = realtimeService.subscribe('energy', (data) => {
      setLastUpdateTime(new Date());
      if (data.data.consumption !== undefined) {
        setPreviousConsumption(currentConsumption);
        setCurrentConsumption(data.data.consumption as number);
      }
      if (data.data.equipment) {
        setEnergyByEquipment(data.data.equipment as typeof energyByEquipment);
      }
      if (data.data.hourly) {
        setHourlyData(data.data.hourly as typeof hourlyData);
      }
    });

    // Check connection status
    const statusInterval = setInterval(() => {
      setIsRealtimeConnected(realtimeService.getConnectionStatus());
    }, 1000);

    return () => {
      unsubscribeEnergy();
      clearInterval(statusInterval);
    };
  }, [currentConsumption]);

  const getHistoricalData = () => {
    switch (timeRange) {
      case "daily":
        return dailyData;
      case "weekly":
        return weeklyData;
      case "monthly":
        return monthlyData;
      default:
        return dailyData;
    }
  };

  const getDataKey = () => {
    switch (timeRange) {
      case "daily":
        return "date";
      case "weekly":
        return "week";
      case "monthly":
        return "month";
      default:
        return "date";
    }
  };

  return (
    <div className="min-h-full space-y-6 p-4 sm:p-6 w-full">
      <div className="scroll-animate">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#26436C' }}>
          <span>Energy</span>{' '}
          <span>Usage</span>{' '}
          <span>Analytics</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">Comprehensive energy monitoring and consumption analytics</p>
      </div>

      {/* Energy Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 scroll-animate">
        <Card className="overflow-hidden p-4 sm:p-6 bg-card border-border hover-lift hover-glow transition-all duration-300 glass rounded-modern-xl animate-scale-in-center card-micro">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 animate-pulse-glow">
              <Zap className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Total Consumption</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-primary">{currentConsumption}</div>
          <div className="text-sm text-muted-foreground">kWh/hour</div>
        </Card>

        <Card className="overflow-hidden p-4 sm:p-6 bg-card border-border hover-lift hover-glow transition-all duration-300 glass rounded-modern-xl animate-scale-in-center card-micro">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-success/10 animate-pulse-glow">
              <TrendingDown className="w-5 h-5 text-success" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Efficiency</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-success">87.2%</div>
          <div className="text-sm text-muted-foreground">Equipment utilization</div>
        </Card>

        <Card className="overflow-hidden p-4 sm:p-6 bg-card border-border hover-lift hover-glow transition-all duration-300 glass rounded-modern-xl animate-scale-in-center card-micro">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 animate-pulse-glow">
              <Clock className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Peak Hours</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-primary">12:00</div>
          <div className="text-sm text-muted-foreground">PM - 2,400 kWh</div>
        </Card>
      </div>


      {/* Main Analytics */}
      <Tabs defaultValue="consumption" className="w-full scroll-animate" key="energy-tabs">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 max-w-2xl mb-6 glass rounded-modern">
          <TabsTrigger value="consumption" className="focus-ring">Consumption</TabsTrigger>
          <TabsTrigger value="efficiency" className="focus-ring">Efficiency</TabsTrigger>
          <TabsTrigger value="historical" className="focus-ring">Historical</TabsTrigger>
        </TabsList>

        <TabsContent value="consumption" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden p-4 sm:p-6 bg-card border-border glass rounded-modern-xl hover-lift transition-all duration-300">
            <h3 className="text-lg font-semibold mb-4">Energy by Equipment</h3>
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4">
              <div className="w-full lg:w-2/3 min-h-[250px]">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={energyByEquipment}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={75}
                      innerRadius={20}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {energyByEquipment.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} kW`, 'Consumption']}
                      labelFormatter={(label) => {
                        const item = energyByEquipment.find(item => item.value === label);
                        return item ? item.name : '';
                      }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        padding: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-1/3 space-y-2">
                {energyByEquipment.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs sm:text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="flex-1 truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

             <Card className="overflow-hidden p-4 sm:p-6 bg-card border-border glass rounded-modern-xl hover-lift transition-all duration-300">
               <h3 className="text-lg font-semibold mb-4">24-Hour Breakdown</h3>
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={hourlyData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                   <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
                   <YAxis stroke="hsl(var(--muted-foreground))" />
                   <Tooltip
                     contentStyle={{
                       backgroundColor: 'hsl(var(--card))',
                       border: '1px solid hsl(var(--border))',
                       borderRadius: '8px'
                     }}
                   />
                   <Legend />
                   <Bar dataKey="grid" name="Grid Power" fill="hsl(var(--primary))" />
                 </BarChart>
               </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-6">
          <Card className="overflow-hidden p-4 sm:p-6 bg-card border-border glass rounded-modern-xl hover-lift transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <h3 className="text-lg font-semibold">Energy Efficiency Metrics</h3>
              <Badge className="bg-success/10 text-success border-success animate-pulse">
                <TrendingDown className="w-3 h-3 mr-1" aria-hidden="true" />
                18% Improvement
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-3">Specific Energy Consumption</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">12.4</span>
                    <span className="text-muted-foreground">kWh/tonne</span>
                  </div>
                  <div className="text-sm text-success mt-2">↓ 14% vs baseline</div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-3">Cost per Tonne</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">$1.82</span>
                    <span className="text-muted-foreground">USD</span>
                  </div>
                  <div className="text-sm text-success mt-2">↓ $0.28 savings</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-3">Carbon Emissions Reduced</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-success">2,847</span>
                    <span className="text-muted-foreground">kg CO₂</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">Per day</div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-3">Equipment Utilization</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">87.2</span>
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <div className="text-sm text-success mt-2">↑ 3.4% improvement</div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="historical" className="space-y-6">
          <Card className="overflow-hidden p-4 sm:p-6 bg-card border-border glass rounded-modern-xl hover-lift transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold">Historical Energy Data</h3>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-auto focus-ring">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={getHistoricalData()}>
                <defs>
                  <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey={getDataKey()} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="consumption"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorConsumption)"
                  name="Energy Consumption"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="efficiency"
                  stroke="hsl(var(--success))"
                  fillOpacity={1}
                  fill="url(#colorEfficiency)"
                  name="Energy Efficiency"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default EnergyUsage;
