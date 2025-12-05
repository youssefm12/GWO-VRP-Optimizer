import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../ui/card';
import { useMemo, useState, useEffect, useRef } from 'react';

interface ConvergenceChartProps {
  data: { iteration: number; fitness: number }[];
}

export function ConvergenceChart({ data }: ConvergenceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 250 });

  // Memoize the chart data to prevent infinite re-renders
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(d => ({
      iteration: d.iteration,
      fitness: parseFloat(d.fitness.toFixed(2))
    }));
  }, [data]);

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

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-slate-900">Convergence Chart</h3>
        <p className="text-slate-500 text-sm">Best fitness over iterations</p>
      </div>

      <div ref={containerRef} style={{ width: '100%', minHeight: '250px', height: '250px' }}>
        {dimensions.width > 0 && (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="iteration"
                tick={{ fontSize: 12 }}
                stroke="#64748b"
                label={{ value: 'Iteration', position: 'insideBottom', offset: -5, fontSize: 12 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#64748b"
                label={{ value: 'Fitness (km)', angle: -90, position: 'insideLeft', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value.toFixed(2)} km`, 'Fitness']}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="fitness"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
                activeDot={{ r: 5 }}
                name="Best Fitness"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}