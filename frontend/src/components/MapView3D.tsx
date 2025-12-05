import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera, Text, Line, Sphere, Box } from '@react-three/drei';
import { motion } from 'motion/react';
import { View3DControls } from './View3DControls';
import { Scene3DStats, StatsTracker } from './Scene3DStats';
import { Scene3DLoader } from './Scene3DLoader';
import { CameraPresets } from './CameraPresets';
import { DebugOverlay } from './DebugOverlay';
import * as THREE from 'three';

export interface Location {
  id: string;
  lat: number;
  lng: number;
  demand?: number;
}

export interface Route {
  vehicle: string;
  customers: string[];
  totalDistance: number;
  load: number;
}

export interface MapView3DProps {
  depot: Location;
  customers: Location[];
  routes?: Route[];
  animatingRouteIndex?: number;
  animationProgress?: number;
  className?: string;
}

// Route colors matching the 2D map
const ROUTE_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

// Convert lat/lng to 3D coordinates
const latLngTo3D = (lat: number, lng: number, heightScale: number = 0) => {
  const x = ((lng + 180) / 360) * 100 - 50;
  const z = ((90 - lat) / 180) * 100 - 50;
  const y = heightScale;
  return [x, y, z] as [number, number, number];
};

// Animated vehicle component
interface AnimatedVehicleProps {
  path: [number, number, number][];
  progress: number;
  color: string;
}

const AnimatedVehicle: React.FC<AnimatedVehicleProps> = ({ path, progress, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (!meshRef.current || path.length < 2) return;
    
    const index = Math.min(Math.floor(progress * (path.length - 1)), path.length - 2);
    const t = (progress * (path.length - 1)) - index;
    
    const start = path[index];
    const end = path[index + 1];
    
    meshRef.current.position.x = start[0] + (end[0] - start[0]) * t;
    meshRef.current.position.y = start[1] + (end[1] - start[1]) * t + 2;
    meshRef.current.position.z = start[2] + (end[2] - start[2]) * t;
    
    // Rotate to face direction
    const direction = new THREE.Vector3(end[0] - start[0], 0, end[2] - start[2]);
    if (direction.length() > 0) {
      direction.normalize();
      const angle = Math.atan2(direction.x, direction.z);
      meshRef.current.rotation.y = angle;
    }
  });
  
  return (
    <group ref={meshRef}>
      <Box args={[1.5, 1, 2]} castShadow>
        <meshStandardMaterial color={color} />
      </Box>
      {/* Cabin */}
      <Box args={[1.2, 0.8, 0.8]} position={[0, 0.6, -0.3]} castShadow>
        <meshStandardMaterial color={color} />
      </Box>
    </group>
  );
};

// Customer marker component
interface CustomerMarkerProps {
  position: [number, number, number];
  demand: number;
  id: string;
  color?: string;
}

const CustomerMarker: React.FC<CustomerMarkerProps> = ({ position, demand, id, color = '#3b82f6' }) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <group position={position}>
      {/* Pin base */}
      <Sphere
        args={[0.8, 16, 16]}
        position={[0, 1, 0]}
        castShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={hovered ? '#60a5fa' : color}
          emissive={hovered ? '#3b82f6' : '#000000'}
          emissiveIntensity={hovered ? 0.5 : 0}
        />
      </Sphere>
      {/* Pin stick */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 1, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Label */}
      {hovered && (
        <Text
          position={[0, 3, 0]}
          fontSize={0.8}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#000000"
        >
          {`#${id}\nDemand: ${demand}`}
        </Text>
      )}
    </group>
  );
};

// Depot marker component
const DepotMarker: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current && hovered) {
      meshRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 2) * 0.2 + 2;
    }
  });
  
  return (
    <group position={position}>
      {/* Building base */}
      <Box
        args={[3, 4, 3]}
        position={[0, 2, 0]}
        castShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color="#ef4444"
          emissive="#dc2626"
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </Box>
      {/* Roof */}
      <mesh position={[0, 4.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.5, 1.5, 4]} />
        <meshStandardMaterial color="#b91c1c" />
      </mesh>
      {/* Label */}
      <Text
        position={[0, 6, 0]}
        fontSize={1}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.15}
        outlineColor="#000000"
      >
        DEPOT
      </Text>
    </group>
  );
};

