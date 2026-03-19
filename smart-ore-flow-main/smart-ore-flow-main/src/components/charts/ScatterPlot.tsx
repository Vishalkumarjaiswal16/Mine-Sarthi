import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, ScatterChart as ScatterIcon, TrendingUp, AlertTriangle } from 'lucide-react';
import { ScatterChart as RechartsScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ScatterDataPoint {
  [key: string]: string | number | boolean;
}

interface ScatterPlotProps {
  data: ScatterDataPoint[];
  xKey: string;
  yKey: string;
  title?: string;
  height?: number;
  exportable?: boolean;
  outlierDetection?: boolean;
  className?: string;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  xKey,
  yKey,
  title = 'Scatter Plot Analysis',
  height = 400,
  exportable = true,
  outlierDetection = true,
  className = '',
}) => {
  const [selectedX, setSelectedX] = useState(xKey);
  const [selectedY, setSelectedY] = useState(yKey);

  // Get all numeric keys for axis selection
  const numericKeys = Object.keys(data[0] || {}).filter(key => {
    return data.some(item => typeof item[key] === 'number');
  });

  // Detect outliers using IQR method
  const detectOutliers = (values: number[]): number[] => {
    if (values.length < 4) return [];

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return values.filter(value => value < lowerBound || value > upperBound);
  };

  const xValues = data.map(d => d[selectedX]).filter(v => typeof v === 'number');
  const yValues = data.map(d => d[selectedY]).filter(v => typeof v === 'number');

  const outliers = outlierDetection ? detectOutliers(yValues) : [];
  const outlierIndices = outliers.map(outlier =>
    data.findIndex(d => d[selectedY] === outlier)
  );

  // Prepare scatter data
  const scatterData = data.map((item, index) => ({
    x: item[selectedX],
    y: item[selectedY],
    isOutlier: outlierIndices.includes(index),
    index,
  }));

  const exportData = () => {
    const csvContent = [
      ['X', 'Y', 'Is Outlier'].join(','),
      ...scatterData.map(row => [row.x, row.y, row.isOutlier ? 'Yes' : 'No'].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scatter-plot-${selectedX}-vs-${selectedY}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{ payload: ScatterDataPoint & { x: number; y: number; isOutlier: boolean } }>;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg" style={{ backgroundColor: 'hsl(35 28% 90%)', borderColor: 'hsl(35 25% 75%)' }}>
          <p className="text-sm font-medium">{`${selectedX}: ${data.x}`}</p>
          <p className="text-sm font-medium">{`${selectedY}: ${data.y}`}</p>
          {data.isOutlier && (
            <Badge variant="destructive" className="mt-1 text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Outlier
            </Badge>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`${className} glass rounded-modern-xl shadow-depth-xl hover:shadow-glow-success transition-all duration-500 animate-float overflow-hidden`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ScatterIcon className="w-5 h-5" />
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            Analyzing relationship between {selectedX} and {selectedY}
          </p>
        </div>

        {exportable && (
          <button
            onClick={exportData}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            title="Export scatter plot data"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Axis selectors */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">X-Axis:</span>
          <Select value={selectedX} onValueChange={setSelectedX}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {numericKeys.map(key => (
                <SelectItem key={key} value={key}>{key}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Y-Axis:</span>
          <Select value={selectedY} onValueChange={setSelectedY}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {numericKeys.map(key => (
                <SelectItem key={key} value={key}>{key}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <RechartsScatterChart data={scatterData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(35 25% 75%)" strokeOpacity={0.3} />
            <XAxis
              type="number"
              dataKey="x"
              name={selectedX}
              stroke="hsl(25 20% 22%)"
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={selectedY}
              stroke="hsl(25 20% 22%)"
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter dataKey="y" fill="hsl(var(--primary))">
              {scatterData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isOutlier ? 'hsl(15 65% 55%)' : 'hsl(200 65% 55%)'}
                  r={entry.isOutlier ? 6 : 4}
                />
              ))}
            </Scatter>
          </RechartsScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics and insights */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Data Points</span>
          </div>
          <p className="text-lg font-bold">{data.length}</p>
        </div>

        {outlierDetection && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium">Outliers</span>
            </div>
            <p className="text-lg font-bold">{outliers.length}</p>
          </div>
        )}

        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <ScatterIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Correlation</span>
          </div>
          <p className="text-lg font-bold">
            {(() => {
              const correlation = calculateCorrelation(xValues, yValues);
              return correlation.toFixed(2);
            })()}
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Analysis Insights</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• {outliers.length > 0 ? `${outliers.length} potential outliers detected` : 'No significant outliers found'}</p>
          <p>• Correlation coefficient: {calculateCorrelation(xValues, yValues).toFixed(2)}</p>
          <p>• Use this analysis to identify patterns and anomalies in your data</p>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate Pearson correlation coefficient
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

export default ScatterPlot;
