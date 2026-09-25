import React from 'react';
import {
  BrainCircuit,
  Waves,
  Cpu,
  Layers,
  CheckCircle2,
  FileCode2,
  ArrowRight,
} from 'lucide-react';

export const About = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
            System Architecture &amp; Methodology
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Projection of River Inundation Extent via Deep Learning
        </h1>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          The Flood Inundation Projection System delivers spatial surface water extent and depth estimations corresponding to upstream river forecast hydrographs. This operational frontend interface is constructed for direct integration with an AI model service built using Fourier Neural Operators (FNO/FNO+) and Python/FastAPI.
        </p>
      </div>

      {/* System Flow Diagram Card */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-1">
          Core Hydrological Pipeline
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Data flow from river stage forecasts to spatial GIS flood maps:
        </p>

        <div className="space-y-3">
          {/* Step 1 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-start gap-3">
            <div className="w-6 h-6 rounded bg-sky-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              1
            </div>
            <div>
              <strong className="text-xs font-bold text-slate-900 block">
                Forecasted River &amp; Flood Inflow Information
              </strong>
              <p className="text-xs text-slate-600 mt-0.5">
                Catchment rainfall projections, upstream reservoir releases, and gauge stage observations (e.g. Prakasam Gauge, Vijayawada Bridge) enter as boundary conditions.
              </p>
            </div>
          </div>

          <div className="flex justify-center text-slate-400">
            <ArrowRight className="w-4 h-4 rotate-90" />
          </div>

          {/* Step 2 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-start gap-3">
            <div className="w-6 h-6 rounded bg-sky-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              2
            </div>
            <div>
              <strong className="text-xs font-bold text-slate-900 block">
                AI Flood Prediction Model (Fourier Neural Operator / FNO+)
              </strong>
              <p className="text-xs text-slate-600 mt-0.5">
                Fast surrogate neural operator solves 2D shallow water hydrodynamic equations across high-resolution DEM meshes in sub-second inference time, overcoming traditional hours-long numerical hydrodynamic solver delays.
              </p>
            </div>
          </div>

          <div className="flex justify-center text-slate-400">
            <ArrowRight className="w-4 h-4 rotate-90" />
          </div>

          {/* Step 3 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-start gap-3">
            <div className="w-6 h-6 rounded bg-sky-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              3
            </div>
            <div>
              <strong className="text-xs font-bold text-slate-900 block">
                Future Water Depth &amp; Inundation Extent Projection
              </strong>
              <p className="text-xs text-slate-600 mt-0.5">
                Spatio-temporal water depth rasters are converted into continuous inundation polygons, depth contour rings, and maximum depth statistics for +1h, +3h, +6h, +12h, and +24h horizons.
              </p>
            </div>
          </div>

          <div className="flex justify-center text-slate-400">
            <ArrowRight className="w-4 h-4 rotate-90" />
          </div>

          {/* Step 4 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-start gap-3">
            <div className="w-6 h-6 rounded bg-sky-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              4
            </div>
            <div>
              <strong className="text-xs font-bold text-slate-900 block">
                Flood Risk Classification &amp; Interactive GIS Map Presentation
              </strong>
              <p className="text-xs text-slate-600 mt-0.5">
                The frontend translates raw depth arrays into actionable civil protection outputs: low/moderate/high risk polygons, settlement submergence alerts, and interactive Leaflet GIS visualization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Integration Contract Specification */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-3">
          <FileCode2 className="w-4 h-4 text-sky-700" />
          <h2 className="text-sm font-bold text-slate-900">
            FastAPI Backend Coupling Specification
          </h2>
        </div>

        <p className="text-xs text-slate-600 mb-3">
          The frontend is architecturally decoupled into a standalone service module (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">src/services/floodService.js</code>). Connecting the Python backend requires only changing the simulated calls to actual <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">fetch()</code> or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">axios</code> endpoints:
        </p>

        <div className="bg-slate-900 text-slate-200 p-3.5 rounded text-xs font-mono overflow-x-auto">
          <pre className="text-slate-300">{`# Expected FastAPI Endpoint Contracts:

POST /api/v1/predict
Request:
{
  "location_id": "basin-krishna-lower",
  "forecast_river_level": 8.42,
  "rainfall": 125.0,
  "forecast_duration_hours": 24,
  "initial_water_condition": "Elevated"
}

Response:
{
  "prediction_id": "PRD-2026-0901",
  "projected_flooded_area_km2": 24.6,
  "max_depth_meters": 2.8,
  "avg_depth_meters": 1.4,
  "risk_level": "HIGH",
  "inundation_geojson": { "type": "FeatureCollection", ... },
  "timeline": [ ... ]
}`}</pre>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-2">
            <Cpu className="w-4 h-4 text-sky-700" />
            <span>Why Fourier Neural Operators (FNO+)?</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Standard 2D hydrodynamic models (e.g. HEC-RAS, TELEMAC-2D) take multiple hours to compute flood inundation over complex topography. Fourier Neural Operators learn the solution operator for the shallow-water partial differential equations directly, enabling millisecond-speed inference suitable for real-time early warning.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-2">
            <Layers className="w-4 h-4 text-sky-700" />
            <span>GIS &amp; Multi-Horizon Visualization</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The frontend provides interactive timeline switching across +1h, +3h, +6h, +12h, and +24h time-steps. Users can inspect river centerlines, hazard depth zones, settlement markers, and road networks directly on OpenStreetMap tiles with zero visual clutter.
          </p>
        </div>
      </div>
    </div>
  );
};
