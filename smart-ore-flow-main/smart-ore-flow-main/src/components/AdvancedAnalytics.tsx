import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, BarChart3, LineChart, PieChart, ScatterChart, Grid3X3, TrendingUp, TrendingDown, Calendar, Filter, AreaChart } from "lucide-react";
import jsPDF from "jspdf";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart as RechartsAreaChart,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ScatterChart as RechartsScatterChart,
  Scatter
} from "recharts";
import HeatmapChart from "@/components/charts/HeatmapChart";
import ScatterPlot from "@/components/charts/ScatterPlot";
import { heatmapData } from "@/lib/mockData";

const mockData = [
  { time: "00:00", energy: 450, baseline: 500, efficiency: 87, throughput: 280, temperature: 65, vibration: 1.8 },
  { time: "04:00", energy: 480, baseline: 500, efficiency: 89, throughput: 295, temperature: 68, vibration: 1.9 },
  { time: "08:00", energy: 520, baseline: 500, efficiency: 85, throughput: 310, temperature: 72, vibration: 2.1 },
  { time: "12:00", energy: 490, baseline: 500, efficiency: 91, throughput: 305, temperature: 75, vibration: 2.0 },
  { time: "16:00", energy: 460, baseline: 500, efficiency: 88, throughput: 290, temperature: 70, vibration: 1.7 },
  { time: "20:00", energy: 440, baseline: 500, efficiency: 92, throughput: 285, temperature: 67, vibration: 1.6 },
  { time: "24:00", energy: 430, baseline: 500, efficiency: 90, throughput: 275, temperature: 64, vibration: 1.5 },
];

const pieData = [
  { name: "Crushing", value: 35, color: "hsl(var(--primary))" },
  { name: "Grinding", value: 45, color: "hsl(var(--success))" },
  { name: "Classification", value: 12, color: "hsl(var(--warning))" },
  { name: "Other", value: 8, color: "hsl(var(--muted))" },
];

const scatterData = [
  { efficiency: 85, throughput: 280, size: 6 },
  { efficiency: 87, throughput: 295, size: 8 },
  { efficiency: 83, throughput: 310, size: 10 },
  { efficiency: 89, throughput: 305, size: 9 },
  { efficiency: 86, throughput: 290, size: 7 },
  { efficiency: 90, throughput: 285, size: 8 },
  { efficiency: 88, throughput: 275, size: 6 },
];

type ChartType = "line" | "area" | "bar" | "pie" | "scatter" | "heatmap";

