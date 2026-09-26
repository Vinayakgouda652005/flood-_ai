import React, { useState } from 'react';
import { RiskDistributionChart } from '../components/charts/RiskDistributionChart.jsx';
import { StatCard } from '../components/common/StatCard.jsx';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import { AFFECTED_LOCATIONS, HYDRO_STATIONS } from '../data/mockData.js';
import {
  BarChart3,
  ShieldAlert,
  Building2,
  Users,
  Layers,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export const Analysis = ({
  summary,
}) => {
  const [filterRisk, setFilterRisk] = useState('ALL');

  const filteredLocations = AFFECTED_LOCATIONS.filter((loc) => {
    if (filterRisk === 'ALL') return true;
    return loc.risk === filterRisk;
  });

  const totalPopAtRisk = AFFECTED_LOCATIONS.reduce(
    (acc, cur) => acc + (cur.populationAtRisk || 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-700" />
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Risk &amp; Impact Analysis
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Hydrological hazard exposure assessment, civil vulnerability, and monitored gauge stations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono">
            Sector 4 Assessment
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Estimated Pop. at Risk"
          value={totalPopAtRisk.toLocaleString()}
          unit="residents"
          highlight="danger"
          contextTag="CIVIL SAFETY"
          subtext="Across 3 high-vulnerability settlements"
        />

        <StatCard
          label="High Hazard Submergence"
          value={summary.highRiskAreaKm2}
          unit="km²"
          highlight="danger"
          contextTag="> 2.0m DEPTH"
          subtext="Impassable for vehicular evacuation"
        />

        <StatCard
          label="Moderate Hazard Submergence"
          value={summary.moderateRiskAreaKm2}
          unit="km²"
          highlight="warning"
          contextTag="1.0m – 2.0m"
          subtext="Ground-floor residential inundation"
        />

        <StatCard
          label="Gauges in Critical State"
          value="1 / 4"
          unit="stations"
          highlight="danger"
          contextTag="MONITORING"
          subtext="Tadepalli Outfall over danger mark"
        />
      </div>

      {/* Risk Chart & Classification Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <RiskDistributionChart
            highRiskKm2={summary.highRiskAreaKm2}
            moderateRiskKm2={summary.moderateRiskAreaKm2}
            lowRiskKm2={summary.lowRiskAreaKm2}
          />
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-4 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Depth Hazard Criteria
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Standard civil defense hazard taxonomy based on inundation depth and flow velocity:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded border border-red-200 bg-red-50/60">
                <div className="flex items-center justify-between font-bold text-red-900 mb-1">
                  <span>High Risk (&gt; 2.0m Depth)</span>
                  <span className="font-mono">{summary.highRiskAreaKm2} km²</span>
                </div>
                <p className="text-red-700 text-[11px]">
                  Immediate life threat. Multi-story inundation, rapid bank erosion, and complete loss of ground transportation. Evacuation mandatory.
                </p>
              </div>

              <div className="p-2.5 rounded border border-amber-200 bg-amber-50/60">
                <div className="flex items-center justify-between font-bold text-amber-900 mb-1">
                  <span>Moderate Risk (1.0m – 2.0m Depth)</span>
                  <span className="font-mono">{summary.moderateRiskAreaKm2} km²</span>
                </div>
                <p className="text-amber-700 text-[11px]">
                  Structural ground level damage. Normal vehicles stranded. Power and drinking water supply disruption expected.
                </p>
              </div>

              <div className="p-2.5 rounded border border-emerald-200 bg-emerald-50/60">
                <div className="flex items-center justify-between font-bold text-emerald-900 mb-1">
                  <span>Low Risk (&lt; 1.0m Depth)</span>
                  <span className="font-mono">{summary.lowRiskAreaKm2} km²</span>
                </div>
                <p className="text-emerald-700 text-[11px]">
                  Shallow water ponding and floodplain agricultural saturation. Navigable by high-clearance emergency vehicles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settlement Vulnerability Table */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Monitored Settlements &amp; Infrastructure Locations
            </h3>
            <p className="text-xs text-slate-500">
              Field locations intersecting the +24h projected flood extent
            </p>
          </div>

          {/* Filter Risk Buttons */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 mr-1">Filter:</span>
            {['ALL', 'HIGH', 'MODERATE', 'LOW'].map((risk) => (
              <button
                key={risk}
                onClick={() => setFilterRisk(risk)}
                className={`px-2 py-1 text-[11px] rounded font-medium transition-colors cursor-pointer ${
                  filterRisk === risk
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Location / Ward</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Dist. to River</th>
                <th className="py-2.5 px-3">Projected Depth</th>
                <th className="py-2.5 px-3">Pop. Exposed</th>
                <th className="py-2.5 px-3">Civil Action Status</th>
                <th className="py-2.5 px-3">Hazard Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLocations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{loc.name}</td>
                  <td className="py-2.5 px-3 text-slate-500">{loc.type}</td>
                  <td className="py-2.5 px-3 font-mono">{loc.distanceFromRiverKm} km</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-red-700">
                    {loc.estimatedDepth} m
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {loc.populationAtRisk ? loc.populationAtRisk.toLocaleString() : '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        loc.status === 'Evacuation Alert'
                          ? 'bg-red-100 text-red-800 font-bold'
                          : loc.status === 'Submerged'
                          ? 'bg-orange-100 text-orange-800'
                          : loc.status === 'Advisory'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {loc.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <RiskBadge level={loc.risk} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hydrological Gauging Network Table */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Hydrological Gauging Telemetry Stations
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Field telemetry sensors providing upstream boundary conditions for the AI flood projection model
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {HYDRO_STATIONS.map((stn) => (
            <div
              key={stn.id}
              className={`p-3 rounded border text-xs ${
                stn.status === 'critical'
                  ? 'border-red-300 bg-red-50/40'
                  : stn.status === 'warning'
                  ? 'border-amber-300 bg-amber-50/40'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 mb-2">
                <span className="font-bold text-slate-900 truncate">{stn.name}</span>
                <span className="text-[10px] font-mono text-slate-500">{stn.code}</span>
              </div>

              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Current Water Level:</span>
                  <strong className="font-mono text-slate-900">{stn.currentLevel} m</strong>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Warning Threshold:</span>
                  <span className="font-mono">{stn.warningLevel} m</span>
                </div>
                <div className="flex justify-between text-red-700">
                  <span>Danger Threshold:</span>
                  <span className="font-mono font-bold">{stn.dangerLevel} m</span>
                </div>
              </div>

              <div className="mt-2.5 pt-1.5 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Status:</span>
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                    stn.status === 'critical'
                      ? 'bg-red-200 text-red-900'
                      : stn.status === 'warning'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {stn.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
