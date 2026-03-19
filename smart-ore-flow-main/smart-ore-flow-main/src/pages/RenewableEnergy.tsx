import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RenewableChart from '@/components/RenewableChart';
import BatteryStorage from '@/components/BatteryStorage';
import RenewableAnalytics from '@/components/RenewableAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { generateRenewableGeneration, generateBatteryMetrics, generateRenewableMix } from '@/lib/mockData';
import { Sun, Wind, Battery, BarChart3, Settings, Download, Share2, Power, Radio } from 'lucide-react';
import { SolarControl } from '@/components/renewable/SolarControl';
import { BatteryControl } from '@/components/renewable/BatteryControl';
import jsPDF from 'jspdf';
import { toast } from '@/hooks/use-toast';
import { realtimeService } from '@/lib/realtimeService';

const RenewableEnergy: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { addComment } = useCollaboration();
  const [activeTab, setActiveTab] = useState('generation');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  
  // Real-time renewable energy data state
  const [solarControls, setSolarControls] = useState([
    {
      id: 'solar-1',
      name: 'Solar Array A',
      status: 'on' as const,
      connected: true,
      powerOutput: 612,
      efficiency: 94.2,
      lastUpdate: new Date(),
    },
    {
      id: 'solar-2',
      name: 'Solar Array B',
      status: 'on' as const,
      connected: true,
      powerOutput: 580,
      efficiency: 91.5,
      lastUpdate: new Date(),
    },
  ]);

  const [batteryControls, setBatteryControls] = useState([
    {
      id: 'battery-1',
      name: 'Battery Bank 1',
      status: 'charging' as const,
      connected: true,
      chargeLevel: 87,
      capacity: 2.5,
      powerFlow: 45.2,
      lastUpdate: new Date(),
    },
    {
      id: 'battery-2',
      name: 'Battery Bank 2',
      status: 'discharging' as const,
      connected: true,
      chargeLevel: 65,
      capacity: 2.5,
      powerFlow: -32.8,
      lastUpdate: new Date(),
    },
  ]);

  const handleSolarToggle = (id: string, status: boolean) => {
    console.log(`Solar ${id} toggled to ${status ? 'ON' : 'OFF'}`);
    // In real implementation, this would call an API
  };

  const handleBatteryToggle = (id: string, status: boolean) => {
    console.log(`Battery ${id} toggled to ${status ? 'ON' : 'OFF'}`);
    // In real implementation, this would call an API
  };

  // Real-time data updates from hardware
  useEffect(() => {
    // Try to connect to real-time service
    const wsUrl = import.meta.env.VITE_WS_URL;
    const sseUrl = import.meta.env.VITE_SSE_URL;

    if (wsUrl) {
      realtimeService.connectWebSocket(wsUrl);
    } else if (sseUrl) {
      realtimeService.connectSSE(sseUrl);
    }

    // Subscribe to renewable energy updates
    const unsubscribeRenewable = realtimeService.subscribe('renewable', (data) => {
      setLastUpdateTime(new Date());
      if (data.data.solar) {
        setSolarControls(data.data.solar as typeof solarControls);
      }
      if (data.data.battery) {
        setBatteryControls(data.data.battery as typeof batteryControls);
      }
    });

    // Subscribe to solar panel updates
    const unsubscribeSolar = realtimeService.subscribe('solar', (data) => {
      setLastUpdateTime(new Date());
      setSolarControls(prev => {
        const index = prev.findIndex(s => s.id === data.deviceId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            ...data.data,
            lastUpdate: new Date(),
          };
          return updated;
        }
        return prev;
      });
    });

    // Subscribe to battery updates
    const unsubscribeBattery = realtimeService.subscribe('battery', (data) => {
      setLastUpdateTime(new Date());
      setBatteryControls(prev => {
        const index = prev.findIndex(b => b.id === data.deviceId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            ...data.data,
            lastUpdate: new Date(),
          };
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
      unsubscribeRenewable();
      unsubscribeSolar();
      unsubscribeBattery();
      clearInterval(statusInterval);
    };
  }, []);

  const handleExport = () => {
    try {
      // Collect renewable energy data
      const exportData = {
        metadata: {
          title: 'Renewable Energy Dashboard Report',
          generated: new Date().toISOString(),
          generatedBy: user?.name || 'System',
        },
        summary: {
          solarCapacity: '1.2 MW',
          batteryStorage: '2.5 MWh',
          renewableMix: '78%',
        },
        solar: solarControls.map(control => ({
          name: control.name,
          status: control.status,
          powerOutput: `${control.powerOutput} kW`,
          efficiency: `${control.efficiency}%`,
          lastUpdate: control.lastUpdate.toISOString(),
        })),
        battery: batteryControls.map(control => ({
          name: control.name,
          status: control.status,
          chargeLevel: `${control.chargeLevel}%`,
          capacity: `${control.capacity} MWh`,
          powerFlow: `${control.powerFlow} kW`,
          lastUpdate: control.lastUpdate.toISOString(),
        })),
      };

      // Create PDF export
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Renewable Energy Dashboard Report', 20, 30);
      
      // Metadata
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 50);
      doc.text(`Generated By: ${exportData.metadata.generatedBy}`, 20, 60);
      
      // Summary Section
      doc.setFontSize(16);
      doc.text('Summary', 20, 80);
      doc.setFontSize(12);
      let yPos = 90;
      doc.text(`Solar Capacity: ${exportData.summary.solarCapacity}`, 20, yPos);
      yPos += 10;
      doc.text(`Battery Storage: ${exportData.summary.batteryStorage}`, 20, yPos);
      yPos += 10;
      doc.text(`Renewable Mix: ${exportData.summary.renewableMix}`, 20, yPos);
      
      // Solar Section
      yPos += 20;
      if (yPos > 270) {
        doc.addPage();
        yPos = 30;
      }
      doc.setFontSize(16);
      doc.text('Solar Arrays', 20, yPos);
      yPos += 10;
      doc.setFontSize(12);
      exportData.solar.forEach((solar, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 30;
        }
        doc.text(`${solar.name}: ${solar.powerOutput} (${solar.efficiency} efficiency)`, 20, yPos);
        yPos += 10;
      });
      
      // Battery Section
      yPos += 10;
      if (yPos > 270) {
        doc.addPage();
        yPos = 30;
      }
      doc.setFontSize(16);
      doc.text('Battery Storage', 20, yPos);
      yPos += 10;
      doc.setFontSize(12);
      exportData.battery.forEach((battery, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 30;
        }
        doc.text(`${battery.name}: ${battery.chargeLevel} charged (${battery.powerFlow} kW)`, 20, yPos);
        yPos += 10;
      });
      
      // Save PDF
      const fileName = `renewable-energy-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({
        title: 'Export Successful',
        description: `Renewable energy report exported as ${fileName}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export renewable energy data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: 'Renewable Energy Dashboard',
        text: `Renewable Energy Status:
• Solar Capacity: 1.2 MW
• Battery Storage: 2.5 MWh
• Renewable Mix: 78%

View the full dashboard at: ${window.location.href}`,
        url: window.location.href,
      };

      // Try Web Share API first (mobile/desktop browsers that support it)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({
          title: 'Shared Successfully',
          description: 'Renewable energy dashboard shared successfully',
        });
      } else {
        // Fallback: Copy to clipboard
        const shareText = `${shareData.title}\n\n${shareData.text}`;
        await navigator.clipboard.writeText(shareText);
        toast({
          title: 'Link Copied',
          description: 'Dashboard link copied to clipboard. You can paste it to share.',
        });
      }
    } catch (error: any) {
      // User cancelled share or clipboard failed
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        // Fallback: Copy URL to clipboard
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast({
            title: 'Link Copied',
            description: 'Dashboard URL copied to clipboard.',
          });
        } catch (clipboardError) {
          toast({
            title: 'Share Failed',
            description: 'Unable to share. Please copy the URL manually.',
            variant: 'destructive',
          });
        }
      }
    }
  };

  const handleAddComment = () => {
    addComment('The renewable energy performance looks excellent today!', undefined, 'renewable-energy');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30" style={{ overflow: 'visible' }}>
      <div className="container mx-auto px-4 py-8" style={{ maxWidth: '100%', overflow: 'visible' }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {isRealtimeConnected && (
              <Badge variant="outline" className="flex items-center gap-1.5 bg-success/10 text-success border-success">
                <Radio className="w-3 h-3 animate-pulse" />
                Real-time
              </Badge>
            )}
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#26436C' }}>
                <span>Renewable</span>{' '}
                <span>Energy</span>{' '}
                <span>Dashboard</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Monitor and optimize your sustainable energy infrastructure
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                Live Data
              </Badge>
              {hasPermission('export:data') && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Sun className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">1.2 MW</div>
                    <div className="text-sm text-muted-foreground">Solar Capacity</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <Battery className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">2.5 MWh</div>
                    <div className="text-sm text-muted-foreground">Battery Storage</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">78%</div>
                    <div className="text-sm text-muted-foreground">Renewable Mix</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generation" className="flex items-center space-x-2">
              <Sun className="w-4 h-4" />
              <span>Generation</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center space-x-2">
              <Battery className="w-4 h-4" />
              <span>Storage</span>
            </TabsTrigger>
            <TabsTrigger value="hardware" className="flex items-center space-x-2">
              <Power className="w-4 h-4" />
              <span>Hardware</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generation" className="w-full space-y-8 mt-6" style={{ minWidth: 0, overflow: 'visible' }}>
            <div className="w-full mb-8" style={{ minWidth: 0, overflow: 'visible' }}>
              <RenewableChart height={400} className="w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mt-8 w-full" style={{ minWidth: 0 }}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Solar Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Daily Generation</span>
                      <span className="font-bold">8.2 MWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Efficiency</span>
                      <span className="font-bold">22.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Capacity Factor</span>
                      <span className="font-bold">27.3%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="storage" className="space-y-8">
            <div className="mb-8">
              <BatteryStorage />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Storage Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Capacity</span>
                      <span className="font-bold">2.5 MWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usable Capacity</span>
                      <span className="font-bold">2.3 MWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Round-trip Efficiency</span>
                      <span className="font-bold">89.5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Financial Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Daily Savings</span>
                      <span className="font-bold text-green-600">$1,240</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Revenue</span>
                      <span className="font-bold text-green-600">$37,200</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ROI</span>
                      <span className="font-bold text-green-600">24.5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Maintenance Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Last Inspection</span>
                      <span className="font-bold">2 days ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Service</span>
                      <span className="font-bold">28 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Health Score</span>
                      <span className="font-bold text-green-600">95/100</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="hardware" className="space-y-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Hardware Controls</h2>
              <p className="text-muted-foreground">
                Monitor and control solar panels and battery storage systems
              </p>
            </div>

            {/* Solar Controls Section */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-6">
                <Sun className="w-5 h-5 text-warning" />
                <h3 className="text-xl font-semibold">Solar Power Controls</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {solarControls.map((solar) => (
                  <SolarControl
                    key={solar.id}
                    initialStatus={solar.status}
                    initialConnected={solar.connected}
                    initialPowerOutput={solar.powerOutput}
                    initialEfficiency={solar.efficiency}
                  />
                ))}
              </div>
            </div>

            {/* Battery Controls Section */}
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-6">
                <Battery className="w-5 h-5 text-success" />
                <h3 className="text-xl font-semibold">Battery Storage Controls</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {batteryControls.map((battery) => (
                  <BatteryControl
                    key={battery.id}
                    initialStatus={battery.status}
                    initialConnected={battery.connected}
                    initialChargeLevel={battery.chargeLevel}
                    initialCapacity={battery.capacity}
                    initialPowerFlow={battery.powerFlow}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8">
            <div className="mb-8">
              <RenewableAnalytics />
            </div>
          </TabsContent>
        </Tabs>

        {/* Collaboration Section */}
        {hasPermission('view:reports') && (
          <Card className="glass-card mt-8">
            <CardHeader>
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Share insights and collaborate with your team on renewable energy optimization.
                </div>
                <Button onClick={handleAddComment} variant="outline" size="sm">
                  Add Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RenewableEnergy;
