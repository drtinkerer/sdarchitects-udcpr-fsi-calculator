'use client';

import React from 'react';
import { Building2, FileDown } from 'lucide-react';
import { ZoneType } from '@/lib/types/udcpr';
import { MASTER_TEMPLATES } from '@/lib/udcpr/constants';

interface NavbarProps {
  zone: ZoneType;
  onExportPdf: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  zone,
  onExportPdf,
}) => {
  const currentTpl = MASTER_TEMPLATES[zone];

  return (
    <header className="glass-panel sticky top-0 z-30 border-b border-slate-200 px-4 sm:px-6 py-3 shadow-sm no-print">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm border border-slate-800">
            <Building2 className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">UDCPR FSI Calculator Pro</h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                SaaS Edition
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Active Template: <span className="font-semibold text-slate-700">{currentTpl.name}</span> ({currentTpl.totalRows} Rows)
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Sole Export PDF Button */}
          <button
            onClick={onExportPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition transform hover:scale-[1.02]"
            title="Export clean 1-page A4 PDF Statement"
          >
            <FileDown className="w-4 h-4 text-sky-400" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
