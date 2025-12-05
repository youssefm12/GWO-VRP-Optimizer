import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer } from '../App';

interface RoutesAnimationProps {
  depot: { lat: number; lng: number };
  customers: Customer[];
  routes: number[][];
  isAnimating: boolean;
  onAnimationChange: (isAnimating: boolean) => void;
  onAnimationProgress: (routeIndex: number, progress: number) => void;
}

export function RoutesAnimation({
  depot,
  customers,
  routes,
  isAnimating,
  onAnimationChange,
  onAnimationProgress,
}: RoutesAnimationProps) {
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [deliveredCustomers, setDeliveredCustomers] = useState<Set<number>>(new Set());
  const animationRef = useRef<number | null>(null);

  const handleStart = () => {
    onAnimationChange(true);
    setCurrentRouteIndex(0);
    setCurrentProgress(0);
    setDeliveredCustomers(new Set());
    onAnimationProgress(0, 0);
  };

  const handlePause = () => {
    onAnimationChange(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleReset = () => {
    onAnimationChange(false);
    setCurrentRouteIndex(0);
    setCurrentProgress(0);
    setDeliveredCustomers(new Set());
    onAnimationProgress(-1, 0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  useEffect(() => {
    if (!isAnimating || routes.length === 0) return;

    const currentRoute = routes[currentRouteIndex];
    if (!currentRoute) return;

    const routeLength = currentRoute.length;
    const segmentDuration = 2000; // 2 seconds per segment
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const totalProgress = (elapsed / segmentDuration) + currentProgress;
      
      if (totalProgress >= routeLength - 1) {
        // Mark all customers in this route as delivered
        const newDelivered = new Set(deliveredCustomers);
        currentRoute.forEach(nodeId => {
          if (nodeId !== 0) newDelivered.add(nodeId);
        });
        setDeliveredCustomers(newDelivered);

        // Move to next route or finish
        if (currentRouteIndex < routes.length - 1) {
          setCurrentRouteIndex(prev => prev + 1);
          setCurrentProgress(0);
          onAnimationProgress(currentRouteIndex + 1, 0);
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete
          onAnimationChange(false);
          onAnimationProgress(-1, 0);
        }
      } else {
        setCurrentProgress(totalProgress);
        onAnimationProgress(currentRouteIndex, totalProgress);
        
        // Mark current customer as delivered if we passed it
        const currentSegment = Math.floor(totalProgress);
        if (currentSegment > 0 && currentSegment < routeLength) {
          const currentNodeId = currentRoute[currentSegment];
          if (currentNodeId !== 0 && !deliveredCustomers.has(currentNodeId)) {
            setDeliveredCustomers(prev => new Set(prev).add(currentNodeId));
          }
        }
        
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, currentRouteIndex, routes, deliveredCustomers, currentProgress, onAnimationChange, onAnimationProgress]);

  const overallProgress = routes.length > 0
    ? ((currentRouteIndex + (currentProgress / Math.max(routes[currentRouteIndex]?.length - 1 || 1, 1))) / routes.length) * 100
    : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-6 right-6 z-[1000]"
      >
        <div className="bg-white rounded-lg shadow-xl p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-900">Delivery Animation</h3>
            <div className="flex gap-2">
              {!isAnimating ? (
                <Button
                  onClick={handleStart}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Play
                </Button>
              ) : (
                <Button
                  onClick={handlePause}
                  size="sm"
                  variant="outline"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
              )}
              <Button
                onClick={handleReset}
                size="sm"
                variant="outline"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isAnimating && (
            <>
              <div className="mb-2">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Route {currentRouteIndex + 1} of {routes.length}</span>
                  <span>{Math.round(overallProgress)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-xs text-blue-600 mb-0.5">Current Vehicle</p>
                  <p className="text-blue-900">#{currentRouteIndex + 1}</p>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-xs text-green-600 mb-0.5">Delivered</p>
                  <p className="text-green-900">
                    {deliveredCustomers.size}/{customers.length}
                  </p>
                </div>
              </div>
            </>
          )}

          {!isAnimating && deliveredCustomers.size === 0 && (
            <p className="text-sm text-slate-600">
              Click "Play" to watch the optimized delivery routes in action!
            </p>
          )}

          {!isAnimating && deliveredCustomers.size > 0 && deliveredCustomers.size === customers.length && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-900 mb-1">
                ✓ All deliveries complete!
              </p>
              <p className="text-xs text-green-700">
                {customers.length} customers served using {routes.length} vehicle{routes.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
