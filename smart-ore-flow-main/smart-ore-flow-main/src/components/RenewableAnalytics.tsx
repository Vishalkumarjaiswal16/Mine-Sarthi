import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  generateRenewableMix,
  RenewableMix,
  calculateCarbonOffset,
  CarbonOffset,
  generateRenewableRecommendations,
  AIRecommendation
} from '@/lib/mockData';
import { Leaf, Zap, TrendingUp, Award } from 'lucide-react';

interface RenewableAnalyticsProps {
  height?: number;
  className?: string;
}

const RenewableAnalytics: React.FC<RenewableAnalyticsProps> = ({ height = 300, className = '' }) => {
  const [renewableMix, setRenewableMix] = useState<RenewableMix | null>(null);
  const [carbonOffset, setCarbonOffset] = useState<CarbonOffset | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);

  useEffect(() => {
    // Generate renewable mix data
    const mix = generateRenewableMix();
    setRenewableMix(mix);

    // Calculate carbon offset based on renewable energy
    const renewableKwh = mix.total * (mix.renewablePercentage / 100);
    const offset = calculateCarbonOffset(renewableKwh);
    setCarbonOffset(offset);

    // Generate AI recommendations
    const recs = generateRenewableRecommendations(mix, {
      soc: 75,
      power: 50,
      chargeRate: 50,
      dischargeRate: 0,
      health: 95,
      cycles: 1300,
      temperature: 30,
    });
    setRecommendations(recs);
  }, []);

  const pieData = renewableMix ? [
    { name: 'Solar', value: renewableMix.solar, color: '#f59e0b' }, // Amber/Orange for solar
    { name: 'Wind', value: renewableMix.wind, color: '#3b82f6' }, // Blue for wind
    { name: 'Battery', value: renewableMix.battery, color: '#10b981' }, // Green for battery
    { name: 'Grid', value: renewableMix.grid, color: '#6b7280' }, // Gray for grid
  ] : [];

  const barData = renewableMix ? [
    { name: 'Solar', value: renewableMix.solar },
    { name: 'Wind', value: renewableMix.wind },
    { name: 'Battery', value: renewableMix.battery },
    { name: 'Grid', value: renewableMix.grid },
  ] : [];

  if (!renewableMix || !carbonOffset) {
    return (
      <Card className={`glass-card ${className}`}>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-muted-foreground">Loading renewable analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Renewable Mix Overview */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              Renewable Energy Mix
            </div>
            <Badge variant="outline" className="text-xs">
              {renewableMix.renewablePercentage}% Renewable
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Percentage']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'Percentage']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    stroke="#059669"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carbon Offset Impact */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Leaf className="w-5 h-5 text-green-500" />
            Carbon Offset Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {carbonOffset.co2Saved.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">kg CO₂ Saved</div>
            </div>

            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {carbonOffset.equivalentTrees}
              </div>
              <div className="text-sm text-muted-foreground">Trees Planted</div>
            </div>

            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {carbonOffset.equivalentCars}
              </div>
              <div className="text-sm text-muted-foreground">Cars Off Road</div>
            </div>

            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {carbonOffset.equivalentFlights}
              </div>
              <div className="text-sm text-muted-foreground">Flights Avoided</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-500" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
                <div className={`w-3 h-3 rounded-full mt-2 ${
                  rec.priority === 'high' ? 'bg-red-500' :
                  rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm">{rec.title}</h4>
                    <Badge
                      variant={
                        rec.priority === 'high' ? 'destructive' :
                        rec.priority === 'medium' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">{rec.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RenewableAnalytics;
