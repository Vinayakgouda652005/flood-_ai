import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const FloodAreaChart = ({
  data,
  title = 'Projected Flooded Area vs Forecast Time',
  height = 260,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500">
          Spatial expansion of predicted water inundation footprint (km²)
        </p>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="timeOffset"
              tick={{ fontSize: 11, fill: '#64748b' }}
              stroke="#cbd5e1"
            />
            <YAxis
              domain={[0, 30]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              stroke="#cbd5e1"
              unit=" km²"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 text-white p-2 rounded text-xs shadow-md border border-slate-700">
                      <div className="font-semibold text-slate-300">{label}</div>
                      <div className="font-mono text-sky-400 font-bold">
                        Inundated Area: {payload[0].value} km²
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="floodedAreaKm2"
              name="Flooded Area"
              stroke="#0284c7"
              strokeWidth={2}
              fill="#bae6fd"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
