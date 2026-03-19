import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Bell, User, Shield, Database, Zap, Palette, BarChart3, Download, Lock, Monitor, Settings2, Eye, Globe, Clock } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

const SettingsEnhanced = () => {
  const { settings, updateSettings, saveSettings, resetSettings } = useSettings();
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'idle' | 'saving' | 'saved' }>({});

  // Local state for form inputs (will sync with context)
  const [localSettings, setLocalSettings] = useState(settings);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync local state when context settings change (after initial load)
  useEffect(() => {
    if (!isInitialized) {
      // First load - use context settings
      setLocalSettings(settings);
      setIsInitialized(true);
    } else {
      // Subsequent updates - sync with context
      setLocalSettings(settings);
    }
  }, [settings, isInitialized]);

  // Force white theme always
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  // Update local state and context when form changes
  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    updateSettings({ [key]: value });
  };

  // Save settings to localStorage
  const handleSave = (section: string) => {
    setSaveStatus(prev => ({ ...prev, [section]: 'saving' }));
    
    try {
      // Update context with current local settings
      updateSettings(localSettings);
      
      // Save to localStorage directly (don't rely on context state update timing)
      localStorage.setItem('mine-sarthi-settings', JSON.stringify(localSettings));
      
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [section]: 'saved' }));
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [section]: 'idle' }));
        }, 2000);
      }, 500);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus(prev => ({ ...prev, [section]: 'idle' }));
      alert('Error saving settings. Please try again.');
    }
  };

  const handleExportData = () => {
    const data = {
      settings: localSettings,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mine-sarthi-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.settings) {
              setLocalSettings(data.settings);
              updateSettings(data.settings);
              saveSettings();
              alert('Settings imported successfully!');
            }
          } catch (error) {
            alert('Error importing settings. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetSettings();
      // Sync local state with reset settings
      setLocalSettings(settings);
      alert('Settings reset to defaults!');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: '#26436C' }}>
          <span>Enhanced</span>{' '}
          <span>Settings</span>
        </h2>
        <p className="text-muted-foreground">Advanced configuration and customization options</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-7 max-w-4xl">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              General Settings
            </h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input 
                  id="siteName" 
                  value={localSettings.siteName}
                  onChange={(e) => handleSettingChange('siteName', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  value={localSettings.location}
                  onChange={(e) => handleSettingChange('location', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input 
                  id="timezone" 
                  value={localSettings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Language</Label>
                  <Select 
                    value={localSettings.language} 
                    onValueChange={(value) => handleSettingChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Units</Label>
                  <Select 
                    value={localSettings.units} 
                    onValueChange={(value) => handleSettingChange('units', value as 'metric' | 'imperial')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric</SelectItem>
                      <SelectItem value="imperial">Imperial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Refresh</Label>
                  <p className="text-sm text-muted-foreground">Automatically refresh dashboard data</p>
                </div>
                <Switch
                  checked={localSettings.autoRefresh}
                  onCheckedChange={(checked) => handleSettingChange('autoRefresh', checked)}
                />
              </div>
              {localSettings.autoRefresh && (
                <div className="grid gap-2">
                  <Label>Refresh Interval: {localSettings.refreshInterval} seconds</Label>
                  <Slider
                    value={[localSettings.refreshInterval]}
                    onValueChange={(value) => handleSettingChange('refreshInterval', value[0])}
                    max={300}
                    min={10}
                    step={10}
                    className="w-full"
                  />
                </div>
              )}
            </div>
            <Button 
              className="mt-6" 
              onClick={() => handleSave('general')}
              disabled={saveStatus.general === 'saving'}
            >
              {saveStatus.general === 'saving' ? 'Saving...' : saveStatus.general === 'saved' ? 'Saved!' : 'Save Changes'}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance Settings
            </h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Font Size</Label>
                <Select 
                  value={localSettings.fontSize}
                  onValueChange={(value) => handleSettingChange('fontSize', value as 'small' | 'medium' | 'large')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                </div>
                <Switch 
                  checked={localSettings.compactMode}
                  onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Animations</Label>
                  <p className="text-sm text-muted-foreground">Enable smooth transitions and animations</p>
                </div>
                <Switch 
                  checked={localSettings.showAnimations}
                  onCheckedChange={(checked) => handleSettingChange('showAnimations', checked)}
                />
              </div>
            </div>
            <Button 
              className="mt-6" 
              onClick={() => handleSave('appearance')}
              disabled={saveStatus.appearance === 'saving'}
            >
              {saveStatus.appearance === 'saving' ? 'Applying...' : saveStatus.appearance === 'saved' ? 'Applied!' : 'Apply Appearance'}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Dashboard Customization
            </h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Default Chart Type</Label>
                <Select 
                  value={localSettings.defaultChartType}
                  onValueChange={(value) => handleSettingChange('defaultChartType', value as 'area' | 'line' | 'bar')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area">Area Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Default Time Range</Label>
                <Select 
                  value={localSettings.defaultTimeRange}
                  onValueChange={(value) => handleSettingChange('defaultTimeRange', value as '1h' | '24h' | '7d' | '30d')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Performance Badges</Label>
                  <p className="text-sm text-muted-foreground">Display efficiency and trend indicators</p>
                </div>
                <Switch 
                  checked={localSettings.showPerformanceBadges}
                  onCheckedChange={(checked) => handleSettingChange('showPerformanceBadges', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-expand Cards</Label>
                  <p className="text-sm text-muted-foreground">Automatically expand metric cards on hover</p>
                </div>
                <Switch 
                  checked={localSettings.autoExpandCards}
                  onCheckedChange={(checked) => handleSettingChange('autoExpandCards', checked)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Dashboard Layout</Label>
                <Select 
                  value={localSettings.dashboardLayout}
                  onValueChange={(value) => handleSettingChange('dashboardLayout', value as 'grid' | 'list' | 'compact')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid Layout</SelectItem>
                    <SelectItem value="list">List Layout</SelectItem>
                    <SelectItem value="compact">Compact Layout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              className="mt-6" 
              onClick={() => handleSave('dashboard')}
              disabled={saveStatus.dashboard === 'saving'}
            >
              {saveStatus.dashboard === 'saving' ? 'Saving...' : saveStatus.dashboard === 'saved' ? 'Saved!' : 'Save Dashboard Settings'}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Advanced Alert Configuration</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label>Critical Equipment Alerts</Label>
                  <p className="text-sm text-muted-foreground">Immediate notifications for critical issues</p>
                </div>
                <Switch 
                  checked={localSettings.criticalEquipmentAlerts}
                  onCheckedChange={(checked) => handleSettingChange('criticalEquipmentAlerts', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label>Energy Threshold Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notify when consumption exceeds threshold</p>
                </div>
                <Switch 
                  checked={localSettings.energyThresholdAlerts}
                  onCheckedChange={(checked) => handleSettingChange('energyThresholdAlerts', checked)}
                />
              </div>
              <div className="grid gap-2 p-3 rounded-lg bg-muted/50">
                <Label>Alert Threshold: {localSettings.alertThreshold}%</Label>
                <Slider
                  value={[localSettings.alertThreshold]}
                  onValueChange={(value) => handleSettingChange('alertThreshold', value[0])}
                  max={100}
                  min={50}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Trigger alerts when efficiency drops below this percentage</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label>Maintenance Reminders</Label>
                  <p className="text-sm text-muted-foreground">Scheduled maintenance notifications</p>
                </div>
                <Switch 
                  checked={localSettings.maintenanceReminders}
                  onCheckedChange={(checked) => handleSettingChange('maintenanceReminders', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label>AI Recommendations</Label>
                  <p className="text-sm text-muted-foreground">Real-time optimization suggestions</p>
                </div>
                <Switch 
                  checked={localSettings.aiRecommendations}
                  onCheckedChange={(checked) => handleSettingChange('aiRecommendations', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label>Daily Summary Reports</Label>
                  <p className="text-sm text-muted-foreground">Email summary at end of shift</p>
                </div>
                <Switch 
                  checked={localSettings.dailySummaryReports}
                  onCheckedChange={(checked) => handleSettingChange('dailySummaryReports', checked)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Notification Sound</Label>
                <Select 
                  value={localSettings.notificationSound}
                  onValueChange={(value) => handleSettingChange('notificationSound', value as 'none' | 'gentle' | 'urgent')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="gentle">Gentle</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              className="mt-6" 
              onClick={() => handleSave('notifications')}
              disabled={saveStatus.notifications === 'saving'}
            >
              {saveStatus.notifications === 'saving' ? 'Saving...' : saveStatus.notifications === 'saved' ? 'Saved!' : 'Save Alert Settings'}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Data Management</h3>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="dataRetention">Data Retention Period (days)</Label>
                <Input 
                  id="dataRetention" 
                  type="number" 
                  value={localSettings.dataRetentionPeriod}
                  onChange={(e) => handleSettingChange('dataRetentionPeriod', parseInt(e.target.value) || 365)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sampleRate">Sensor Sample Rate (seconds)</Label>
                <Input 
                  id="sampleRate" 
                  type="number" 
                  value={localSettings.sensorSampleRate}
                  onChange={(e) => handleSettingChange('sensorSampleRate', parseInt(e.target.value) || 5)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Backup</Label>
                  <p className="text-sm text-muted-foreground">Automatic daily system backup</p>
                </div>
                <Switch 
                  checked={localSettings.autoBackup}
                  onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Data Compression</Label>
                  <p className="text-sm text-muted-foreground">Compress historical data to save space</p>
                </div>
                <Switch 
                  checked={localSettings.dataCompression}
                  onCheckedChange={(checked) => handleSettingChange('dataCompression', checked)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Export Format</Label>
                <Select 
                  value={localSettings.exportFormat}
                  onValueChange={(value) => handleSettingChange('exportFormat', value as 'json' | 'csv' | 'xml')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" onClick={handleImportSettings}>Import Settings</Button>
              <Button 
                onClick={() => handleSave('data')}
                disabled={saveStatus.data === 'saving'}
              >
                {saveStatus.data === 'saving' ? 'Applying...' : saveStatus.data === 'saved' ? 'Applied!' : 'Apply Data Settings'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Security Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for all user accounts</p>
                </div>
                <Switch 
                  checked={localSettings.twoFactorAuth}
                  onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Session Timeout (minutes)</Label>
                <Input 
                  type="number" 
                  value={localSettings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value) || 60)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>IP Whitelisting</Label>
                  <p className="text-sm text-muted-foreground">Restrict access to specific IP addresses</p>
                </div>
                <Switch 
                  checked={localSettings.ipWhitelisting}
                  onCheckedChange={(checked) => handleSettingChange('ipWhitelisting', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">Log all user actions for security review</p>
                </div>
                <Switch 
                  checked={localSettings.auditLogging}
                  onCheckedChange={(checked) => handleSettingChange('auditLogging', checked)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Password Policy</Label>
                <Select 
                  value={localSettings.passwordPolicy}
                  onValueChange={(value) => handleSettingChange('passwordPolicy', value as 'basic' | 'strong' | 'enterprise')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (8+ chars)</SelectItem>
                    <SelectItem value="strong">Strong (12+ chars, mixed)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (Complex requirements)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              className="mt-6" 
              onClick={() => handleSave('security')}
              disabled={saveStatus.security === 'saving'}
            >
              {saveStatus.security === 'saving' ? 'Updating...' : saveStatus.security === 'saved' ? 'Updated!' : 'Update Security Settings'}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Advanced Configuration</h3>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="modelVersion">AI Model Version</Label>
                <Input 
                  id="modelVersion" 
                  value={localSettings.modelVersion}
                  onChange={(e) => handleSettingChange('modelVersion', e.target.value)}
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="updateFrequency">Model Update Frequency</Label>
                <Input 
                  id="updateFrequency" 
                  value={localSettings.updateFrequency}
                  onChange={(e) => handleSettingChange('updateFrequency', e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label>Auto-apply Recommendations</Label>
                  <p className="text-sm text-muted-foreground">Automatically apply high-confidence suggestions</p>
                </div>
                <Switch 
                  checked={localSettings.autoApplyRecommendations}
                  onCheckedChange={(checked) => handleSettingChange('autoApplyRecommendations', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label>Learning Mode</Label>
                  <p className="text-sm text-muted-foreground">Continuously improve model with operational data</p>
                </div>
                <Switch 
                  checked={localSettings.learningMode}
                  onCheckedChange={(checked) => handleSettingChange('learningMode', checked)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Debug Mode</Label>
                <Select 
                  value={localSettings.debugMode}
                  onValueChange={(value) => handleSettingChange('debugMode', value as 'off' | 'basic' | 'verbose')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="basic">Basic Logging</SelectItem>
                    <SelectItem value="verbose">Verbose Logging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Performance Monitoring</Label>
                  <p className="text-sm text-muted-foreground">Track application performance metrics</p>
                </div>
                <Switch 
                  checked={localSettings.performanceMonitoring}
                  onCheckedChange={(checked) => handleSettingChange('performanceMonitoring', checked)}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={handleResetDefaults}>Reset to Defaults</Button>
              <Button 
                onClick={() => handleSave('advanced')}
                disabled={saveStatus.advanced === 'saving'}
              >
                {saveStatus.advanced === 'saving' ? 'Applying...' : saveStatus.advanced === 'saved' ? 'Applied!' : 'Apply Advanced Settings'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsEnhanced;
