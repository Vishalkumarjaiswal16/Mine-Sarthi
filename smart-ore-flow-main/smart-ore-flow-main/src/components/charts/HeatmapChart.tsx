import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { MapPin, Package, Camera, Layers, Eye, EyeOff, Maximize2, Minimize2, Info, TrendingUp, Activity, Zap, Settings, Cloud } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Enhanced CSS for Industrial Energy-Hotspot Heatmap
const heatmapStyles = `
  .heat-pulse {
    animation: heatPulse 3s ease-in-out infinite;
  }
  
  @keyframes heatPulse {
    0%, 100% {
      opacity: 0.85;
      transform: scale(1);
      filter: brightness(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.15);
      filter: brightness(1.2);
    }
  }
  
  .heat-glow {
    filter: drop-shadow(0 0 12px rgba(255, 69, 0, 0.9));
    animation: heatGlow 2.5s ease-in-out infinite;
  }
  
  @keyframes heatGlow {
    0%, 100% {
      filter: drop-shadow(0 0 12px rgba(255, 69, 0, 0.9)) brightness(1);
    }
    50% {
      filter: drop-shadow(0 0 24px rgba(255, 255, 0, 1)) brightness(1.3);
    }
  }
  
  .industrial-tooltip {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%) !important;
    backdrop-filter: blur(16px);
    border: 2px solid rgba(59, 130, 246, 0.4) !important;
    border-radius: 12px !important;
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.7),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    padding: 0 !important;
    font-family: 'Inter', -apple-system, sans-serif;
    animation: tooltipFadeIn 0.3s ease-out;
    color: white !important;
  }
  
  .leaflet-popup-content-wrapper {
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  
  .leaflet-popup-tip {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%) !important;
    border: 2px solid rgba(59, 130, 246, 0.4) !important;
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
  }
  
  .leaflet-popup-close-button {
    color: white !important;
    font-size: 20px !important;
    font-weight: bold !important;
    padding: 8px !important;
    opacity: 0.8 !important;
    transition: opacity 0.2s ease !important;
  }
  
  .leaflet-popup-close-button:hover {
    opacity: 1 !important;
    color: #ef4444 !important;
  }
  
  @keyframes tooltipFadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .heatmap-dark-overlay {
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.25));
    pointer-events: none;
    z-index: 100;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = heatmapStyles;
  if (!document.head.querySelector('style[data-heatmap-styles]')) {
    styleSheet.setAttribute('data-heatmap-styles', 'true');
    document.head.appendChild(styleSheet);
  }
}

interface HeatmapData {
  lat: number;
  lng: number;
  weight: number;
  intensity?: number; // 0-1 scaled value for heat intensity
  name?: string;
  label?: string;
  production?: number;
  efficiency?: number;
  status?: string;
  energyLoad?: number;
  machineStatus?: string;
  equipmentEfficiency?: number;
  elevation?: number;
  area?: number;
  workforce?: number;
  commodity?: string;
  operator?: string;
  lastInspection?: string;
  nextMaintenance?: string;
  updatedAt?: string;
  temperature?: number;
}

interface HeatmapChartProps {
  heatmapData?: HeatmapData[];
  title?: string;
  height?: number;
  className?: string;
  selectedLayer?: string;
  onSiteSelect?: (site: HeatmapData) => void; // Callback for site selection
}

// Enhanced Combined Heatmap Component
const CombinedHeatmap: React.FC<{ 
  heatmapData: HeatmapData[]; 
  height: number; 
  selectedLayer?: string;
  onSiteSelect?: (site: HeatmapData) => void;
  showThermal?: boolean;
  showMap?: boolean;
  heatIntensity?: number[];
  thermalOpacity?: number[];
  onSiteClick?: (site: HeatmapData) => void;
  mapStyle?: 'satellite' | 'hybrid' | 'terrain';
  heatRadius?: number[];
  heatBlur?: number[];
  intensityMultiplier?: number[];
  enablePulse?: boolean;
}> = ({
  heatmapData,
  height,
  selectedLayer = 'energy',
  onSiteSelect,
  showThermal: _showThermal = true,
  showMap = true,
  heatIntensity = [50],
  thermalOpacity: _thermalOpacity = [70],
  onSiteClick,
  mapStyle = 'hybrid',
  heatRadius = [60],
  heatBlur = [35],
  intensityMultiplier = [1.0],
  enablePulse = true,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);

  // India center coordinates - Focused on mining regions
  // India boundaries: Latitude 6.5°N to 37.1°N, Longitude 68.1°E to 97.4°E
  const center: [number, number] = [22.0, 82.0]; // Central India (mining belt - Odisha, Jharkhand, Chhattisgarh)
  const zoom = 6; // Zoom level to show India mining sites

  // Simulated India Mining Sites Data (if no data provided)
  const getIndiaMiningSites = (): HeatmapData[] => {
    // Real India mining locations with coordinates
    return [
      // Odisha Mining Sites
      {
        lat: 22.0300, lng: 85.4300, weight: 0.85, intensity: 0.85,
        name: 'Joda Iron Ore Mine', label: 'Joda Iron Ore Mine',
        production: 1200, efficiency: 92, status: 'Excellent',
        energyLoad: 2850, equipmentEfficiency: 88, temperature: 32,
        commodity: 'Iron Ore', operator: 'Tata Steel', area: 1250,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 21.8500, lng: 85.2000, weight: 0.75, intensity: 0.75,
        name: 'Barbil Mining Complex', label: 'Barbil Mining Complex',
        production: 980, efficiency: 87, status: 'Optimal',
        energyLoad: 2450, equipmentEfficiency: 85, temperature: 31,
        commodity: 'Iron Ore', operator: 'SAIL', area: 980,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 22.1500, lng: 85.6000, weight: 0.70, intensity: 0.70,
        name: 'Noamundi Iron Mine', label: 'Noamundi Iron Mine',
        production: 850, efficiency: 84, status: 'Good',
        energyLoad: 2200, equipmentEfficiency: 82, temperature: 30,
        commodity: 'Iron Ore', operator: 'Tata Steel', area: 750,
        updatedAt: new Date().toISOString()
      },
      // Jharkhand Mining Sites
      {
        lat: 22.8000, lng: 86.2000, weight: 0.90, intensity: 0.90,
        name: 'Kiriburu Iron Ore Mine', label: 'Kiriburu Iron Ore Mine',
        production: 1350, efficiency: 94, status: 'Excellent',
        energyLoad: 3200, equipmentEfficiency: 90, temperature: 33,
        commodity: 'Iron Ore', operator: 'SAIL', area: 1500,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 22.6500, lng: 85.9000, weight: 0.80, intensity: 0.80,
        name: 'Meghahatuburu Mine', label: 'Meghahatuburu Mine',
        production: 1100, efficiency: 89, status: 'Optimal',
        energyLoad: 2700, equipmentEfficiency: 87, temperature: 32,
        commodity: 'Iron Ore', operator: 'SAIL', area: 1100,
        updatedAt: new Date().toISOString()
      },
      // Chhattisgarh Mining Sites
      {
        lat: 20.2000, lng: 81.1000, weight: 0.65, intensity: 0.65,
        name: 'Bailadila Iron Ore Mine', label: 'Bailadila Iron Ore Mine',
        production: 720, efficiency: 81, status: 'Good',
        energyLoad: 1950, equipmentEfficiency: 79, temperature: 29,
        commodity: 'Iron Ore', operator: 'NMDC', area: 650,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 20.5000, lng: 81.4000, weight: 0.60, intensity: 0.60,
        name: 'Dalli-Rajhara Mine', label: 'Dalli-Rajhara Mine',
        production: 680, efficiency: 78, status: 'Fair',
        energyLoad: 1800, equipmentEfficiency: 76, temperature: 28,
        commodity: 'Iron Ore', operator: 'Bhilai Steel', area: 580,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 18.7000, lng: 81.1000, weight: 0.72, intensity: 0.72,
        name: 'BIOM – Kirandul Complex', label: 'BIOM – Kirandul Complex',
        production: 800, efficiency: 83, status: 'Good',
        energyLoad: 2150, equipmentEfficiency: 81, temperature: 30,
        commodity: 'Iron Ore', operator: 'NMDC', area: 720,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 18.6000, lng: 81.0000, weight: 0.70, intensity: 0.70,
        name: 'BIOM – Bacheli Complex', label: 'BIOM – Bacheli Complex',
        production: 780, efficiency: 82, status: 'Good',
        energyLoad: 2050, equipmentEfficiency: 80, temperature: 29,
        commodity: 'Iron Ore', operator: 'NMDC', area: 700,
        updatedAt: new Date().toISOString()
      },
      // Karnataka Mining Sites
      {
        lat: 15.3000, lng: 76.5000, weight: 0.55, intensity: 0.55,
        name: 'Hospet Iron Ore Mine', label: 'Hospet Iron Ore Mine',
        production: 600, efficiency: 75, status: 'Fair',
        energyLoad: 1650, equipmentEfficiency: 73, temperature: 27,
        commodity: 'Iron Ore', operator: 'JSW Steel', area: 520,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 15.2000, lng: 76.5000, weight: 0.68, intensity: 0.68,
        name: 'Donimalai Iron Ore Mine', label: 'Donimalai Iron Ore Mine',
        production: 750, efficiency: 81, status: 'Good',
        energyLoad: 2100, equipmentEfficiency: 79, temperature: 29,
        commodity: 'Iron Ore', operator: 'NMDC', area: 680,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 15.3000, lng: 76.6000, weight: 0.65, intensity: 0.65,
        name: 'Kumaraswamy Iron Ore Mine', label: 'Kumaraswamy Iron Ore Mine',
        production: 720, efficiency: 80, status: 'Good',
        energyLoad: 2000, equipmentEfficiency: 78, temperature: 28,
        commodity: 'Iron Ore', operator: 'NMDC', area: 650,
        updatedAt: new Date().toISOString()
      },
      // Goa Mining Sites
      {
        lat: 15.5000, lng: 73.8000, weight: 0.50, intensity: 0.50,
        name: 'Goa Iron Ore Mine', label: 'Goa Iron Ore Mine',
        production: 550, efficiency: 72, status: 'Fair',
        energyLoad: 1500, equipmentEfficiency: 70, temperature: 26,
        commodity: 'Iron Ore', operator: 'Vedanta', area: 480,
        updatedAt: new Date().toISOString()
      },
      // Additional Odisha Sites
      {
        lat: 21.9500, lng: 85.3500, weight: 0.68, intensity: 0.68,
        name: 'Gua Iron Ore Mine', label: 'Gua Iron Ore Mine',
        production: 750, efficiency: 82, status: 'Good',
        energyLoad: 2100, equipmentEfficiency: 80, temperature: 30,
        commodity: 'Iron Ore', operator: 'SAIL', area: 680,
        updatedAt: new Date().toISOString()
      },
    ];
  };

  // Use simulated data if no data provided or if data doesn't contain India points
  const effectiveHeatmapData = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) {
      console.log('🇮🇳 No data provided, using simulated India mining sites');
      return getIndiaMiningSites();
    }
    
    // Check if any points are in India
    const hasIndiaPoints = heatmapData.some(point => 
      point.lat >= 6.5 && point.lat <= 37.1 && 
      point.lng >= 68.1 && point.lng <= 97.4
    );
    
    if (!hasIndiaPoints) {
      console.log('🇮🇳 No India points in data, using simulated India mining sites');
      return getIndiaMiningSites();
    }
    
    // Filter to India-only points
    return heatmapData.filter(point => 
      point.lat >= 6.5 && point.lat <= 37.1 && 
      point.lng >= 68.1 && point.lng <= 97.4
    );
  }, [heatmapData]);

  // Initialize Map with Enhanced GIS-Style Heat Layer
  useEffect(() => {
    if (!mapRef.current || !showMap) return undefined;

    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
    }

    // Use effective data (simulated if needed) - Filter to India-only
    // India boundaries: Latitude 6.5°N to 37.1°N, Longitude 68.1°E to 97.4°E
    const heatData: [number, number, number][] = effectiveHeatmapData
      .map(point => {
        const intensity = (point.intensity ?? point.weight ?? 0.5) * (intensityMultiplier?.[0] ?? 1.0);
        return [
          point.lat,  // Accurate latitude (India)
          point.lng,  // Accurate longitude (India)
          Math.max(0, Math.min(1, intensity)) // Clamp between 0-1
        ];
      });

    // Industrial Energy-Hotspot 5-Step Gradient: Green → Yellow → Orange → Red-Orange → Bright Red + White Core
    // Smooth blending for close hotspots, organic appearance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    heatLayerRef.current = (L as any).heatLayer(heatData, {
      radius: heatRadius?.[0] ?? 60, // Adjustable radius for smooth blending
      blur: heatBlur?.[0] ?? 35, // Soft blurred edges for organic look, smooth feathering
      maxZoom: 18,
      max: 1.0,
      minOpacity: 0.15, // Minimum visibility for low-intensity areas
      // 5-step industrial gradient with smooth transitions (blend mode: screen/overlay effect)
      gradient: {
        0.0: 'rgba(0, 255, 0, 0)',          // Green - Low (transparent start)
        0.2: 'rgba(0, 255, 0, 0.4)',       // Green - Low intensity (#00FF00)
        0.4: 'rgba(255, 255, 0, 0.6)',      // Yellow - Mid-Low intensity (#FFFF00)
        0.6: 'rgba(255, 165, 0, 0.75)',    // Orange - Mid intensity (#FFA500)
        0.8: 'rgba(255, 69, 0, 0.85)',     // Red-Orange - High intensity (#FF4500)
        0.95: 'rgba(255, 0, 0, 0.95)',     // Bright Red - Extreme intensity
        1.0: 'rgba(255, 255, 255, 1.0)'    // White Core - Maximum intensity (hotspot center)
      },
    }).addTo(mapRef.current);

    // Industrial Heat Pulse Animation (2-4 second loop, slow expansion, opacity breathing)
    let animationFrame: number;
    let pulseTime = 0;
    
    const animatePulse = () => {
      if (!enablePulse) {
        return;
      }
      
      pulseTime += 0.015; // Slower animation for industrial feel (2-4 second loop)
      if (heatLayerRef.current && mapRef.current) {
        // Opacity breathing effect
        const pulseOpacity = 0.15 + Math.sin(pulseTime) * 0.08; // Opacity breathing
        
        // Update heat layer with pulsing effect
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((heatLayerRef.current as any).setOptions) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (heatLayerRef.current as any).setOptions({
            minOpacity: pulseOpacity,
            // Note: leaflet.heat doesn't directly support scale, but we can adjust radius dynamically
            radius: (heatRadius?.[0] ?? 60) * (1 + Math.sin(pulseTime) * 0.05) // Subtle radius pulse
          });
        }
      }
      animationFrame = requestAnimationFrame(animatePulse);
    };
    
    if (enablePulse) {
      animatePulse();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [effectiveHeatmapData, heatIntensity, showMap, selectedLayer, heatRadius, enablePulse, intensityMultiplier, heatBlur]);

  const createHotspotIcon = (intensity: number, size: number = 32, name?: string) => {
    // Enhanced circular hotspot marker with better visibility
    // Intensity determines color: Green → Yellow → Orange → Red → White Core
    const baseSize = size;
    const intensityValue = Math.max(0, Math.min(1, intensity));
    
    // Determine color based on intensity (matching heatmap gradient)
    let fillColor = '#10b981'; // Green (low) - using Tailwind green
    let glowColor = 'rgba(16, 185, 129, 0.8)';
    let borderColor = '#ffffff';
    
    if (intensityValue >= 0.95) {
      fillColor = '#ffffff'; // White core (extreme)
      glowColor = 'rgba(255, 255, 255, 1)';
      borderColor = '#fbbf24';
    } else if (intensityValue >= 0.8) {
      fillColor = '#ef4444'; // Bright Red (extreme)
      glowColor = 'rgba(239, 68, 68, 0.9)';
      borderColor = '#ffffff';
    } else if (intensityValue >= 0.6) {
      fillColor = '#f97316'; // Orange (high)
      glowColor = 'rgba(249, 115, 22, 0.8)';
      borderColor = '#ffffff';
    } else if (intensityValue >= 0.4) {
      fillColor = '#f59e0b'; // Amber (mid)
      glowColor = 'rgba(245, 158, 11, 0.7)';
      borderColor = '#ffffff';
    } else if (intensityValue >= 0.2) {
      fillColor = '#eab308'; // Yellow (mid-low)
      glowColor = 'rgba(234, 179, 8, 0.6)';
      borderColor = '#ffffff';
    }
    
    // Size scales with intensity - larger for better visibility
    const circleSize = baseSize * (0.7 + intensityValue * 0.5);
    const outerGlowSize = circleSize * 1.6;
    
    return L.divIcon({
      html: `
        <div style="
          position: relative;
          width: ${outerGlowSize}px;
          height: ${outerGlowSize}px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <!-- Outer pulse ring -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${outerGlowSize}px;
            height: ${outerGlowSize}px;
            background: radial-gradient(circle, ${glowColor} 0%, ${glowColor}40 40%, transparent 70%);
            border-radius: 50%;
            animation: pulseGlow 2.5s ease-in-out infinite;
            z-index: 1;
          "></div>
          <!-- Middle glow ring -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${circleSize * 1.3}px;
            height: ${circleSize * 1.3}px;
            background: radial-gradient(circle, ${glowColor}80 0%, ${glowColor}40 50%, transparent 80%);
            border-radius: 50%;
            animation: pulseGlow 2s ease-in-out infinite;
            animation-delay: 0.5s;
            z-index: 2;
          "></div>
          <!-- Main hotspot circle -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${circleSize}px;
            height: ${circleSize}px;
            background: radial-gradient(circle, ${fillColor} 0%, ${fillColor}ee 40%, ${fillColor}cc 100%);
            border-radius: 50%;
            border: 3px solid ${borderColor};
            box-shadow: 
              0 0 ${circleSize * 0.6}px ${glowColor},
              0 0 ${circleSize * 1}px ${glowColor}66,
              0 0 ${circleSize * 1.5}px ${glowColor}33,
              inset 0 0 ${circleSize * 0.4}px rgba(255,255,255,0.4);
            z-index: 3;
            transition: all 0.3s ease;
          "></div>
          <!-- Inner bright core for high intensity -->
          ${intensityValue > 0.5 ? `
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${circleSize * 0.5}px;
            height: ${circleSize * 0.5}px;
            background: radial-gradient(circle, #ffffff 0%, ${fillColor}ff 100%);
            border-radius: 50%;
            box-shadow: 0 0 ${circleSize * 0.4}px rgba(255,255,255,0.9);
            z-index: 4;
            animation: corePulse 1.5s ease-in-out infinite;
          "></div>
          ` : ''}
          <!-- Site name label (optional, shown on hover) -->
          ${name ? `
          <div style="
            position: absolute;
            top: ${outerGlowSize + 5}px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(8px);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            z-index: 10;
          " class="marker-label">${name}</div>
          ` : ''}
        </div>
        <style>
          @keyframes pulseGlow {
            0%, 100% {
              opacity: 0.5;
              transform: translate(-50%, -50%) scale(1);
            }
            50% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1.15);
            }
          }
          @keyframes corePulse {
            0%, 100% {
              opacity: 0.8;
              transform: translate(-50%, -50%) scale(1);
            }
            50% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1.1);
            }
          }
          .hotspot-circle-marker:hover .marker-label {
            opacity: 1 !important;
          }
          .hotspot-circle-marker:hover > div > div:nth-child(3) {
            transform: translate(-50%, -50%) scale(1.15) !important;
            box-shadow: 
              0 0 ${circleSize * 0.8}px ${glowColor},
              0 0 ${circleSize * 1.2}px ${glowColor}88,
              0 0 ${circleSize * 2}px ${glowColor}44 !important;
          }
        </style>
      `,
      className: 'hotspot-circle-marker',
      iconSize: [outerGlowSize, outerGlowSize + (name ? 30 : 0)],
      iconAnchor: [outerGlowSize / 2, outerGlowSize / 2],
    });
  };

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Map View - 3D View Removed */}
      {showMap && (
        <div 
          className="absolute inset-0 rounded-lg overflow-hidden"
          style={{ zIndex: 1 }}
        >
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
            zoomControl={true}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            touchZoom={true}
            dragging={true}
            minZoom={2}
            maxZoom={18}
          >
            {/* Enhanced High-Quality Map Tiles - Better Resolution and Quality */}
            {mapStyle === 'satellite' && (
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com">Esri</a> | &copy; <a href="https://www.google.com/maps">Google</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                opacity={1}
                maxZoom={20}
                tileSize={256}
                zoomOffset={0}
                detectRetina={true}
              />
            )}
            
            {mapStyle === 'hybrid' && (
              <>
                {/* High-quality satellite base */}
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com">Esri</a>'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  opacity={0.75}
                  maxZoom={20}
                  tileSize={256}
                  zoomOffset={0}
                  detectRetina={true}
                />
                {/* Enhanced street overlay for hybrid */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  opacity={0.45}
                  maxZoom={20}
                  tileSize={256}
                  zoomOffset={0}
                  detectRetina={true}
                />
              </>
            )}
            
            {mapStyle === 'terrain' && (
              <>
                {/* Enhanced terrain base with better shading */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  opacity={1}
                  maxZoom={17}
                  tileSize={256}
                  zoomOffset={0}
                  detectRetina={true}
                />
              </>
            )}
            
            {/* Render circular hotspot markers ONLY for India mining sites */}
            {effectiveHeatmapData && effectiveHeatmapData.length > 0 ? (
              effectiveHeatmapData.map((point, index) => {
                // Calculate intensity for hotspot color
                const intensity = point.intensity ?? point.weight ?? 0.5;
                const markerSize = 24; // Base size for hotspot circles
                
                return (
                  <React.Fragment key={`hotspot-${index}-${point.lat}-${point.lng}`}>
                  {/* Main mining site hotspot */}
                <Marker
                  position={[point.lat, point.lng]}
                    icon={createHotspotIcon(intensity, markerSize, point.name || point.label)}
                    eventHandlers={{
                    click: () => {
                      if (onSiteClick) {
                        onSiteClick(point);
                      }
                      if (onSiteSelect) {
                        onSiteSelect(point);
                      }
                    },
                    mouseover: (e) => {
                      const marker = e.target;
                      marker.setZIndexOffset(1000); // Bring to front on hover
                      if (onSiteClick) {
                        // Set hovered site for tooltip
                        onSiteClick(point);
                      }
                    },
                    mouseout: (e) => {
                      const marker = e.target;
                      marker.setZIndexOffset(0); // Reset z-index
                    }
                  }}
                >
                  <Popup className="industrial-tooltip min-w-[380px] max-w-[480px]" maxWidth={480}>
                    <div className="p-5 space-y-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-lg">
                      {/* Enhanced Header with site info */}
                      <div className="flex items-start justify-between pb-3 border-b border-white/20">
                        <div className="space-y-2 flex-1">
                          <h3 className="font-bold text-xl text-white leading-tight">
                            {point.name || point.label || `Mining Site ${index + 1}`}
                          </h3>
                          <div className="flex items-center gap-3 text-sm">
                            <p className="text-white/80 flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="font-mono">{point.lat.toFixed(6)}°, {point.lng.toFixed(6)}°</span>
                            </p>
                            {point.elevation && (
                              <p className="text-white/70 text-xs">
                                Elevation: {point.elevation}m
                              </p>
                            )}
                          </div>
                          {(point.operator || point.commodity) && (
                            <div className="flex items-center gap-3 text-xs text-white/70">
                              {point.operator && (
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {point.operator}
                                </span>
                              )}
                              {point.commodity && (
                                <span className="px-2 py-1 bg-primary/20 rounded text-primary border border-primary/30">
                                  {point.commodity}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold px-3 py-1.5 ${
                            point.status === 'Excellent' ? 'bg-green-500/20 text-green-300 border-green-400' :
                            point.status === 'Optimal' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400' :
                            point.status === 'Good' ? 'bg-blue-500/20 text-blue-300 border-blue-400' :
                            point.status === 'Fair' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400' :
                            'bg-red-500/20 text-red-300 border-red-400'
                          }`}
                        >
                          {point.status || 'Unknown'}
                        </Badge>
                      </div>

                      {/* Enhanced Industrial-Grade Tooltip Metrics - Clear and Visible */}
                      <div className="grid grid-cols-2 gap-3">

                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 hover:bg-white/15 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <Cloud className="w-5 h-5 text-blue-400" />
                            <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">Temperature</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-400 mb-1">
                            {point.temperature ? `${point.temperature}°C` : 'N/A'}
                          </div>
                          <div className="text-xs text-white/60">Ambient</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 hover:bg-white/15 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">Production</span>
                          </div>
                          <div className="text-2xl font-bold text-green-400 mb-1">{point.production || 'N/A'}</div>
                          <div className="text-xs text-white/60">Tons/Hour</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 hover:bg-white/15 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-5 h-5 text-emerald-400" />
                            <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">Efficiency</span>
                          </div>
                          <div className="text-2xl font-bold text-emerald-400 mb-1">{point.efficiency || 'N/A'}%</div>
                          <div className="text-xs text-white/60">Utilization</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 hover:bg-white/15 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">Energy Load</span>
                          </div>
                          <div className="text-2xl font-bold text-yellow-400 mb-1">{point.energyLoad || 'N/A'}</div>
                          <div className="text-xs text-white/60">kWh ({point.energyLoad ? ((point.energyLoad / 3000) * 100).toFixed(0) : 'N/A'}% Capacity)</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 hover:bg-white/15 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <Settings className="w-5 h-5 text-purple-400" />
                            <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">Equipment</span>
                          </div>
                          <div className="text-2xl font-bold text-purple-400 mb-1">{point.equipmentEfficiency || 'N/A'}%</div>
                          <div className="text-xs text-white/60">Efficiency</div>
                        </div>
                      </div>

                      {/* Last Updated Time */}
                      {point.updatedAt && (
                        <div className="border-t pt-2 mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Last Updated:</span>
                            <span className="font-mono text-muted-foreground">
                              {new Date(point.updatedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Enhanced Additional Site Information */}
                      {(point.operator || point.commodity || point.area || point.workforce) && (
                        <div className="border-t border-white/20 pt-4 space-y-3">
                          <h4 className="text-sm font-bold text-white/90 uppercase tracking-wide mb-2">Site Details</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {point.area && (
                              <div className="bg-white/5 p-3 rounded border border-white/10">
                                <div className="text-xs text-white/60 mb-1">Site Area</div>
                                <div className="text-base font-bold text-white">{point.area.toLocaleString()} ha</div>
                              </div>
                            )}
                            {point.workforce && (
                              <div className="bg-white/5 p-3 rounded border border-white/10">
                                <div className="text-xs text-white/60 mb-1">Workforce</div>
                                <div className="text-base font-bold text-white">{point.workforce.toLocaleString()} employees</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Maintenance Information */}
                      {(point.lastInspection || point.nextMaintenance) && (
                        <div className="border-t pt-3 space-y-2">
                          {point.lastInspection && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Last Inspection:</span>
                              <span className="font-medium">{point.lastInspection}</span>
                            </div>
                          )}
                          {point.nextMaintenance && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Next Service:</span>
                              <span className="font-medium">{point.nextMaintenance}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Weather Integration - View Weather Button */}
                      <div className="border-t pt-3 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            if (onSiteSelect) {
                              onSiteSelect(point);
                            }
                            // Navigate to weather page with site coordinates
                            const weatherUrl = `/weather?lat=${point.lat}&lng=${point.lng}&name=${encodeURIComponent(point.name || 'Mining Site')}`;
                            window.location.href = weatherUrl;
                          }}
                        >
                          <Cloud className="w-4 h-4 mr-2" />
                          View Weather for This Site
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
                
                {/* Component hotspots - Show mining site components as circles around main site */}
                {/* Equipment Component Circle */}
                {point.equipmentEfficiency && (
                <Circle
                    center={[point.lat + 0.001, point.lng + 0.001]}
                    radius={30000}
                  pathOptions={{
                      color: '#3b82f6',
                      fillColor: '#3b82f6',
                      fillOpacity: 0.3,
                    weight: 2,
                      dashArray: '5, 5',
                    }}
                  >
                    <Tooltip permanent={false} direction="top" offset={[0, -10]}>
                      <div className="p-2 space-y-1">
                        <div className="font-semibold text-xs">Equipment Component</div>
                        <div className="text-xs text-muted-foreground">
                          Efficiency: {point.equipmentEfficiency}%
          </div>
            </div>
                    </Tooltip>
                  </Circle>
                )}
                
                {/* Production Component Circle */}
                {point.production && (
                  <Circle
                    center={[point.lat - 0.001, point.lng + 0.001]}
                    radius={25000}
                    pathOptions={{
                      color: '#10b981',
                      fillColor: '#10b981',
                      fillOpacity: 0.25,
                      weight: 2,
                      dashArray: '5, 5',
                    }}
                  >
                    <Tooltip permanent={false} direction="top" offset={[0, -10]}>
                      <div className="p-2 space-y-1">
                        <div className="font-semibold text-xs">Production Component</div>
                        <div className="text-xs text-muted-foreground">
                          Rate: {point.production} tph
          </div>
          </div>
                    </Tooltip>
                  </Circle>
                )}
                
                {/* Energy Component Circle */}
                {point.energyLoad && (
                  <Circle
                    center={[point.lat + 0.001, point.lng - 0.001]}
                    radius={20000}
                    pathOptions={{
                      color: '#f59e0b',
                      fillColor: '#f59e0b',
                      fillOpacity: 0.25,
                      weight: 2,
                      dashArray: '5, 5',
                    }}
                  >
                    <Tooltip permanent={false} direction="top" offset={[0, -10]}>
                      <div className="p-2 space-y-1">
                        <div className="font-semibold text-xs">Energy Component</div>
                        <div className="text-xs text-muted-foreground">
                          Load: {point.energyLoad} kWh
          </div>
        </div>
                    </Tooltip>
                  </Circle>
                )}
                
                {/* Hover tooltip circle for main site */}
                <Circle
                  center={[point.lat, point.lng]}
                  radius={intensity * 50000}
                  pathOptions={{
                    color: 'transparent',
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    weight: 0,
                  }}
                >
                  <Tooltip permanent={false} direction="top" offset={[0, -10]} className="industrial-tooltip">
                    <div className="p-2 space-y-1">
                      <div className="font-semibold text-sm">{point.name || point.label || `Mining Site ${index + 1}`}</div>
                      {point.energyLoad && (
            <div className="text-xs text-muted-foreground">
                          Energy: {point.energyLoad} kWh
            </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1 pt-1 border-t">
                        🇮🇳 India Mining Site
              </div>
              </div>
                  </Tooltip>
                </Circle>
                </React.Fragment>
                );
              }).filter(Boolean)
            ) : (
              <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground">No heatmap data points available</p>
              </div>
              </div>
            )}
          </MapContainer>
              </div>
      )}
    </div>
  );
};

