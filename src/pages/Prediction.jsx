import React, { useState } from 'react';
import { floodService } from '../services/floodService.js';
import { StatCard } from '../components/common/StatCard.jsx';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import {
  BrainCircuit,
  Map as MapIcon,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const Prediction = ({
  basins = [],
  onNavigate,
  onPredictionCompleted,
  lastResult,
}) => {
  const [params, setParams] = useState({
    locationId: basins[0]?.id || 'basin-krishna-lower',
    forecastRiverLevel: 8.42,
    rainfall: 125,
    forecastDurationHours: 24,
    initialWaterCondition: 'Elevated',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(lastResult);
  const [hasRun, setHasRun] = useState(!!lastResult);

  const handleRunPrediction = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const pred = await floodService.runPrediction(params);
      setResult(pred);
      setHasRun(true);
      if (onPredictionCompleted) {
        onPredictionCompleted(pred);
      }
    } catch (err) {
      console.error('Prediction simulation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setParams({
      locationId: basins[0]?.id || 'basin-krishna-lower',
      forecastRiverLevel: 8.42,
      rainfall: 125,
      forecastDurationHours: 24,
      initialWaterCondition: 'Elevated',
    });
  };

  const selectedBasin = basins.find((b) => b.id === params.locationId) || basins[0];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          Flood Prediction
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Enter forecast information to generate a projected inundation map.
        </p>
      </div>

      {/* Main Grid: Form on Left, Output on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Form Column */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-sky-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Forecast Input Parameters
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Model: FNO+ proxy
            </span>
          </div>

          <form onSubmit={handleRunPrediction} className="space-y-4">
            {/* Location Selector */}
            <div>
              <label
                htmlFor="pred-location"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Target River Reach / Basin Location
              </label>
              <select
                id="pred-location"
                value={params.locationId}
                onChange={(e) =>
                  setParams({ ...params, locationId: e.target.value })
                }
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-hidden focus:border-sky-600 font-medium"
              >
                {basins.map((basin) => (
                  <option key={basin.id} value={basin.id}>
                    {basin.name} — {basin.riverName}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Ref Gauge Station: {selectedBasin?.referenceStation}
              </p>
            </div>

            {/* Forecast River Level */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="pred-river-level"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Forecast River Level
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Range: 4.0m – 12.0m
                </span>
              </div>
              <div className="relative">
                <input
                  id="pred-river-level"
                  type="number"
                  step="0.05"
                  min="3.0"
                  max="15.0"
                  value={params.forecastRiverLevel}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      forecastRiverLevel: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 pr-10 focus:outline-hidden focus:border-sky-600"
                />
                <span className="absolute right-3 top-2 text-xs font-semibold text-slate-500">
                  m
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Warning threshold: 7.50m | Danger threshold: 8.50m
              </p>
            </div>

            {/* Forecast Rainfall */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="pred-rainfall"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Rainfall (Catchment Accumulated)
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Range: 0 – 350 mm
                </span>
              </div>
              <div className="relative">
                <input
                  id="pred-rainfall"
                  type="number"
                  step="5"
                  min="0"
                  max="500"
                  value={params.rainfall}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      rainfall: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 pr-12 focus:outline-hidden focus:border-sky-600"
                />
                <span className="absolute right-3 top-2 text-xs font-semibold text-slate-500">
                  mm
                </span>
              </div>
            </div>

            {/* Forecast Duration & Initial Water Condition in 2 cols */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="pred-duration"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Forecast Duration
                </label>
                <select
                  id="pred-duration"
                  value={params.forecastDurationHours}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      forecastDurationHours: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-800 focus:outline-hidden focus:border-sky-600"
                >
                  <option value={6}>6 Hours</option>
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours</option>
                  <option value={48}>48 Hours</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="pred-condition"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Initial Water Condition
                </label>
                <select
                  id="pred-condition"
                  value={params.initialWaterCondition}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      initialWaterCondition: e.target.value,
                    })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-800 focus:outline-hidden focus:border-sky-600"
                >
                  <option value="Normal">Normal</option>
                  <option value="Elevated">Elevated</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-sky-400 rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing Model Projection...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Flood Projection</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="p-2.5 rounded border border-slate-300 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Reset to default sample values"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Architecture note */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500">
            <HelpCircle className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
            <span>
              <strong>Future Integration Note:</strong> Triggering &quot;Run Flood Projection&quot; executes <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">floodService.runPrediction()</code>. In the full stack deployment, this calls <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">POST /predict</code> on the FastAPI server hosting the Fourier Neural Operator.
            </span>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-6 flex flex-col">
          {hasRun && result ? (
            <div className="bg-white border border-slate-200 rounded p-5 shadow-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Prediction Complete
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    ID: {result.id}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 mb-4">
                  <div className="font-semibold text-slate-900 mb-1">
                    Simulation Horizon: {result.forecastDurationHours} Hours
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Inputs evaluated: {result.parameters?.forecastRiverLevel}m river stage, {result.parameters?.rainfall}mm rainfall, initial {String(result.parameters?.initialWaterCondition || '').toLowerCase()} baseflow.
                  </p>
                </div>

                {/* 4 Stat Cards for Output */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <StatCard
                    label="Projected Flooded Area"
                    value={result.projectedFloodedAreaKm2}
                    unit="km²"
                    highlight="info"
                  />
                  <StatCard
                    label="Maximum Depth"
                    value={result.maxDepthMeters}
                    unit="m"
                    highlight="danger"
                  />
                  <StatCard
                    label="Average Water Depth"
                    value={result.avgDepthMeters}
                    unit="m"
                  />
                  <StatCard label="Overall Risk" value="">
                    <div className="py-1">
                      <RiskBadge level={result.riskLevel} size="md" />
                    </div>
                  </StatCard>
                </div>

                {/* Risk Sub-distribution */}
                <div className="p-3 bg-white border border-slate-200 rounded text-xs space-y-1.5 mb-4">
                  <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                    Sub-Reach Impact Breakdown
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>High Risk Depth (&gt;2.0m):</span>
                    <span className="font-mono text-red-700 font-bold">{result.highRiskAreaKm2} km²</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Moderate Risk Depth (1.0–2.0m):</span>
                    <span className="font-mono text-amber-700 font-semibold">{result.moderateRiskAreaKm2} km²</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Low Risk Buffer (&lt;1.0m):</span>
                    <span className="font-mono text-emerald-700 font-semibold">{result.lowRiskAreaKm2} km²</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-100">
                    <span>Affected Settlement Zones:</span>
                    <span className="font-mono text-slate-900 font-bold">{result.affectedLocationsCount} zones</span>
                  </div>
                </div>
              </div>

              {/* View Map Action Button */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => onNavigate('inundation-map')}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <MapIcon className="w-4 h-4" />
                  <span>View Inundation Map</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded p-8 flex-1 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                No Prediction Generated Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Configure the forecast river level, catchment rainfall, and simulation horizon on the left, then click &quot;Run Flood Projection&quot;.
              </p>
              <span className="text-[11px] font-mono px-2 py-1 bg-white border border-slate-200 rounded text-slate-600">
                Ready for parameters
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
