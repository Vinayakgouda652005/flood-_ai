import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export const ForecastChart = ({
  data,
  title = 'Flood Level Forecast',
  showThresholds = true,
  height = 280,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500">
            Projected river hydrograph level (m) along main gauging cross-section
          </p>
        </div>

        {showThresholds && (
          <div className="flex items-center gap-3 text-xs text-slate-600 shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-amber-500" />
              <span>Warning (7.5m)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-red-600" />
              <span>Danger (8.5m)</span>
            </span>
          </div>
        )}
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
              domain={[6.5, 10.0]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              stroke="#cbd5e1"
              unit="m"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value;
                  return (
                    <div className="bg-slate-900 text-white p-2 rounded text-xs shadow-md border border-slate-700">
                      <div className="font-semibold text-slate-300 mb-0.5">{label}</div>
                      <div className="font-mono text-sky-400 font-bold">
                        River Level: {val} m
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Status:{' '}
                        {val >= 8.5
                          ? 'Critical Danger'
                          : val >= 7.5
                          ? 'Warning Level'
                          : 'Normal'}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {showThresholds && (
              <>
                <ReferenceLine
                  y={7.5}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Warning 7.5m',
                    position: 'insideTopRight',
                    fill: '#b45309',
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  y={8.5}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Danger 8.5m',
                    position: 'insideTopRight',
                    fill: '#b91c1c',
                    fontSize: 10,
                  }}
                />
              </>
            )}

            <Line
              type="monotone"
              dataKey="riverLevel"
              name="River Level (m)"
              stroke="#0284c7"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#0369a1', stroke: '#ffffff', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: '#0284c7' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
