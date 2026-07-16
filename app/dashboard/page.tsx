import React from 'react';
import FilterPanel from '../../components/controls/FilterPanel';
import PerformanceMonitor from '../../components/ui/PerformanceMonitor';
import DataTable from '../../components/ui/DataTable';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import ScatterPlot from '../../components/charts/ScatterPlot';
import Heatmap from '../../components/charts/Heatmap';

export const revalidate = 0;

export default async function DashboardPage() {
  const initialConfig = {
    dashboardNode: 'node_a',
    region: 'us-east-1',
  };

  return (
    <div className="p-4 min-w-0">
      {/* 
        Grid layout: 
        Main Workspace spans 3 columns on desktop, Advanced Inspector Sidebar spans 1 column.
        This composition separates visualization reading from advanced parameters customization.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* MAIN WORKSPACE ZONE */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-w-0">
          
          {/* Telemetry Indicator Tiles Strip */}
          <section aria-label="Performance Indicators" className="shrink-0">
            <PerformanceMonitor />
          </section>

          {/* Primary Timeline focus */}
          <section aria-label="Telemetry Line History" className="w-full">
            <LineChart />
          </section>

          {/* Secondary correlation and intensities */}
          <section aria-label="Secondary Metrics Analysis" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScatterPlot />
            <Heatmap />
          </section>

          {/* Comparisons Bar Charts */}
          <section aria-label="System Comparison" className="w-full">
            <BarChart />
          </section>

          {/* Full Width Activity Logs Table */}
          <section aria-label="Telemetry Activity Logs" className="w-full">
            <DataTable />
          </section>

        </div>

        {/* ADVANCED RIGHT INSPECTOR ZONE */}
        <aside className="lg:col-span-1 flex flex-col gap-4">
          <div className="lg:sticky lg:top-4">
            <FilterPanel />
          </div>
        </aside>

      </div>
    </div>
  );
}
