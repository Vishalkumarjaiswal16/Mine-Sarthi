import React, { useRef, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Eye, EyeOff, Maximize2, Minimize2, Info, AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import * as THREE from 'three';

// Equipment component - Conveyor Belt
const ConveyorBelt: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; speed?: number }> = ({ 
  position, 
  rotation = [0, 0, 0],
  speed = 0.5 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    // Animation can be added here if needed
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Conveyor base */}
      <mesh ref={meshRef} position={[0, 0.1, 0]}>
        <boxGeometry args={[4, 0.2, 0.5]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      {/* Conveyor belt */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[4, 0.1, 0.5]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      {/* Rollers */}
      {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.5, 16]} />
          <meshStandardMaterial color="#718096" />
        </mesh>
      ))}
    </group>
  );
};

// Equipment component - Crusher
const Crusher: React.FC<{ position: [number, number, number]; onClick?: () => void }> = ({ 
  position, 
  onClick 
}) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <group 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Main body */}
      <mesh>
        <boxGeometry args={[1.5, 2, 1.5]} />
        <meshStandardMaterial 
          color={hovered ? "#3b82f6" : "#1e40af"} 
          emissive={hovered ? "#3b82f6" : "#000000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      {/* Crushing mechanism */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.5, 16]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      {/* Input chute */}
      <mesh position={[0, 1.5, 0.75]}>
        <boxGeometry args={[0.8, 0.3, 0.3]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {/* Output */}
      <mesh position={[0, -1, 0]}>
        <boxGeometry args={[0.6, 0.3, 0.6]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </group>
  );
};

// Equipment component - Mill
const Mill: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; onClick?: () => void }> = ({ 
  position, 
  rotation = [0, 0, 0],
  onClick 
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group 
      ref={meshRef}
      position={position}
      rotation={rotation}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Mill body */}
      <mesh>
        <cylinderGeometry args={[1, 1, 2, 32]} />
        <meshStandardMaterial 
          color={hovered ? "#10b981" : "#059669"} 
          emissive={hovered ? "#10b981" : "#000000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      {/* Mill ends */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[1, 1, 0.2, 32]} />
        <meshStandardMaterial color="#047857" />
      </mesh>
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[1, 1, 0.2, 32]} />
        <meshStandardMaterial color="#047857" />
      </mesh>
    </group>
  );
};

// Individual ore particle
const OreParticle: React.FC<{ index: number; total: number }> = ({ index, total }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const progress = (time * 0.5 + index * 0.2) % 1;
      meshRef.current.position.x = -2 + progress * 4;
      meshRef.current.position.y = 0.2;
      meshRef.current.position.z = 0;
    }
  });

  return (
    <mesh ref={meshRef} position={[-2 + (index * 0.5), 0.2, 0]}>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshStandardMaterial color="#f59e0b" />
    </mesh>
  );
};

// Ore particles flowing through the system
const OreParticles: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <OreParticle key={i} index={i} total={count} />
      ))}
    </>
  );
};

// Ground plane
const Ground: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#1f2937" />
    </mesh>
  );
};

// Main 3D Scene
const Scene: React.FC<{ 
  onEquipmentClick?: (equipment: string) => void;
  showHeatmap?: boolean;
}> = ({ onEquipmentClick, showHeatmap = false }) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
      
      <Ground />
      
      {/* Mining Equipment Layout */}
      <Crusher 
        position={[-3, 0, 0]} 
        onClick={() => onEquipmentClick?.('crusher')}
      />
      <ConveyorBelt position={[-1, 0, 0]} speed={0.5} />
      <Mill 
        position={[1, 0, 0]} 
        onClick={() => onEquipmentClick?.('mill')}
      />
      <ConveyorBelt position={[3, 0, 0]} speed={0.3} />
      
      {/* Ore particles */}
      <OreParticles count={8} />
      
      {/* Energy heatmap overlay */}
      {showHeatmap && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <planeGeometry args={[8, 2]} />
          <meshStandardMaterial 
            color="#ef4444" 
            transparent 
            opacity={0.3}
            emissive="#ef4444"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </>
  );
};

// Equipment Detail Panel
interface EquipmentDetails {
  name: string;
  power: number;
  temperature: number;
  vibration: number;
  status: string;
}

