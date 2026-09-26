import React, { useState, useEffect } from 'react';
import { FloodMap } from '../components/map/FloodMap.jsx';
import { MapLegend } from '../components/map/MapLegend.jsx';
import { LayerControl } from '../components/map/LayerControl.jsx';
import { StatCard } from '../components/common/StatCard.jsx';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import { floodService } from '../services/floodService.js';
import {
  Maximize2,
  Calendar,
  AlertTriangle,
  FileDown,
  Info,
  MapPin,
} from 'lucide-react';

export const InundationMap = ({
  basin,
  summary,
  selectedLocation,
  predictionResult,
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState(24);
  const [layers, setLayers] = useState({
    showRiver: true,
    showInundation: true,
    showRiskZones: true,
    showRoads: true,
    showSettlements: true,
    showStations: true,
  });

  const [backendGeoJson, setBackendGeoJson] = useState(
    predictionResult?.inundation?.geojson || null
  );

  // Attempt to query backend GET /api/inundation if location is set
  useEffect(() => {
    let isMounted = true;
    async function loadInundation() {
      if (selectedLocation?.latitude && selectedLocation?.longitude) {
        try {
          const res = await floodService.getInundation({
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            date: predictionResult?.date || new Date().toISOString().split('T')[0],
          });
          if (isMounted && res && res.geojson) {
            setBackendGeoJson(res.geojson);
          }
        } catch {
          // Keep default layers
        }
      }
    }
    loadInundation();
    return () => {
      isMounted = false;
    };
  }, [selectedLocation, predictionResult]);

  const horizons = [
    { value: 1, label: '+1h', area: '8.2 km²', maxDepth: '1.2m' },
    { value: 3, label: '+3h', area: '12.7 km²', maxDepth: '1.7m' },
    { value: 6, label: '+6h', area: '17.4 km²', maxDepth: '2.2m' },
    { value: 12, label: '+12h', area: '21.3 km²', maxDepth: '2.5m' },
    { value: 24, label: '+24h', area: '24.6 km²', maxDepth: '2.8m' },
  ];

  const currentHorizonInfo = horizons.find((h) => h.value === selectedHorizon) || horizons[4];

  // Map center: prefer user selected location if present, else basin center
  const mapCenter =
    selectedLocation?.latitude && selectedLocation?.longitude
      ? [selectedLocation.latitude, selectedLocation.longitude]
      : basin?.center || [16.518, 80.62];

  return (
    <div className="space-y-4">
      {/* Map Control Toolbar */}
      <div className="bg-white border border-slate-200 rounded p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Spatial Inundation Extent Map
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
              Interactive GIS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geospatial projection of water submergence boundaries across forecast horizons.
          </p>
        </div>

        {/* Location & Horizon selector buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedLocation && (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
              <MapPin className="w-3.5 h-3.5 text-sky-700" />
              <span className="font-semibold text-slate-800">{selectedLocation.name}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-700 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Horizon:</span>
            </span>
            {horizons.map((h) => {
              const isSelected = selectedHorizon === h.value;
              return (
                <button
                  key={h.value}
                  onClick={() => setSelectedHorizon(h.value)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors font-medium cursor-pointer ${
                    isSelected
                      ? 'bg-sky-700 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {h.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Map Container Area */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        {/* Sub-bar showing metrics for the chosen horizon */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-500">Selected Horizon: </span>
              <span className="font-bold text-slate-900">+{selectedHorizon} Hours</span>
            </div>
            <div className="h-3 w-px bg-slate-300 hidden sm:block" />
            <div>
              <span className="text-slate-500">Projected Inundation Footprint: </span>
              <span className="font-mono font-bold text-sky-700">{currentHorizonInfo.area}</span>
            </div>
            <div className="h-3 w-px bg-slate-300 hidden sm:block" />
            <div>
              <span className="text-slate-500">Peak Submergence Depth: </span>
              <span className="font-mono font-bold text-red-700">{currentHorizonInfo.maxDepth}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 hidden md:inline">
              Click polygons or settlement circles for localized depth details
            </span>
          </div>
        </div>

        {/* GIS Map Canvas with Floating Overlays */}
        <div className="relative" style={{ height: '580px' }}>
          <FloodMap
            horizonHours={selectedHorizon}
            layers={layers}
            center={mapCenter}
            zoom={selectedLocation ? 13 : basin?.zoom || 12}
            height="580px"
            selectedLocation={selectedLocation}
            predictionResult={predictionResult}
            inundationGeoJson={backendGeoJson}
          />

          {/* Floating Top Right: Map Legend */}
          <div className="absolute top-3 right-3 z-1000 max-w-xs pointer-events-auto">
            <MapLegend isCompact={false} />
          </div>

          {/* Floating Bottom Left: Layer Controls */}
          <div className="absolute bottom-3 left-3 z-1000 pointer-events-auto">
            <LayerControl layers={layers} onChange={setLayers} />
          </div>

          {/* Floating Bottom Right: Gauge / Prediction Warning Flag */}
          <div className="absolute bottom-3 right-3 z-1000 pointer-events-auto hidden sm:block">
            <div className="bg-white/95 border border-slate-300 rounded p-2 text-xs text-slate-700 shadow-xs backdrop-blur-xs flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
              <span className="font-semibold text-slate-800">
                {predictionResult
                  ? `Predicted Risk: ${predictionResult.risk_level} (${(predictionResult.flood_probability * 100).toFixed(0)}%)`
                  : 'Prakasam Gauge Level: 8.42m'}
              </span>
              <span className="text-red-700 font-mono text-[11px] font-bold">
                {predictionResult?.flood_occurred ? '(Flood Threat Active)' : '(Approaching 8.5m Danger)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Context Information & Evacuation Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 pb-1.5 border-b border-slate-100 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>High Risk Zone Evacuation Buffer</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Red-shaded zones represent water depths exceeding 2.0 meters with high velocity channel overflow. Emergency civil authorities advise evacuation of lowlands and riparian embankments.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 pb-1.5 border-b border-slate-100 mb-2">
            <Maximize2 className="w-4 h-4 text-sky-600" />
            <span>Spatial Model Methodology</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Hydrodynamic simulation represents inference from a 2D Fourier Neural Operator (FNO+) conditioned on upstream hydrographs, digital elevation models (DEM), and precipitation rasters.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 pb-1.5 border-b border-slate-100 mb-2">
            <Info className="w-4 h-4 text-slate-600" />
            <span>Integration with FastAPI Backend</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            GeoJSON layers are ready to be served dynamically via <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">GET /api/inundation</code> or direct <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">POST /api/predict</code> inundation payload.
          </p>
        </div>
      </div>
    </div>
  );
};
