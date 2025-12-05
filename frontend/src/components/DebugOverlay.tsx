import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bug } from 'lucide-react';

export interface DebugOverlayProps {
  depot?: { lat: number; lng: number };
  customers?: any[];
  routes?: any[];
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ depot, customers = [], routes = [] }) => {
  const [showDebug, setShowDebug] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="absolute bottom-6 left-6 z-20 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-xs shadow-lg transition-colors"
      >
        <Bug className="w-4 h-4 inline mr-1" />
        {showDebug ? 'Hide Debug' : 'Show Debug'}
      </button>
      
      <AnimatePresence>
        {showDebug && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute bottom-20 left-6 z-20 bg-slate-900/95 backdrop-blur-sm text-white p-4 rounded-lg text-xs max-w-md max-h-96 overflow-y-auto"
          >
            <div className="font-bold text-amber-400 mb-3">🐛 Debug Info</div>
            
            <div className="space-y-3">
              <div>
                <div className="text-amber-300 font-semibold">Depot:</div>
                <pre className="text-green-300 mt-1">
                  {JSON.stringify(depot, null, 2)}
                </pre>
              </div>
              
              <div>
                <div className="text-amber-300 font-semibold">
                  Customers: ({customers.length})
                </div>
                <pre className="text-blue-300 mt-1 max-h-32 overflow-y-auto">
                  {JSON.stringify(customers.slice(0, 3), null, 2)}
                  {customers.length > 3 && '\n... and more'}
                </pre>
              </div>
              
              <div>
                <div className="text-amber-300 font-semibold">
                  Routes: ({routes.length})
                </div>
                <pre className="text-purple-300 mt-1 max-h-32 overflow-y-auto">
                  {JSON.stringify(routes, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
