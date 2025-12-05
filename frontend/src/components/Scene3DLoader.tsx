import React from 'react';
import { Html, useProgress } from '@react-three/drei';
import { motion } from 'motion/react';

export const Scene3DLoader: React.FC = () => {
  const { progress, active } = useProgress();
  
  if (!active) return null;
  
  return (
    <Html center>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 p-8 bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl"
      >
        <div className="relative w-20 h-20">
          {/* Spinning cube animation */}
          <motion.div
            animate={{ 
              rotateX: [0, 360],
              rotateY: [0, 360],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            className="w-full h-full"
          >
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg" 
              style={{ 
                transform: 'perspective(500px) rotateX(30deg) rotateY(45deg)',
              }}
            />
          </motion.div>
        </div>
        
        <div className="text-center space-y-2">
          <div className="text-white text-lg font-semibold">
            Loading 3D Scene
          </div>
          
          <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          <div className="text-slate-400 text-sm">
            {Math.round(progress)}%
          </div>
        </div>
      </motion.div>
    </Html>
  );
};
