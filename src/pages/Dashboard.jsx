import React, { useState } from 'react';
import { StatCard } from '../components/common/StatCard.jsx';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import { FloodMap } from '../components/map/FloodMap.jsx';
import { MapLegend } from '../components/map/MapLegend.jsx';
import { LayerControl } from '../components/map/LayerControl.jsx';
import { ForecastChart } from '../components/charts/ForecastChart.jsx';
import { ArrowUpRight, ExternalLink, Info, ShieldAlert } from 'lucide-react';

export const Dashboard = ({
  onNavigate,
  summary,
  timelineData,
}) => {
  const [layers, setLayers] = useState({
    showRiver: true,
    showInundation: true,
    showRiskZones: true,
    showRoads: false,
    showSettlements: true,
    showStations: true,
  });

  return (
    <div className="space-y-5">
      {/* Page Header Banner */}
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Flood Inundation Dashboard
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-medium">
              Operational View
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Monitor forecasted flood conditions and projected spatial inundation for {summary.locationName} ({summary.referenceRiver}).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Last Model Cycle: {summary.lastUpdated}</span>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="bg-amber-50 border border-amber-300 rounded p-3 text-xs text-amber-900 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="flex-1">
          <strong className="font-semibold">Hydrological Advisory: </strong>
          Projected river gauge level (8.42m) is approaching the critical danger threshold (8.50m) within the +6h to +12h window. Floodplain sectors in low-lying riparian reaches are anticipated to experience up to 2.8m water inundation depth.
        </div>
        <button
          onClick={() => onNavigate('forecast')}
          className="text-amber-800 hover:text-amber-950 font-semibold underline shrink-0 cursor-pointer"
        >
          View Timeline &rarr;
        </button>
      </div>

      {/* Four Core Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Forecast River Level */}
        <StatCard
          label="Forecast River Level"
          value={summary.riverLevelMeters}
          unit="m"
          contextTag="GAUGE +6H"
          highlight={summary.riverLevelMeters >= summary.warningLevelMeters ? 'warning' : 'default'}
          subtext={`Warning: ${summary.warningLevelMeters.toFixed(2)}m | Danger: ${summary.dangerLevelMeters.toFixed(2)}m`}
        />

        {/* 2. Predicted Flooded Area */}
        <StatCard
          label="Predicted Flooded Area"
          value={summary.predictedFloodedAreaKm2}
          unit="km²"
          contextTag="+24H HORIZON"
          highlight="info"
          subtext="Spatial surface water extent"
        />

        {/* 3. Maximum Water Depth */}
        <StatCard
          label="Maximum Water Depth"
          value={summary.maxWaterDepthMeters}
          unit="m"
          contextTag="PEAK LOCAL"
          highlight="danger"
          subtext="Estimated in low-elevation banks"
        />

        {/* 4. Risk Level */}
        <StatCard
          label="Risk Level"
          value=""
          contextTag="SYNTHETIC"
          highlight={summary.riskLevel === 'HIGH' || summary.riskLevel === 'VERY_HIGH' ? 'danger' : 'warning'}
          subtext="Civil protection threshold alert"
        >
          <div className="py-1">
            <RiskBadge level={summary.riskLevel} size="lg" />
          </div>
        </StatCard>
      </div>

      {/* Projected Inundation Map Section */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Projected Inundation
              </h2>
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Horizon: +24 hrs
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Spatial extent of projected flood submergence along the river channel
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('inundation-map')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded transition-colors cursor-pointer"
            >
              <span>Full GIS Inundation Workspace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="relative" style={{ height: '420px' }}>
          <FloodMap horizonHours={24} layers={layers} height="420px" />

          {/* Floating Legend on Map */}
          <div className="absolute top-3 right-3 z-1000 max-w-xs">
            <MapLegend isCompact={false} />
          </div>

          {/* Floating GIS Layer Quick Toggles */}
          <div className="absolute bottom-3 left-3 z-1000">
            <LayerControl layers={layers} onChange={setLayers} />
          </div>
        </div>
      </div>

      {/* Forecast Chart & Quick Summary Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ForecastChart data={timelineData} />
        </div>

        {/* Recent Prediction Summary Block */}
        <div className="bg-white border border-slate-200 rounded p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Recent Projection Summary
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                RUN-KR-842
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Monitored Reach:</span>
                <span className="font-semibold text-slate-900">Sector 4 (Urban Buffer)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">24h Peak Inundation Area:</span>
                <span className="font-mono font-bold text-slate-900">24.6 km²</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">High Risk Submergence:</span>
                <span className="font-mono text-red-700 font-semibold">7.8 km² (&gt;2.0m)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Moderate Risk Submergence:</span>
                <span className="font-mono text-amber-700 font-semibold">10.2 km² (1-2m)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Affected Settlement Wards:</span>
                <span className="font-mono font-bold text-slate-900">12 Wards</span>
              </div>
            </div>

            <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Simulated hydrological output. Ready for direct coupling with FastAPI and Fourier Neural Operator (FNO+) backend.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 mt-4 flex gap-2">
            <button
              onClick={() => onNavigate('prediction')}
              className="flex-1 py-2 px-3 text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded text-center transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span>Run Custom Prediction</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('analysis')}
              className="flex-1 py-2 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-center transition-colors cursor-pointer"
            >
              View Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