const HeatmapChart: React.FC<HeatmapChartProps> = (props) => {
  const {
  heatmapData = [],
  title = 'Advanced Mining Site Heatmap',
  height = 700,
  className = '',
  selectedLayer = 'energy',
  } = props;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThermal, setShowThermal] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [heatIntensity] = useState([50]);
  const [thermalOpacity, setThermalOpacity] = useState([70]);
  const [selectedSite, setSelectedSite] = useState<HeatmapData | null>(null);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'hybrid' | 'terrain'>('hybrid');
  const [heatRadius, setHeatRadius] = useState([60]);
  const [heatBlur, setHeatBlur] = useState([35]);
  const [intensityMultiplier] = useState([1.0]);
  const [enablePulse, setEnablePulse] = useState(true);
  const [currentSelectedLayer] = useState<string>(selectedLayer);

  // Debug: Log when heatmapData changes
  useEffect(() => {
    console.log('🗺️ HeatmapChart - Data received:', {
      dataLength: heatmapData?.length || 0,
      selectedLayer: currentSelectedLayer,
      samplePoint: heatmapData?.[0]
    });
  }, [heatmapData, currentSelectedLayer]);

  // Simulated India Mining Sites Data (if no data provided)
  const getIndiaMiningSites = (): HeatmapData[] => {
    // Real India mining locations with coordinates
    return [
      // Odisha Mining Sites
      {
        lat: 22.0300, lng: 85.4300, weight: 0.85, intensity: 0.85,
        name: 'Joda Iron Ore Mine', label: 'Joda Iron Ore Mine',
        production: 1200, efficiency: 92, status: 'Excellent',
        energyLoad: 2850, equipmentEfficiency: 88, temperature: 32,
        commodity: 'Iron Ore', operator: 'Tata Steel', area: 1250,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 21.8500, lng: 85.2000, weight: 0.75, intensity: 0.75,
        name: 'Barbil Mining Complex', label: 'Barbil Mining Complex',
        production: 980, efficiency: 87, status: 'Optimal',
        energyLoad: 2450, equipmentEfficiency: 85, temperature: 31,
        commodity: 'Iron Ore', operator: 'SAIL', area: 980,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 22.1500, lng: 85.6000, weight: 0.70, intensity: 0.70,
        name: 'Noamundi Iron Mine', label: 'Noamundi Iron Mine',
        production: 850, efficiency: 84, status: 'Good',
        energyLoad: 2200, equipmentEfficiency: 82, temperature: 30,
        commodity: 'Iron Ore', operator: 'Tata Steel', area: 750,
        updatedAt: new Date().toISOString()
      },
      // Jharkhand Mining Sites
      {
        lat: 22.8000, lng: 86.2000, weight: 0.90, intensity: 0.90,
        name: 'Kiriburu Iron Ore Mine', label: 'Kiriburu Iron Ore Mine',
        production: 1350, efficiency: 94, status: 'Excellent',
        energyLoad: 3200, equipmentEfficiency: 90, temperature: 33,
        commodity: 'Iron Ore', operator: 'SAIL', area: 1500,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 22.6500, lng: 85.9000, weight: 0.80, intensity: 0.80,
        name: 'Meghahatuburu Mine', label: 'Meghahatuburu Mine',
        production: 1100, efficiency: 89, status: 'Optimal',
        energyLoad: 2700, equipmentEfficiency: 87, temperature: 32,
        commodity: 'Iron Ore', operator: 'SAIL', area: 1100,
        updatedAt: new Date().toISOString()
      },
      // Chhattisgarh Mining Sites
      {
        lat: 20.2000, lng: 81.1000, weight: 0.65, intensity: 0.65,
        name: 'Bailadila Iron Ore Mine', label: 'Bailadila Iron Ore Mine',
        production: 720, efficiency: 81, status: 'Good',
        energyLoad: 1950, equipmentEfficiency: 79, temperature: 29,
        commodity: 'Iron Ore', operator: 'NMDC', area: 650,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 20.5000, lng: 81.4000, weight: 0.60, intensity: 0.60,
        name: 'Dalli-Rajhara Mine', label: 'Dalli-Rajhara Mine',
        production: 680, efficiency: 78, status: 'Fair',
        energyLoad: 1800, equipmentEfficiency: 76, temperature: 28,
        commodity: 'Iron Ore', operator: 'Bhilai Steel', area: 580,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 18.7000, lng: 81.1000, weight: 0.72, intensity: 0.72,
        name: 'BIOM – Kirandul Complex', label: 'BIOM – Kirandul Complex',
        production: 800, efficiency: 83, status: 'Good',
        energyLoad: 2150, equipmentEfficiency: 81, temperature: 30,
        commodity: 'Iron Ore', operator: 'NMDC', area: 720,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 18.6000, lng: 81.0000, weight: 0.70, intensity: 0.70,
        name: 'BIOM – Bacheli Complex', label: 'BIOM – Bacheli Complex',
        production: 780, efficiency: 82, status: 'Good',
        energyLoad: 2050, equipmentEfficiency: 80, temperature: 29,
        commodity: 'Iron Ore', operator: 'NMDC', area: 700,
        updatedAt: new Date().toISOString()
      },
      // Karnataka Mining Sites
      {
        lat: 15.3000, lng: 76.5000, weight: 0.55, intensity: 0.55,
        name: 'Hospet Iron Ore Mine', label: 'Hospet Iron Ore Mine',
        production: 600, efficiency: 75, status: 'Fair',
        energyLoad: 1650, equipmentEfficiency: 73, temperature: 27,
        commodity: 'Iron Ore', operator: 'JSW Steel', area: 520,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 15.2000, lng: 76.5000, weight: 0.68, intensity: 0.68,
        name: 'Donimalai Iron Ore Mine', label: 'Donimalai Iron Ore Mine',
        production: 750, efficiency: 81, status: 'Good',
        energyLoad: 2100, equipmentEfficiency: 79, temperature: 29,
        commodity: 'Iron Ore', operator: 'NMDC', area: 680,
        updatedAt: new Date().toISOString()
      },
      {
        lat: 15.3000, lng: 76.6000, weight: 0.65, intensity: 0.65,
        name: 'Kumaraswamy Iron Ore Mine', label: 'Kumaraswamy Iron Ore Mine',
        production: 720, efficiency: 80, status: 'Good',
        energyLoad: 2000, equipmentEfficiency: 78, temperature: 28,
        commodity: 'Iron Ore', operator: 'NMDC', area: 650,
        updatedAt: new Date().toISOString()
      },
      // Goa Mining Sites
      {
        lat: 15.5000, lng: 73.8000, weight: 0.50, intensity: 0.50,
        name: 'Goa Iron Ore Mine', label: 'Goa Iron Ore Mine',
        production: 550, efficiency: 72, status: 'Fair',
        energyLoad: 1500, equipmentEfficiency: 70, temperature: 26,
        commodity: 'Iron Ore', operator: 'Vedanta', area: 480,
        updatedAt: new Date().toISOString()
      },
      // Additional Odisha Sites
      {
        lat: 21.9500, lng: 85.3500, weight: 0.68, intensity: 0.68,
        name: 'Gua Iron Ore Mine', label: 'Gua Iron Ore Mine',
        production: 750, efficiency: 82, status: 'Good',
        energyLoad: 2100, equipmentEfficiency: 80, temperature: 30,
        commodity: 'Iron Ore', operator: 'SAIL', area: 680,
        updatedAt: new Date().toISOString()
      },
    ];
  };

  // Get effective data (simulated India sites if needed)
  const effectiveHeatmapData = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) {
      console.log('🇮🇳 No data provided, using simulated India mining sites');
      return getIndiaMiningSites();
    }
    
    // Check if any points are in India
    const hasIndiaPoints = heatmapData.some(point => 
      point.lat >= 6.5 && point.lat <= 37.1 && 
      point.lng >= 68.1 && point.lng <= 97.4
    );
    
    if (!hasIndiaPoints) {
      console.log('🇮🇳 No India points in data, using simulated India mining sites');
      return getIndiaMiningSites();
    }
    
    // Filter to India-only points
    return heatmapData.filter(point => 
      point.lat >= 6.5 && point.lat <= 37.1 && 
      point.lng >= 68.1 && point.lng <= 97.4
    );
  }, [heatmapData]);

  // Transform data based on selected layer using useMemo for performance
  const transformedData = useMemo(() => {
    const layer = currentSelectedLayer;
    console.log('🔄 Transforming data for layer:', layer, 'with', effectiveHeatmapData.length, 'points');

    const result = effectiveHeatmapData.map(point => {
      let weight = point.weight;
      let debugInfo = '';

      if (layer === 'energy') {
        // Transform based on energy load (assuming energyLoad property exists)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const energyLoad = (point as any).energyLoad as number | undefined;
        weight = energyLoad ? energyLoad / 3000 : point.weight;
        debugInfo = `Energy: ${energyLoad || 'N/A'} -> ${weight.toFixed(2)}`;
      } else if (layer === 'status') {
        // Transform based on machine status
        const statusMap: Record<string, number> = {
          'Excellent': 1.0,
          'Optimal': 0.9,
          'Good': 0.7,
          'Fair': 0.5,
          'Maintenance': 0.3,
          'excellent': 1.0,
          'good': 0.8,
          'fair': 0.6,
          'poor': 0.4,
          'critical': 0.2,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statusKey = ((point as any).machineStatus || point.status || '') as string;
        weight = statusMap[statusKey] || 0.5;
        debugInfo = `Status: ${statusKey} -> ${weight.toFixed(2)}`;
      } else if (layer === 'efficiency') {
        // Transform based on equipment efficiency
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const efficiency = ((point as any).equipmentEfficiency || point.efficiency || 75) as number;
        weight = efficiency / 100;
        debugInfo = `Efficiency: ${efficiency}% -> ${weight.toFixed(2)}`;
      } else if (layer === 'production') {
        // Transform based on production
        const production = point.production || 0;
        weight = production / 1300; // Normalize production
        debugInfo = `Production: ${production}tph -> ${weight.toFixed(2)}`;
      }

      const finalWeight = Math.max(0.1, Math.min(1.0, weight));
      console.log(`📍 ${point.name}: ${debugInfo} (final: ${finalWeight.toFixed(2)})`);

      return {
        ...point,
        weight: finalWeight,
      };
    });

    console.log('✅ Data transformation complete for layer:', layer);
    return result;
  }, [effectiveHeatmapData, currentSelectedLayer]);

  if (!heatmapData || heatmapData.length === 0) {
    return (
      <Card className={`p-6 glass rounded-modern-xl shadow-depth-xl ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              No heatmap data available
            </p>
          </div>
        </div>
        <div
          style={{ height, width: '100%' }}
          className="rounded-lg border bg-gradient-to-br from-[hsl(215,28%,17%)] to-[hsl(220,25%,20%)] flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-muted-foreground">No Data Available</p>
          </div>
        </div>
      </Card>
    );
  }

  // Get layer-specific title
  const getLayerTitle = () => {
    const layerTitles: Record<string, string> = {
      energy: 'Energy Load Heatmap',
      status: 'Machine Status Heatmap',
      efficiency: 'Equipment Efficiency Heatmap',
      production: 'Production Heatmap',
    };
    return layerTitles[currentSelectedLayer] || title;
  };

  return (
    <Card className={`p-6 glass rounded-modern-xl shadow-depth-xl hover:shadow-glow-success transition-all duration-500 animate-float relative ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            {getLayerTitle()}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Combined 3D, Map, and Thermal visualization for mining operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="gap-2"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                Fullscreen
              </>
            )}
          </Button>
        </div>
      </div>

      <div
        className={`rounded-lg border-2 border-primary/20 overflow-hidden bg-gradient-to-br from-slate-900/50 to-slate-800/50 relative ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}
        style={{ height: isFullscreen ? 'calc(100vh - 2rem)' : height }}
      >
        {/* Subtle dark overlay to improve heatmap contrast */}
        <div className="heatmap-dark-overlay absolute inset-0 pointer-events-none z-10" />
        
        <CombinedHeatmap
          key={`heatmap-${currentSelectedLayer}-${mapStyle}`}
          heatmapData={transformedData}
          height={isFullscreen ? window.innerHeight - 64 : height}
          selectedLayer={currentSelectedLayer}
          onSiteSelect={props.onSiteSelect}
          onSiteClick={setSelectedSite}
          showThermal={showThermal}
          showMap={showMap}
          heatIntensity={heatIntensity}
          thermalOpacity={thermalOpacity}
          mapStyle={mapStyle}
          heatRadius={heatRadius}
          heatBlur={heatBlur}
          intensityMultiplier={intensityMultiplier}
          enablePulse={enablePulse}
        />
      </div>

      {/* Comprehensive Interactive Controls Panel - Outside the Map */}
      <div className="mt-4 space-y-4">
        {/* Row 1: Map Style & View Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Map Style Selector */}
          <Card className="p-4 glass rounded-modern-xl shadow-depth-xl">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Map Style
            </h4>
            <div className="space-y-2">
              <Button
                variant={mapStyle === 'satellite' ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setMapStyle('satellite')}
              >
                Satellite
              </Button>
              <Button
                variant={mapStyle === 'hybrid' ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setMapStyle('hybrid')}
              >
                Hybrid
              </Button>
              <Button
                variant={mapStyle === 'terrain' ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setMapStyle('terrain')}
              >
                Terrain
              </Button>
            </div>
          </Card>

          {/* View Toggles */}
          <Card className="p-4 glass rounded-modern-xl shadow-depth-xl">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              View Controls
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  Map View
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-12 p-0"
                  onClick={() => setShowMap(!showMap)}
                >
                  {showMap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground flex items-center gap-2">
                  <Camera className="w-3 h-3" />
                  Thermal Layer
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-12 p-0"
                  onClick={() => setShowThermal(!showThermal)}
                >
                  {showThermal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <label className="text-xs text-muted-foreground flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  Pulse Animation
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-12 p-0"
                  onClick={() => setEnablePulse(!enablePulse)}
                >
                  {enablePulse ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>

          {/* Heatmap Settings */}
          {showMap && (
            <Card className="p-4 glass rounded-modern-xl shadow-depth-xl">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                Heatmap Settings
              </h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Radius: {heatRadius[0]}</label>
                  <Slider
                    value={heatRadius}
                    onValueChange={setHeatRadius}
                    min={20}
                    max={120}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Blur: {heatBlur[0]}</label>
                  <Slider
                    value={heatBlur}
                    onValueChange={setHeatBlur}
                    min={10}
                    max={60}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Thermal Opacity */}
          {showThermal && (
            <Card className="p-4 glass rounded-modern-xl shadow-depth-xl">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Thermal Opacity Controls
              </h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Thermal Opacity: {thermalOpacity[0]}%</label>
                  <Slider
                    value={thermalOpacity}
                    onValueChange={setThermalOpacity}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Selected Site Info */}
        {selectedSite && (
          <Card className="p-4 glass rounded-modern-xl shadow-depth-xl lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Selected Site: {selectedSite.name}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setSelectedSite(null)}
              >
                ×
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="text-xs">
                  {selectedSite.status || 'Unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Production:</span>
                <span className="font-semibold">{selectedSite.production || 'N/A'} tph</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Efficiency:</span>
                <span className="font-semibold">{selectedSite.efficiency || 'N/A'}%</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
};

export default HeatmapChart;
