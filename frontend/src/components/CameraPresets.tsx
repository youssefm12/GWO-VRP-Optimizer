import React from 'react';
import { motion } from 'motion/react';
import { Compass, Eye, Mountain, Plane } from 'lucide-react';

export interface CameraPreset {
  name: string;
  position: [number, number, number];
  icon: React.ReactNode;
}

const CAMERA_PRESETS: CameraPreset[] = [
  {
    name: 'Default',
    position: [60, 40, 60],
    icon: <Eye className="w-3 h-3" />,
  },
  {
    name: 'Top View',
    position: [0, 100, 0],
    icon: <Plane className="w-3 h-3" />,
  },
  {
    name: 'Side View',
    position: [100, 30, 0],
    icon: <Mountain className="w-3 h-3" />,
  },
  {
    name: 'Front View',
    position: [0, 30, 100],
    icon: <Compass className="w-3 h-3" />,
  },
];

export interface CameraPresetsProps {
  onSelectPreset: (position: [number, number, number]) => void;
}

export const CameraPresets: React.FC<CameraPresetsProps> = ({ onSelectPreset }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="absolute bottom-6 left-6 z-10 bg-white rounded-lg shadow-lg p-2"
    >
      <div className="text-xs font-semibold text-slate-700 mb-2 px-2">
        📷 Camera Presets
      </div>
      
      <div className="grid grid-cols-2 gap-1">
        {CAMERA_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onSelectPreset(preset.position)}
            className="
              flex items-center gap-2 px-3 py-2 rounded-md text-xs
              bg-slate-50 hover:bg-blue-50 hover:text-blue-700
              text-slate-600 transition-colors
              group
            "
          >
            <span className="group-hover:scale-110 transition-transform">
              {preset.icon}
            </span>
            <span>{preset.name}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};
