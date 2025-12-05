/**
 * Utility functions for generating consistent colors for routes
 */

// Predefined color palette for routes
const ROUTE_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // purple
  '#84cc16', // lime
  '#f43f5e', // rose
  '#0ea5e9', // sky
  '#eab308', // yellow
];

/**
 * Get a consistent color for a route based on its index
 * @param index - The route index
 * @returns A hex color string
 */
export function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}

/**
 * Generate a random color (fallback)
 * @returns A hex color string
 */
export function generateRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * Convert hex color to RGB with opacity
 * @param hex - Hex color string
 * @param opacity - Opacity value (0-1)
 * @returns RGBA string
 */
export function hexToRGBA(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
