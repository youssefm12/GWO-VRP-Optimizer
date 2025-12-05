import React from 'react';
import { motion } from 'motion/react';
import { Maximize2, Minimize2 } from 'lucide-react';

export interface MapFullscreenToggleProps {
  isFullscreen: boolean;
  onToggle: () => void;
}

export const MapFullscreenToggle: React.FC<MapFullscreenToggleProps> = ({ isFullscreen, onToggle }) => {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onToggle}
      className="
        absolute top-6 right-6 z-20
        bg-white hover:bg-slate-50
        shadow-lg hover:shadow-xl
        rounded-lg p-3
        transition-all duration-300
        group
      "
      title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
    >
      {isFullscreen ? (
        <Minimize2 className="w-5 h-5 text-slate-700 group-hover:text-blue-600 transition-colors" />
      ) : (
        <Maximize2 className="w-5 h-5 text-slate-700 group-hover:text-blue-600 transition-colors" />
      )}
    </motion.button>
  );
};
