import React from 'react';
import { Menu, MapPin, AlertTriangle, RefreshCw } from 'lucide-react';

export const Header = ({
  basins = [],
  selectedBasinId,
  onSelectBasin,
  onToggleMobileSidebar,
  onRefresh,
  isRefreshing = false,
  selectedLocation = null,
}) => {
  const selectedBasin = basins.find((b) => b.id === selectedBasinId) || basins[0];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Mobile menu toggle + Project context */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                Flood Inundation Projection System
              </h2>
              <span className="hidden lg:inline-flex text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Hydrological Monitoring
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
              AI-Based Flood Forecasting &amp; Spatial Inundation Analysis
            </p>
          </div>
        </div>

        {/* Right: Basin Selector & Operational Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Location Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-700 max-w-xs truncate">
            <MapPin className="w-3.5 h-3.5 text-sky-700 shrink-0" />
            <label htmlFor="basin-select" className="text-slate-500 font-medium shrink-0">
              Location:
            </label>
            <select
              id="basin-select"
              value={selectedBasinId}
              onChange={(e) => onSelectBasin(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer truncate"
            >
              {basins.map((basin) => (
                <option key={basin.id} value={basin.id}>
                  {basin.name} ({basin.riverName})
                </option>
              ))}
            </select>
          </div>

          {/* Alert Status Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-50 border border-orange-200 text-orange-800 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
            <span>Active Flood Advisory (+24h)</span>
          </div>

          {/* Refresh Action */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50"
              title="Refresh hydrological feeds"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
