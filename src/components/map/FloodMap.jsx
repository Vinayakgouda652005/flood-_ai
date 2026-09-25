import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
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
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);

  return null;
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
}) => {
  const validHorizon = [1, 3, 6, 12, 24].includes(horizonHours) ? horizonHours : 24;
  const polygons = INUNDATION_POLYGONS[validHorizon] || INUNDATION_POLYGONS[24];

  return (
    <div className="w-full relative overflow-hidden bg-slate-100 border border-slate-300 rounded" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        className="w-full h-full"
      >
        <MapEffectController center={center} zoom={zoom} />

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
      </MapContainer>
    </div>
  );
};
