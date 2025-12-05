import React from 'react';
import { motion } from 'motion/react';
import { Map, Box } from 'lucide-react';

export interface ViewToggleProps {
  is3D: boolean;
  onToggle: (is3D: boolean) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ is3D, onToggle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-6 left-1/2 -translate-x-1/2 z-10"
    >
      <div className="bg-white rounded-full shadow-lg p-1 flex gap-1">
        <button
          onClick={() => onToggle(false)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
            ${!is3D 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'text-slate-600 hover:bg-slate-100'
            }
          `}
        >
          <Map className="w-4 h-4" />
          <span className="font-medium">2D View</span>
        </button>
        
        <button
          onClick={() => onToggle(true)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
            ${is3D 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'text-slate-600 hover:bg-slate-100'
            }
          `}
        >
          <Box className="w-4 h-4" />
          <span className="font-medium">3D View</span>
        </button>
      </div>
      
      {is3D && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 bg-slate-800 text-white text-xs px-4 py-2 rounded-lg shadow-lg text-center"
        >
          💡 <span className="font-semibold">Tip:</span> Use mouse to rotate, scroll to zoom
        </motion.div>
      )}
    </motion.div>
  );
};
