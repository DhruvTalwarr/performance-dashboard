'use client';

import React from 'react';
import { useData } from '../providers/DataProvider';
import { TimeRangeOption } from '../../lib/types';

export default function TimeRangeSelector() {
  const { filters, updateFilters } = useData();

  const presets: { label: string; value: TimeRangeOption }[] = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '30m', value: '30m' },
    { label: '1h', value: '1h' },
    { label: 'ALL', value: 'all' }
  ];

  return (
    <div className="flex items-center gap-2 select-none">
      <div className="flex bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded p-0.5 shadow-sm">
        {presets.map((preset) => {
          const isActive = filters.timeRange === preset.value;
          return (
            <button
              key={preset.value}
              onClick={() => updateFilters({ timeRange: preset.value })}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded transition-all ${
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
  );
}
