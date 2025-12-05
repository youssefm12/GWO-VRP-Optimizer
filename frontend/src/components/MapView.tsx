import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Truck } from 'lucide-react';
import { DebugOverlay } from './DebugOverlay';

export interface Location {
  id: string;
  lat: number;
  lng: number;
  demand?: number;
}

export interface Depot {
  id: number;
  lat: number;
  lng: number;
  name: string;
}

export interface Route {
  vehicle: string;
  customers: string[];
  totalDistance: number;
  load: number;
}

export interface MapViewProps {
  depot: Location;
  depots?: Depot[];
  customers: Location[];
  routes?: Route[];
  animatingRouteIndex?: number;
  animationProgress?: number;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  depot,
  depots,
  customers,
  routes = [],
  animatingRouteIndex,
  animationProgress = 0,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Calculate stable bounds from all points
  const bounds = useMemo(() => {
    const allPoints = [depot, ...customers];
    if (allPoints.length === 0) {
      return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1, centerLat: 0.5, centerLng: 0.5 };
    }

    const lats = allPoints.map((p) => p.lat);
    const lngs = allPoints.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      minLat,
      maxLat,
      minLng,
      maxLng,
      centerLat: (minLat + maxLat) / 2,
      centerLng: (minLng + maxLng) / 2,
    };
  }, [depot, customers]);

  // Stable coordinate conversion
  const latLngToSVG = useCallback((lat: number, lng: number) => {
    const width = 1000;
    const height = 600;
    const padding = 100;

    // Calculate the range
    const latRange = bounds.maxLat - bounds.minLat || 1;
    const lngRange = bounds.maxLng - bounds.minLng || 1;

    // Scale to fit within the viewBox with padding
    const x = ((lng - bounds.minLng) / lngRange) * (width - 2 * padding) + padding;
    const y = ((bounds.maxLat - lat) / latRange) * (height - 2 * padding) + padding;

    return { x, y };
  }, [bounds]);

  // Handle mouse wheel zoom - use native event listener to avoid passive event issue
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prev) => Math.max(0.5, Math.min(5, prev * delta)));
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, []);

  // Handle panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Only left click
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setPanOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Route colors
  const routeColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  ];

  // Calculate stable viewBox
  const viewBox = useMemo(() => {
    const baseWidth = 1000;
    const baseHeight = 600;
    
    const width = baseWidth / zoom;
    const height = baseHeight / zoom;
    
    const x = (baseWidth - width) / 2 - panOffset.x / zoom;
    const y = (baseHeight - height) / 2 - panOffset.y / zoom;
    
    return `${x} ${y} ${width} ${height}`;
  }, [zoom, panOffset]);

  // Reset view button
  const resetView = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  return (
    <div className={`w-full h-full flex flex-col bg-white ${className}`}>
      <DebugOverlay depot={depot} customers={customers} routes={routes} />
      
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-white" />
            <h2 className="text-white">Route Visualization (2D)</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-100">
              Zoom: {(zoom * 100).toFixed(0)}%
            </span>
            <button
              onClick={resetView}
              className="text-xs bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded transition-colors text-white"
            >
              Reset View
            </button>
          </div>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="flex-1 w-full cursor-move bg-slate-50 select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ touchAction: 'none' }}
      >
        {/* Grid background */}
        <defs>
          <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="url(#smallGrid)" />
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#cbd5e1" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="1000" height="600" fill="url(#grid)" />

        {/* Routes */}
        {routes.map((route, routeIndex) => {
          const color = routeColors[routeIndex % routeColors.length];
          const validCustomers = route.customers
            .map((id) => customers.find((c) => c.id === id))
            .filter((c): c is Location => c !== undefined);
          
          const points = [depot, ...validCustomers, depot];
          const isAnimating = animatingRouteIndex === routeIndex;

          return (
            <g key={routeIndex}>
              {/* Route path */}
              {points.map((point, i) => {
                if (i === 0) return null;
                const prev = points[i - 1];
                const start = latLngToSVG(prev.lat, prev.lng);
                const end = latLngToSVG(point.lat, point.lng);

                return (
                  <line
                    key={`${routeIndex}-${i}`}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={color}
                    strokeWidth={isAnimating ? 4 : 3}
                    strokeOpacity={isAnimating ? 1 : 0.7}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Animated truck */}
              {isAnimating && animationProgress > 0 && animationProgress < points.length - 1 && (
                (() => {
                  const segmentIndex = Math.floor(animationProgress);
                  const segmentProgress = animationProgress - segmentIndex;
                  
                  if (segmentIndex >= points.length - 1) return null;
                  
                  const start = points[segmentIndex];
                  const end = points[segmentIndex + 1];

                  const startPos = latLngToSVG(start.lat, start.lng);
                  const endPos = latLngToSVG(end.lat, end.lng);
                  const x = startPos.x + (endPos.x - startPos.x) * segmentProgress;
                  const y = startPos.y + (endPos.y - startPos.y) * segmentProgress;

                  return (
                    <g transform={`translate(${x}, ${y})`}>
                      <circle r={15} fill="white" stroke={color} strokeWidth={3} />
                      <foreignObject x={-12} y={-12} width={24} height={24}>
                        <div className="flex items-center justify-center w-full h-full">
                          <Truck className="size-5" style={{ color }} />
                        </div>
                      </foreignObject>
                    </g>
                  );
                })()
              )}
            </g>
          );
        })}

        {/* Customer markers */}
        {customers.map((customer) => {
          const pos = latLngToSVG(customer.lat, customer.lng);
          return (
            <g key={customer.id} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle
                r={10}
                fill="#3b82f6"
                stroke="white"
                strokeWidth={2.5}
              />
              <text
                x={0}
                y={-18}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="#1e293b"
              >
                {customer.demand}
              </text>
            </g>
          );
        })}

        {/* Depot marker */}
        {(() => {
          const pos = latLngToSVG(depot.lat, depot.lng);
          return (
            <g transform={`translate(${pos.x}, ${pos.y})`}>
              <circle
                r={16}
                fill="#ef4444"
                stroke="white"
                strokeWidth={4}
              />
              <foreignObject x={-10} y={-10} width={20} height={20}>
                <div className="flex items-center justify-center w-full h-full">
                  <Navigation className="size-5 text-white" />
                </div>
              </foreignObject>
              <text
                x={0}
                y={-26}
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#dc2626"
              >
                DEPOT
              </text>
            </g>
          );
        })()}

        {/* Multiple depots (if available) */}
        {depots && depots.length > 1 && depots.map((d, idx) => {
          const depotColors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4'];
          const color = depotColors[idx % depotColors.length];
          const pos = latLngToSVG(d.lat, d.lng);
          
          return (
            <g key={`depot-${d.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle
                r={16}
                fill={color}
                stroke="white"
                strokeWidth={4}
              />
              <foreignObject x={-10} y={-10} width={20} height={20}>
                <div className="flex items-center justify-center w-full h-full">
                  <Navigation className="size-5 text-white" />
                </div>
              </foreignObject>
              <text
                x={0}
                y={-26}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill={color}
              >
                {d.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex-shrink-0">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="size-4 bg-red-500 rounded-full border-2 border-white shadow-sm" />
            <span className="text-sm text-slate-700 font-medium">Depot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-4 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
            <span className="text-sm text-slate-700 font-medium">Customers ({customers.length})</span>
          </div>
          {routes.slice(0, 5).map((route, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-8 h-1 rounded-full"
                style={{ backgroundColor: routeColors[idx] }}
              />
              <span className="text-sm text-slate-700">Route {idx + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};