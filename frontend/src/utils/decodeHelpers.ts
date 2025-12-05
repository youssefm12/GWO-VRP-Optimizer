/**
 * Helper functions for decoding and processing optimization results
 */

import { Customer } from '../App';

/**
 * Decode route indices to actual coordinates
 * @param route - Array of node IDs (0 = depot, >0 = customer ID)
 * @param depot - Depot coordinates
 * @param customers - Array of customers
 * @returns Array of coordinates
 */
export function decodeRouteToCoordinates(
  route: number[],
  depot: { lat: number; lng: number },
  customers: Customer[]
): Array<{ lat: number; lng: number }> {
  return route.map(nodeId => {
    if (nodeId === 0) {
      return depot;
    }
    const customer = customers.find(c => c.id === nodeId);
    return customer ? { lat: customer.lat, lng: customer.lng } : depot;
  });
}

/**
 * Calculate total demand for a route
 * @param route - Array of node IDs
 * @param customers - Array of customers
 * @returns Total demand
 */
export function calculateRouteDemand(
  route: number[],
  customers: Customer[]
): number {
  return route.reduce((total, nodeId) => {
    if (nodeId === 0) return total;
    const customer = customers.find(c => c.id === nodeId);
    return total + (customer?.demand || 0);
  }, 0);
}

/**
 * Validate route against capacity constraint
 * @param route - Array of node IDs
 * @param customers - Array of customers
 * @param capacity - Vehicle capacity
 * @returns Whether the route is valid
 */
export function isRouteValid(
  route: number[],
  customers: Customer[],
  capacity: number
): boolean {
  const demand = calculateRouteDemand(route, customers);
  return demand <= capacity;
}

/**
 * Get route statistics
 * @param route - Array of node IDs
 * @param customers - Array of customers
 * @returns Route statistics
 */
export function getRouteStats(
  route: number[],
  customers: Customer[]
): {
  numStops: number;
  totalDemand: number;
  customerIds: number[];
} {
  const customerIds = route.filter(id => id !== 0);
  return {
    numStops: customerIds.length,
    totalDemand: calculateRouteDemand(route, customers),
    customerIds,
  };
}

/**
 * Format convergence data for charts
 * @param rawData - Raw convergence data from backend
 * @returns Formatted data for Recharts
 */
export function formatConvergenceData(
  rawData: Array<{ iteration?: number; iter?: number; fitness?: number; best_fitness?: number }>
): Array<{ iteration: number; fitness: number }> {
  return rawData.map(item => ({
    iteration: item.iteration ?? item.iter ?? 0,
    fitness: item.fitness ?? item.best_fitness ?? 0,
  }));
}

/**
 * Parse backend route format to frontend format
 * @param backendRoutes - Routes from backend (may have different format)
 * @returns Standardized route format
 */
export function parseBackendRoutes(backendRoutes: any): number[][] {
  if (!Array.isArray(backendRoutes)) {
    console.error('Invalid routes format:', backendRoutes);
    return [];
  }

  return backendRoutes.map(route => {
    if (Array.isArray(route)) {
      return route;
    }
    // Handle potential string or other formats
    if (typeof route === 'string') {
      return route.split(',').map(id => parseInt(id, 10));
    }
    return [];
  });
}

/**
 * Calculate summary statistics for all routes
 * @param routes - Array of routes
 * @param customers - Array of customers
 * @returns Summary statistics
 */
export function calculateRoutesSummary(
  routes: number[][],
  customers: Customer[]
): {
  totalCustomers: number;
  totalDemand: number;
  numVehicles: number;
  avgCustomersPerVehicle: number;
  avgDemandPerVehicle: number;
} {
  const allCustomerIds = new Set<number>();
  let totalDemand = 0;

  routes.forEach(route => {
    route.filter(id => id !== 0).forEach(id => {
      allCustomerIds.add(id);
      const customer = customers.find(c => c.id === id);
      if (customer) {
        totalDemand += customer.demand;
      }
    });
  });

  return {
    totalCustomers: allCustomerIds.size,
    totalDemand,
    numVehicles: routes.length,
    avgCustomersPerVehicle: allCustomerIds.size / routes.length,
    avgDemandPerVehicle: totalDemand / routes.length,
  };
}
