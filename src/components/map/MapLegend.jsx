import React from 'react';

export const MapLegend = ({
  className = '',
  isCompact = false,
}) => {
  return (
    <div
      className={`bg-white/95 border border-slate-300 rounded p-2.5 text-xs text-slate-700 shadow-xs backdrop-blur-xs ${className}`}
    >
      <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
        Map Legend
      </div>

      <div className={`space-y-1.5 ${isCompact ? 'grid grid-cols-2 gap-2 space-y-0' : ''}`}>
        {/* River */}
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-sky-600 rounded-xs shrink-0" />
          <span className="text-slate-700 font-medium">Main River Channel</span>
        </div>

        {/* Projected Inundation */}
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-sky-400/50 border border-sky-600 rounded-xs shrink-0" />
          <span className="text-slate-700">Projected Inundation</span>
        </div>

        {/* Moderate Risk */}
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-amber-400/50 border border-amber-600 rounded-xs shrink-0" />
          <span className="text-slate-700">Moderate Risk (1.0m – 2.0m)</span>
        </div>

        {/* High Risk */}
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-red-500/50 border border-red-700 rounded-xs shrink-0" />
          <span className="text-slate-700">High Risk (&gt; 2.0m)</span>
        </div>

        {/* Stations & Settlements */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-slate-800 bg-white shrink-0" />
          <span className="text-slate-700">Gauging Station</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-700 shrink-0" />
          <span className="text-slate-700">Monitored Settlement</span>
        </div>
      </div>
    </div>
  );
};
