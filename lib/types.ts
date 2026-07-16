export interface DataPoint {
  timestamp: number; // Epoch milliseconds
  value: number;     // Primary metric
  category: 'A' | 'B' | 'C' | 'D';
  metric1: number;   // Secondary metric (e.g. CPU load / throughput)
  metric2: number;   // Tertiary metric (e.g. latency)
}

export interface ChartConfig {
  margin: { top: number; right: number; bottom: number; left: number };
  gridLines: boolean;
  showTooltip: boolean;
  colorPalette: Record<string, string>;
}

export interface ViewportState {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export type TimeRangeOption = '1m' | '5m' | '15m' | '30m' | '1h' | 'all';
export type AggregationInterval = 'raw' | '1m' | '5m' | '1h';

export interface FilterState {
  categories: { A: boolean; B: boolean; C: boolean; D: boolean };
  valueMin: number;
  valueMax: number;
  timeRange: TimeRangeOption;
  aggregation: AggregationInterval;
}

export interface AggregationBucket {
  timestamp: number;
  value: number;
  metric1: number;
  metric2: number;
  count: number;
}

export interface PerformanceMetrics {
  fps: number;
  renderTime: number;      // ms spent in canvas draw
  processingTime: number;  // ms spent in filtering/downsampling
  activePointsCount: number; // total points in system
  renderedPointsCount: number; // points actually pushed to canvas
  memoryUsed?: number;     // MB, browser memory if available
  memoryLimit?: number;    // MB, browser memory limit if available
}
