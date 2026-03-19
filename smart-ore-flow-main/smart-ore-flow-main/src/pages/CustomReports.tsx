import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Download,
  Share,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Calendar,
  Filter,
  Settings,
  Eye,
  Save,
  FileText,
  Users,
  Clock
} from "lucide-react";

interface ReportWidget {
  id: string;
  type: 'metric' | 'chart' | 'table';
  title: string;
  metrics: string[];
  timeRange: string;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  widgets: ReportWidget[];
  createdAt: Date;
  lastModified: Date;
  isPublic: boolean;
  collaborators: string[];
}

const availableMetrics = [
  { id: 'feedSize', label: 'Feed Size', unit: 'mm' },
  { id: 'oreHardness', label: 'Ore Hardness', unit: 'BWI' },
  { id: 'equipmentLoad', label: 'Equipment Load', unit: '%' },
  { id: 'moistureContent', label: 'Moisture Content', unit: '%' },
  { id: 'temperature', label: 'Temperature', unit: '°C' },
  { id: 'vibration', label: 'Vibration', unit: 'mm/s' },
  { id: 'powerFactor', label: 'Power Factor', unit: '' },
  { id: 'energyConsumption', label: 'Energy Consumption', unit: 'kWh' },
  { id: 'throughput', label: 'Throughput', unit: 'tph' },
  { id: 'efficiency', label: 'Efficiency', unit: '%' },
];

const timeRanges = [
  { id: '1h', label: 'Last Hour' },
  { id: '24h', label: 'Last 24 Hours' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'custom', label: 'Custom Range' },
];

