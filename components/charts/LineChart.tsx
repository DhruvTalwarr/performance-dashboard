'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../providers/DataProvider';
import { useChartRenderer } from '../../hooks/useChartRenderer';
import { makeScaler, makeInvertScaler, drawCanvasGrid, downsampleMinMax, getCategoryColor } from '../../lib/canvasUtils';
import { DataPoint } from '../../lib/types';
import { LineChart as ChartIcon } from 'lucide-react';

const MARGIN = { top: 15, right: 15, bottom: 25, left: 35 };

export default function LineChart() {
  const { processedData, reportRenderTime } = useData();
  const [activeSeries, setActiveSeries] = useState({ A: true, B: true, C: true, D: true });
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; points: DataPoint[] } | null>(null);

  const {
    containerRef,
    canvasRef,
    dimensions,
    viewport,
    setChartViewport,
    hoverPosition,
    interactionProps
  } = useChartRenderer({
    margin: MARGIN
  });

  const { width, height } = dimensions;
  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const dataBounds = useMemo(() => {
    if (processedData.length === 0) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 100 };
    }
    const xMin = processedData[0].timestamp;
    const xMax = processedData[processedData.length - 1].timestamp;
    
    let yMax = -Infinity;
    for (let i = 0; i < processedData.length; i++) {
      const val = processedData[i].value;
      if (val > yMax) yMax = val;
    }

    yMax = Math.max(10, yMax * 1.12);
    return { xMin, xMax, yMin: 0, yMax };
  }, [processedData]);

  useEffect(() => {
    if (!viewport) {
      setChartViewport(dataBounds);
    } else {
      const isZoomed = viewport.xMax < dataBounds.xMax - 5000 || viewport.xMin > dataBounds.xMin + 5000;
      if (!isZoomed) {
        setChartViewport(dataBounds);
      } else {
        const windowSize = viewport.xMax - viewport.xMin;
        setChartViewport({
          ...viewport,
          xMin: dataBounds.xMax - windowSize,
          xMax: dataBounds.xMax,
          yMax: dataBounds.yMax
        });
      }
    }
  }, [dataBounds, setChartViewport]);

  const activeVp = viewport || dataBounds;

  const xScale = useMemo(() => {
    return makeScaler(activeVp.xMin, activeVp.xMax, MARGIN.left, width - MARGIN.right);
  }, [activeVp.xMin, activeVp.xMax, width]);

  const yScale = useMemo(() => {
    return makeScaler(activeVp.yMin, activeVp.yMax, height - MARGIN.bottom, MARGIN.top);
  }, [activeVp.yMin, activeVp.yMax, height]);

  const invertXScale = useMemo(() => {
    return makeInvertScaler(activeVp.xMin, activeVp.xMax, MARGIN.left, width - MARGIN.right);
  }, [activeVp.xMin, activeVp.xMax, width]);

  const seriesData = useMemo(() => {
    const grouped = { A: [], B: [], C: [], D: [] } as Record<'A'|'B'|'C'|'D', DataPoint[]>;

    for (let i = 0; i < processedData.length; i++) {
      const p = processedData[i];
      if (p.timestamp >= activeVp.xMin && p.timestamp <= activeVp.xMax) {
        grouped[p.category].push(p);
      }
    }

    const targetPoints = Math.max(100, plotWidth);
    return {
      A: activeSeries.A ? downsampleMinMax(grouped.A, targetPoints) : [],
      B: activeSeries.B ? downsampleMinMax(grouped.B, targetPoints) : [],
      C: activeSeries.C ? downsampleMinMax(grouped.C, targetPoints) : [],
      D: activeSeries.D ? downsampleMinMax(grouped.D, targetPoints) : [],
    };
  }, [processedData, activeVp.xMin, activeVp.xMax, activeSeries, plotWidth]);

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

    const xTicks = [
      activeVp.xMin,
      activeVp.xMin + (activeVp.xMax - activeVp.xMin) * 0.25,
      activeVp.xMin + (activeVp.xMax - activeVp.xMin) * 0.5,
      activeVp.xMin + (activeVp.xMax - activeVp.xMin) * 0.75,
      activeVp.xMax,
    ];

    const yTicks = [
      activeVp.yMin,
      activeVp.yMin + (activeVp.yMax - activeVp.yMin) * 0.25,
      activeVp.yMin + (activeVp.yMax - activeVp.yMin) * 0.5,
      activeVp.yMin + (activeVp.yMax - activeVp.yMin) * 0.75,
      activeVp.yMax,
    ];

    drawCanvasGrid(ctx, width, height, MARGIN, xTicks, yTicks, xScale, yScale, isDark);

    Object.entries(seriesData).forEach(([cat, points]) => {
      if (points.length < 2) return;
      
      ctx.save();
      ctx.strokeStyle = getCategoryColor(cat as 'A' | 'B' | 'C' | 'D', isDark);
      ctx.lineWidth = 1.5; // Crispy telemetry lines
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(xScale(points[0].timestamp), yScale(points[0].value));
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(xScale(points[i].timestamp), yScale(points[i].value));
      }
      ctx.stroke();
      ctx.restore();
    });

    reportRenderTime(performance.now() - t0);
  }, [seriesData, width, height, xScale, yScale, activeVp, reportRenderTime, plotWidth, plotHeight]);

  useEffect(() => {
    if (!hoverPosition || processedData.length === 0) {
      setTooltipData(null);
      return;
    }

    const mouseTime = invertXScale(hoverPosition.x);
    const closest: DataPoint[] = [];
    const thresholdMs = (activeVp.xMax - activeVp.xMin) * 0.05;

    Object.keys(activeSeries).forEach((catKey) => {
      const cat = catKey as 'A' | 'B' | 'C' | 'D';
      if (!activeSeries[cat]) return;

      const points = processedData.filter(p => p.category === cat);
      if (points.length === 0) return;

      let low = 0, high = points.length - 1;
      let bestPoint = points[0];
      let minDiff = Math.abs(points[0].timestamp - mouseTime);

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const diff = Math.abs(points[mid].timestamp - mouseTime);
        if (diff < minDiff) {
          minDiff = diff;
          bestPoint = points[mid];
        }
        if (points[mid].timestamp < mouseTime) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      if (minDiff < thresholdMs) {
        closest.push(bestPoint);
      }
    });

    if (closest.length > 0) {
      setTooltipData({
        x: hoverPosition.x,
        y: hoverPosition.y,
        points: closest
      });
    } else {
      setTooltipData(null);
    }
  }, [hoverPosition, processedData, activeSeries, invertXScale, activeVp]);

  const xTicks = useMemo(() => {
    return [activeVp.xMin, activeVp.xMin + (activeVp.xMax - activeVp.xMin) * 0.5, activeVp.xMax];
  }, [activeVp.xMin, activeVp.xMax]);

  const yTicks = useMemo(() => {
    return [activeVp.yMin, activeVp.yMin + (activeVp.yMax - activeVp.yMin) * 0.5, activeVp.yMax];
  }, [activeVp.yMin, activeVp.yMax]);

  const formatXAxis = (val: number) => {
    if (val === 0 || isNaN(val) || !isFinite(val)) return '';
    return new Date(val).toISOString().split('T')[1].slice(0, -5);
  };

  return (
    <div className="panel select-none h-full min-h-[220px]">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <ChartIcon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <span className="panel-title">System Metrics Over Time</span>
        </div>

        {/* Legend buttons */}
        <div className="flex gap-2">
          {(['A', 'B', 'C', 'D'] as const).map((cat) => {
            const checked = activeSeries[cat];
            const color = getCategoryColor(cat, false);
            return (
              <button
                key={cat}
                onClick={() => setActiveSeries(p => ({ ...p, [cat]: !p[cat] }))}
                className="btn btn-sm font-semibold border flex items-center gap-2 transition-all text-[10px] py-1 px-2.5"
                style={{
                  borderColor: checked ? color : 'hsl(var(--border))',
                  backgroundColor: checked ? 'rgba(0,0,0,0.03)' : 'transparent',
                  color: checked ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'
                }}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                SYS_{cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel-body flex-grow">
        <div ref={containerRef} className="chart-container" style={{ height: '200px', width: '100%', position: 'relative' }}>
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
                {formatXAxis(tick)}
              </text>
            ))}

            {tooltipData && (
              <line
                x1={tooltipData.x}
                y1={MARGIN.top}
                x2={tooltipData.x}
                y2={height - MARGIN.bottom}
                stroke="hsl(var(--border))"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}
          </svg>

          {/* Redesigned Premium Tooltip */}
          {tooltipData && (
            <div
              className="absolute rounded border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-md p-2 flex flex-col gap-1 z-20 pointer-events-none text-[10px] font-mono"
              style={{
                left: `${tooltipData.x + 12 + (tooltipData.x > plotWidth - 110 ? -140 : 0)}px`,
                top: `${tooltipData.y - 12 + (tooltipData.y > plotHeight - 80 ? -80 : 0)}px`,
              }}
            >
              <div className="font-bold text-[9px] text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))] pb-1 mb-1 text-center">
                TIME: {formatXAxis(tooltipData.points[0].timestamp)}
              </div>
              {tooltipData.points.map((p) => {
                const color = getCategoryColor(p.category, false);
                return (
                  <div key={p.category} className="flex justify-between gap-4 items-center">
                    <span className="font-semibold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      SYS_{p.category}:
                    </span>
                    <span className="font-bold text-[hsl(var(--foreground))] tabular">{p.value.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
