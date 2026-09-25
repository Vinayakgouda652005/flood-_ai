import React from 'react';
import { Layers } from 'lucide-react';

export const LayerControl = ({
  layers,
  onChange,
  className = '',
}) => {
  const toggleLayer = (key) => {
    onChange({
      ...layers,
      [key]: !layers[key],
    });
  };

  const layerItems = [
    { key: 'showRiver', label: 'River Centerline', color: 'text-sky-600' },
    { key: 'showInundation', label: 'Inundation Extent', color: 'text-sky-500' },
    { key: 'showRiskZones', label: 'Risk Zones (Depth)', color: 'text-orange-600' },
    { key: 'showRoads', label: 'Transport Arterials', color: 'text-slate-500' },
    { key: 'showSettlements', label: 'Settlements & Wards', color: 'text-slate-800' },
    { key: 'showStations', label: 'Gauging Stations', color: 'text-blue-700' },
  ];

  return (
    <div
      className={`bg-white/95 border border-slate-300 rounded p-2.5 text-xs text-slate-700 shadow-xs backdrop-blur-xs ${className}`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
        <Layers className="w-3.5 h-3.5 text-slate-500" />
        <span>GIS Layers</span>
      </div>

      <div className="space-y-1.5">
        {layerItems.map((item) => (
          <label
            key={item.key}
            className="flex items-center gap-2 cursor-pointer hover:text-slate-900 select-none"
          >
            <input
              type="checkbox"
              checked={!!layers[item.key]}
              onChange={() => toggleLayer(item.key)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-sky-700 focus:ring-sky-500 cursor-pointer"
            />
            <span className="font-medium">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
