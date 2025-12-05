import { MapView } from './MapView';
import { motion } from 'motion/react';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';

interface Location {
  id: string;
  lat: number;
  lng: number;
  demand?: number;
}

interface Depot {
  id: number;
  lat: number;
  lng: number;
  name: string;
}

interface Route {
  vehicle: string;
  customers: string[];
  totalDistance: number;
  load: number;
}

interface OptimizationResult {
  routes: number[][];
  fitness: number;
  convergenceHistory: { iteration: number; fitness: number }[];
  runtime?: number;
}

interface RouteComparisonViewProps {
  depot: { lat: number; lng: number };
  depots?: Depot[];
  customers: Location[];
  baselineResult: OptimizationResult | null;
  gwoResult: OptimizationResult | null;
  animatingRouteIndex?: number;
  animationProgress?: number;
}

export function RouteComparisonView({
  depot,
  depots,
  customers,
  baselineResult,
  gwoResult,
  animatingRouteIndex,
  animationProgress,
}: RouteComparisonViewProps) {
  const improvement = baselineResult && gwoResult
    ? ((baselineResult.fitness - gwoResult.fitness) / baselineResult.fitness) * 100
    : 0;

  const baselineRoutes = baselineResult
    ? baselineResult.routes.map((route, idx) => ({
        vehicle: `Vehicle ${idx + 1}`,
        customers: route.filter(id => id !== 0).map(String),
        totalDistance: 0,
        load: 0,
      }))
    : [];

  const gwoRoutes = gwoResult
    ? gwoResult.routes.map((route, idx) => ({
        vehicle: `Vehicle ${idx + 1}`,
        customers: route.filter(id => id !== 0).map(String),
        totalDistance: 0,
        load: 0,
      }))
    : [];

  return (
    <div className="h-full flex flex-col">
      {/* Comparison Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-8">
          <div>
            <h2 className="text-slate-900">Route Comparison Mode</h2>
            <p className="text-sm text-slate-500">Baseline vs GWO Optimized</p>
          </div>
          
          {baselineResult && gwoResult && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200"
            >
              <TrendingDown className="size-5 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-600">Improvement</p>
                <p className="text-emerald-700 font-mono">{improvement.toFixed(1)}%</p>
              </div>
              <ArrowRight className="size-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-600">Distance Saved</p>
                <p className="text-emerald-700 font-mono">
                  {(baselineResult.fitness - gwoResult.fitness).toFixed(1)} km
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Runtime Comparison */}
        {gwoResult?.runtime && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-right"
          >
            <p className="text-xs text-slate-500">Optimization Time</p>
            <p className="text-slate-900 font-mono">{gwoResult.runtime.toFixed(2)}s</p>
          </motion.div>
        )}
      </motion.div>

      {/* Side-by-side Maps */}
      <div className="flex-1 grid grid-cols-2 gap-0 divide-x divide-slate-200">
        {/* Baseline Solution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-slate-50"
        >
          {/* Label */}
          <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg px-4 py-2 border border-slate-200">
            <h3 className="text-slate-900 mb-1">Baseline Solution</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Total Distance:</span>
                <span className="font-mono text-slate-900">
                  {baselineResult?.fitness.toFixed(1) || '—'} km
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Vehicles:</span>
                <span className="font-mono text-slate-900">
                  {baselineRoutes.length || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Map */}
          {baselineResult ? (
            <MapView
              depot={depot}
              depots={depots}
              customers={customers}
              routes={baselineRoutes}
              className="h-full"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="size-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400">No baseline solution</p>
                <p className="text-sm text-slate-400">Run optimization first</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* GWO Optimized Solution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-slate-50"
        >
          {/* Label */}
          <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg px-4 py-2 border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-slate-900">GWO Optimized</h3>
              <div className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs">
                Best
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Total Distance:</span>
                <span className="font-mono text-emerald-700">
                  {gwoResult?.fitness.toFixed(1) || '—'} km
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Vehicles:</span>
                <span className="font-mono text-emerald-700">
                  {gwoRoutes.length || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Map */}
          {gwoResult ? (
            <MapView
              depot={depot}
              depots={depots}
              customers={customers}
              routes={gwoRoutes}
              animatingRouteIndex={animatingRouteIndex}
              animationProgress={animationProgress}
              className="h-full"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <TrendingDown className="size-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400">No optimized solution</p>
                <p className="text-sm text-slate-400">Run optimization first</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Detailed Comparison Stats */}
      {baselineResult && gwoResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border-t border-slate-200 px-6 py-3"
        >
          <div className="grid grid-cols-5 gap-6 text-center">
            <div>
              <p className="text-xs text-slate-500 mb-1">Distance Reduction</p>
              <p className="text-slate-900 font-mono">
                {(baselineResult.fitness - gwoResult.fitness).toFixed(1)} km
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Improvement %</p>
              <p className={`font-mono ${improvement > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                {improvement.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Vehicle Difference</p>
              <p className="text-slate-900 font-mono">
                {Math.abs(baselineRoutes.length - gwoRoutes.length)} 
                {baselineRoutes.length > gwoRoutes.length ? ' fewer' : baselineRoutes.length < gwoRoutes.length ? ' more' : ' same'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Avg Distance/Vehicle</p>
              <p className="text-slate-900 font-mono">
                {gwoRoutes.length > 0 ? (gwoResult.fitness / gwoRoutes.length).toFixed(1) : '0'} km
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Convergence Speed</p>
              <p className="text-slate-900 font-mono">
                {gwoResult.convergenceHistory.length} iterations
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
