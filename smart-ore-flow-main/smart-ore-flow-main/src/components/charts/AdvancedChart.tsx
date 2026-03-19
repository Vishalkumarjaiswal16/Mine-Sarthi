import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  PieChart as PieChartIcon,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

export type ChartType = 'line' | 'area' | 'bar' | 'pie';

export interface ChartDataPoint {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AdvancedChartProps {
  title: string;
  data: ChartDataPoint[];
  xAxisKey: string;
  yAxisKeys: string[];
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  chartTypes?: ChartType[];
  defaultChartType?: ChartType;
  exportable?: boolean;
  trendAnalysis?: boolean;
  className?: string;
}

const defaultColors = [
  'hsl(200 65% 55%)',
  'hsl(190 95% 55%)',
  'hsl(140 45% 52%)',
  'hsl(45 75% 58%)',
  'hsl(15 65% 55%)',
  'hsl(35 22% 65%)',
];

const AdvancedChart: React.FC<AdvancedChartProps> = ({
  title,
  data,
  xAxisKey,
  yAxisKeys,
  colors = defaultColors,
  height = 400,
  showLegend = true,
  showGrid = true,
  chartTypes = ['line', 'area', 'bar'],
  defaultChartType = 'line',
  exportable = true,
  trendAnalysis = true,
  className = '',
}) => {
  const [currentChartType, setCurrentChartType] = useState<ChartType>(defaultChartType);

  // Calculate trends for each data series
  const trends = useMemo(() => {
    if (!trendAnalysis || data.length < 2) return {};

    const trends: { [key: string]: { direction: 'up' | 'down' | 'stable'; percentage: number } } = {};

    yAxisKeys.forEach(key => {
      const values = data.map(d => d[key]).filter(v => typeof v === 'number');
      if (values.length < 2) return;

      const first = values[0];
      const last = values[values.length - 1];
      const change = ((last - first) / first) * 100;

      let direction: 'up' | 'down' | 'stable' = 'stable';
      if (change > 1) direction = 'up';
      else if (change < -1) direction = 'down';

      trends[key] = { direction, percentage: Math.abs(change) };
    });

    return trends;
  }, [data, yAxisKeys, trendAnalysis]);

  const exportData = () => {
    const csvContent = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (currentChartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(35 25% 75%)" strokeOpacity={0.3} />}
            <XAxis 
              dataKey={xAxisKey} 
              stroke="hsl(25 20% 22%)"
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(25 20% 22%)"
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(35 28% 90%)',
                border: '1px solid hsl(35 25% 75%)',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 12px hsl(25 20% 22% / 0.1)',
                padding: '8px 12px'
              }}
            />
            {showLegend && <Legend />}
            {yAxisKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                fill={colors[index % colors.length]}
                fillOpacity={0.4}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(35 25% 75%)" strokeOpacity={0.3} />}
            <XAxis 
              dataKey={xAxisKey} 
              stroke="hsl(25 20% 22%)"
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(25 20% 22%)"
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(35 28% 90%)',
                border: '1px solid hsl(35 25% 75%)',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 12px hsl(25 20% 22% / 0.1)',
                padding: '8px 12px'
              }}
            />
            {showLegend && <Legend />}
            {yAxisKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[6, 6, 0, 0]}
                stroke={colors[index % colors.length]}
                strokeWidth={1}
              />
            ))}
          </BarChart>
        );

      case 'pie': {
        // For pie chart, use the first Y-axis key and aggregate data
        const pieData = data.map(item => ({
          name: item[xAxisKey],
          value: item[yAxisKeys[0]],
        }));

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(35 28% 90%)',
                border: '1px solid hsl(35 25% 75%)',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 12px hsl(25 20% 22% / 0.1)',
                padding: '8px 12px'
              }}
            />
          </PieChart>
        );
      }

      default: // line
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(35 25% 75%)" strokeOpacity={0.3} />}
            <XAxis 
              dataKey={xAxisKey} 
              stroke="hsl(25 20% 22%)"
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(25 20% 22%)"
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(35 28% 90%)',
                border: '1px solid hsl(35 25% 75%)',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 12px hsl(25 20% 22% / 0.1)',
                padding: '8px 12px'
              }}
            />
            {showLegend && <Legend />}
            {yAxisKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={{ r: 5, fill: colors[index % colors.length] }}
                activeDot={{ r: 7 }}
              />
            ))}
          </LineChart>
        );
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-success" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-destructive" />;
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getChartIcon = (type: ChartType) => {
    switch (type) {
      case 'line':
        return <LineChartIcon className="w-4 h-4" />;
      case 'area':
        return <AreaChartIcon className="w-4 h-4" />;
      case 'bar':
        return <BarChart3 className="w-4 h-4" />;
      case 'pie':
        return <PieChartIcon className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {trendAnalysis && Object.keys(trends).length > 0 && (
            <div className="flex gap-2 mt-2">
              {Object.entries(trends).map(([key, trend]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="text-xs flex items-center gap-1"
                >
                  {getTrendIcon(trend.direction)}
                  {key}: {trend.percentage.toFixed(1)}%
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {chartTypes.map(type => (
            <Button
              key={type}
              variant={currentChartType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentChartType(type)}
              className="p-2"
            >
              {getChartIcon(type)}
            </Button>
          ))}

          {exportable && (
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default AdvancedChart;
