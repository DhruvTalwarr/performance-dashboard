'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../providers/DataProvider';
import { useChartRenderer } from '../../hooks/useChartRenderer';
import { setupCanvas, getCategoryColor } from '../../lib/canvasUtils';
import { LayoutGrid } from 'lucide-react';

const MARGIN = { top: 15, right: 15, bottom: 25, left: 35 };
const COLS = 12;
const ROWS = ['D', 'C', 'B', 'A'] as const;

export default function Heatmap() {
  const { filteredData, reportRenderTime } = useData();
  const [hoveredCell, setHoveredCell] = useState<{ col: number; row: number; val: number; ts: number } | null>(null);

  const { containerRef, canvasRef, dimensions, hoverPosition, interactionProps } = useChartRenderer({ margin: MARGIN });

  const { width, height } = dimensions;
  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const timeBounds = useMemo(() => {
    if (filteredData.length === 0) {
      return { min: 0, max: 1 };
    }
    // Fast path: timestamps are chronologically pre-sorted
    return {
      min: filteredData[0].timestamp,
      max: filteredData[filteredData.length - 1].timestamp
    };
  }, [filteredData]);

  const matrix = useMemo(() => {
    const grid = Array.from({ length: COLS }, () => {
      return {
        A: { sum: 0, count: 0 },
        B: { sum: 0, count: 0 },
        C: { sum: 0, count: 0 },
        D: { sum: 0, count: 0 },
      };
    });

    const span = timeBounds.max - timeBounds.min;
    if (span <= 0 || filteredData.length === 0) {
      return Array.from({ length: COLS }, (_, col) => ({
        timestamp: timeBounds.min + (col / COLS) * span,
        values: { A: 0, B: 0, C: 0, D: 0 }
      }));
    }

    for (let i = 0; i < filteredData.length; i++) {
      const p = filteredData[i];
      const pct = (p.timestamp - timeBounds.min) / span;
      let colIdx = Math.floor(pct * COLS);
      colIdx = Math.min(COLS - 1, Math.max(0, colIdx));

      const cell = grid[colIdx][p.category];
      cell.sum += p.value;
      cell.count += 1;
    }

    return grid.map((colData, col) => {
      const colStartTs = timeBounds.min + (col / COLS) * span;
      return {
        timestamp: colStartTs,
        values: {
          A: colData.A.count > 0 ? colData.A.sum / colData.A.count : 0,
          B: colData.B.count > 0 ? colData.B.sum / colData.B.count : 0,
          C: colData.C.count > 0 ? colData.C.sum / colData.C.count : 0,
          D: colData.D.count > 0 ? colData.D.sum / colData.D.count : 0,
        }
      };
    });
  }, [filteredData, timeBounds]);

  const getColorForValue = (val: number, isDark: boolean) => {
    if (val === 0) {
      return isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
    }
    const pct = Math.min(1, val / 120);

    // Controlled elegant color progression
    if (pct < 0.35) {
      const ratio = pct / 0.35;
      return isDark 
        ? `hsla(215, 15%, ${15 + ratio * 15}%, 0.5)` 
        : `hsla(215, 12%, ${92 - ratio * 10}%, 0.85)`;
    } else if (pct < 0.75) {
      const ratio = (pct - 0.35) / 0.4;
      return isDark
        ? `hsla(35, 45%, ${30 + ratio * 10}%, ${0.4 + ratio * 0.4})`
        : `hsla(35, 50%, ${60 - ratio * 10}%, ${0.6 + ratio * 0.3})`;
    } else {
      const ratio = (pct - 0.75) / 0.25;
      return isDark
        ? `hsla(355, 45%, 45%, ${0.8 + ratio * 0.2})`
        : `hsla(355, 45%, 45%, ${0.8 + ratio * 0.2})`;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const t0 = performance.now();
    ctx.clearRect(0, 0, width, height);

    if (matrix.length === 0) return;

    const isDark = document.documentElement.classList.contains('dark');
    const cellWidth = plotWidth / COLS;
    const cellHeight = plotHeight / ROWS.length;
    const padding = 1;

    // Background fill
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.005)' : 'rgba(0, 0, 0, 0.004)';
    ctx.fillRect(MARGIN.left, MARGIN.top, plotWidth, plotHeight);

    for (let col = 0; col < COLS; col++) {
      const colData = matrix[col];
      const cx = MARGIN.left + col * cellWidth;

      ROWS.forEach((rowName, rowIdx) => {
        const cy = MARGIN.top + rowIdx * cellHeight;
        const val = colData.values[rowName];

        ctx.fillStyle = getColorForValue(val, isDark);
        ctx.fillRect(cx + padding, cy + padding, cellWidth - padding * 2, cellHeight - padding * 2);
      });
    }

    reportRenderTime(performance.now() - t0);
  }, [matrix, width, height, plotWidth, plotHeight, reportRenderTime]);

  useEffect(() => {
    if (!hoverPosition || matrix.length === 0) {
      setHoveredCell(null);
      return;
    }

    const x = hoverPosition.x - MARGIN.left;
    const y = hoverPosition.y - MARGIN.top;

    if (x < 0 || x > plotWidth || y < 0 || y > plotHeight) {
      setHoveredCell(null);
      return;
    }

    const cellWidth = plotWidth / COLS;
    const cellHeight = plotHeight / ROWS.length;

    const col = Math.min(COLS - 1, Math.floor(x / cellWidth));
    const rowIdx = Math.min(ROWS.length - 1, Math.floor(y / cellHeight));
    const rowName = ROWS[rowIdx];

    const colData = matrix[col];
    const val = colData.values[rowName];

    setHoveredCell({ col, row: rowIdx, val, ts: colData.timestamp });
  }, [hoverPosition, matrix, plotWidth, plotHeight]);

  const formatXAxis = (val: number) => {
    if (val === 0 || isNaN(val) || !isFinite(val)) return '';
    return new Date(val).toISOString().split('T')[1].slice(0, -5);
  };

  return (
    <div className="panel select-none h-full min-h-[180px]">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <span className="panel-title">Operations Intensity Matrix</span>
        </div>

        {/* Legend color ramp */}
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-[hsl(var(--muted-foreground))] font-mono">
          <span>COOL</span>
          <div className="flex h-2.5 w-24 rounded overflow-hidden border border-[hsl(var(--border))]">
            <div className="flex-1 bg-neutral-300 dark:bg-neutral-800" />
            <div className="flex-1 bg-amber-400 dark:bg-amber-600" />
            <div className="flex-1 bg-rose-500 dark:bg-rose-700" />
          </div>
          <span>HOT</span>
        </div>
      </div>

      <div className="panel-body flex-grow">
        <div ref={containerRef} className="chart-container" style={{ height: '160px', width: '100%', position: 'relative' }}>
          <canvas ref={canvasRef} {...interactionProps} className="absolute inset-0 block h-full w-full" />

          <svg className="chart-svg-overlay absolute inset-0 w-full h-full">
            {ROWS.map((rowName, idx) => {
              const cellHeight = plotHeight / ROWS.length;
              const textY = MARGIN.top + idx * cellHeight + cellHeight / 2 + 3;
              return (
                <text
                  key={rowName}
                  x={MARGIN.left - 8}
                  y={textY}
                  textAnchor="end"
                  className="text-[9px] fill-[hsl(var(--foreground))] font-mono font-bold"
                >
                  SYS_{rowName}
                </text>
              );
            })}

            {matrix.length > 0 && [0, Math.floor(COLS / 2), COLS - 1].map((colIdx) => {
              const cellWidth = plotWidth / COLS;
              const textX = MARGIN.left + colIdx * cellWidth + cellWidth / 2;
              const ts = matrix[colIdx]?.timestamp;

              if (!ts) return null;
              return (
                <text
                  key={colIdx}
                  x={textX}
                  y={height - MARGIN.bottom + 12}
                  textAnchor="middle"
                  className="text-[9px] fill-[hsl(var(--muted-foreground))] font-mono font-semibold"
                >
                  {formatXAxis(ts)}
                </text>
              );
            })}
          </svg>

          {/* Redesigned Premium Tooltip */}
          {hoveredCell && (
            <div
              className="absolute rounded border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm p-1.5 pointer-events-none text-[10px] font-mono"
              style={{
                left: `${MARGIN.left + hoveredCell.col * (plotWidth / COLS) + (plotWidth / COLS) / 2 + 12}px`,
                top: `${MARGIN.top + hoveredCell.row * (plotHeight / ROWS.length) + (plotHeight / ROWS.length) / 2 - 35}px`,
              }}
            >
              <div className="font-bold border-b border-[hsl(var(--border))] pb-0.5 mb-1 flex items-center gap-1.5 text-[9px]">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(ROWS[hoveredCell.row], false) }} />
                SYS_{ROWS[hoveredCell.row]}
              </div>
              <div className="flex justify-between gap-3">
                <span>Intensity:</span>
                <span className="font-bold text-[hsl(var(--foreground))] tabular">{hoveredCell.val.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
