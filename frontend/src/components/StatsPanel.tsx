import { TrendingDown, TrendingUp, Truck, Clock, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { motion } from 'motion/react';

interface StatsPanelProps {
  baselineFitness?: number;
  gwoFitness?: number;
  improvement: number;
  numVehicles: number;
  runtime?: number;
  isOptimizing: boolean;
}

export function StatsPanel({
  baselineFitness,
  gwoFitness,
  improvement,
  numVehicles,
  runtime,
  isOptimizing,
}: StatsPanelProps) {
  const stats = [
    {
      label: 'Baseline Distance',
      value: baselineFitness ? `${baselineFitness.toFixed(2)} km` : '--',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      label: 'GWO Distance',
      value: gwoFitness ? `${gwoFitness.toFixed(2)} km` : '--',
      icon: TrendingDown,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Improvement',
      value: improvement > 0 ? `${improvement.toFixed(2)}%` : '--',
      icon: TrendingDown,
      color: improvement > 0 ? 'text-blue-600' : 'text-slate-400',
      bgColor: improvement > 0 ? 'bg-blue-100' : 'bg-slate-100',
    },
    {
      label: 'Vehicles Used',
      value: numVehicles > 0 ? numVehicles : '--',
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Runtime',
      value: runtime ? `${runtime.toFixed(2)}s` : '--',
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-slate-900 mb-1">Performance Metrics</h2>
        <p className="text-slate-500 text-sm">Optimization results</p>
      </div>

      {isOptimizing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm text-blue-900">Optimization in progress...</p>
              <p className="text-xs text-blue-700">Running Grey Wolf Optimizer</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-0.5">{stat.label}</p>
                  <p className="text-slate-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {gwoFitness && baselineFitness && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg"
        >
          <h3 className="text-green-900 text-sm mb-2">Optimization Summary</h3>
          <p className="text-green-800 text-xs mb-2">
            The Grey Wolf Optimizer reduced the total distance by{' '}
            <span className="font-semibold">{improvement.toFixed(2)}%</span>,
            saving approximately{' '}
            <span className="font-semibold">
              {(baselineFitness - gwoFitness).toFixed(2)} km
            </span>{' '}
            using {numVehicles} vehicle{numVehicles !== 1 ? 's' : ''}.
          </p>
          <div className="flex items-center gap-2 text-xs text-green-700">
            <TrendingDown className="h-4 w-4" />
            <span>Better than baseline</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
