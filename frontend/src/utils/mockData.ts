/**
 * Utility functions for generating mock VRP data
 */

import { VRPData } from '../App';

/**
 * Generate random coordinates within a city area
 * @param centerLat - Center latitude
 * @param centerLng - Center longitude
 * @param radiusKm - Radius in kilometers
 * @returns Random lat/lng coordinates
 */
function generateRandomCoordinates(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): { lat: number; lng: number } {
  const radiusInDegrees = radiusKm / 111; // Rough conversion: 1 degree ≈ 111 km

  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);

  return {
    lat: centerLat + y,
    lng: centerLng + x / Math.cos(centerLat * (Math.PI / 180)),
  };
}

/**
 * Generate mock VRP data with depot(s) and customers
 * @param numCustomers - Number of customers to generate
 * @param numDepots - Number of depots to generate (default: 1)
 * @returns VRP data object
 */
export function generateMockVRPData(numCustomers: number, numDepots: number = 1): VRPData {
  // Use a major city as the center (e.g., San Francisco)
  const centerLat = 37.7749;
  const centerLng = -122.4194;
  const radiusKm = 15; // 15km radius

  // Generate primary depot at center (for backward compatibility)
  const depot = {
    lat: centerLat,
    lng: centerLng,
  };

  // Generate multiple depots distributed around the center
  const depotNames = ['Central Hub', 'North Depot', 'East Depot', 'South Depot', 'West Depot'];
  const depots = Array.from({ length: Math.min(numDepots, 5) }, (_, index) => {
    if (index === 0) {
      // First depot is at the center
      return {
        id: index,
        lat: centerLat,
        lng: centerLng,
        name: depotNames[0],
      };
    }
    
    // Distribute other depots in a circle around the center
    const angle = (index * 2 * Math.PI) / numDepots;
    const depotRadius = radiusKm * 0.5; // Place depots at half the customer radius
    const radiusInDegrees = depotRadius / 111;
    
    return {
      id: index,
      lat: centerLat + radiusInDegrees * Math.sin(angle),
      lng: centerLng + radiusInDegrees * Math.cos(angle) / Math.cos(centerLat * (Math.PI / 180)),
      name: depotNames[index] || `Depot ${index + 1}`,
    };
  });

  // Generate random customers
  const customers = Array.from({ length: numCustomers }, (_, index) => {
    const coords = generateRandomCoordinates(centerLat, centerLng, radiusKm);
    return {
      id: index + 1,
      lat: coords.lat,
      lng: coords.lng,
      demand: Math.floor(Math.random() * 30) + 10, // Random demand between 10-40 units
    };
  });

  return {
    depot,
    depots,
    customers,
  };
}

/**
 * Calculate Euclidean distance between two points (in km)
 * @param lat1 - Latitude of point 1
 * @param lng1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lng2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate total route distance
 * @param route - Array of node IDs
 * @param depot - Depot coordinates
 * @param customers - Array of customers
 * @returns Total distance in kilometers
 */
export function calculateRouteDistance(
  route: number[],
  depot: { lat: number; lng: number },
  customers: { id: number; lat: number; lng: number }[]
): number {
  let totalDistance = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const fromNodeId = route[i];
    const toNodeId = route[i + 1];

    const fromCoords =
      fromNodeId === 0
        ? depot
        : customers.find(c => c.id === fromNodeId) || depot;
    const toCoords =
      toNodeId === 0
        ? depot
        : customers.find(c => c.id === toNodeId) || depot;

    totalDistance += calculateDistance(
      fromCoords.lat,
      fromCoords.lng,
      toCoords.lat,
      toCoords.lng
    );
  }

  return totalDistance;
}