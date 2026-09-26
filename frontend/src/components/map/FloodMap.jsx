import React, { useEffect } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
  GeoJSON,
  Marker,
} from 'react-leaflet';
import {
  RIVER_CENTERLINE,
  INUNDATION_POLYGONS,
  SETTLEMENT_MARKERS,
  ROAD_SEGMENTS,
  HYDRO_STATIONS,
} from '../../data/mockData.js';

// Helper to trigger invalidateSize when map loads or horizon/center changes
const MapEffectController = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    // Slight delay to ensure DOM container size has settled
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);

  return null;
};

// Create custom DOM icon for selected user location
const createSelectedLocationIcon = (isHighRisk = false) => {
  const bgColor = isHighRisk ? '#dc2626' : '#0284c7';
  const pulseColor = isHighRisk ? 'rgba(239, 68, 68, 0.4)' : 'rgba(14, 165, 233, 0.4)';

  return L.divIcon({
    className: 'selected-location-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; margin-left: -10px; margin-top: -10px;">
        <span style="position: absolute; width: 40px; height: 40px; border-radius: 9999px; background-color: ${pulseColor}; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; z-index: 10; width: 34px; height: 34px; border-radius: 9999px; background: ${bgColor}; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3" fill="white"></circle>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 40],
    popupAnchor: [0, -36],
  });
};

