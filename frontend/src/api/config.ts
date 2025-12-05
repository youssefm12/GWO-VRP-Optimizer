/**
 * API Configuration
 */

// Backend API URLs - can be overridden with environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

// API Endpoints
export const ENDPOINTS = {
  // Health
  health: `${API_BASE_URL}/health`,
  
  // Datasets
  datasets: `${API_BASE_URL}/datasets`,
  datasetGenerate: `${API_BASE_URL}/datasets/generate`,
  datasetScan: `${API_BASE_URL}/datasets/scan`,
  datasetIngest: `${API_BASE_URL}/datasets/ingest`,
  datasetAutoIngest: `${API_BASE_URL}/datasets/auto-ingest`,
  
  // Jobs
  jobs: `${API_BASE_URL}/jobs`,
  
  // Direct optimization
  optimizeSync: `${API_BASE_URL}/optimize_sync`,
  generateInstance: `${API_BASE_URL}/generate_instance`,
  
  // WebSocket
  wsOptimize: `${WS_BASE_URL}/ws/optimize`,
} as const;

// API Timeouts
export const TIMEOUTS = {
  default: 30000,
  optimization: 120000,
} as const;
