'use client';

import React from 'react';
import { TableRowItem, ZoneType } from '@/lib/types/udcpr';
import { Table, ChevronUp } from 'lucide-react';

interface FullTableProps {
  rows: TableRowItem[];
  zone: ZoneType;
  onCollapse: () => void;
}

export const FullTable: React.FC<FullTableProps> = ({
  rows,
  onCollapse,
}) => {
  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-7 shadow-sm space-y-4 no-print animate-fade-in">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-900 text-sky-400">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              Statutory UDCPR FSI Calculation Statement
            </h3>
            <p className="text-xs text-slate-500">
              Complete {rows.length} rows computed in strict accordance with UDCPR Maharashtra statutory guidelines.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCollapse}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition self-start sm:self-auto"
        >
          <ChevronUp className="w-4 h-4 text-slate-500" />
          <span>Collapse</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold text-xs tracking-wider">
              <th className="py-2.5 px-3 w-16 text-center border-r border-slate-800">Sr No</th>
              <th className="py-2.5 px-4 border-r border-slate-800">Statutory UDCPR Description & Statutory Basis</th>
              <th className="py-2.5 px-4 w-40 text-right">Permissible Area (sq.m)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              // 1. Full-span disclaimer row
              if (row.spanABC) {
                return (
                  <tr key={idx} className="bg-slate-50 text-[11px] text-slate-500 italic">
                    <td colSpan={3} className="py-3 px-4 text-center">
                      {row.a}
                    </td>
                  </tr>
                );
              }

              // 2. Header Rows (Row 1, 2, 3)
              if (row.spanAB) {
                return (
                  <tr key={idx} className="bg-slate-100/80 font-bold border-b border-slate-200 text-slate-900">
                    <td colSpan={2} className="py-2 px-4">
                      {row.a}
                    </td>
                    <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                      {row.c}
                    </td>
                  </tr>
                );
              }

              // 3. Skip column title row since we have a dedicated thead
              if (row.isTableHead) {
                return null;
              }

              // 4. Blank spacer rows
              if (row.isBlank) {
                return (
                  <tr key={idx} className="bg-slate-50/40">
                    <td colSpan={3} className="py-1"></td>
                  </tr>
                );
              }

              // 5. Section headings (e.g. 1.0 AREA OF GROSS PLOT)
              if (row.isSection) {
                return (
                  <tr key={idx} className="bg-slate-100 font-bold text-slate-900 text-xs">
                    <td className="py-2 px-3 text-center font-mono">{row.a}</td>
                    <td className="py-2 px-4 font-semibold uppercase">{row.b}</td>
                    <td className="py-2 px-4 text-right font-mono">{row.c}</td>
                  </tr>
                );
              }

              // 6. Regular Data Row
              let rowStyle = 'hover:bg-sky-50/50 transition-colors';
              if (row.isGrandTotal) {
                rowStyle = 'bg-sky-100 font-black text-sky-950 text-sm border-t-2 border-b-4 border-slate-900';
              } else if (row.isHighlight) {
                rowStyle = 'bg-sky-50/70 font-semibold text-slate-900';
              }

              return (
                <tr key={idx} className={rowStyle}>
                  <td className="py-2 px-3 text-center font-mono text-slate-500 font-semibold border-r border-slate-100">
                    {row.a}
                  </td>
                  <td className="py-2 px-4 text-slate-800 border-r border-slate-100">
                    {row.b}
                  </td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">
                    <span>{row.c}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
