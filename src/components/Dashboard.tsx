'use client';

import React from 'react';
import { ProjectFormData, ZoneType, ProjectType, GreenFsiType } from '@/lib/types/udcpr';
import { ROAD_WIDTH_MAP } from '@/lib/udcpr/constants';
import { Table } from 'lucide-react';

interface DashboardProps {
  formData: ProjectFormData;
  onChange: (updated: Partial<ProjectFormData>) => void;
  isTableExpanded: boolean;
  onToggleTable: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  formData,
  onChange,
  isTableExpanded,
  onToggleTable,
}) => {
  const isCbd = formData.zone === 'cbd';

  const handleZoneChange = (zone: ZoneType) => {
    let roadCode = formData.roadWidthCode;
    if (zone === 'cbd') {
      const currentOpt = ROAD_WIDTH_MAP[roadCode];
      if (!currentOpt || !currentOpt.minCbd) {
        roadCode = 'w_24';
      }
    }
    onChange({ zone, roadWidthCode: roadCode });
  };

  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-7 shadow-sm space-y-6 no-print">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">Project Parameters & Statutory Values</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Modify any relevant plot area, road width, deduction, or loading value below. Calculations recalculate live in real-time.
        </p>
      </div>

      <form className="space-y-6" onSubmit={e => e.preventDefault()}>
        {/* ROW 1: Date, Client Name, Project Name */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={e => onChange({ date: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Client Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. RIGHT FOUNDATION"
              value={formData.clientName}
              onChange={e => onChange({ clientName: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Project Name / Location <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. SALISBURY PARK"
              value={formData.projectName}
              onChange={e => onChange({ projectName: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-sm"
              required
            />
          </div>
        </div>

        {/* ROW 2: Plot Areas & Mandatory Deductions */}
        <div>
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>Plot Measurement & Statutory Deductions</span>
            <span className="text-[10px] text-slate-400 font-normal font-mono">(Sr. No. 1.0 & 2.0)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Plot Area (7/12 Extract) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.plotArea712}
                  onChange={e => onChange({ plotArea712: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 pr-14 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none shadow-sm"
                  required
                />
                <span className="absolute right-3.5 top-2 text-xs font-medium text-slate-400 pointer-events-none">sq.m</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Land revenue extract (Row 1a)</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Plot Area (Site Measurement) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.plotAreaSite}
                  onChange={e => onChange({ plotAreaSite: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 pr-14 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none shadow-sm"
                  required
                />
                <span className="absolute right-3.5 top-2 text-xs font-medium text-slate-400 pointer-events-none">sq.m</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Site survey area (Row 1b)</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Road Widening Area
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.roadWidening}
                  onChange={e => onChange({ roadWidening: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 pr-14 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none shadow-sm"
                />
                <span className="absolute right-3.5 top-2 text-xs font-medium text-slate-400 pointer-events-none">sq.m</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Row 2a (gets 2x in-situ TDR credit)</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                D.P. Reservation / Green Belt
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.dpReservationArea ?? 0}
                  onChange={e => onChange({ dpReservationArea: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 pr-14 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none shadow-sm"
                />
                <span className="absolute right-3.5 top-2 text-xs font-medium text-slate-400 pointer-events-none">sq.m</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Row 2b (Green belt surrender)</p>
            </div>
          </div>
        </div>

        {/* ROW 3: Road Width, Project Type, Green FSI & Saleable Loading */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Road Width <span className="text-rose-500">*</span>
              {isCbd && <span className="ml-1 text-[10px] text-amber-600 font-normal">(Min 12m)</span>}
            </label>
            <select
              value={formData.roadWidthCode}
              onChange={e => onChange({ roadWidthCode: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none shadow-sm"
            >
              {Object.entries(ROAD_WIDTH_MAP).map(([code, info]) => {
                if (isCbd && !info.minCbd) return null;
                return (
                  <option key={code} value={code}>
                    {info.label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Project Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.projectType}
              onChange={e => onChange({ projectType: e.target.value as ProjectType })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none shadow-sm"
            >
              <option value="residential">Residential (60% Ancillary FSI)</option>
              <option value="commercial">Commercial (80% Ancillary FSI)</option>
              <option value="mixed">Mixed Use (60% Ancillary FSI)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Green Building Rating
            </label>
            <select
              value={formData.greenFsiType}
              onChange={e => onChange({ greenFsiType: e.target.value as GreenFsiType })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none shadow-sm"
            >
              <option value="none">None (0% Additional FSI)</option>
              <option value="green_griha_3">GRIHA 3-Star / IGBC Silver (+3% FSI)</option>
              <option value="green_griha_4">GRIHA 4-Star / IGBC Gold (+5% FSI)</option>
              <option value="green_griha_5">GRIHA 5-Star / IGBC Platinum (+7% FSI)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Saleable Loading %
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={formData.saleableLoadingPct ?? 15}
                onChange={e => onChange({ saleableLoadingPct: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 pr-8 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none shadow-sm"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-medium text-slate-400 pointer-events-none">%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Default: 15% loading on BUA</p>
          </div>
        </div>

        {/* ROW 4: Zone Selector */}
        <div className="pt-2 border-t border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
            Zoning Regulation Model <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Regular Zone */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                formData.zone === 'regular'
                  ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="zoneSelection"
                value="regular"
                checked={formData.zone === 'regular'}
                onChange={() => handleZoneChange('regular')}
                className="mt-1 text-sky-600 focus:ring-sky-500"
              />
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900">Regular Zone</div>
                <div className="text-[11px] text-slate-500 mt-0.5">UDCPR Table 6-A standard residential/commercial (53 Rows).</div>
              </div>
            </label>

            {/* TOD Zone */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                formData.zone === 'tod'
                  ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="zoneSelection"
                value="tod"
                checked={formData.zone === 'tod'}
                onChange={() => handleZoneChange('tod')}
                className="mt-1 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900">TOD Zone (Metro Corridor)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Chapter 13 Transit Oriented Development within 500m (46 Rows).</div>
              </div>
            </label>

            {/* CBD Zone */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                formData.zone === 'cbd'
                  ? 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="zoneSelection"
                value="cbd"
                checked={formData.zone === 'cbd'}
                onChange={() => handleZoneChange('cbd')}
                className="mt-1 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900">CBD Zone (Commercial Core)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Commercial Core District, min 12m road width (46 Rows).</div>
              </div>
            </label>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onToggleTable}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-md transition transform active:scale-95"
          >
            <Table className="w-4 h-4 text-sky-400" />
            <span>{isTableExpanded ? 'Hide Statutory Statement' : 'Generate / View Full Statement'}</span>
          </button>
        </div>
      </form>
    </section>
  );
};
