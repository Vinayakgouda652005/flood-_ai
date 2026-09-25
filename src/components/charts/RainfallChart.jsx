import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const RainfallChart = ({
  data,
  title = 'Forecasted Cumulative Rainfall',
  height = 240,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500">
          Ensemble meteorological catchment precipitation (mm)
        </p>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
              tick={{ fontSize: 11, fill: '#64748b' }}
              stroke="#cbd5e1"
              unit=" mm"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 text-white p-2 rounded text-xs shadow-md border border-slate-700">
                      <div className="font-semibold text-slate-300">{label}</div>
                      <div className="font-mono text-sky-400 font-bold">
                        Rainfall: {payload[0].value} mm
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="rainfall"
              name="Rainfall (mm)"
              fill="#0284c7"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
