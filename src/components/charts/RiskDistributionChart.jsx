import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const RiskDistributionChart = ({
  highRiskKm2,
  moderateRiskKm2,
  lowRiskKm2,
  height = 240,
}) => {
  const data = [
    { name: 'High Risk (> 2.0m)', area: highRiskKm2, color: '#dc2626' },
    { name: 'Moderate Risk (1.0-2.0m)', area: moderateRiskKm2, color: '#f59e0b' },
    { name: 'Low Risk (< 1.0m)', area: lowRiskKm2, color: '#10b981' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Risk-Area Classification Distribution
        </h3>
        <p className="text-xs text-slate-500">
          Spatial extent partition by hydrological hazard depth criteria
        </p>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 25, left: 40, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#64748b' }}
              stroke="#cbd5e1"
              unit=" km²"
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#334155' }}
              stroke="#cbd5e1"
              width={140}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 text-white p-2 rounded text-xs shadow-md border border-slate-700">
                      <div className="font-semibold text-slate-300">
                        {payload[0].payload.name}
                      </div>
                      <div className="font-mono text-sky-400 font-bold mt-0.5">
                        Area: {payload[0].value} km²
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="area" radius={[0, 3, 3, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
