import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AppSettings {
  // General Settings
  siteName: string;
  location: string;
  timezone: string;
  language: string;
  units: 'metric' | 'imperial';
  autoRefresh: boolean;
  refreshInterval: number; // seconds

  // Appearance Settings
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  showAnimations: boolean;

  // Dashboard Settings
  defaultChartType: 'area' | 'line' | 'bar';
  defaultTimeRange: '1h' | '24h' | '7d' | '30d';
  showPerformanceBadges: boolean;
  autoExpandCards: boolean;
  dashboardLayout: 'grid' | 'list' | 'compact';

  // Notification Settings
  criticalEquipmentAlerts: boolean;
  energyThresholdAlerts: boolean;
  alertThreshold: number; // percentage
  maintenanceReminders: boolean;
  aiRecommendations: boolean;
  dailySummaryReports: boolean;
  notificationSound: 'none' | 'gentle' | 'urgent';

  // Data Settings
  dataRetentionPeriod: number; // days
  sensorSampleRate: number; // seconds
  autoBackup: boolean;
  dataCompression: boolean;
  exportFormat: 'json' | 'csv' | 'xml';

  // Security Settings
  twoFactorAuth: boolean;
  sessionTimeout: number; // minutes
  ipWhitelisting: boolean;
  auditLogging: boolean;
  passwordPolicy: 'basic' | 'strong' | 'enterprise';

  // Advanced Settings
  modelVersion: string;
  updateFrequency: string;
  autoApplyRecommendations: boolean;
  learningMode: boolean;
  debugMode: 'off' | 'basic' | 'verbose';
  performanceMonitoring: boolean;
}

const defaultSettings: AppSettings = {
  // General
  siteName: 'Iron Ore Processing Plant A',
  location: 'Western Australia',
  timezone: 'GMT+8 (AWST)',
  language: 'en',
  units: 'metric',
  autoRefresh: true,
  refreshInterval: 30,

  // Appearance
  fontSize: 'medium',
  compactMode: false,
  showAnimations: true,

  // Dashboard
  defaultChartType: 'area',
  defaultTimeRange: '24h',
  showPerformanceBadges: true,
  autoExpandCards: false,
  dashboardLayout: 'grid',

  // Notifications
  criticalEquipmentAlerts: true,
  energyThresholdAlerts: true,
  alertThreshold: 85,
  maintenanceReminders: true,
  aiRecommendations: true,
  dailySummaryReports: false,
  notificationSound: 'gentle',

  // Data
  dataRetentionPeriod: 365,
  sensorSampleRate: 5,
  autoBackup: true,
  dataCompression: true,
  exportFormat: 'json',

  // Security
  twoFactorAuth: false,
  sessionTimeout: 60,
  ipWhitelisting: false,
  auditLogging: true,
  passwordPolicy: 'strong',

  // Advanced
  modelVersion: 'SmartComminution-v2.4.1',
  updateFrequency: 'Weekly',
  autoApplyRecommendations: false,
  learningMode: true,
  debugMode: 'off',
  performanceMonitoring: true,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  saveSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'mine-sarthi-settings';

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new settings
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(defaultSettings);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Apply settings to the application
  useEffect(() => {
    if (!isLoaded) return;

    // Apply auto-refresh setting
    if (settings.autoRefresh) {
      // This will be handled by components that need auto-refresh
      document.documentElement.setAttribute('data-auto-refresh', 'true');
      document.documentElement.setAttribute('data-refresh-interval', settings.refreshInterval.toString());
    } else {
      document.documentElement.setAttribute('data-auto-refresh', 'false');
    }

    // Apply appearance settings
    document.documentElement.setAttribute('data-font-size', settings.fontSize);
    document.documentElement.setAttribute('data-compact-mode', settings.compactMode.toString());
    document.documentElement.setAttribute('data-show-animations', settings.showAnimations.toString());

    // Apply language
    document.documentElement.setAttribute('lang', settings.language);

    // Apply units
    document.documentElement.setAttribute('data-units', settings.units);

    // Apply chart type
    document.documentElement.setAttribute('data-default-chart-type', settings.defaultChartType);

    // Apply time range
    document.documentElement.setAttribute('data-default-time-range', settings.defaultTimeRange);

    // Apply dashboard layout
    document.documentElement.setAttribute('data-dashboard-layout', settings.dashboardLayout);

    // Apply alert threshold
    document.documentElement.setAttribute('data-alert-threshold', settings.alertThreshold.toString());

    // Apply debug mode
    if (settings.debugMode !== 'off') {
      console.log('[Settings] Debug mode:', settings.debugMode);
    }
  }, [settings, isLoaded]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      console.log('[Settings] Settings saved to localStorage');
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    // Re-apply default settings to document immediately
    const root = document.documentElement;
    root.setAttribute('data-auto-refresh', defaultSettings.autoRefresh.toString());
    root.setAttribute('data-refresh-interval', defaultSettings.refreshInterval.toString());
    root.setAttribute('data-font-size', defaultSettings.fontSize);
    root.setAttribute('data-compact-mode', defaultSettings.compactMode.toString());
    root.setAttribute('data-show-animations', defaultSettings.showAnimations.toString());
    root.setAttribute('lang', defaultSettings.language);
    root.setAttribute('data-units', defaultSettings.units);
    root.setAttribute('data-default-chart-type', defaultSettings.defaultChartType);
    root.setAttribute('data-default-time-range', defaultSettings.defaultTimeRange);
    root.setAttribute('data-dashboard-layout', defaultSettings.dashboardLayout);
    root.setAttribute('data-alert-threshold', defaultSettings.alertThreshold.toString());
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
    resetSettings,
    saveSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