const CustomReports = () => {
  const [reports, setReports] = useState<CustomReport[]>([
    {
      id: '1',
      name: 'Daily Operations Summary',
      description: 'Comprehensive overview of daily mining operations',
      widgets: [
        {
          id: 'w1',
          type: 'metric',
          title: 'Key Performance Indicators',
          metrics: ['throughput', 'efficiency', 'energyConsumption'],
          timeRange: '24h',
        },
        {
          id: 'w2',
          type: 'chart',
          title: 'Energy Trends',
          metrics: ['energyConsumption', 'powerFactor'],
          timeRange: '7d',
          chartType: 'line',
        },
      ],
      createdAt: new Date('2024-01-15'),
      lastModified: new Date('2024-01-20'),
      isPublic: true,
      collaborators: ['john.doe@mine.com', 'sarah.smith@mine.com'],
    },
    {
      id: '2',
      name: 'Equipment Health Monitor',
      description: 'Real-time equipment status and maintenance alerts',
      widgets: [
        {
          id: 'w3',
          type: 'metric',
          title: 'Equipment Status',
          metrics: ['temperature', 'vibration', 'equipmentLoad'],
          timeRange: '1h',
        },
      ],
      createdAt: new Date('2024-01-18'),
      lastModified: new Date('2024-01-22'),
      isPublic: false,
      collaborators: [],
    },
  ]);

  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    isPublic: false,
  });

  const handleCreateReport = () => {
    const report: CustomReport = {
      id: Date.now().toString(),
      name: newReport.name,
      description: newReport.description,
      widgets: [],
      createdAt: new Date(),
      lastModified: new Date(),
      isPublic: newReport.isPublic,
      collaborators: [],
    };
    setReports([...reports, report]);
    setNewReport({ name: '', description: '', isPublic: false });
    setIsCreateDialogOpen(false);
    setSelectedReport(report);
  };

  const handleSaveReport = (report: CustomReport) => {
    setReports(reports.map(r => r.id === report.id ? { ...report, lastModified: new Date() } : r));
  };

  const handleDeleteReport = (reportId: string) => {
    setReports(reports.filter(r => r.id !== reportId));
    if (selectedReport?.id === reportId) {
      setSelectedReport(null);
    }
  };

  const addWidgetToReport = (reportId: string, widget: ReportWidget) => {
    setReports(reports.map(r =>
      r.id === reportId
        ? { ...r, widgets: [...r.widgets, widget], lastModified: new Date() }
        : r
    ));
  };

  const removeWidgetFromReport = (reportId: string, widgetId: string) => {
    setReports(reports.map(r =>
      r.id === reportId
        ? { ...r, widgets: r.widgets.filter(w => w.id !== widgetId), lastModified: new Date() }
        : r
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#26436C' }}>
            <span>Custom</span>{' '}
            <span>Reports</span>
          </h2>
          <p className="text-muted-foreground">Create and share custom reports with real-time collaboration</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  placeholder="Enter report name"
                />
              </div>
              <div>
                <Label htmlFor="report-description">Description</Label>
                <Textarea
                  id="report-description"
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  placeholder="Describe the purpose of this report"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-public"
                  checked={newReport.isPublic}
                  onCheckedChange={(checked) => setNewReport({ ...newReport, isPublic: !!checked })}
                />
                <Label htmlFor="is-public">Make this report public</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateReport} disabled={!newReport.name.trim()}>
                  Create Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              My Reports
            </h3>
            <div className="space-y-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedReport?.id === report.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{report.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{report.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={report.isPublic ? "secondary" : "outline"} className="text-xs">
                          {report.isPublic ? 'Public' : 'Private'}
                        </Badge>
                        {report.collaborators.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {report.collaborators.length}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Report Builder */}
        <div className="lg:col-span-3">
          {selectedReport ? (
            <div className="space-y-6">
              {/* Report Header */}
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedReport.name}</h3>
                    <p className="text-muted-foreground mt-1">{selectedReport.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Created {selectedReport.createdAt.toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Modified {selectedReport.lastModified.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Share className="w-4 h-4" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedReport.widgets.map((widget) => (
                  <Card key={widget.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium">{widget.title}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWidgetFromReport(selectedReport.id, widget.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        ×
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Type: {widget.type}</p>
                      <p>Metrics: {widget.metrics.join(', ')}</p>
                      <p>Time Range: {timeRanges.find(tr => tr.id === widget.timeRange)?.label}</p>
                      {widget.chartType && <p>Chart: {widget.chartType}</p>}
                    </div>
                  </Card>
                ))}

                {/* Add Widget Placeholder */}
                <Card className="p-4 border-dashed border-2 hover:border-primary/50 transition-colors">
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Plus className="w-8 h-8 mb-2" />
                    <p className="text-sm">Add Widget</p>
                  </div>
                </Card>
              </div>

              {/* Widget Builder */}
              <Card className="p-6">
                <h4 className="font-semibold mb-4">Add New Widget</h4>
                <Tabs defaultValue="metric" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="metric">Metrics</TabsTrigger>
                    <TabsTrigger value="chart">Charts</TabsTrigger>
                    <TabsTrigger value="table">Tables</TabsTrigger>
                  </TabsList>

                  <TabsContent value="metric" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Select Metrics</Label>
                        <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                          {availableMetrics.map((metric) => (
                            <div key={metric.id} className="flex items-center space-x-2">
                              <Checkbox id={metric.id} />
                              <Label htmlFor={metric.id} className="text-sm">
                                {metric.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Time Range</Label>
                        <Select>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select time range" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeRanges.map((range) => (
                              <SelectItem key={range.id} value={range.id}>
                                {range.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => {
                      // Add metric widget logic here
                    }}>
                      Add Metric Widget
                    </Button>
                  </TabsContent>

                  <TabsContent value="chart" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Chart Type</Label>
                        <Select>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select chart type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="line">Line Chart</SelectItem>
                            <SelectItem value="bar">Bar Chart</SelectItem>
                            <SelectItem value="area">Area Chart</SelectItem>
                            <SelectItem value="pie">Pie Chart</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Time Range</Label>
                        <Select>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select time range" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeRanges.map((range) => (
                              <SelectItem key={range.id} value={range.id}>
                                {range.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Select Metrics</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                        {availableMetrics.map((metric) => (
                          <div key={metric.id} className="flex items-center space-x-2">
                            <Checkbox id={`chart-${metric.id}`} />
                            <Label htmlFor={`chart-${metric.id}`} className="text-sm">
                              {metric.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => {
                      // Add chart widget logic here
                    }}>
                      Add Chart Widget
                    </Button>
                  </TabsContent>

                  <TabsContent value="table" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Select Columns</Label>
                        <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                          {availableMetrics.map((metric) => (
                            <div key={metric.id} className="flex items-center space-x-2">
                              <Checkbox id={`table-${metric.id}`} />
                              <Label htmlFor={`table-${metric.id}`} className="text-sm">
                                {metric.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Time Range</Label>
                        <Select>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select time range" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeRanges.map((range) => (
                              <SelectItem key={range.id} value={range.id}>
                                {range.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => {
                      // Add table widget logic here
                    }}>
                      Add Table Widget
                    </Button>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Report Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a report from the list or create a new one to get started.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Create Your First Report
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomReports;
