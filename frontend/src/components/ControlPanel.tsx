import { VRPConfig } from '../App';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Loader2, Play, RefreshCw, Zap } from 'lucide-react';
import { Separator } from './ui/separator';

interface ControlPanelProps {
  config: VRPConfig;
  onConfigChange: (key: keyof VRPConfig, value: number) => void;
  onRegenerateData: () => void;
  onOptimizeSync: () => void;
  onOptimizeRealtime: () => void;
  isOptimizing: boolean;
  showGWORoutes: boolean;
  onToggleRoutes: (value: boolean) => void;
}

export function ControlPanel({
  config,
  onConfigChange,
  onRegenerateData,
  onOptimizeSync,
  onOptimizeRealtime,
  isOptimizing,
  showGWORoutes,
  onToggleRoutes,
}: ControlPanelProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-slate-900 mb-1">VRP Optimizer</h1>
        <p className="text-slate-500 text-sm">Grey Wolf Optimizer</p>
      </div>

      <Separator className="mb-6" />

      {/* GWO Parameters */}
      <div className="space-y-6">
        <div>
          <h2 className="text-slate-700 mb-4">Algorithm Parameters</h2>

          {/* Number of Wolves */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="wolves">Population (Wolves)</Label>
              <Input
                id="wolves-input"
                type="number"
                value={config.numWolves}
                onChange={(e) => onConfigChange('numWolves', parseInt(e.target.value) || 30)}
                className="w-20 h-8"
                min={10}
                max={100}
              />
            </div>
            <Slider
              id="wolves"
              value={[config.numWolves]}
              onValueChange={(value) => onConfigChange('numWolves', value[0])}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">Range: 10-100</p>
          </div>

          {/* Number of Iterations */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="iterations">Iterations</Label>
              <Input
                id="iterations-input"
                type="number"
                value={config.numIterations}
                onChange={(e) => onConfigChange('numIterations', parseInt(e.target.value) || 100)}
                className="w-20 h-8"
                min={50}
                max={500}
              />
            </div>
            <Slider
              id="iterations"
              value={[config.numIterations]}
              onValueChange={(value) => onConfigChange('numIterations', value[0])}
              min={50}
              max={500}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">Range: 50-500</p>
          </div>

          {/* Random Seed */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="seed">Random Seed</Label>
              <Input
                id="seed-input"
                type="number"
                value={config.randomSeed}
                onChange={(e) => onConfigChange('randomSeed', parseInt(e.target.value) || 42)}
                className="w-20 h-8"
              />
            </div>
            <p className="text-xs text-slate-500">For reproducible results</p>
          </div>
        </div>

        <Separator />

        {/* VRP Parameters */}
        <div>
          <h2 className="text-slate-700 mb-4">VRP Configuration</h2>

          {/* Vehicle Capacity */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="capacity">Vehicle Capacity</Label>
              <Input
                id="capacity-input"
                type="number"
                value={config.vehicleCapacity}
                onChange={(e) => onConfigChange('vehicleCapacity', parseInt(e.target.value) || 100)}
                className="w-20 h-8"
                min={50}
                max={200}
              />
            </div>
            <Slider
              id="capacity"
              value={[config.vehicleCapacity]}
              onValueChange={(value) => onConfigChange('vehicleCapacity', value[0])}
              min={50}
              max={200}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">Range: 50-200 units</p>
          </div>

          {/* Penalty Coefficient */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="penalty">Penalty Coefficient</Label>
              <Input
                id="penalty-input"
                type="number"
                value={config.penaltyCoefficient}
                onChange={(e) => onConfigChange('penaltyCoefficient', parseInt(e.target.value) || 1000)}
                className="w-20 h-8"
                min={100}
                max={5000}
              />
            </div>
            <Slider
              id="penalty"
              value={[config.penaltyCoefficient]}
              onValueChange={(value) => onConfigChange('penaltyCoefficient', value[0])}
              min={100}
              max={5000}
              step={100}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">For constraint violations</p>
          </div>

          {/* Number of Customers */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="customers">Number of Customers</Label>
              <Input
                id="customers-input"
                type="number"
                value={config.numCustomers}
                onChange={(e) => onConfigChange('numCustomers', parseInt(e.target.value) || 20)}
                className="w-20 h-8"
                min={5}
                max={100}
              />
            </div>
            <Slider
              id="customers"
              value={[config.numCustomers]}
              onValueChange={(value) => onConfigChange('numCustomers', value[0])}
              min={5}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">Range: 5-100</p>
          </div>

          {/* Number of Depots */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="depots">Number of Depots</Label>
              <Input
                id="depots-input"
                type="number"
                value={config.numDepots}
                onChange={(e) => onConfigChange('numDepots', parseInt(e.target.value) || 1)}
                className="w-20 h-8"
                min={1}
                max={5}
              />
            </div>
            <Slider
              id="depots"
              value={[config.numDepots]}
              onValueChange={(value) => onConfigChange('numDepots', value[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">Range: 1-5 distribution centers</p>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div>
          <h2 className="text-slate-700 mb-4">Actions</h2>

          <div className="space-y-3">
            <Button
              onClick={onRegenerateData}
              variant="outline"
              className="w-full"
              disabled={isOptimizing}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate VRP Instance
            </Button>

            <Button
              onClick={onOptimizeSync}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Optimization (Sync)
                </>
              )}
            </Button>

            <Button
              onClick={onOptimizeRealtime}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Run Optimization (WebSocket)
                </>
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Display Options */}
        <div>
          <h2 className="text-slate-700 mb-4">Display Options</h2>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="route-toggle">Show GWO Routes</Label>
              <p className="text-xs text-slate-500">
                {showGWORoutes ? 'Optimized routes' : 'Baseline routes'}
              </p>
            </div>
            <Switch
              id="route-toggle"
              checked={showGWORoutes}
              onCheckedChange={onToggleRoutes}
            />
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-8 p-4 bg-slate-100 rounded-lg">
        <p className="text-xs text-slate-600">
          Configure parameters above and click "Run Optimization" to solve the VRP using the Grey Wolf Optimizer algorithm.
        </p>
      </div>
    </div>
  );
}