import React, { useState, useEffect } from 'react';
import { ForecastChart } from '../components/charts/ForecastChart.jsx';
import { RainfallChart } from '../components/charts/RainfallChart.jsx';
import { FloodAreaChart } from '../components/charts/FloodAreaChart.jsx';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import { StatCard } from '../components/common/StatCard.jsx';
import { floodService } from '../services/floodService.js';
import {
  Clock,
  Waves,
  CloudRain,
  Maximize2,
  Calendar,
  AlertCircle,
  MapPin,
  HelpCircle,
} from 'lucide-react';

const formatHumanDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const Forecast = ({
  timelineData = [],
  summary,
  selectedLocation,
  selectedDate,
}) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState(2); // default to +6 hr
  const [activeTimeline, setActiveTimeline] = useState(timelineData);

  // Attempt backend GET /api/forecast if endpoint exists
  useEffect(() => {
    let isMounted = true;
    async function fetchBackendForecast() {
      if (selectedLocation?.latitude && selectedLocation?.longitude && selectedDate) {
        try {
          const backendData = await floodService.getForecast({
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            date: selectedDate,
          });
          if (isMounted && backendData && Array.isArray(backendData.timeSteps)) {
            setActiveTimeline(backendData.timeSteps);
          }
        } catch {
          // Keep baseline data
        }
      }
    }
    fetchBackendForecast();
    return () => {
      isMounted = false;
    };
  }, [selectedLocation, selectedDate]);

  useEffect(() => {
    if (timelineData && timelineData.length > 0) {
      setActiveTimeline(timelineData);
    }
  }, [timelineData]);

  const activePoint = activeTimeline[selectedPointIndex] || activeTimeline[0] || {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-700" />
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Forecast Timeline &amp; Hydrograph
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Temporal trajectory of river stage, rainfall, and spatial flood expansion over a 24-hour forecast cycle.
          </p>
        </div>

        {/* Selected Location & Date Context Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-sky-50 border border-sky-200 rounded px-2.5 py-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-sky-700" />
            <span>
              {selectedLocation?.name || summary?.locationName || 'Monitored Reach'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {selectedDate ? formatHumanDate(selectedDate) : 'Today'}
            </span>
          </div>
        </div>
      </div>

      {/* Backend API Integration Banner */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-sky-700 shrink-0" />
          <span>
            <strong>Forecast API Contract:</strong> Structured to receive dynamic hydrographs from <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-300">GET /api/forecast?latitude={selectedLocation?.latitude || '16.51'}&amp;longitude={selectedLocation?.longitude || '80.62'}&amp;date={selectedDate || '2026-09-25'}</code>.
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded shrink-0 font-bold">
          Backend Ready
        </span>
      </div>

      {/* Horizon Slider / Interactive Step Selector */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Select Horizon Time-Step:
          </span>
          <span className="text-xs font-mono font-bold text-sky-800 bg-sky-50 border border-sky-200 rounded px-2 py-0.5">
            Active: {activePoint?.timeOffset} (+{activePoint?.hours} hrs)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {activeTimeline.map((pt, idx) => {
            const isSelected = selectedPointIndex === idx;
            return (
              <button
                key={pt.hours || idx}
                onClick={() => setSelectedPointIndex(idx)}
                className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sky-600 bg-sky-50/70 shadow-xs ring-1 ring-sky-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900">{pt.timeOffset}</span>
                  <RiskBadge level={pt.riskLevel} size="sm" showIndicator={false} />
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Level:</span>
                    <strong className="font-mono text-slate-800">{pt.riverLevel}m</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Extent:</span>
                    <span className="font-mono text-slate-700">{pt.floodedAreaKm2} km²</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Step Stat Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Projected River Level"
          value={activePoint?.riverLevel}
          unit="m"
          contextTag={activePoint?.timeOffset}
          highlight={activePoint?.riverLevel >= 8.5 ? 'danger' : activePoint?.riverLevel >= 7.5 ? 'warning' : 'default'}
          subtext={activePoint?.riverLevel >= 8.5 ? 'Above 8.50m Danger Mark' : 'Above 7.50m Warning Level'}
        />

        <StatCard
          label="Cumulative Rainfall"
          value={activePoint?.rainfall}
          unit="mm"
          contextTag="CATCHMENT"
          highlight="info"
          subtext="Ensemble rainfall accumulation"
        />

        <StatCard
          label="Projected Inundation Extent"
          value={activePoint?.floodedAreaKm2}
          unit="km²"
          contextTag="SURFACE AREA"
          subtext="Continuous flood footprint"
        />

        <StatCard
          label="Peak Water Depth"
          value={activePoint?.maxDepth}
          unit="m"
          contextTag="LOCAL MAX"
          highlight={activePoint?.maxDepth >= 2.0 ? 'danger' : 'warning'}
          subtext={`Average water depth: ${activePoint?.avgDepth} m`}
        />
      </div>

      {/* Charts Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ForecastChart data={activeTimeline} title="River Gauge Level Projection vs Time" />
        <FloodAreaChart data={activeTimeline} title="Predicted Inundation Extent Expansion (km²)" />
      </div>

      <div>
        <RainfallChart data={activeTimeline} title="Forecasted Cumulative Catchment Rainfall (mm)" />
      </div>

      {/* Hydrograph Details Table */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Detailed Forecast Horizon Hydrograph Table
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Horizon</th>
                <th className="py-2.5 px-3">River Stage (m)</th>
                <th className="py-2.5 px-3">Gauge Status</th>
                <th className="py-2.5 px-3">Rainfall (mm)</th>
                <th className="py-2.5 px-3">Inundation (km²)</th>
                <th className="py-2.5 px-3">Max Depth (m)</th>
                <th className="py-2.5 px-3">Avg Depth (m)</th>
                <th className="py-2.5 px-3">Risk Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTimeline.map((row, idx) => (
                <tr
                  key={row.hours || idx}
                  className={`hover:bg-slate-50 ${
                    activePoint?.hours === row.hours ? 'bg-sky-50/50 font-medium' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{row.timeOffset}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-sky-800">{row.riverLevel} m</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        row.riverLevel >= 8.5
                          ? 'bg-red-100 text-red-800'
                          : row.riverLevel >= 7.5
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {row.riverLevel >= 8.5 ? 'CRITICAL DANGER' : row.riverLevel >= 7.5 ? 'WARNING' : 'NORMAL'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">{row.rainfall} mm</td>
                  <td className="py-2.5 px-3 font-mono font-bold">{row.floodedAreaKm2} km²</td>
                  <td className="py-2.5 px-3 font-mono text-red-700 font-semibold">{row.maxDepth} m</td>
                  <td className="py-2.5 px-3 font-mono">{row.avgDepth} m</td>
                  <td className="py-2.5 px-3">
                    <RiskBadge level={row.riskLevel} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
