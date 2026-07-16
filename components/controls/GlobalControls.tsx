'use client';

import React from 'react';
import { useData } from '../providers/DataProvider';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { TimeRangeOption } from '../../lib/types';

export default function GlobalControls() {
  const {
    isStreaming,
    toggleStreaming,
    clearBuffer,
    filters,
    updateFilters
  } = useData();

  const timePresets: { label: string; value: TimeRangeOption }[] = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: 'ALL', value: 'all' }
  ];

  const aggModes = [
    { label: 'REALTIME', value: 'raw' },
    { label: '1M AVG', value: '1m' },
    { label: '5M AVG', value: '5m' }
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-3 select-none text-[12px]">
      
      {/* Stream Control Group */}
      <div className="flex items-center gap-1 border-r border-[hsl(var(--border))] pr-3">
        <button
          onClick={toggleStreaming}
          className={`btn btn-sm font-bold flex items-center gap-1.5 ${
            isStreaming
              ? 'border-[hsl(var(--border))] bg-black/5 dark:bg-white/5 text-[hsl(var(--foreground))]'
              : 'bg-emerald-600 hover:bg-emerald-500 border-transparent text-white'
          }`}
        >
          {isStreaming ? (
            <>
              <Pause className="h-3 w-3" /> PAUSE
            </>
          ) : (
            <>
              <Play className="h-3 w-3" /> LIVE
            </>
          )}
        </button>
        <button
          onClick={clearBuffer}
          className="btn btn-sm border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          title="Clear Buffer"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Time Range Selector Preset Group */}
      <div className="flex items-center border-r border-[hsl(var(--border))] pr-3">
        <div className="flex bg-black/5 dark:bg-white/5 border border-[hsl(var(--border))] rounded p-0.5">
          {timePresets.map((preset) => {
            const isActive = filters.timeRange === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => updateFilters({ timeRange: preset.value })}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all ${
                  isActive
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]'
                }`}
              >
                {preset.label.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Aggregation Mode Group */}
      <div className="flex items-center">
        <div className="flex bg-black/5 dark:bg-white/5 border border-[hsl(var(--border))] rounded p-0.5">
          {aggModes.map((mode) => {
            const isActive = filters.aggregation === mode.value;
            return (
              <button
                key={mode.value}
                onClick={() => updateFilters({ aggregation: mode.value })}
                className={`px-2.5 py-0.5 text-[10px] font-bold rounded transition-all ${
                  isActive
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]'
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