export const FloodMap = ({
  horizonHours = 24,
  layers = {
    showRiver: true,
    showInundation: true,
    showRiskZones: true,
    showRoads: true,
    showSettlements: true,
    showStations: true,
  },
  center = [16.518, 80.620],
  zoom = 12,
  height = '100%',
  interactive = true,
  selectedLocation = null,
  predictionResult = null,
  inundationGeoJson = null,
}) => {
  const validHorizon = [1, 3, 6, 12, 24].includes(horizonHours) ? horizonHours : 24;
  const polygons = INUNDATION_POLYGONS[validHorizon] || INUNDATION_POLYGONS[24];

  // Determine effective center
  const effectiveCenter =
    selectedLocation?.latitude && selectedLocation?.longitude
      ? [selectedLocation.latitude, selectedLocation.longitude]
      : center;

  const isHighRisk =
    predictionResult?.risk_level === 'HIGH' ||
    predictionResult?.risk_level === 'VERY_HIGH';

  return (
    <div className="w-full relative overflow-hidden bg-slate-100 border border-slate-300 rounded" style={{ height }}>
      <MapContainer
        center={effectiveCenter}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        className="w-full h-full"
      >
        <MapEffectController center={effectiveCenter} zoom={zoom} />

        {/* Base Map: OpenStreetMap Carto style */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />

        {/* 1. Road Infrastructure Layer */}
        {layers.showRoads &&
          ROAD_SEGMENTS.map((road, idx) => (
            <Polyline
              key={`road-${idx}`}
              positions={road}
              pathOptions={{
                color: '#64748b',
                weight: 3,
                dashArray: '4, 6',
                opacity: 0.75,
              }}
            >
              <Tooltip sticky>Transport Arterial Corridor</Tooltip>
            </Polyline>
          ))}

        {/* 2. Projected Flood Inundation Polygon */}
        {layers.showInundation &&
          polygons.waterExtent.map((ring, idx) => (
            <Polygon
              key={`inundation-${validHorizon}-${idx}`}
              positions={ring}
              pathOptions={{
                color: '#0284c7',
                fillColor: '#38bdf8',
                fillOpacity: 0.38,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="font-sans">
                  <strong className="block text-slate-900 border-b border-slate-200 pb-1 mb-1">
                    Projected Inundation Extent (+{validHorizon}h)
                  </strong>
                  <div className="text-slate-600 text-xs">
                    Submergence probability: &gt; 85%<br />
                    Hydro Model: FNO+ Neural Operator (Simulated)
                  </div>
                </div>
              </Popup>
            </Polygon>
          ))}

        {/* 3. Moderate Risk Zones */}
        {layers.showRiskZones &&
          polygons.moderateRisk.map((ring, idx) => (
            <Polygon
              key={`mod-risk-${validHorizon}-${idx}`}
              positions={ring}
              pathOptions={{
                color: '#d97706',
                fillColor: '#f59e0b',
                fillOpacity: 0.45,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="font-sans">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold mb-1">
                    MODERATE RISK ZONE
                  </span>
                  <p className="text-xs text-slate-700">
                    Depth range: 1.0m – 2.0m<br />
                    Precautionary evacuation recommended for ground floor dwellings.
                  </p>
                </div>
              </Popup>
            </Polygon>
          ))}

        {/* 4. High Risk Zones */}
        {layers.showRiskZones &&
          polygons.highRisk.map((ring, idx) => (
            <Polygon
              key={`high-risk-${validHorizon}-${idx}`}
              positions={ring}
              pathOptions={{
                color: '#b91c1c',
                fillColor: '#ef4444',
                fillOpacity: 0.55,
                weight: 2,
              }}
            >
              <Popup>
                <div className="font-sans">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold mb-1">
                    HIGH RISK ZONE (CRITICAL)
                  </span>
                  <p className="text-xs text-slate-700">
                    Depth: &gt; 2.0m (Max 2.8m)<br />
                    Severe velocity &amp; inundation threat. Immediate evacuation priority.
                  </p>
                </div>
              </Popup>
            </Polygon>
          ))}

        {/* 5. Main River Centerline */}
        {layers.showRiver && (
          <Polyline
            positions={RIVER_CENTERLINE}
            pathOptions={{
              color: '#0369a1',
              weight: 4.5,
              opacity: 0.9,
            }}
          >
            <Tooltip sticky>Krishna River — Main Channel</Tooltip>
          </Polyline>
        )}

        {/* 6. Settlement & Infrastructure Points */}
        {layers.showSettlements &&
          SETTLEMENT_MARKERS.map((loc) => {
            const isHigh = loc.risk === 'HIGH';
            return (
              <CircleMarker
                key={loc.id}
                center={[loc.lat, loc.lng]}
                radius={isHigh ? 7 : 5.5}
                pathOptions={{
                  color: isHigh ? '#991b1b' : '#b45309',
                  fillColor: isHigh ? '#dc2626' : '#f59e0b',
                  fillOpacity: 0.9,
                  weight: 1.5,
                }}
              >
                <Tooltip direction="top" offset={[0, -5]}>
                  <div className="font-semibold text-xs text-slate-900">{loc.name}</div>
                  <div className="text-[11px] text-slate-600">
                    Depth: {loc.depth} m | {loc.risk} Risk
                  </div>
                </Tooltip>
                <Popup>
                  <div className="font-sans min-w-[170px]">
                    <div className="font-bold text-slate-900 text-xs">{loc.name}</div>
                    <div className="text-[11px] text-slate-500 mb-1.5">{loc.type}</div>
                    <div className="space-y-1 text-xs text-slate-700 border-t border-slate-200 pt-1.5">
                      <div className="flex justify-between">
                        <span>Projected Depth:</span>
                        <strong className="font-mono text-red-700">{loc.depth} m</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Classification:</span>
                        <span className="font-bold text-xs">{loc.risk}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Civil Status:</span>
                        <span className="font-medium text-slate-800">{loc.status}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* 7. Hydrological Gauging Stations */}
        {layers.showStations &&
          HYDRO_STATIONS.map((stn) => {
            const isCritical = stn.status === 'critical';
            const isWarning = stn.status === 'warning';
            const markerColor = isCritical ? '#dc2626' : isWarning ? '#d97706' : '#2563eb';

            return (
              <CircleMarker
                key={stn.id}
                center={[stn.lat, stn.lng]}
                radius={6.5}
                pathOptions={{
                  color: '#0f172a',
                  fillColor: markerColor,
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Tooltip direction="right" offset={[6, 0]}>
                  <span className="font-mono font-semibold">{stn.name}</span>: {stn.currentLevel}m
                </Tooltip>
                <Popup>
                  <div className="font-sans min-w-[190px]">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200 mb-1.5">
                      <strong className="text-slate-900 text-xs">{stn.name}</strong>
                      <span className="font-mono text-[10px] text-slate-500">{stn.code}</span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-700">
                      <div className="flex justify-between">
                        <span>Current Water Level:</span>
                        <strong className="font-mono text-slate-900">{stn.currentLevel} m</strong>
                      </div>
                      <div className="flex justify-between text-amber-700">
                        <span>Warning Level:</span>
                        <span className="font-mono">{stn.warningLevel} m</span>
                      </div>
                      <div className="flex justify-between text-red-700">
                        <span>Danger Mark:</span>
                        <span className="font-mono font-bold">{stn.dangerLevel} m</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100">
                        <span>Threshold Status:</span>
                        <span
                          className={`font-semibold uppercase text-[10px] px-1.5 py-0.2 rounded ${
                            isCritical
                              ? 'bg-red-100 text-red-800'
                              : isWarning
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {stn.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* 8. Backend-provided dynamic Inundation GeoJSON (if returned by API) */}
        {inundationGeoJson && (
          <GeoJSON
            key={JSON.stringify(inundationGeoJson).length}
            data={inundationGeoJson}
            style={() => ({
              color: '#dc2626',
              weight: 2,
              fillColor: '#ef4444',
              fillOpacity: 0.45,
            })}
          />
        )}

        {/* 9. Selected Location Marker (User Chosen / Geolocation) */}
        {selectedLocation?.latitude && selectedLocation?.longitude && (
          <Marker
            position={[selectedLocation.latitude, selectedLocation.longitude]}
            icon={createSelectedLocationIcon(isHighRisk)}
          >
            <Tooltip direction="top" offset={[0, -28]} permanent>
              <div className="font-bold text-xs text-slate-900">
                📍 {selectedLocation.name || 'Selected Location'}
              </div>
            </Tooltip>
            <Popup>
              <div className="font-sans min-w-[210px]">
                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 mb-2">
                  <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                  <strong className="text-slate-900 text-xs">
                    {selectedLocation.name || 'Selected Prediction Location'}
                  </strong>
                </div>
                <div className="space-y-1 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Latitude:</span>
                    <strong className="font-mono text-slate-900">
                      {Number(selectedLocation.latitude).toFixed(4)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Longitude:</span>
                    <strong className="font-mono text-slate-900">
                      {Number(selectedLocation.longitude).toFixed(4)}
                    </strong>
                  </div>
                  {predictionResult && (
                    <div className="pt-2 mt-2 border-t border-slate-200 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Risk Assessment:</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          isHighRisk
                            ? 'bg-red-100 text-red-800'
                            : predictionResult.risk_level === 'MODERATE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {predictionResult.risk_level}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Flood Probability:</span>
                        <strong className="font-mono text-sky-800 font-bold">
                          {(predictionResult.flood_probability * 100).toFixed(0)}%
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-semibold text-slate-900">
                          {predictionResult.flood_occurred ? 'Flood Risk Detected' : 'Minimal Flood Risk'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
