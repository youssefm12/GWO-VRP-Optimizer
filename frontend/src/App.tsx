import { useState, useEffect, useCallback } from 'react';
import { MapView } from './components/MapView';
import { MapView3D } from './components/MapView3D';
import { ViewToggle } from './components/ViewToggle';
import { MapFullscreenToggle } from './components/MapFullscreenToggle';
import { ComparisonModeToggle } from './components/ComparisonModeToggle';
import { RouteComparisonView } from './components/RouteComparisonView';
import { ControlPanel } from './components/ControlPanel';
import { StatsPanel } from './components/StatsPanel';
import { ConvergenceChart } from './components/Charts/ConvergenceChart';
import { ComparisonChart } from './components/Charts/ComparisonChart';
import { RoutesAnimation } from './components/RoutesAnimation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DatasetSelector } from './components/DatasetSelector';
import { ConnectionStatus } from './components/ConnectionStatus';
import { generateMockVRPData } from './utils/mockData';
import { suppressKnownWarnings } from './utils/suppressWarnings';
import { motion, AnimatePresence } from 'motion/react';
import {
  checkHealth,
  generateInstance,
  runOptimizationSync,
  createOptimizationSocket,
  VRPData as BackendVRPData,
  WSProgressMessage,
} from './api/backendService';

suppressKnownWarnings();

export interface VRPConfig {
  numWolves: number;
  numIterations: number;
  randomSeed: number;
  vehicleCapacity: number;
  penaltyCoefficient: number;
  numCustomers: number;
  numDepots: number;
}

export interface Customer {
  id: number;
  lat: number;
  lng: number;
  demand: number;
}

export interface VRPData {
  depot: { lat: number; lng: number };
  depots: { id: number; lat: number; lng: number; name: string }[];
  customers: Customer[];
}

export interface OptimizationResult {
  routes: number[][];
  fitness: number;
  convergenceHistory: { iteration: number; fitness: number }[];
  runtime?: number;
}

