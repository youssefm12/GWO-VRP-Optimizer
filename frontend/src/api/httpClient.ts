/**
 * HTTP client for VRP optimization API
 */

export interface OptimizationRequest {
  config: {
    numWolves: number;
    numIterations: number;
    randomSeed: number;
    vehicleCapacity: number;
    penaltyCoefficient: number;
  };
  vrpData: {
    depot: { lat: number; lng: number };
    customers: Array<{
      id: number;
      lat: number;
      lng: number;
      demand: number;
    }>;
  };
}

export interface OptimizationResponse {
  routes: number[][];
  best_fitness: number;
  convergence_history: Array<{
    iteration: number;
    fitness: number;
  }>;
  runtime: number;
}

/**
 * Run synchronous optimization via HTTP POST
 * @param url - API endpoint URL
 * @param request - Optimization request
 * @returns Optimization response
 */
export async function runSyncOptimization(
  url: string,
  request: OptimizationRequest
): Promise<OptimizationResponse> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OptimizationResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to run optimization:', error);
    throw error;
  }
}

/**
 * Regenerate VRP instance via HTTP POST
 * @param url - API endpoint URL
 * @param numCustomers - Number of customers to generate
 * @returns VRP data
 */
export async function regenerateVRPInstance(
  url: string,
  numCustomers: number
): Promise<{
  depot: { lat: number; lng: number };
  customers: Array<{
    id: number;
    lat: number;
    lng: number;
    demand: number;
  }>;
}> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ num_customers: numCustomers }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to regenerate VRP instance:', error);
    throw error;
  }
}

/**
 * Health check endpoint
 * @param url - API base URL
 * @returns Health status
 */
export async function checkAPIHealth(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/health`);
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}
