'use client';

import React from 'react';
import { TableRowItem, ProjectFormData, CalculationResult } from '@/lib/types/udcpr';
import { formatDateDisplay, getProjectTypeDisplay } from '@/lib/udcpr/rows';
import { MASTER_TEMPLATES } from '@/lib/udcpr/constants';

interface PrintSectionProps {
  rows: TableRowItem[];
  formData: ProjectFormData;
  calc: CalculationResult;
}

export const PrintSection: React.FC<PrintSectionProps> = ({ rows, formData, calc }) => {
  const tpl = MASTER_TEMPLATES[formData.zone];
  const dateFormatted = formatDateDisplay(formData.date);
  const projTypeFormatted = getProjectTypeDisplay(formData.projectType);

  return (
    <div className="print-only font-sans text-slate-900 leading-tight">
      {/* 1. Compact Unified Title & Metadata Block */}
      <div className="rounded-t border-2 border-slate-900 overflow-hidden mb-1">
        {/* Title Bar */}
        <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between">
          <div>
            <div className="text-[10pt] font-black uppercase tracking-tight">
              Statutory FSI & Built-Up Area (BUA) Statement
            </div>
            <div className="text-[6.5pt] text-slate-300">
              Computed under Unified Development Control and Promotion Regulations (UDCPR) for Maharashtra State
            </div>
          </div>
          <div className="text-right flex items-center gap-3">
            <span className="text-[7pt] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-400/30 font-semibold uppercase">
              {tpl.name.split('(')[0].trim()}
            </span>
            <div className="text-[8pt] font-mono font-bold text-white">
              {dateFormatted}
            </div>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="bg-slate-50 px-3 py-1 grid grid-cols-4 gap-2 text-[7pt] border-t border-slate-300">
          <div>
            <span className="text-slate-400 uppercase font-semibold">Client: </span>
            <span className="font-bold text-slate-900">{formData.clientName.toUpperCase()}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold">Project: </span>
            <span className="font-bold text-slate-900">{formData.projectName.toUpperCase()}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold">Road Width: </span>
            <span className="font-bold text-slate-900">{calc.roadInfo.label.split('(')[0].trim()} ({calc.roadInfo.tag})</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold">Project Type: </span>
            <span className="font-bold text-slate-900">{projTypeFormatted} ({formData.projectType === 'commercial' ? '80%' : '60%'} Ancillary)</span>
          </div>
        </div>
      </div>

      {/* 2. Compact Color-Coded 3-Column Table */}
      <div className="rounded-b border-2 border-slate-900 overflow-hidden shadow-sm">
        <table className="print-table w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[7.5pt]">
              <th className="py-1 px-2 w-12 text-center border-r border-slate-700">Sr No</th>
              <th className="py-1 px-3 border-r border-slate-700">Statutory UDCPR Description & Statutory Basis</th>
              <th className="py-1 px-3 w-32 text-right">Permissible Area (sq.m)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((item, idx) => {
              // Full-width disclaimer
              if (item.spanABC) {
                return (
                  <tr key={idx} className="bg-slate-100 text-slate-500 italic text-[6pt]">
                    <td colSpan={3} className="py-1 px-2 text-center border-t border-slate-300">
                      {item.a}
                    </td>
                  </tr>
                );
              }

              // Skip title rows (Row 1, 2, 3) as they are already in the top title block
              if (item.spanAB) {
                return null;
              }

              // Skip table head row since we have a dedicated thead
              if (item.isTableHead) {
                return null;
              }

              // Blank spacer row (compressed to 2px)
              if (item.isBlank) {
                return (
                  <tr key={idx} className="h-[2px] bg-slate-50/50">
                    <td colSpan={3} className="p-0 border-none"></td>
                  </tr>
                );
              }

              // Section header row
              if (item.isSection) {
                return (
                  <tr key={idx} className="bg-slate-200 font-bold text-slate-900 text-[7.2pt]">
                    <td className="py-0.5 px-2 text-center font-mono border-r border-slate-300 bg-slate-300/80">{item.a}</td>
                    <td className="py-0.5 px-2.5 border-r border-slate-300 uppercase">{item.b}</td>
                    <td className="py-0.5 px-3 text-right font-mono font-semibold">{item.c}</td>
                  </tr>
                );
              }

              // Highlight rows
              let rowBg = 'bg-white';
              let textStyle = 'text-slate-800';

              if (item.isGrandTotal) {
                rowBg = 'bg-emerald-100 text-emerald-950 font-black border-t-2 border-b-2 border-emerald-600 text-[8pt]';
                textStyle = 'font-black text-emerald-950';
              } else if (item.isHighlight) {
                rowBg = 'bg-sky-50 text-sky-950 font-bold';
                textStyle = 'font-bold text-sky-900';
              }

              return (
                <tr key={idx} className={`${rowBg}`}>
                  <td className="py-0.5 px-2 text-center font-mono text-slate-500 font-semibold border-r border-slate-200">
                    {item.a}
                  </td>
                  <td className={`py-0.5 px-2.5 border-r border-slate-200 ${textStyle}`}>
                    {item.b}
                  </td>
                  <td className="py-0.5 px-3 text-right font-mono font-semibold text-slate-900">
                    {item.c}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
