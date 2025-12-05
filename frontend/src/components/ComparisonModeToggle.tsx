import { Button } from './ui/button';
import { SplitSquareHorizontal, Map } from 'lucide-react';
import { motion } from 'motion/react';

interface ComparisonModeToggleProps {
  isComparisonMode: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function ComparisonModeToggle({
  isComparisonMode,
  onToggle,
  disabled = false,
}: ComparisonModeToggleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="absolute top-20 left-4 z-10"
    >
      <Button
        onClick={onToggle}
        disabled={disabled}
        size="sm"
        variant={isComparisonMode ? "default" : "outline"}
        className="bg-white shadow-lg border-slate-200 hover:bg-slate-50 gap-2"
      >
        {isComparisonMode ? (
          <>
            <Map className="size-4" />
            <span>Single View</span>
          </>
        ) : (
          <>
            <SplitSquareHorizontal className="size-4" />
            <span>Compare Routes</span>
          </>
        )}
      </Button>

      {disabled && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 mt-2 w-48 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl"
        >
          Run optimization first to compare routes
        </motion.div>
      )}
    </motion.div>
  );
}
