import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Database, Plus, RefreshCw, Upload, Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';
import {
  Dataset,
  VRPData,
  listDatasets,
  getDataset,
  generateDataset,
  deleteDataset,
  autoIngestDatasets,
} from '../api/backendService';

interface DatasetSelectorProps {
  onDatasetSelect: (vrpData: VRPData, datasetId?: string) => void;
  selectedDatasetId?: string;
  disabled?: boolean;
}

export function DatasetSelector({
  onDatasetSelect,
  selectedDatasetId,
  disabled = false,
}: DatasetSelectorProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateParams, setGenerateParams] = useState({
    name: '',
    num_customers: 20,
    demand_low: 5,
    demand_high: 20,
  });

  const loadDatasets = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listDatasets();
      setDatasets(result.datasets);
    } catch (e) {
      setError('Failed to load datasets');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleDatasetChange = async (datasetId: string) => {
    if (datasetId === '__generate__') {
      setShowGenerateDialog(true);
      return;
    }
    
    try {
      setLoading(true);
      const result = await getDataset(datasetId);
      onDatasetSelect(result.vrp_data, datasetId);
    } catch (e) {
      setError('Failed to load dataset');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!generateParams.name.trim()) {
      setError('Please enter a dataset name');
      return;
    }

    try {
      setLoading(true);
      const result = await generateDataset({
        name: generateParams.name,
        num_customers: generateParams.num_customers,
        demand_low: generateParams.demand_low,
        demand_high: generateParams.demand_high,
      });
      await loadDatasets();
      onDatasetSelect(result.vrp_data, result.metadata.id);
      setShowGenerateDialog(false);
      setGenerateParams({ name: '', num_customers: 20, demand_low: 5, demand_high: 20 });
    } catch (e) {
      setError('Failed to generate dataset');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoIngest = async () => {
    try {
      setLoading(true);
      const result = await autoIngestDatasets();
      if (result.total_ingested > 0) {
        await loadDatasets();
      }
      if (result.total_failed > 0) {
        console.warn('Some datasets failed to ingest:', result.failed);
      }
    } catch (e) {
      setError('Failed to ingest datasets');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this dataset?')) return;
    
    try {
      await deleteDataset(id);
      await loadDatasets();
      if (selectedDatasetId === id) {
        onDatasetSelect({ depot: { lat: 0, lng: 0 }, customers: [] });
      }
    } catch (e) {
      setError('Failed to delete dataset');
      console.error(e);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-slate-500" />
        <Label>Dataset</Label>
      </div>

      <Select
        value={selectedDatasetId || ''}
        onValueChange={handleDatasetChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a dataset..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__generate__">
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Generate New Dataset
            </span>
          </SelectItem>
          <Separator className="my-1" />
          {datasets.length === 0 ? (
            <div className="px-2 py-4 text-sm text-slate-500 text-center">
              No datasets found
            </div>
          ) : (
            datasets.map((dataset) => (
              <SelectItem key={dataset.id} value={dataset.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{dataset.name}</span>
                  <span className="text-xs text-slate-400 ml-2">
                    {dataset.num_customers} customers
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={loadDatasets}
          disabled={loading}
          className="flex-1"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAutoIngest}
          disabled={loading}
          className="flex-1"
        >
          <Upload className="h-3 w-3 mr-1" />
          Import
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Generate Dataset Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New Dataset</DialogTitle>
            <DialogDescription>
              Create a synthetic VRP dataset with random customer locations and demands.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="dataset-name">Dataset Name</Label>
              <Input
                id="dataset-name"
                value={generateParams.name}
                onChange={(e) => setGenerateParams({ ...generateParams, name: e.target.value })}
                placeholder="My Dataset"
              />
            </div>
            
            <div>
              <Label htmlFor="num-customers">Number of Customers</Label>
              <Input
                id="num-customers"
                type="number"
                value={generateParams.num_customers}
                onChange={(e) => setGenerateParams({ ...generateParams, num_customers: parseInt(e.target.value) || 20 })}
                min={5}
                max={100}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="demand-low">Min Demand</Label>
                <Input
                  id="demand-low"
                  type="number"
                  value={generateParams.demand_low}
                  onChange={(e) => setGenerateParams({ ...generateParams, demand_low: parseInt(e.target.value) || 5 })}
                  min={1}
                />
              </div>
              <div>
                <Label htmlFor="demand-high">Max Demand</Label>
                <Input
                  id="demand-high"
                  type="number"
                  value={generateParams.demand_high}
                  onChange={(e) => setGenerateParams({ ...generateParams, demand_high: parseInt(e.target.value) || 20 })}
                  min={1}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
