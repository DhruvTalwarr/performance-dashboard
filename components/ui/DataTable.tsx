'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../providers/DataProvider';
import { DataPoint } from '../../lib/types';
import { useVirtualization } from '../../hooks/useVirtualization';
import { ArrowUpDown, TableProperties, ShieldQuestion } from 'lucide-react';
import { getCategoryColor } from '../../lib/canvasUtils';

type SortKey = 'timestamp' | 'value' | 'category' | 'metric1' | 'metric2';
type SortOrder = 'asc' | 'desc';

const DataTableRow = React.memo(({ point, style, isDark }: { 
  point: DataPoint; 
  style: React.CSSProperties;
  isDark: boolean;
}) => {
  const dateStr = new Date(point.timestamp).toISOString().split('T')[1].slice(0, -1);
  const color = getCategoryColor(point.category, isDark);

  return (
    <div 
      className="flex border-b border-[hsl(var(--border))] hover:bg-black/2 dark:hover:bg-white/2 transition-colors items-center text-[11px] font-mono text-left"
      style={style}
    >
      <div className="flex-[2] px-4 font-semibold text-[hsl(var(--muted-foreground))] tabular">{dateStr}</div>
      <div className="flex-[1.5] px-4 flex items-center gap-2 font-bold">
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span>SYS_{point.category}</span>
      </div>
      <div className="flex-[2] px-4 font-bold text-right tabular text-[hsl(var(--foreground))]">{point.value.toFixed(1)}</div>
      <div className="flex-[2] px-4 text-right tabular text-[hsl(var(--muted-foreground))]">{point.metric1.toFixed(1)}</div>
      <div className="flex-[2] px-4 text-right tabular text-[hsl(var(--muted-foreground))]">{point.metric2.toFixed(1)}</div>
    </div>
  );
});

DataTableRow.displayName = 'DataTableRow';

export default function DataTable() {
  const { processedData, isStreaming } = useData();
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [tableData, setTableData] = useState<DataPoint[]>([]);

  useEffect(() => {
    if (!isStreaming) {
      setTableData(processedData);
      return;
    }

    const handler = setTimeout(() => {
      setTableData(processedData);
    }, 400);

    return () => clearTimeout(handler);
  }, [processedData, isStreaming]);

  const isDark = useMemo(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  }, []);

  const sortedData = useMemo(() => {
    if (tableData.length === 0) return [];
    
    if (sortKey === 'timestamp') {
      return sortOrder === 'desc' 
        ? [...tableData].reverse() 
        : tableData;
    }
    
    const clone = [...tableData];
    
    return clone.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      valA = valA as number;
      valB = valB as number;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [tableData, sortKey, sortOrder]);

  const ROW_HEIGHT = 26; // Increased from 24 for cleaner row breathing room

  const {
    containerRef,
    startIndex,
    endIndex,
    offsetY,
    totalHeight,
    handleScroll
  } = useVirtualization({
    rowHeight: ROW_HEIGHT,
    overscan: 10,
    totalCount: sortedData.length
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const visibleSlice = useMemo(() => {
    return sortedData.slice(startIndex, endIndex + 1);
  }, [sortedData, startIndex, endIndex]);

  return (
    <div className="panel flex-1 flex flex-col min-h-[300px] overflow-hidden select-none">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <TableProperties className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <span className="panel-title">System Activity Logs</span>
        </div>
        <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
          Buffer size: <span className="text-[hsl(var(--foreground))] font-bold">{sortedData.length.toLocaleString()}</span> records
        </span>
      </div>

      {/* Table Head */}
      <div className="flex bg-black/5 dark:bg-white/2 border-b border-[hsl(var(--border))] text-[10px] font-mono font-bold text-[hsl(var(--muted-foreground))] uppercase h-8 items-center shrink-0">
        <button onClick={() => toggleSort('timestamp')} className="flex-[2] px-4 flex items-center gap-1 hover:text-[hsl(var(--foreground))] text-left select-none outline-none">
          Timestamp <ArrowUpDown className="h-3 w-3" />
        </button>
        <button onClick={() => toggleSort('category')} className="flex-[1.5] px-4 flex items-center gap-1 hover:text-[hsl(var(--foreground))] text-left select-none outline-none">
          Origin <ArrowUpDown className="h-3 w-3" />
        </button>
        <button onClick={() => toggleSort('value')} className="flex-[2] px-4 flex items-center justify-end gap-1 hover:text-[hsl(var(--foreground))] text-right select-none outline-none">
          Value <ArrowUpDown className="h-3 w-3" />
        </button>
        <button onClick={() => toggleSort('metric1')} className="flex-[2] px-4 flex items-center justify-end gap-1 hover:text-[hsl(var(--foreground))] text-right select-none outline-none">
          Throughput <ArrowUpDown className="h-3 w-3" />
        </button>
        <button onClick={() => toggleSort('metric2')} className="flex-[2] px-4 flex items-center justify-end gap-1 hover:text-[hsl(var(--foreground))] text-right select-none outline-none">
          Latency <ArrowUpDown className="h-3 w-3" />
        </button>
      </div>

      {/* Virtualized Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative w-full"
        style={{ contentVisibility: 'auto' }}
      >
        {sortedData.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[hsl(var(--muted-foreground))] gap-2">
            <ShieldQuestion className="h-6 w-6 text-[hsl(var(--border))]" />
            <span className="text-[12px] font-medium">No matching logs found.</span>
          </div>
        ) : (
          <div style={{ height: `${totalHeight}px`, width: '100%', position: 'relative' }}>
            <div 
              style={{ 
                transform: `translateY(${offsetY}px)`, 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {visibleSlice.map((point, index) => {
                return (
                  <DataTableRow
                    key={`${point.timestamp}-${point.category}-${point.value}`}
                    point={point}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    isDark={isDark}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
