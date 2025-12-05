/**
 * Backend API Service
 * Handles all communication with the VRP optimizer backend
 */

import { ENDPOINTS, TIMEOUTS } from './config';

// Types
export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  format: string;
  num_customers: number;
  num_depots: number;
  total_demand: number;
  file_path: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Customer {
  id: number;
  lat: number;
  lng: number;
  demand: number;
}

export interface Depot {
  id: number;
  lat: number;
  lng: number;
  name: string;
}

export interface VRPData {
  depot: { lat: number; lng: number };
  depots?: Depot[];
  customers: Customer[];
}

export interface OptimizationConfig {
  numWolves: number;
  numIterations: number;
  randomSeed: number;
  vehicleCapacity: number;
  penaltyCoefficient: number;
}

export interface RouteDetail {
  route: number[];
  distance: number;
  load: number;
}

export interface OptimizationResult {
  routes: number[][];
  best_fitness: number;
  convergence_history: { iteration: number; fitness: number }[];
  runtime: number;
  route_details?: RouteDetail[];
}

export interface Job {
  id: string;
  dataset_id: string;
  name: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  config: OptimizationConfig;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface JobWithResult {
  metadata: Job;
  result: OptimizationResult | null;
}

// API Functions

/**
 * Check if the backend is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(ENDPOINTS.health, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * List all datasets
 */
export async function listDatasets(): Promise<{ datasets: Dataset[]; total: number }> {
  const response = await fetch(ENDPOINTS.datasets);
  if (!response.ok) throw new Error('Failed to fetch datasets');
  return response.json();
}

/**
 * Get a single dataset with its VRP data
 */
export async function getDataset(id: string): Promise<{ metadata: Dataset; vrp_data: VRPData }> {
  const response = await fetch(`${ENDPOINTS.datasets}/${id}`);
  if (!response.ok) throw new Error('Failed to fetch dataset');
  return response.json();
}

/**
 * Create a new dataset
 */
export async function createDataset(
  name: string,
  vrpData: VRPData,
  description?: string
): Promise<{ metadata: Dataset; vrp_data: VRPData }> {
  const response = await fetch(ENDPOINTS.datasets, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      description,
      vrp_data: vrpData,
    }),
  });
  if (!response.ok) throw new Error('Failed to create dataset');
  return response.json();
}

/**
 * Generate a new synthetic dataset
 */
export async function generateDataset(params: {
  name: string;
  description?: string;
  num_customers: number;
  demand_low?: number;
  demand_high?: number;
  seed?: number;
  center_lat?: number;
  center_lng?: number;
  spread?: number;
}): Promise<{ metadata: Dataset; vrp_data: VRPData }> {
  const response = await fetch(ENDPOINTS.datasetGenerate, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error('Failed to generate dataset');
  return response.json();
}

/**
 * Delete a dataset
 */
export async function deleteDataset(id: string): Promise<void> {
  const response = await fetch(`${ENDPOINTS.datasets}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete dataset');
}

/**
 * Generate a new VRP instance (quick, no persistence)
 */
export async function generateInstance(numCustomers: number, seed?: number): Promise<VRPData> {
  const response = await fetch(ENDPOINTS.generateInstance, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num_customers: numCustomers, seed }),
  });
  if (!response.ok) throw new Error('Failed to generate instance');
  return response.json();
}

/**
 * Run synchronous optimization
 */
export async function runOptimizationSync(
  config: OptimizationConfig,
  vrpData: VRPData
): Promise<OptimizationResult> {
  const response = await fetch(ENDPOINTS.optimizeSync, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, vrpData }),
    signal: AbortSignal.timeout(TIMEOUTS.optimization),
  });
  if (!response.ok) throw new Error('Optimization failed');
  return response.json();
}

/**
 * Create a new job
 */
export async function createJob(
  datasetId: string,
  config: OptimizationConfig,
  name?: string
): Promise<JobWithResult> {
  const response = await fetch(ENDPOINTS.jobs, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataset_id: datasetId,
      config,
      name,
    }),
  });
  if (!response.ok) throw new Error('Failed to create job');
  return response.json();
}

/**
 * Run a job synchronously
 */
export async function runJobSync(jobId: string): Promise<JobWithResult> {
  const response = await fetch(`${ENDPOINTS.jobs}/${jobId}/run`, {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUTS.optimization),
  });
  if (!response.ok) throw new Error('Job execution failed');
  return response.json();
}

/**
 * Get job details
 */
export async function getJob(jobId: string): Promise<JobWithResult> {
  const response = await fetch(`${ENDPOINTS.jobs}/${jobId}`);
  if (!response.ok) throw new Error('Failed to fetch job');
  return response.json();
}

/**
 * List all jobs
 */
export async function listJobs(datasetId?: string): Promise<{ jobs: Job[]; total: number }> {
  const url = datasetId
    ? `${ENDPOINTS.jobs}?dataset_id=${datasetId}`
    : ENDPOINTS.jobs;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch jobs');
  return response.json();
}

/**
 * Scan for datasets in the backend data directory
 */
export async function scanDatasets(): Promise<{
  scanned_paths: string[];
  found_datasets: Array<{
    path: string;
    format: string;
    name: string;
    num_customers: number;
    valid: boolean;
    error?: string;
  }>;
  total_found: number;
  total_valid: number;
}> {
  const response = await fetch(ENDPOINTS.datasetScan, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error('Failed to scan datasets');
  return response.json();
}

/**
 * Auto-ingest all datasets found in the data directory
 */
export async function autoIngestDatasets(): Promise<{
  ingested: Dataset[];
  failed: Array<{ path: string; error: string }>;
  total_ingested: number;
  total_failed: number;
}> {
  const response = await fetch(ENDPOINTS.datasetAutoIngest, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error('Failed to auto-ingest datasets');
  return response.json();
}

// WebSocket optimization
export interface WSProgressMessage {
  iter?: number;
  best_fitness?: number;
  done?: boolean;
  routes?: number[][];
  runtime?: number;
  error?: string;
}

export function createOptimizationSocket(
  config: OptimizationConfig,
  vrpData: VRPData,
  onProgress: (msg: WSProgressMessage) => void,
  onError: (error: Error) => void,
  onClose: () => void
): WebSocket {
  const ws = new WebSocket(ENDPOINTS.wsOptimize);

  ws.onopen = () => {
    ws.send(JSON.stringify({ config, vrpData }));
  };

  ws.onmessage = (event) => {
    try {
      const data: WSProgressMessage = JSON.parse(event.data);
      onProgress(data);
      if (data.done || data.error) {
        ws.close();
      }
    } catch (e) {
      onError(new Error('Failed to parse message'));
    }
  };

  ws.onerror = () => {
    onError(new Error('WebSocket connection failed'));
  };

  ws.onclose = onClose;

  return ws;
}