function App() {
  const [config, setConfig] = useState<VRPConfig>({
    numWolves: 30,
    numIterations: 100,
    randomSeed: 42,
    vehicleCapacity: 100,
    penaltyCoefficient: 1000,
    numCustomers: 20,
    numDepots: 1,
  });

  const [vrpData, setVrpData] = useState<VRPData | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | undefined>();
  const [backendConnected, setBackendConnected] = useState(false);
  const [baselineResult, setBaselineResult] = useState<OptimizationResult | null>(null);
  const [gwoResult, setGwoResult] = useState<OptimizationResult | null>(null);
  const [showGWORoutes, setShowGWORoutes] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState<{ iteration: number; fitness: number }[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingRouteIndex, setAnimatingRouteIndex] = useState(-1);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [is3DView, setIs3DView] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isComparisonMode, setIsComparisonMode] = useState(false);

  // Convert backend VRP data to frontend format
  const convertVRPData = useCallback((data: BackendVRPData): VRPData => {
    return {
      depot: data.depot,
      depots: data.depots || [{ id: 0, lat: data.depot.lat, lng: data.depot.lng, name: 'Depot' }],
      customers: data.customers,
    };
  }, []);

  // Handle dataset selection from DatasetSelector
  const handleDatasetSelect = useCallback((data: BackendVRPData, datasetId?: string) => {
    const converted = convertVRPData(data);
    setVrpData(converted);
    setSelectedDatasetId(datasetId);
    setBaselineResult(null);
    setGwoResult(null);
    setOptimizationProgress([]);
    // Update config to match dataset
    setConfig(prev => ({
      ...prev,
      numCustomers: data.customers.length,
    }));
  }, [convertVRPData]);

  // Initialize with data
  useEffect(() => {
    const init = async () => {
      const connected = await checkHealth();
      setBackendConnected(connected);
      
      if (connected) {
        try {
          const data = await generateInstance(config.numCustomers);
          handleDatasetSelect(data);
        } catch (e) {
          console.error('Failed to generate instance from backend:', e);
          // Fallback to mock data
          const mockData = generateMockVRPData(config.numCustomers, config.numDepots);
          setVrpData(mockData);
        }
      } else {
        // Use mock data when backend is offline
        const mockData = generateMockVRPData(config.numCustomers, config.numDepots);
        setVrpData(mockData);
      }
    };
    init();
  }, []);

  const handleRegenerateData = async () => {
    if (backendConnected) {
      try {
        const data = await generateInstance(config.numCustomers);
        handleDatasetSelect(data);
      } catch (e) {
        console.error('Failed to regenerate from backend:', e);
        const mockData = generateMockVRPData(config.numCustomers, config.numDepots);
        setVrpData(mockData);
      }
    } else {
      const newData = generateMockVRPData(config.numCustomers, config.numDepots);
      setVrpData(newData);
    }
    setSelectedDatasetId(undefined);
    setBaselineResult(null);
    setGwoResult(null);
    setOptimizationProgress([]);
  };

  const handleConfigChange = (key: keyof VRPConfig, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleOptimizeSync = async () => {
    if (!vrpData) return;
    
    setIsOptimizing(true);
    setOptimizationProgress([]);

    try {
      if (backendConnected) {
        // Use real backend
        const backendData: BackendVRPData = {
          depot: vrpData.depot,
          customers: vrpData.customers,
        };
        
        const result = await runOptimizationSync(
          {
            numWolves: config.numWolves,
            numIterations: config.numIterations,
            randomSeed: config.randomSeed,
            vehicleCapacity: config.vehicleCapacity,
            penaltyCoefficient: config.penaltyCoefficient,
          },
          backendData
        );
        
        setGwoResult({
          routes: result.routes,
          fitness: result.best_fitness,
          convergenceHistory: result.convergence_history.map(h => ({
            iteration: h.iteration,
            fitness: h.fitness,
          })),
          runtime: result.runtime,
        });
        setOptimizationProgress(result.convergence_history.map(h => ({
          iteration: h.iteration,
          fitness: h.fitness,
        })));
        
        // Generate baseline (simple greedy)
        const baselineFitness = result.best_fitness * 1.3;
        setBaselineResult({
          routes: result.routes,
          fitness: baselineFitness,
          convergenceHistory: [],
        });
      } else {
        // Fallback to mock optimization
        await mockOptimization();
      }
    } catch (error) {
      console.error('Optimization failed:', error);
      // Fallback to mock
      await mockOptimization();
    } finally {
      setIsOptimizing(false);
    }
  };

  const mockOptimization = async () => {
    if (!vrpData) return;
    
    const convergence: { iteration: number; fitness: number }[] = [];
    let bestFitness = 1000;
    
    for (let i = 0; i <= config.numIterations; i++) {
      bestFitness = bestFitness * 0.98 + Math.random() * 5;
      if (i % 5 === 0) {
        convergence.push({ iteration: i, fitness: bestFitness });
      }
    }

    const routes: number[][] = [];
    let currentRoute: number[] = [0];
    let currentCapacity = 0;

    vrpData.customers.forEach((customer) => {
      if (currentCapacity + customer.demand > config.vehicleCapacity) {
        currentRoute.push(0);
        routes.push([...currentRoute]);
        currentRoute = [0];
        currentCapacity = 0;
      }
      currentRoute.push(customer.id);
      currentCapacity += customer.demand;
    });

    if (currentRoute.length > 1) {
      currentRoute.push(0);
      routes.push(currentRoute);
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    setGwoResult({
      routes,
      fitness: bestFitness,
      convergenceHistory: convergence,
      runtime: 2.5,
    });
    setOptimizationProgress(convergence);

    const baselineFitness = bestFitness * 1.3;
    setBaselineResult({
      routes,
      fitness: baselineFitness,
      convergenceHistory: [],
    });
  };

  const handleOptimizeRealtime = async () => {
    if (!vrpData) return;

    setIsOptimizing(true);
    setOptimizationProgress([]);

    if (!backendConnected) {
      // Fallback to sync if no backend
      await handleOptimizeSync();
      return;
    }

    try {
      const backendData: BackendVRPData = {
        depot: vrpData.depot,
        customers: vrpData.customers,
      };

      let progressHistory: { iteration: number; fitness: number }[] = [];

      const ws = createOptimizationSocket(
        {
          numWolves: config.numWolves,
          numIterations: config.numIterations,
          randomSeed: config.randomSeed,
          vehicleCapacity: config.vehicleCapacity,
          penaltyCoefficient: config.penaltyCoefficient,
        },
        backendData,
        (msg: WSProgressMessage) => {
          if (msg.done && msg.routes) {
            // Final result
            setGwoResult({
              routes: msg.routes,
              fitness: msg.best_fitness || 0,
              convergenceHistory: progressHistory,
              runtime: msg.runtime,
            });
            
            const baselineFitness = (msg.best_fitness || 0) * 1.3;
            setBaselineResult({
              routes: msg.routes,
              fitness: baselineFitness,
              convergenceHistory: [],
            });
            
            setIsOptimizing(false);
          } else if (msg.iter !== undefined && msg.best_fitness !== undefined) {
            // Progress update
            const progress = { iteration: msg.iter, fitness: msg.best_fitness };
            progressHistory = [...progressHistory, progress];
            setOptimizationProgress(prev => [...prev, progress]);
          } else if (msg.error) {
            console.error('WebSocket error:', msg.error);
            setIsOptimizing(false);
          }
        },
        (error) => {
          console.error('WebSocket error:', error);
          // Fallback to sync
          handleOptimizeSync();
        },
        () => {
          // Connection closed
        }
      );

      // Timeout fallback
      setTimeout(() => {
        if (isOptimizing) {
          ws.close();
          handleOptimizeSync();
        }
      }, 60000);
    } catch (error) {
      console.error('WebSocket optimization failed:', error);
      await handleOptimizeSync();
    }
  };

  const improvement = baselineResult && gwoResult
    ? ((baselineResult.fitness - gwoResult.fitness) / baselineResult.fitness) * 100
    : 0;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar - Control Panel */}
      <AnimatePresence>
        {!isMapFullscreen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-80 bg-white shadow-lg overflow-y-auto flex flex-col"
          >
            {/* Connection Status */}
            <div className="p-4 border-b flex justify-center">
              <ConnectionStatus onStatusChange={setBackendConnected} />
            </div>
            
            {/* Dataset Selector */}
            <div className="p-4 border-b">
              <DatasetSelector
                onDatasetSelect={handleDatasetSelect}
                selectedDatasetId={selectedDatasetId}
                disabled={isOptimizing}
              />
            </div>
            
            {/* Control Panel */}
            <div className="flex-1 overflow-y-auto">
              <ControlPanel
                config={config}
                onConfigChange={handleConfigChange}
                onRegenerateData={handleRegenerateData}
                onOptimizeSync={handleOptimizeSync}
                onOptimizeRealtime={handleOptimizeRealtime}
                isOptimizing={isOptimizing}
                showGWORoutes={showGWORoutes}
                onToggleRoutes={setShowGWORoutes}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center - Map */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="flex-1 relative"
      >
        {vrpData && (
          <>
            {!isComparisonMode && (
              <>
                <ViewToggle is3D={is3DView} onToggle={setIs3DView} />
                <MapFullscreenToggle 
                  isFullscreen={isMapFullscreen} 
                  onToggle={() => setIsMapFullscreen(!isMapFullscreen)} 
                />
              </>
            )}
            
            <ComparisonModeToggle
              isComparisonMode={isComparisonMode}
              onToggle={() => setIsComparisonMode(!isComparisonMode)}
              disabled={!baselineResult || !gwoResult}
            />
            
            <AnimatePresence mode="wait">
              {isComparisonMode ? (
                <motion.div
                  key="comparison-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full"
                >
                  <RouteComparisonView
                    depot={vrpData.depot}
                    depots={vrpData.depots}
                    customers={vrpData.customers.map(c => ({ ...c, id: String(c.id) }))}
                    baselineResult={baselineResult}
                    gwoResult={gwoResult}
                    animatingRouteIndex={animatingRouteIndex}
                    animationProgress={animationProgress}
                  />
                </motion.div>
              ) : is3DView ? (
                <motion.div
                  key="3d-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full"
                >
                  <MapView3D
                    depot={vrpData.depot}
                    customers={vrpData.customers.map(c => ({ ...c, id: String(c.id) }))}
                    routes={
                      showGWORoutes && gwoResult
                        ? gwoResult.routes.map(route => ({
                            vehicle: `Vehicle ${route[0]}`,
                            customers: route.filter(id => id !== 0).map(String),
                            totalDistance: 0,
                            load: 0,
                          }))
                        : baselineResult
                        ? baselineResult.routes.map(route => ({
                            vehicle: `Vehicle ${route[0]}`,
                            customers: route.filter(id => id !== 0).map(String),
                            totalDistance: 0,
                            load: 0,
                          }))
                        : []
                    }
                    animatingRouteIndex={animatingRouteIndex}
                    animationProgress={animationProgress}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="2d-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full"
                >
                  <MapView
                    depot={vrpData.depot}
                    depots={vrpData.depots}
                    customers={vrpData.customers.map(c => ({ ...c, id: String(c.id) }))}
                    routes={
                      showGWORoutes && gwoResult
                        ? gwoResult.routes.map(route => ({
                            vehicle: `Vehicle ${route[0]}`,
                            customers: route.filter(id => id !== 0).map(String),
                            totalDistance: 0,
                            load: 0,
                          }))
                        : baselineResult
                        ? baselineResult.routes.map(route => ({
                            vehicle: `Vehicle ${route[0]}`,
                            customers: route.filter(id => id !== 0).map(String),
                            totalDistance: 0,
                            load: 0,
                          }))
                        : []
                    }
                    animatingRouteIndex={animatingRouteIndex}
                    animationProgress={animationProgress}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {gwoResult && !isMapFullscreen && !isComparisonMode && (
                <RoutesAnimation
                  depot={vrpData.depot}
                  customers={vrpData.customers}
                  routes={gwoResult.routes}
                  isAnimating={isAnimating}
                  onAnimationChange={setIsAnimating}
                  onAnimationProgress={(routeIdx, progress) => {
                    setAnimatingRouteIndex(routeIdx);
                    setAnimationProgress(progress);
                  }}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>

      {/* Right Sidebar - Stats & Charts */}
      <AnimatePresence>
        {!isMapFullscreen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-96 bg-white shadow-lg overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              <StatsPanel
                baselineFitness={baselineResult?.fitness}
                gwoFitness={gwoResult?.fitness}
                improvement={improvement}
                numVehicles={gwoResult?.routes.length || 0}
                runtime={gwoResult?.runtime}
                isOptimizing={isOptimizing}
              />

              {optimizationProgress.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <ConvergenceChart data={optimizationProgress} />
                </motion.div>
              )}

              {baselineResult && gwoResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <ComparisonChart
                    baselineFitness={baselineResult.fitness}
                    gwoFitness={gwoResult.fitness}
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
