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
import { PrintSection } from '@/components/PrintSection';

const STORAGE_KEY_FORM = 'udcpr_form_data_v1';

export default function Home() {
  const [formData, setFormData] = useState<ProjectFormData>(DEFAULT_FORM_DATA);
  const [overrides, setOverrides] = useState<RowOverrides>({});
  const [isTableExpanded, setIsTableExpanded] = useState(false);

  // Modals state

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

  // Overrides handling
  const handleUpdateOverride = (rowNumber: number, value: number) => {
    setOverrides(prev => ({ ...prev, [rowNumber]: value }));
  };

  const handleResetOverrides = () => {
    setOverrides({});
  };

  // Export handlers
  const handlePrint = () => {
    window.print();
  };
  return (
    <>
      <div className="min-h-screen flex flex-col justify-between no-print">
      <Navbar
        zone={formData.zone}
        onExportPdf={handlePrint}
      />

      {/* Main Workspace */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
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
      <footer className="border-t border-slate-200 bg-white/80 py-4 px-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>UDCPR FSI Calculator Pro • S D ARCHITECTS Standard</span>
          <span className="font-mono text-[11px] text-slate-400">
            Strict Formula Parity to Regular (53R), TOD (46R), CBD (46R) Master Templates
          </span>
        </div>
      </footer>
    </div>

      {/* Dedicated A4 Print Section (visible during window.print()) */}
      <PrintSection rows={rows} formData={formData} calc={calc} />
    </>
  );
}
