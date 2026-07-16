'use client';

import React, { useEffect, useMemo } from 'react';
import { useData } from '../providers/DataProvider';
import { useChartRenderer } from '../../hooks/useChartRenderer';
import { drawCanvasGrid, makeScaler, getCategoryColor } from '../../lib/canvasUtils';
import { BarChart3 } from 'lucide-react';

const MARGIN = { top: 15, right: 15, bottom: 25, left: 35 };

export default function BarChart() {
  const { filteredData, reportRenderTime } = useData();

  const { containerRef, canvasRef, dimensions } = useChartRenderer({ margin: MARGIN });

  const { width, height } = dimensions;
  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const averages = useMemo(() => {
    const aggregates = {
      A: { sumVal: 0, sumM1: 0, count: 0 },
      B: { sumVal: 0, sumM1: 0, count: 0 },
      C: { sumVal: 0, sumM1: 0, count: 0 },
      D: { sumVal: 0, sumM1: 0, count: 0 },
    };

    for (let i = 0; i < filteredData.length; i++) {
      const p = filteredData[i];
      const entry = aggregates[p.category];
      entry.sumVal += p.value;
      entry.sumM1 += p.metric1;
      entry.count += 1;
    }

    return Object.entries(aggregates).map(([category, data]) => ({
      category: category as 'A' | 'B' | 'C' | 'D',
      avgValue: data.count > 0 ? data.sumVal / data.count : 0,
      avgThroughput: data.count > 0 ? data.sumM1 / data.count : 0,
    }));
  }, [filteredData]);

  const yMax = useMemo(() => {
    let max = 10;
    averages.forEach(avg => {
      if (avg.avgValue > max) max = avg.avgValue;
      if (avg.avgThroughput > max) max = avg.avgThroughput;
    });
    return max * 1.12;
  }, [averages]);

  const yScale = useMemo(() => {
    return makeScaler(0, yMax, height - MARGIN.bottom, MARGIN.top);
  }, [yMax, height]);

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

    const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];
    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);

    yTicks.forEach(tick => {
      const y = yScale(tick);
      if (y >= MARGIN.top && y <= height - MARGIN.bottom) {
        ctx.beginPath();
        ctx.moveTo(MARGIN.left, y);
        ctx.lineTo(width - MARGIN.right, y);
        ctx.stroke();
      }
    });
    ctx.restore();

    const categoriesCount = averages.length;
    const sectionWidth = plotWidth / categoriesCount;
    const paddingMultiplier = 0.35;
    const innerBarSpacing = 4;

    const colorsM1 = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';

    averages.forEach((avg, i) => {
      const sectionX = MARGIN.left + i * sectionWidth;
      const contentWidth = sectionWidth * (1 - paddingMultiplier);
      const startX = sectionX + (sectionWidth * paddingMultiplier) / 2;
      const barWidth = (contentWidth - innerBarSpacing) / 2;

      const yVal = yScale(avg.avgValue);
      const hVal = height - MARGIN.bottom - yVal;
      ctx.fillStyle = getCategoryColor(avg.category, isDark);
      ctx.fillRect(startX, yVal, barWidth, Math.max(1, hVal));

      const yM1 = yScale(avg.avgThroughput);
      const hM1 = height - MARGIN.bottom - yM1;
      ctx.fillStyle = colorsM1;
      ctx.fillRect(startX + barWidth + innerBarSpacing, yM1, barWidth, Math.max(1, hM1));
    });

    reportRenderTime(performance.now() - t0);
  }, [averages, width, height, yScale, yMax, reportRenderTime, plotWidth, plotHeight]);

  const yTicks = useMemo(() => {
    return [0, yMax * 0.5, yMax];
  }, [yMax]);

  return (
    <div className="panel select-none h-full min-h-[160px]">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <span className="panel-title">System Metrics Comparison</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-[hsl(var(--primary))]" />
            <span className="text-[hsl(var(--muted-foreground))]">AVG VALUE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-neutral-300 dark:bg-neutral-700" />
            <span className="text-[hsl(var(--muted-foreground))]">THROUGHPUT</span>
          </div>
        </div>
      </div>

      <div className="panel-body flex-grow">
        <div ref={containerRef} className="chart-container" style={{ height: '140px', width: '100%', position: 'relative' }}>
          <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
          
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

            {averages.map((avg, i) => {
              const plotWidth = width - MARGIN.left - MARGIN.right;
              const sectionWidth = plotWidth / averages.length;
              const textX = MARGIN.left + i * sectionWidth + sectionWidth / 2;

              return (
                <text
                  key={avg.category}
                  x={textX}
                  y={height - MARGIN.bottom + 12}
                  textAnchor="middle"
                  className="text-[10px] fill-[hsl(var(--foreground))] font-mono font-bold"
                >
                  SYS_{avg.category}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