const AdvancedAnalytics = () => {
  const [chartType, setChartType] = useState<ChartType>("area");
  const [timeRange, setTimeRange] = useState("24h");
  const [metric, setMetric] = useState("energy");
  const [equipment, setEquipment] = useState("all");

  const chartHeight = chartType === "scatter" || chartType === "heatmap" ? 700 : 350;

  const exportData = (format: "csv" | "json" | "pdf") => {
    const data = mockData.map(item => ({
      Time: item.time,
      "Energy (kWh)": item.energy,
      "Baseline (kWh)": item.baseline,
      "Efficiency (%)": item.efficiency,
      "Throughput (tph)": item.throughput,
      "Temperature (°C)": item.temperature,
      "Vibration (mm/s)": item.vibration,
    }));

    if (format === "csv") {
      const csv = [
        Object.keys(data[0]).join(","),
        ...data.map(row => Object.values(row).join(","))
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-data-${equipment}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === "json") {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-data-${equipment}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Generate PDF using jsPDF
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.text(`Analytics Report - ${equipment.toUpperCase()} Equipment`, 20, 30);

      // Add metadata
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 50);
      doc.text(`Time Range: ${timeRange}`, 20, 60);
      doc.text(`Chart Type: ${chartType}`, 20, 70);
      doc.text(`Metric: ${getMetricLabel()}`, 20, 80);

      // Add data table
      doc.text("Data Summary:", 20, 100);

      let yPosition = 110;
      data.forEach((row, index) => {
        if (yPosition > 270) { // Check if we need a new page
          doc.addPage();
          yPosition = 30;
        }
        doc.text(`${row.Time}: ${row[Object.keys(row)[1]]}`, 20, yPosition);
        yPosition += 10;
      });

      // Add summary statistics
      const avgEnergy = mockData.reduce((sum, item) => sum + item.energy, 0) / mockData.length;
      const avgEfficiency = mockData.reduce((sum, item) => sum + item.efficiency, 0) / mockData.length;

      doc.text(`Average Energy: ${avgEnergy.toFixed(2)} kWh`, 20, yPosition + 10);
      doc.text(`Average Efficiency: ${avgEfficiency.toFixed(2)}%`, 20, yPosition + 20);

      // Save the PDF
      doc.save(`analytics-report-${equipment}-${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              />
              {metric === "energy" && (
                <Line
                  type="monotone"
                  dataKey="baseline"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                />
              )}
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsAreaChart data={mockData}>
              <defs>
                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#analyticsGradient)"
              />
              {metric === "energy" && (
                <Line
                  type="monotone"
                  dataKey="baseline"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                />
              )}
            </RechartsAreaChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey={metric} fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ScatterPlot
            data={scatterData}
            xKey="efficiency"
            yKey="throughput"
            title="Efficiency vs Throughput Scatter Plot"
            height={chartHeight}
          />
        );

      case "heatmap": {
        return (
          <HeatmapChart
            heatmapData={heatmapData}
            title="Mining Operations Heatmap"
            height={chartHeight}
          />
        );
      }

      default:
        return null;
    }
  };

  const getChartIcon = () => {
    switch (chartType) {
      case "line": return <LineChart className="w-4 h-4" />;
      case "area": return <AreaChart className="w-4 h-4" />;
      case "bar": return <BarChart3 className="w-4 h-4" />;
      case "pie": return <PieChart className="w-4 h-4" />;
      case "scatter": return <ScatterChart className="w-4 h-4" />;
      case "heatmap": return <Grid3X3 className="w-4 h-4" />;
      default: return <LineChart className="w-4 h-4" />;
    }
  };

  const getMetricLabel = () => {
    switch (metric) {
      case "energy": return "Energy Consumption (kWh)";
      case "efficiency": return "Efficiency (%)";
      case "throughput": return "Throughput (tph)";
      case "temperature": return "Temperature (°C)";
      case "vibration": return "Vibration (mm/s)";
      default: return "Energy Consumption (kWh)";
    }
  };

  const getCurrentMetricValue = () => {
    switch (metric) {
      case "energy": return "Energy (kWh)";
      case "efficiency": return "Efficiency (%)";
      case "throughput": return "Throughput (tph)";
      case "temperature": return "Temperature (°C)";
      case "vibration": return "Vibration (mm/s)";
      default: return "Energy (kWh)";
    }
  };

  return (
    <Card className="p-4 sm:p-6 glass rounded-modern-xl shadow-depth-xl hover:shadow-glow-success transition-all duration-500 animate-float" role="region" aria-labelledby="analytics-chart-title">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div>
          <h3 id="analytics-chart-title" className="text-base sm:text-lg font-semibold flex items-center gap-2">
            {getChartIcon()}
            Advanced Analytics Dashboard
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">{getMetricLabel()} • {equipment.toUpperCase()} Equipment</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="area">Area</SelectItem>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
              <SelectItem value="pie">Pie</SelectItem>
              <SelectItem value="scatter">Scatter</SelectItem>
              <SelectItem value="heatmap">Heatmap</SelectItem>
            </SelectContent>
          </Select>

          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="energy">Energy</SelectItem>
              <SelectItem value="efficiency">Efficiency</SelectItem>
              <SelectItem value="throughput">Throughput</SelectItem>
              <SelectItem value="temperature">Temperature</SelectItem>
              <SelectItem value="vibration">Vibration</SelectItem>
            </SelectContent>
          </Select>

          <Select value={equipment} onValueChange={setEquipment}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="crusher">Crusher</SelectItem>
              <SelectItem value="mill">Mill</SelectItem>
              <SelectItem value="classifier">Classifier</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1H</SelectItem>
              <SelectItem value="24h">24H</SelectItem>
              <SelectItem value="7d">7D</SelectItem>
              <SelectItem value="30d">30D</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => exportData("csv")} title="Export as CSV">
              <Download className="w-3 h-3" />
              CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportData("json")} title="Export as JSON">
              <Download className="w-3 h-3" />
              JSON
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportData("pdf")} title="Export as PDF">
              <Download className="w-3 h-3" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      <div className={chartType === "scatter" || chartType === "heatmap" ? "mb-12" : "mb-4"} style={{ height: chartHeight, width: '100%' }}>
        {renderChart()}
      </div>

      {chartType === "pie" && (
        <div className="flex flex-wrap gap-4 justify-center text-xs mb-4">
          {pieData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}: {item.value}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm border-t pt-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3 text-muted-foreground" />
            <span>Filtered by: {equipment}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <TrendingDown className="w-3 h-3 mr-1" />
            ↓ 14% vs baseline
          </Badge>
          <Badge variant="outline" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            ↑ 8% efficiency
          </Badge>
          <Badge variant="outline" className="text-xs bg-success/10 text-success">
            Status: Optimal
          </Badge>
        </div>
      </div>
    </Card>
  );
};

export default AdvancedAnalytics;