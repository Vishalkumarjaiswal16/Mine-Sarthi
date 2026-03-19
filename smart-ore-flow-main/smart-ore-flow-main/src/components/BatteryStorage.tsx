import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { generateBatteryMetrics, BatteryMetrics } from '@/lib/mockData';
import { Battery, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

interface BatteryStorageProps {
  height?: number;
  className?: string;
}

const BatteryStorage: React.FC<BatteryStorageProps> = ({ height = 300, className = '' }) => {
  const [batteryData, setBatteryData] = useState<BatteryMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<{ timestamp: Date; soc: number; power: number; temperature: number }[]>([]);

  useEffect(() => {
    // Generate current battery metrics
    const currentData = generateBatteryMetrics();
    setBatteryData(currentData);

    // Generate historical data for the last 24 hours
    const history = [];
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
      const soc = 65 + Math.random() * 30; // 65-95%
      const power = Math.random() > 0.5 ? (50 + Math.random() * 100) : -(50 + Math.random() * 100);
      history.push({
        timestamp,
        soc: Math.round(soc),
        power: Math.round(power),
        temperature: 25 + Math.random() * 15,
      });
    }
    setHistoricalData(history);
  }, []);

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{formatTime(new Date(label))}</p>
          {payload.map((entry: { name: string; value: number; color: string }, index: number) => (
            <div key={index} className="flex items-center space-x-2 mt-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm text-muted-foreground">
                {entry.name}: <span className="font-medium text-foreground">
                  {entry.name === 'power' ? `${entry.value} kW` : entry.name === 'soc' ? `${entry.value}%` : `${entry.value}°C`}
                </span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!batteryData) {
    return (
      <Card className={`glass-card ${className}`}>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-muted-foreground">Loading battery data...</div>
        </CardContent>
      </Card>
    );
  }

  const isCharging = batteryData.power > 0;
  const powerStatus = isCharging ? 'Charging' : 'Discharging';
  const powerColor = isCharging ? 'text-green-600' : 'text-blue-600';

  return (
    <Card className={`glass-card ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Battery className="w-5 h-5" />
            Battery Storage System
          </div>
          <Badge variant="outline" className="text-xs">
            {powerStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {batteryData.soc}%
            </div>
            <div className="text-sm text-muted-foreground">State of Charge</div>
            <Progress value={batteryData.soc} className="mt-2" />
          </div>

          <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${powerColor}`}>
              {Math.abs(batteryData.power)} kW
            </div>
            <div className="text-sm text-muted-foreground">{powerStatus}</div>
            <div className="flex items-center justify-center mt-2">
              <Zap className={`w-4 h-4 ${powerColor}`} />
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {batteryData.temperature}°C
            </div>
            <div className="text-sm text-muted-foreground">Temperature</div>
            <div className="flex items-center justify-center mt-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {batteryData.health}%
            </div>
            <div className="text-sm text-muted-foreground">Health</div>
            <div className="flex items-center justify-center mt-2">
              <AlertTriangle className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* SOC and Power Chart */}
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  unit=" kW"
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="soc"
                  name="SOC"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="power"
                  name="Power Flow"
                  stroke={isCharging ? "#10b981" : "#8b5cf6"}
                  strokeWidth={2}
                  dot={{ fill: isCharging ? "#10b981" : "#8b5cf6", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Temperature Chart */}
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  unit="°C"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f59e0b"
                  fill="#f59e0b33"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Battery Cycles Info */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Battery Cycles</div>
              <div className="text-2xl font-bold text-primary">{batteryData.cycles.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Remaining Life</div>
              <div className="text-lg font-semibold text-green-600">
                ~{Math.round((1500 - batteryData.cycles) / 365)} years
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatteryStorage;
