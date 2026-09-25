import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  Map as MapIcon,
  Clock,
  BarChart3,
  Info,
  Waves,
} from 'lucide-react';

export const Sidebar = ({
  currentPage,
  onSelectPage,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'prediction', label: 'Flood Prediction', icon: BrainCircuit },
    { id: 'inundation-map', label: 'Inundation Map', icon: MapIcon, badge: 'GIS' },
    { id: 'forecast', label: 'Forecast Timeline', icon: Clock },
    { id: 'analysis', label: 'Analysis & Statistics', icon: BarChart3 },
    { id: 'about', label: 'About System', icon: Info },
  ];

  const handleNavClick = (id) => {
    onSelectPage(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header Branding */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-sky-700 flex items-center justify-center text-white shrink-0">
            <Waves className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight truncate leading-tight">
              FIPS HydroGIS
            </h1>
            <p className="text-[11px] text-slate-400 truncate">
              Flood Inundation Projection
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-2 overflow-y-auto">
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Main Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors text-left ${
                    isActive
                      ? 'bg-sky-900/60 text-sky-200 border-l-2 border-sky-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-sky-300' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isActive
                          ? 'bg-sky-800 text-sky-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Status Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60">
          <div className="text-[11px] font-medium text-slate-300 truncate">
            Flood Inundation Projection System
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-slate-400 font-mono">
                System Ready
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
              v1.0-mock
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