// 3D Route path component
interface Route3DProps {
  points: [number, number, number][];
  color: string;
  isAnimating?: boolean;
  animationProgress?: number;
}

const Route3D: React.FC<Route3DProps> = ({ points, color, isAnimating, animationProgress = 0 }) => {
  const lineRef = useRef<THREE.Line>(null);
  
  // Create smooth curve through points
  const curve = useMemo(() => {
    if (points.length < 2) return null;
    return new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(p[0], p[1] + 0.5, p[2]))
    );
  }, [points]);
  
  const tubePoints = useMemo(() => {
    if (!curve) return [];
    return curve.getPoints(50);
  }, [curve]);
  
  // Animate the route drawing
  const visiblePoints = useMemo(() => {
    if (!isAnimating || animationProgress >= 1) return tubePoints;
    const count = Math.floor(tubePoints.length * animationProgress);
    return tubePoints.slice(0, Math.max(2, count));
  }, [tubePoints, isAnimating, animationProgress]);
  
  if (!curve || visiblePoints.length < 2) return null;
  
  return (
    <>
      {/* Main route line */}
      <Line
        ref={lineRef}
        points={visiblePoints}
        color={color}
        lineWidth={3}
        transparent
        opacity={0.8}
      />
      {/* Glowing effect */}
      <Line
        points={visiblePoints}
        color={color}
        lineWidth={5}
        transparent
        opacity={0.3}
      />
    </>
  );
};

// Grid floor component
const GridFloor: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial
          color="#1e293b"
          opacity={0.5}
          transparent
        />
      </mesh>
      <gridHelper args={[120, 24, '#475569', '#334155']} position={[0, 0, 0]} />
    </group>
  );
};

// Camera controller component for smooth transitions
interface CameraControllerProps {
  targetPosition: [number, number, number];
  cameraMode: 'perspective' | 'orthographic';
}

const CameraController: React.FC<CameraControllerProps> = ({ targetPosition, cameraMode }) => {
  const { camera } = useThree();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const startPosition = useRef(new THREE.Vector3());
  const progress = useRef(0);
  
  useEffect(() => {
    startPosition.current.copy(camera.position);
    progress.current = 0;
    setIsTransitioning(true);
  }, [targetPosition]);
  
  useFrame(() => {
    if (isTransitioning && progress.current < 1) {
      progress.current += 0.05;
      
      camera.position.lerpVectors(
        startPosition.current,
        new THREE.Vector3(...targetPosition),
        THREE.MathUtils.smoothstep(progress.current, 0, 1)
      );
      
      camera.lookAt(0, 0, 0);
      
      if (progress.current >= 1) {
        setIsTransitioning(false);
      }
    }
  });
  
  return null;
};

// Main 3D Scene component
interface Scene3DProps {
  depot: Location;
  customers: Location[];
  routes: Route[];
  animatingRouteIndex?: number;
  animationProgress?: number;
  showGrid: boolean;
  showLabels: boolean;
  showShadows: boolean;
  cameraMode: 'perspective' | 'orthographic';
  cameraPosition: [number, number, number];
  onStatsUpdate: (fps: number, pixelRatio: number) => void;
}

