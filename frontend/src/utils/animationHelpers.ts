/**
 * Animation helper functions for route visualization
 */

/**
 * Linear interpolation between two values
 * @param start - Start value
 * @param end - End value
 * @param t - Progress (0 to 1)
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Ease-in-out interpolation
 * @param t - Progress (0 to 1)
 * @returns Eased progress
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Interpolate between two coordinates
 * @param start - Start coordinates
 * @param end - End coordinates
 * @param t - Progress (0 to 1)
 * @param useEasing - Whether to apply easing
 * @returns Interpolated coordinates
 */
export function interpolateCoordinates(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  t: number,
  useEasing: boolean = false
): { lat: number; lng: number } {
  const progress = useEasing ? easeInOutCubic(t) : t;
  return {
    lat: lerp(start.lat, end.lat, progress),
    lng: lerp(start.lng, end.lng, progress),
  };
}

/**
 * Calculate total animation duration based on route length
 * @param numStops - Number of stops in the route
 * @param baseTimePerStop - Base time per stop in milliseconds
 * @returns Total duration in milliseconds
 */
export function calculateAnimationDuration(
  numStops: number,
  baseTimePerStop: number = 1500
): number {
  return numStops * baseTimePerStop;
}

/**
 * Get animation progress for a specific step
 * @param currentStep - Current step index
 * @param totalSteps - Total number of steps
 * @returns Progress percentage (0-100)
 */
export function getAnimationProgress(
  currentStep: number,
  totalSteps: number
): number {
  return totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
}

/**
 * Delay execution by a specified time
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create an animation frame loop
 * @param callback - Function to call on each frame
 * @param duration - Total duration in milliseconds
 * @returns Cleanup function
 */
export function animationLoop(
  callback: (progress: number) => void,
  duration: number
): () => void {
  let startTime: number | null = null;
  let animationId: number;

  const step = (timestamp: number) => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);

    callback(progress);

    if (progress < 1) {
      animationId = requestAnimationFrame(step);
    }
  };

  animationId = requestAnimationFrame(step);

  return () => cancelAnimationFrame(animationId);
}
