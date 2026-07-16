'use client';

import React, { createContext, useContext, useMemo, useState, useTransition, useRef } from 'react';
import { DataPoint, FilterState, TimeRangeOption, AggregationInterval, PerformanceMetrics } from '../../lib/types';
import { useDataStream } from '../../hooks/useDataStream';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

interface DataContextType {
  // Raw and computed data
  rawData: DataPoint[];
  processedData: DataPoint[]; // Filtered (and potentially aggregated)
  filteredData: DataPoint[];  // Filtered but not aggregated (useful for Scatter, etc.)
  isStreaming: boolean;
  pointsPerTick: number;
  bufferLimit: number;
  
  // Actions
  toggleStreaming: () => void;
  setPointsPerTick: (count: number) => void;
  setBufferLimit: (limit: number) => void;
  clearBuffer: () => void;
  
  // Filters
  filters: FilterState;
  updateFilters: (updates: Partial<FilterState>) => void;
  isFilterPending: boolean;

  // Performance
  metrics: PerformanceMetrics;
  reportRenderTime: (ms: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [rawData, streamControls, streamProcTime] = useDataStream(10000, 100);
  const [isPending, startTransition] = useTransition();

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    categories: { A: true, B: true, C: true, D: true },
    valueMin: 0,
    valueMax: 150,
    timeRange: 'all',
    aggregation: 'raw'
  });

  const updateFilters = (updates: Partial<FilterState>) => {
    startTransition(() => {
      setFilters(prev => ({ ...prev, ...updates }));
    });
  };

  // Process data (Filtering and Aggregation)
  const processed = useMemo(() => {
    const t0 = performance.now();
    
    if (rawData.length === 0) {
      return { filtered: [], aggregated: [], processingTime: 0 };
    }

    // 1. Determine Time Range Bounds based on the latest timestamp in the stream
    const latestTimestamp = rawData[rawData.length - 1].timestamp;
    let minTime = 0;
    
    switch (filters.timeRange) {
      case '1m':
        minTime = latestTimestamp - 60 * 1000;
        break;
      case '5m':
        minTime = latestTimestamp - 5 * 60 * 1000;
        break;
      case '15m':
        minTime = latestTimestamp - 15 * 60 * 1000;
        break;
      case '30m':
        minTime = latestTimestamp - 30 * 60 * 1000;
        break;
      case '1h':
        minTime = latestTimestamp - 60 * 60 * 1000;
        break;
      case 'all':
      default:
        minTime = 0;
    }

    // 2. Perform Filtering (Category, Value, Time)
    const filtered: DataPoint[] = [];
    const cats = filters.categories;
    const valMin = filters.valueMin;
    const valMax = filters.valueMax;

    for (let i = 0; i < rawData.length; i++) {
      const p = rawData[i];
      if (p.timestamp >= minTime && cats[p.category] && p.value >= valMin && p.value <= valMax) {
        filtered.push(p);
      }
    }

    // 3. Perform Aggregation if enabled
    if (filters.aggregation === 'raw') {
      const tEnd = performance.now();
      return { filtered, aggregated: filtered, processingTime: tEnd - t0 };
    }

    // Aggregation buckets (1m, 5m, 1h)
    let intervalMs = 60 * 1000;
    if (filters.aggregation === '5m') intervalMs = 5 * 60 * 1000;
    if (filters.aggregation === '1h') intervalMs = 60 * 60 * 1000;

    const buckets = new Map<number, { sum: number; m1: number; m2: number; count: number; category: 'A' | 'B' | 'C' | 'D' }>();
    
    for (let i = 0; i < filtered.length; i++) {
      const p = filtered[i];
      const roundedTime = Math.floor(p.timestamp / intervalMs) * intervalMs;
      
      let bucket = buckets.get(roundedTime);
      if (!bucket) {
        bucket = { sum: 0, m1: 0, m2: 0, count: 0, category: p.category };
        buckets.set(roundedTime, bucket);
      }
      bucket.sum += p.value;
      bucket.m1 += p.metric1;
      bucket.m2 += p.metric2;
      bucket.count += 1;
    }

    // Convert buckets to sorted DataPoints
    const aggregated: DataPoint[] = Array.from(buckets.entries())
      .map(([timestamp, b]) => ({
        timestamp,
        value: parseFloat((b.sum / b.count).toFixed(2)),
        category: b.category,
        metric1: parseFloat((b.m1 / b.count).toFixed(2)),
        metric2: parseFloat((b.m2 / b.count).toFixed(2))
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    const tEnd = performance.now();
    return { filtered, aggregated, processingTime: tEnd - t0 };
  }, [rawData, filters]);

  // Performance Monitor
  const renderedPointsRef = useRef(0);
  const totalProcessingTime = streamProcTime + processed.processingTime;

  const { metrics, reportRenderTime } = usePerformanceMonitor(
    rawData.length,
    renderedPointsRef.current,
    totalProcessingTime
  );

  // Sync rendered points count back for profiling display
  const reportPointsCount = (count: number) => {
    renderedPointsRef.current = count;
  };

  const contextValue = useMemo(() => {
    return {
      rawData,
      processedData: processed.aggregated,
      filteredData: processed.filtered,
      isStreaming: streamControls.isStreaming,
      pointsPerTick: streamControls.pointsPerTick,
      bufferLimit: streamControls.bufferLimit,
      
      toggleStreaming: streamControls.toggleStreaming,
      setPointsPerTick: streamControls.setPointsPerTick,
      setBufferLimit: streamControls.setBufferLimit,
      clearBuffer: streamControls.clearBuffer,
      
      filters,
      updateFilters,
      isFilterPending: isPending,

      metrics,
      reportRenderTime
    };
  }, [
    rawData,
    processed.aggregated,
    processed.filtered,
    streamControls,
    filters,
    isPending,
    metrics,
    reportRenderTime
  ]);

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
