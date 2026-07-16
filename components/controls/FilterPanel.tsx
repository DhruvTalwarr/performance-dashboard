'use client';

import React from 'react';
import { useData } from '../providers/DataProvider';
import { Sliders, HelpCircle, Zap } from 'lucide-react';

export default function FilterPanel() {
  const {
    pointsPerTick,
    bufferLimit,
    setPointsPerTick,
    setBufferLimit,
    filters,
    updateFilters,
    isFilterPending
  } = useData();

  const handleCategoryToggle = (cat: 'A' | 'B' | 'C' | 'D') => {
    updateFilters({
      categories: {
        ...filters.categories,
        [cat]: !filters.categories[cat]
      }
    });
  };

  const isStressTest = pointsPerTick === 1000 && bufferLimit === 100000;

  const handleStressToggle = () => {
    if (isStressTest) {
      setPointsPerTick(1);
      setBufferLimit(20000);
    } else {
      setPointsPerTick(1000);
      setBufferLimit(100000);
    }
  };

  return (
    <div className="panel select-none bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-md shadow-sm">
      <div className="panel-header bg-black/[0.015] dark:bg-white/[0.015] border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <span className="panel-title text-[11px] font-bold uppercase tracking-wider">Advanced Settings</span>
        </div>
        {isFilterPending && (
          <span className="text-[10px] font-mono text-[hsl(var(--primary))] animate-pulse">PENDING...</span>
        )}
      </div>

      <div className="panel-body flex flex-col gap-5 p-4 text-[13px]">
        
        {/* SECTION 1: CHANNEL SELECTION */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Channel Filters</span>
            <span title="Filter lines from specific system channels" className="cursor-pointer">
              <HelpCircle className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] opacity-75" />
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {(['A', 'B', 'C', 'D'] as const).map((cat) => {
              const checked = filters.categories[cat];
              const color = `var(--cat-${cat.toLowerCase()})`;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryToggle(cat)}
                  className={`flex items-center gap-2.5 rounded px-2.5 py-1.5 border text-left transition-all ${
                    checked 
                      ? 'border-[hsl(var(--border))] bg-black/5 dark:bg-white/5 text-[hsl(var(--foreground))] font-semibold' 
                      : 'border-transparent text-[hsl(var(--muted-foreground))] opacity-40 hover:bg-black/2 dark:hover:bg-white/2'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: `hsl(${color})` }} />
                  <span className="text-[12px] font-mono">SYS_{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-t border-[hsl(var(--border))]" />

        {/* SECTION 2: BOUNDARY CONFIGURATIONS */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Signal Thresholds</span>
          
          <div className="flex flex-col gap-3 mt-1.5 font-mono">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))] font-bold">
                <span>VALUE_MIN</span>
                <span className="text-[hsl(var(--foreground))] font-bold">{filters.valueMin}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.valueMin}
                onChange={(e) => updateFilters({ valueMin: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))] font-bold">
                <span>VALUE_MAX</span>
                <span className="text-[hsl(var(--foreground))] font-bold">{filters.valueMax}</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={filters.valueMax}
                onChange={(e) => updateFilters({ valueMax: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <hr className="border-t border-[hsl(var(--border))]" />

        {/* SECTION 3: PERFORMANCE STRESS TEST */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Stress Testing</span>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-normal mt-1">
            Simulates a heavy workload of 100k data points updating 1,000 points per tick to test rendering stability.
          </p>
          <button
            onClick={handleStressToggle}
            className={`btn w-full font-mono font-bold mt-2 py-2 flex items-center justify-center gap-2 border transition-all ${
              isStressTest 
                ? 'bg-red-600 hover:bg-red-500 border-transparent text-white shadow-sm' 
                : 'border-red-500/25 text-red-500/80 hover:bg-red-500/5 hover:border-red-500'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            {isStressTest ? 'DISABLE STRESS TEST' : 'TRIGGER STRESS TEST'}
          </button>
        </div>

      </div>
    </div>
  );
}
