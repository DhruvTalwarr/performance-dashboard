'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../providers/DataProvider';
import { useChartRenderer } from '../../hooks/useChartRenderer';
import { drawCanvasGrid, makeScaler, getCategoryColor } from '../../lib/canvasUtils';
import { DataPoint } from '../../lib/types';
import { Grid } from 'lucide-react';

const MARGIN = { top: 15, right: 15, bottom: 25, left: 35 };

export default function ScatterPlot() {
  const { filteredData, reportRenderTime } = useData();
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  const { containerRef, canvasRef, dimensions, hoverPosition, interactionProps } = useChartRenderer({ margin: MARGIN });

  const { width, height } = dimensions;
  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const bounds = useMemo(() => {
    // Lock boundaries to a static coordinate space to prevent visual jitter and bypass O(N) bounds loops
    return { xMin: 0, xMax: 120, yMin: 0, yMax: 200 };
  }, []);

  const xScale = useMemo(() => {
    return makeScaler(bounds.xMin, bounds.xMax, MARGIN.left, width - MARGIN.right);
  }, [bounds.xMin, bounds.xMax, width]);

  const yScale = useMemo(() => {
    return makeScaler(bounds.yMin, bounds.yMax, height - MARGIN.bottom, MARGIN.top);
  }, [bounds.yMin, bounds.yMax, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const t0 = performance.now();
    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.classList.contains('dark');

    // Grid backgrounds subtle fill
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.005)' : 'rgba(0, 0, 0, 0.004)';
    ctx.fillRect(MARGIN.left, MARGIN.top, plotWidth, plotHeight);

    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN.left, MARGIN.top);
    ctx.lineTo(MARGIN.left, height - MARGIN.bottom);
    ctx.lineTo(width - MARGIN.right, height - MARGIN.bottom);
    ctx.stroke();

    const xTicks = [bounds.xMin, bounds.xMin + (bounds.xMax - bounds.xMin) * 0.5, bounds.xMax];
    const yTicks = [bounds.yMin, bounds.yMin + (bounds.yMax - bounds.yMin) * 0.5, bounds.yMax];
    drawCanvasGrid(ctx, width, height, MARGIN, xTicks, yTicks, xScale, yScale, isDark);

    ctx.save();
    for (let i = 0; i < filteredData.length; i++) {
      const p = filteredData[i];
      const cx = xScale(p.value);
      const cy = yScale(p.metric1);

      if (cx >= MARGIN.left && cx <= width - MARGIN.right && cy >= MARGIN.top && cy <= height - MARGIN.bottom) {
        ctx.fillStyle = getCategoryColor(p.category, isDark, 0.5); // clean semi-transparency
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    ctx.restore();

    if (hoveredPoint) {
      const cx = xScale(hoveredPoint.value);
      const cy = yScale(hoveredPoint.metric1);
      ctx.save();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = getCategoryColor(hoveredPoint.category, isDark);
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    reportRenderTime(performance.now() - t0);
  }, [filteredData, width, height, xScale, yScale, bounds, hoveredPoint, reportRenderTime, plotWidth, plotHeight]);

  useEffect(() => {
    if (!hoverPosition || filteredData.length === 0) {
      setHoveredPoint(null);
      return;
    }

    let minDistance = 15;
    let closest: DataPoint | null = null;

    for (let i = 0; i < filteredData.length; i++) {
      const p = filteredData[i];
      const cx = xScale(p.value);
      const cy = yScale(p.metric1);

      const dx = cx - hoverPosition.x;
      const dy = cy - hoverPosition.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDistance) {
        minDistance = dist;
        closest = p;
      }
    }

    setHoveredPoint(closest);
  }, [hoverPosition, filteredData, xScale, yScale]);

  const xTicks = useMemo(() => {
    return [bounds.xMin, bounds.xMin + (bounds.xMax - bounds.xMin) * 0.5, bounds.xMax];
  }, [bounds]);

  const yTicks = useMemo(() => {
    return [bounds.yMin, bounds.yMin + (bounds.yMax - bounds.yMin) * 0.5, bounds.yMax];
  }, [bounds]);

  return (
    <div className="panel select-none h-full min-h-[180px]">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Grid className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <span className="panel-title">Value & Throughput Correlation</span>
        </div>
      </div>

      <div className="panel-body flex-grow">
        <div ref={containerRef} className="chart-container" style={{ height: '160px', width: '100%', position: 'relative' }}>
          <canvas
            ref={canvasRef}
            {...interactionProps}
            className="absolute inset-0 block h-full w-full"
          />

          <svg className="chart-svg-overlay absolute inset-0 w-full h-full">
            {yTicks.map((tick, i) => (
              <text
                key={i}
                x={MARGIN.left - 8}
                y={yScale(tick) + 3}
                textAnchor="end"
                className="text-[9px] fill-[hsl(var(--muted-foreground))] font-mono font-semibold"
              >
                {tick.toFixed(0)}
              </text>
            ))}

            {xTicks.map((tick, i) => (
              <text
                key={i}
                x={xScale(tick)}
                y={height - MARGIN.bottom + 12}
                textAnchor="middle"
                className="text-[9px] fill-[hsl(var(--muted-foreground))] font-mono font-semibold"
              >
                {tick.toFixed(0)}
              </text>
            ))}
          </svg>

          {/* Redesigned Premium Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute rounded border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm p-1.5 pointer-events-none text-[10px] font-mono"
              style={{
                left: `${xScale(hoveredPoint.value) + 12}px`,
                top: `${yScale(hoveredPoint.metric1) - 35}px`,
              }}
            >
              <div className="font-bold flex items-center gap-1.5 border-b border-[hsl(var(--border))] pb-0.5 mb-1 text-[9px]">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(hoveredPoint.category, false) }} />
                SYS_{hoveredPoint.category}
              </div>
              <div className="flex justify-between gap-3">
                <span>Value:</span>
                <span className="font-bold text-[hsl(var(--foreground))] tabular">{hoveredPoint.value.toFixed(1)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Throughput:</span>
                <span className="font-bold text-[hsl(var(--foreground))] tabular">{hoveredPoint.metric1.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
