import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Card } from '../ui/card';
import { useMemo, useState, useEffect, useRef } from 'react';

interface ComparisonChartProps {
  baselineFitness: number;
  gwoFitness: number;
}

export function ComparisonChart({ baselineFitness, gwoFitness }: ComparisonChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 250 });

  // Memoize the chart data to prevent infinite re-renders
  const data = useMemo(() => [
    {
      name: 'Baseline (NN)',
      distance: parseFloat(baselineFitness.toFixed(2)),
    },
    {
      name: 'GWO Optimized',
      distance: parseFloat(gwoFitness.toFixed(2)),
    },
  ], [baselineFitness, gwoFitness]);

  const improvement = useMemo(() => 
    ((baselineFitness - gwoFitness) / baselineFitness) * 100,
    [baselineFitness, gwoFitness]
  );

  // Measure container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width > 0) {
          setDimensions({ width, height: 250 });
        }
      }
    };

    // Initial measurement
    const timeoutId = setTimeout(updateDimensions, 100);
    
    // Update on resize
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-slate-900">Algorithm Comparison</h3>
        <p className="text-slate-500 text-sm">
          Total distance comparison
        </p>
      </div>

      <div ref={containerRef} style={{ width: '100%', minHeight: '250px', height: '250px' }}>
        {dimensions.width > 0 && (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                stroke="#64748b"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#64748b"
                label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value.toFixed(2)} km`, 'Distance']}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="distance" name="Total Distance" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                <Cell fill="#f59e0b" />
                <Cell fill="#10b981" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Improvement:</span>
          <span className={`font-semibold ${improvement > 0 ? 'text-green-600' : 'text-slate-600'}`}>
            {improvement > 0 ? '-' : ''}{improvement.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-slate-600">Distance Saved:</span>
          <span className="font-semibold text-blue-600">
            {(baselineFitness - gwoFitness).toFixed(2)} km
          </span>
        </div>
      </div>
    </Card>
  );
}