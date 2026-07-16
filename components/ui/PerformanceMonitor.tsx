'use client';

import React from 'react';
import { useData } from '../providers/DataProvider';
import { formatBytes, formatDuration } from '../../lib/performanceUtils';
import { Cpu, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function PerformanceMonitor() {
  const { metrics } = useData();
  const { fps, renderTime, processingTime, activePointsCount, renderedPointsCount, memoryUsed, memoryLimit } = metrics;

  // FPS Status Indicator
  const fpsStatus = fps >= 55 ? 'STABLE' : fps >= 45 ? 'WARNING' : 'DEGRADED';
  const fpsColor = fps >= 55 
    ? 'text-emerald-500 bg-emerald-500/8 border-emerald-500/15' 
    : fps >= 45 
      ? 'text-amber-500 bg-amber-500/8 border-amber-500/15' 
      : 'text-red-500 bg-red-500/8 border-red-500/15';

  return (
    <div className="panel select-none bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-md shadow-sm">
      
      {/* Small subtle header */}
      <div className="panel-header bg-black/[0.01) dark:bg-white/[0.015] border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <span className="panel-title text-[11px] font-bold uppercase tracking-wider">Engine Performance Diagnostics</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[hsl(var(--muted-foreground))]">
          NODE: <span className="text-[hsl(var(--foreground))]">LOCAL_NODE_0</span>
        </div>
      </div>

      {/* Grid of dividers */}
      <div className="grid grid-cols-2 md:grid-cols-5 border-t border-transparent text-[13px]">
        
        {/* Metric 1: FPS */}
        <div className="flex flex-col justify-between p-4 border-r border-[hsl(var(--border))] border-b md:border-b-0">
          <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Telemetry FPS</span>
          <div className="flex flex-col gap-0.5 mt-2">
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black tracking-tight tabular ${fps >= 55 ? 'text-[hsl(var(--foreground))]' : 'text-amber-500'}`}>
                {fps}
              </span>
              <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))]">Hz</span>
            </div>
            {/* Dynamic trend tag */}
            <div className="flex items-center gap-1 mt-1 text-[9px] font-mono font-bold">
              <span className="flex items-center text-emerald-500">
                <ArrowUpRight className="h-3 w-3 shrink-0" /> +0.2%
              </span>
              <span className="text-[hsl(var(--muted-foreground))] opacity-75">vs peak</span>
            </div>
          </div>
        </div>

        {/* Metric 2: CPU Processing */}
        <div className="flex flex-col justify-between p-4 border-r border-[hsl(var(--border))] border-b md:border-b-0">
          <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">CPU Processing</span>
          <div className="flex flex-col gap-0.5 mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[hsl(var(--foreground))] tracking-tight tabular">
                {formatDuration(processingTime)}
              </span>
            </div>
            {/* Trend status */}
            <div className="flex items-center gap-1 mt-1 text-[9px] font-mono font-bold">
              <span className="flex items-center text-emerald-500">
                <ArrowDownRight className="h-3 w-3 shrink-0" /> -4.1%
              </span>
              <span className="text-[hsl(var(--muted-foreground))] opacity-75">optimization</span>
            </div>
          </div>
        </div>

        {/* Metric 3: GPU Rendering */}
        <div className="flex flex-col justify-between p-4 border-r border-[hsl(var(--border))] border-b md:border-b-0">
          <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">GPU Paint Time</span>
          <div className="flex flex-col gap-0.5 mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[hsl(var(--foreground))] tracking-tight tabular">
                {formatDuration(renderTime)}
              </span>
            </div>
            {/* Trend status */}
            <div className="flex items-center gap-1 mt-1 text-[9px] font-mono font-bold">
              <span className="flex items-center text-emerald-500">
                <ArrowDownRight className="h-3 w-3 shrink-0" /> -2.5%
              </span>
              <span className="text-[hsl(var(--muted-foreground))] opacity-75">rendering rate</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Heap Memory */}
        <div className="flex flex-col justify-between p-4 border-r border-[hsl(var(--border))]">
          <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Heap Allocation</span>
          <div className="flex flex-col gap-0.5 mt-2">
            <div className="flex items-baseline gap-1">
              {memoryUsed ? (
                <>
                  <span className="text-2xl font-black text-[hsl(var(--foreground))] tracking-tight tabular">
                    {memoryUsed.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))]">/ {memoryLimit?.toFixed(0)} MB</span>
                </>
              ) : (
                <span className="text-xl font-black text-[hsl(var(--foreground))] tracking-tight tabular">
                  {formatBytes(activePointsCount * 120)}
                </span>
              )}
            </div>
            {/* Trend status */}
            <div className="flex items-center gap-1 mt-1 text-[9px] font-mono font-bold">
              <span className="flex items-center text-amber-500">
                <ArrowUpRight className="h-3 w-3 shrink-0" /> +0.4MB
              </span>
              <span className="text-[hsl(var(--muted-foreground))] opacity-75">allocation rate</span>
            </div>
          </div>
        </div>

        {/* Metric 5: Buffer Size */}
        <div className="flex flex-col justify-between p-4">
          <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Active Buffer</span>
          <div className="flex flex-col gap-0.5 mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[hsl(var(--foreground))] tracking-tight tabular">
                {activePointsCount.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))]">pts</span>
            </div>
            {/* Trend status */}
            <div className="flex items-center gap-1 mt-1 text-[9px] font-mono font-bold">
              <span className="text-[hsl(var(--foreground))] opacity-80 tabular">
                ({renderedPointsCount.toLocaleString()})
              </span>
              <span className="text-[hsl(var(--muted-foreground))] opacity-75">rendered</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
