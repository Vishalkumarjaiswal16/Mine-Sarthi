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
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateRenewableGeneration, RenewableGeneration } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';

interface RenewableChartProps {
  height?: number;
  className?: string;
}

const RenewableChart: React.FC<RenewableChartProps> = ({ height = 300, className = '' }) => {
  const [data, setData] = useState<RenewableGeneration[]>([]);


  useEffect(() => {
    // Generate 24 hours of data
    const renewableData = generateRenewableGeneration(24);
    setData(renewableData);
  }, []);

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg" style={{ backgroundColor: 'hsl(35 28% 90%)', borderColor: 'hsl(35 25% 75%)' }}>
          <p className="font-semibold text-foreground">{formatTime(new Date(label))}</p>
          {payload.map((entry: { name: string; value: number; color: string }, index: number) => (
            <div key={index} className="flex items-center space-x-2 mt-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm text-muted-foreground">
                {entry.name}: <span className="font-medium text-foreground">{entry.value} kW</span>
              </span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-border">
            <span className="text-sm font-medium text-foreground">
              Total: {payload.reduce((sum: number, entry: { name: string; value: number; color: string }) => sum + entry.value, 0)} kW
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`} style={{ minWidth: 0 }}>
      <Card className="glass-card w-full" style={{ overflow: 'visible' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            Renewable Energy Generation
            <Badge variant="outline" className="text-xs">
              Live Data
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full" style={{ padding: '1.5rem', overflow: 'visible' }}>
          {/* Main Line Chart */}
          <div className="w-full mb-8" style={{ height: `${height}px`, minHeight: `${height}px`, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={data} 
                margin={{ top: 30, right: 40, left: 30, bottom: 50 }}
                style={{ width: '100%', height: '100%' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(35 25% 75%)" strokeOpacity={0.3} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  tick={{ fill: 'hsl(25 20% 22%)', fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: 'hsl(25 20% 22%)', fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  unit=" kW"
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '30px', paddingBottom: '10px' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="solar"
                  name="Solar"
                  stroke="hsl(45 75% 58%)"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(45 75% 58%)', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: 'hsl(45 75% 58%)', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="hsl(140 45% 52%)"
                  strokeWidth={4}
                  dot={{ fill: 'hsl(140 45% 52%)', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: 'hsl(140 45% 52%)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Capacity Factor Gauge */}
          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'hsl(140 45% 52%)' }}>
                {data[data.length - 1]?.capacityFactor}%
              </div>
              <div className="text-sm text-muted-foreground">Capacity Factor</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {data[data.length - 1]?.efficiency}%
              </div>
              <div className="text-sm text-muted-foreground">Efficiency</div>
            </div>
          </div>

          {/* Solar Generation Bar Chart */}
          <div className="mt-8 pt-6 border-t border-border/50 w-full" style={{ height: '180px', minHeight: '180px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data.slice(-6)} 
                margin={{ top: 20, right: 30, left: 30, bottom: 50 }}
                style={{ width: '100%', height: '100%' }}
              >
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  tick={{ fill: 'hsl(25 20% 22%)', fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fill: 'hsl(25 20% 22%)', fontSize: 11, fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={false}
                  width={70}
                />
                <Tooltip />
                <Bar dataKey="solar" fill="hsl(45 75% 58%)" name="Solar" stroke="hsl(45 75% 48%)" strokeWidth={1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RenewableChart;