const Scene3D: React.FC<Scene3DProps> = ({
  depot,
  customers,
  routes,
  animatingRouteIndex,
  animationProgress = 0,
  showGrid,
  showLabels,
  showShadows,
  cameraMode,
  cameraPosition,
  onStatsUpdate,
}) => {
  const depotPos = latLngTo3D(depot.lat, depot.lng, 0);
  
  // Build route paths
  const routePaths = useMemo(() => {
    return routes.map(route => {
      const points: [number, number, number][] = [depotPos];
      
      route.customers.forEach(customerId => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
          // Add some height variation based on distance
          const distance = Math.sqrt(
            Math.pow(customer.lat - depot.lat, 2) + 
            Math.pow(customer.lng - depot.lng, 2)
          );
          const height = distance * 2; // Height represents distance/complexity
          points.push(latLngTo3D(customer.lat, customer.lng, height));
        }
      });
      
      points.push(depotPos); // Return to depot
      return points;
    });
  }, [routes, customers, depot, depotPos]);
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 50, 25]}
        intensity={0.8}
        castShadow={showShadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <pointLight position={[-50, 20, -50]} intensity={0.5} color="#3b82f6" />
      <pointLight position={[50, 20, 50]} intensity={0.5} color="#ef4444" />
      
      {/* Grid floor */}
      <GridFloor visible={showGrid} />
      
      {/* Depot */}
      <DepotMarker position={depotPos} />
      
      {/* Customers */}
      {customers.map((customer, idx) => {
        const pos = latLngTo3D(customer.lat, customer.lng, 0);
        return (
          <CustomerMarker
            key={customer.id}
            position={pos}
            demand={customer.demand || 0}
            id={customer.id}
          />
        );
      })}
      
      {/* Routes */}
      {routePaths.map((path, idx) => (
        <Route3D
          key={idx}
          points={path}
          color={ROUTE_COLORS[idx % ROUTE_COLORS.length]}
          isAnimating={animatingRouteIndex === idx}
          animationProgress={animationProgress}
        />
      ))}
      
      {/* Animated vehicles */}
      {animatingRouteIndex !== undefined && animatingRouteIndex >= 0 && (
        <AnimatedVehicle
          path={routePaths[animatingRouteIndex]}
          progress={animationProgress}
          color={ROUTE_COLORS[animatingRouteIndex % ROUTE_COLORS.length]}
        />
      )}
      
      {/* Camera */}
      {cameraMode === 'perspective' ? (
        <PerspectiveCamera makeDefault position={cameraPosition} fov={50} />
      ) : (
        <OrthographicCamera makeDefault position={cameraPosition} zoom={2} />
      )}
      <CameraController targetPosition={cameraPosition} cameraMode={cameraMode} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={150}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
      
      {/* Stats tracker */}
      <StatsTracker onUpdate={onStatsUpdate} />
    </>
  );
};

// Main component export
export const MapView3D: React.FC<MapView3DProps> = ({
  depot,
  customers,
  routes = [],
  animatingRouteIndex,
  animationProgress = 0,
  className = '',
}) => {
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showShadows, setShowShadows] = useState(true);
  const [cameraMode, setCameraMode] = useState<'perspective' | 'orthographic'>('perspective');
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([60, 40, 60]);
  const [fps, setFps] = useState(60);
  const [pixelRatio, setPixelRatio] = useState(1);
  
  const handleStatsUpdate = (newFps: number, newPixelRatio: number) => {
    setFps(newFps);
    setPixelRatio(newPixelRatio);
  };
  
  return (
    <div className={`w-full h-full relative ${className}`}>
      <DebugOverlay depot={depot} customers={customers} routes={routes} />
      
      <View3DControls
        showGrid={showGrid}
        showLabels={showLabels}
        showShadows={showShadows}
        viewMode={cameraMode}
        onToggleGrid={setShowGrid}
        onToggleLabels={setShowLabels}
        onToggleShadows={setShowShadows}
        onChangeViewMode={setCameraMode}
      />
      
      <CameraPresets onSelectPreset={setCameraPosition} />
      
      <Canvas
        shadows={showShadows}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        style={{ background: '#0f172a' }}
      >
        <Suspense fallback={<Scene3DLoader />}>
          <Scene3D
            depot={depot}
            customers={customers}
            routes={routes}
            animatingRouteIndex={animatingRouteIndex}
            animationProgress={animationProgress}
            showGrid={showGrid}
            showLabels={showLabels}
            showShadows={showShadows}
            cameraMode={cameraMode}
            cameraPosition={cameraPosition}
            onStatsUpdate={handleStatsUpdate}
          />
        </Suspense>
      </Canvas>
      
      <Scene3DStats fps={fps} pixelRatio={pixelRatio} />
    </div>
  );
};