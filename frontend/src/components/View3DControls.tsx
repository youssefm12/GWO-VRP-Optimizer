import React from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lightbulb, Grid3x3, Maximize2 } from 'lucide-react';

export interface View3DControlsProps {
  showGrid?: boolean;
  showLabels?: boolean;
  showShadows?: boolean;
  viewMode?: 'perspective' | 'orthographic';
  onToggleGrid?: (value: boolean) => void;
  onToggleLabels?: (value: boolean) => void;
  onToggleShadows?: (value: boolean) => void;
  onChangeViewMode?: (mode: 'perspective' | 'orthographic') => void;
}

export const View3DControls: React.FC<View3DControlsProps> = ({
  showGrid = true,
  showLabels = true,
  showShadows = true,
  viewMode = 'perspective',
  onToggleGrid,
  onToggleLabels,
  onToggleShadows,
  onChangeViewMode,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="absolute top-6 right-6 z-10 bg-white rounded-lg shadow-lg p-3 space-y-2"
    >
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-700">3D Controls</span>
      </div>
      
      {onToggleGrid && (
        <button
          onClick={() => onToggleGrid(!showGrid)}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
            ${showGrid 
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
              : 'text-slate-600 hover:bg-slate-50'
            }
          `}
        >
          <Grid3x3 className="w-4 h-4" />
          <span>Grid Floor</span>
          {showGrid ? <Eye className="w-3 h-3 ml-auto" /> : <EyeOff className="w-3 h-3 ml-auto opacity-50" />}
        </button>
      )}
      
      {onToggleLabels && (
        <button
          onClick={() => onToggleLabels(!showLabels)}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
            ${showLabels 
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
              : 'text-slate-600 hover:bg-slate-50'
            }
          `}
        >
          <span className="text-lg">🏷️</span>
          <span>Labels</span>
          {showLabels ? <Eye className="w-3 h-3 ml-auto" /> : <EyeOff className="w-3 h-3 ml-auto opacity-50" />}
        </button>
      )}
      
      {onToggleShadows && (
        <button
          onClick={() => onToggleShadows(!showShadows)}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
            ${showShadows 
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
              : 'text-slate-600 hover:bg-slate-50'
            }
          `}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Shadows</span>
          {showShadows ? <Eye className="w-3 h-3 ml-auto" /> : <EyeOff className="w-3 h-3 ml-auto opacity-50" />}
        </button>
      )}
      
      <div className="pt-2 border-t border-slate-200">
        <div className="text-xs text-slate-500 mb-1 px-1">Camera Mode</div>
        <div className="flex gap-1">
          <button
            onClick={() => onChangeViewMode?.('perspective')}
            className={`
              flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors
              ${viewMode === 'perspective'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
            `}
          >
            <Maximize2 className="w-3 h-3" />
            Perspective
          </button>
          <button
            onClick={() => onChangeViewMode?.('orthographic')}
            className={`
              flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors
              ${viewMode === 'orthographic'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
            `}
          >
            <Grid3x3 className="w-3 h-3" />
            Ortho
          </button>
        </div>
      </div>
      
      <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 space-y-1">
        <div className="flex items-center gap-1">
          <span>🖱️</span>
          <span>Left drag: Rotate</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🖱️</span>
          <span>Right drag: Pan</span>
        </div>
        <div className="flex items-center gap-1">
          <span>⚙️</span>
          <span>Scroll: Zoom</span>
        </div>
      </div>
    </motion.div>
  );
};
