'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ProjectFormData, RowOverrides } from '@/lib/types/udcpr';
import { DEFAULT_FORM_DATA } from '@/lib/udcpr/constants';
import { calculateZone } from '@/lib/udcpr/calculator';
import { generateRowsForZone } from '@/lib/udcpr/rows';

import { Navbar } from '@/components/Navbar';
import { MetricCards } from '@/components/MetricCards';
import { Dashboard } from '@/components/Dashboard';
import { FullTable } from '@/components/FullTable';
import { CheckCircle2, AlertCircle, ExternalLink, X } from 'lucide-react';

const STORAGE_KEY_FORM = 'udcpr_form_data_v1';

interface ExportResult {
  fileName: string;
  outputMode: string;
  telegramSent: boolean;
  telegramError: string | null;
  folderUrl: string;
  sheetUrl: string;
  pdfUrl: string;
}

function triggerPdfDownload(base64: string, fileName: string) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [formData, setFormData] = useState<ProjectFormData>(DEFAULT_FORM_DATA);
  const [overrides] = useState<RowOverrides>({});
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedForm = localStorage.getItem(STORAGE_KEY_FORM);
      if (savedForm) {
        setFormData(prev => ({ ...prev, ...JSON.parse(savedForm) }));
      }
    } catch (e) {
      console.warn('Failed to load local storage state:', e);
    }
  }, []);

  // Save changes to localStorage
  const handleFormChange = (updated: Partial<ProjectFormData>) => {
    setFormData(prev => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(next));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
      return next;
    });
  };

  // Perform live calculation (pure, deterministic)
  const calc = useMemo(() => {
    return calculateZone(formData, overrides);
  }, [formData, overrides]);

  // Generate full 53/46 row table
  const rows = useMemo(() => {
    return generateRowsForZone(formData, calc, overrides);
  }, [formData, calc, overrides]);

  const handleGeneratePdf = async () => {
    if (!formData.clientName.trim() || !formData.projectName.trim()) {
      setExportError('Please enter both Client Name and Project Name / Location.');
      setExportResult(null);
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setExportResult(null);

    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'n8n workflow failed');
      }

      if (data.pdfBase64 && data.fileName) {
        triggerPdfDownload(data.pdfBase64, data.fileName);
      }

      setExportResult({
        fileName: data.fileName,
        outputMode: data.outputMode ?? 'both',
        telegramSent: Boolean(data.telegramSent),
        telegramError: data.telegramError ?? null,
        folderUrl: data.folderUrl,
        sheetUrl: data.sheetUrl,
        pdfUrl: data.pdfUrl,
      });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to generate PDF via n8n');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar
        zone={formData.zone}
        isExporting={isExporting}
        onGeneratePdf={handleGeneratePdf}
      />

      {/* Main Workspace */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {exportError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{exportError}</span>
            </div>
            <button type="button" onClick={() => setExportError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {exportResult && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Generated <span className="font-semibold">{exportResult.fileName}</span> via n8n.
              </span>
              {exportResult.outputMode !== 'web' && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                    exportResult.telegramSent
                      ? 'bg-sky-100 text-sky-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {exportResult.telegramSent
                    ? 'Sent PDF to Telegram'
                    : `Telegram not sent: ${exportResult.telegramError || 'failed'}`}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <a
                href={exportResult.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 underline"
              >
                <span>Open PDF in Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={exportResult.sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 underline"
              >
                <span>Open Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={exportResult.folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 underline"
              >
                <span>Open Folder</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button type="button" onClick={() => setExportResult(null)} className="text-emerald-600 hover:text-emerald-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Metric Summary Cards */}
        <MetricCards metrics={calc.metrics} />

        {/* 10 Statutory Input Form & Controls */}
        <Dashboard
          formData={formData}
          onChange={handleFormChange}
          isTableExpanded={isTableExpanded}
          onToggleTable={() => setIsTableExpanded(!isTableExpanded)}
        />

        {/* Collapsible 53/46-Row Statutory Table */}
        {isTableExpanded && (
          <FullTable
            rows={rows}
            zone={formData.zone}
            onCollapse={() => setIsTableExpanded(false)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>UDCPR FSI Calculator Pro • S D ARCHITECTS Standard</span>
          <span className="font-mono text-[11px] text-slate-400">
            Strict Formula Parity to Regular (53R), TOD (46R), CBD (46R) Master Templates
          </span>
        </div>
      </footer>
    </div>
  );
}
