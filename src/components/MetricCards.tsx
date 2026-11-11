'use client';

import React from 'react';
import { CalculationMetrics } from '@/lib/types/udcpr';
import { Layers, Maximize2, Building, TrendingUp } from 'lucide-react';

interface MetricCardsProps {
  metrics: CalculationMetrics;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
      {/* Card 1: Gross Net Plot Area */}
      <div className="glass-panel rounded-xl p-4 shadow-sm border-l-4 border-l-sky-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Gross Net Plot</span>
          <Layers className="w-4 h-4 text-sky-500" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
            {metrics.grossNetPlotArea.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs text-slate-500 font-normal ml-1">sq.m</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sr. No. 3.0 (Min Gross minus deductions)</p>
        </div>
      </div>

      {/* Card 2: Net Permissible FSI */}
      <div className="glass-panel rounded-xl p-4 shadow-sm border-l-4 border-l-indigo-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Net Permissible FSI</span>
          <Maximize2 className="w-4 h-4 text-indigo-500" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
            {metrics.netPermissibleFsiArea.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs text-slate-500 font-normal ml-1">sq.m</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
              FSI: {metrics.fsiRatio.toFixed(2)}x
            </span>
            <span className="text-[11px] text-slate-400">Sr. No. 13.0 Land Potential</span>
          </div>
        </div>
      </div>

      {/* Card 3: Total with Ancillary */}
      <div className="glass-panel rounded-xl p-4 shadow-sm border-l-4 border-l-purple-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Total with Ancillary</span>
          <Building className="w-4 h-4 text-purple-500" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
            {metrics.totalWithAncillaryArea.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs text-slate-500 font-normal ml-1">sq.m</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sr. No. 15.0 (Includes 60%/80% Ancillary)</p>
        </div>
      </div>

      {/* Card 4: Total Saleable Area */}
      <div className="glass-panel rounded-xl p-4 shadow-sm border-l-4 border-l-emerald-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Saleable Area</span>
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-800">
            {Math.round(metrics.totalSaleableSqFt).toLocaleString('en-IN')}
            <span className="text-xs text-emerald-600 font-normal ml-1">sq.ft</span>
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
            ({metrics.totalSaleableSqM.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sq.m)
          </p>
        </div>
      </div>
    </div>
  );
};