const EquipmentDetailPanel: React.FC<{ 
  equipment: EquipmentDetails | null;
  onClose: () => void;
}> = ({ equipment, onClose }) => {
  if (!equipment) return null;

  return (
    <Card className="absolute top-4 right-4 w-80 z-10 glass rounded-modern-xl shadow-depth-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{equipment.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Power</div>
            <div className="text-lg font-bold">{equipment.power} kW</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Temperature</div>
            <div className="text-lg font-bold">{equipment.temperature}°C</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Vibration</div>
            <div className="text-lg font-bold">{equipment.vibration} mm/s</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <Badge variant={equipment.status === 'Normal' ? 'default' : 'destructive'}>
              {equipment.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Component
interface DigitalTwin3DProps {
  className?: string;
}

export const DigitalTwin3D: React.FC<DigitalTwin3DProps> = ({ className }) => {
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentDetails | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWebGLSupported, setIsWebGLSupported] = useState<boolean | null>(null);
  const [canRender, setCanRender] = useState(false);

  // Check WebGL support and initialize React Three Fiber
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const supported = !!gl;
      setIsWebGLSupported(supported);
      
      if (supported) {
        // Delay rendering to ensure React Three Fiber is fully loaded
        const timer = setTimeout(() => {
          setCanRender(true);
        }, 100);
        return () => clearTimeout(timer);
      } else {
        setError('WebGL is not supported in this browser');
      }
    } catch (e) {
      setIsWebGLSupported(false);
      setError('WebGL initialization failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  }, []);

  const equipmentData: Record<string, EquipmentDetails> = {
    crusher: {
      name: 'Primary Crusher',
      power: 847,
      temperature: 68,
      vibration: 1.8,
      status: 'Normal',
    },
    mill: {
      name: 'SAG Mill',
      power: 1200,
      temperature: 72,
      vibration: 2.1,
      status: 'Normal',
    },
  };

  const handleEquipmentClick = (equipment: string) => {
    setSelectedEquipment(equipmentData[equipment] || null);
  };

  // Check WebGL support
  if (isWebGLSupported === false || error) {
    return (
      <Card className={`p-6 glass rounded-modern-xl shadow-depth-xl ${className}`}>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">3D View Unavailable</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error || 'WebGL is not supported in this browser. Please use a modern browser with WebGL support.'}
            </p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading while checking WebGL or waiting to render
  if (isWebGLSupported === null || !canRender) {
    return (
      <Card className={`p-6 glass rounded-modern-xl shadow-depth-xl ${className}`}>
        <CardContent>
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Initializing 3D Scene...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`p-6 glass rounded-modern-xl shadow-depth-xl ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            3D Digital Twin
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHeatmap(!showHeatmap)}
            >
              {showHeatmap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showHeatmap ? 'Hide' : 'Show'} Heatmap
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`relative bg-muted/20 rounded-lg overflow-hidden ${isFullscreen ? 'h-[600px]' : 'h-[500px]'}`}>
          <ErrorBoundary
            fallback={
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                  <h3 className="text-lg font-semibold mb-2">3D View Unavailable</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    3D visualization is not available. Please check your browser compatibility.
                  </p>
                  <Button onClick={() => window.location.reload()}>Reload Page</Button>
                </div>
              </div>
            }
          >
            <Suspense fallback={
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading 3D Scene...</p>
                </div>
              </div>
            }>
              <Canvas 
                shadows 
                camera={{ position: [5, 5, 5], fov: 50 }} 
                gl={{ antialias: true, alpha: true }}
              >
                <PerspectiveCamera makeDefault position={[5, 5, 5]} />
                <OrbitControls 
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  minDistance={3}
                  maxDistance={15}
                />
                <Scene 
                  onEquipmentClick={handleEquipmentClick}
                  showHeatmap={showHeatmap}
                />
              </Canvas>
            </Suspense>
          </ErrorBoundary>
          
          <EquipmentDetailPanel
            equipment={selectedEquipment}
            onClose={() => setSelectedEquipment(null)}
          />
          
          {!selectedEquipment && (
            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="w-4 h-4" />
                <span>Click on equipment to view details</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

