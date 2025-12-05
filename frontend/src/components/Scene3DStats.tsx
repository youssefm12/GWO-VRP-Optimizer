import React, { useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { motion, AnimatePresence } from 'motion/react';

// Internal stats tracker that runs inside Canvas
export const StatsTracker: React.FC<{ onUpdate: (fps: number, pixelRatio: number) => void }> = ({ onUpdate }) => {
  const { gl } = useThree();
  
  let frameCount = 0;
  let lastTime = performance.now();
  
  useFrame(() => {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      onUpdate(fps, gl.getPixelRatio());
      frameCount = 0;
      lastTime = currentTime;
    }
  });
  
  return null;
};

// External UI component
export const Scene3DStats: React.FC<{
  fps?: number;
  pixelRatio?: number;
}> = ({ fps = 60, pixelRatio = 1 }) => {
  const [showStats, setShowStats] = useState(false);
  
  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  return (
    <>
      <button
        onClick={() => setShowStats(!showStats)}
        className="absolute bottom-6 right-6 z-10 bg-slate-800/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs hover:bg-slate-700/80 transition-colors"
      >
        {showStats ? '📊 Hide Stats' : '📊 Show Stats'}
      </button>
      
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 right-6 z-10 bg-slate-800/90 backdrop-blur-sm text-white p-4 rounded-lg text-xs space-y-2 min-w-[200px]"
          >
            <div className="flex justify-between items-center border-b border-slate-600 pb-2 mb-2">
              <span className="font-semibold">Performance Stats</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">FPS:</span>
                <span className={`font-mono ${getFpsColor(fps)}`}>{fps}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Renderer:</span>
                <span className="font-mono text-blue-400">WebGL</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Device Pixel Ratio:</span>
                <span className="font-mono text-slate-300">{pixelRatio.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-600 text-slate-400 text-[10px]">
              💡 Lower FPS? Try disabling shadows or reducing customers
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};