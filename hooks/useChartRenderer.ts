import { useEffect, useRef, useState, useCallback } from 'react';
import { ViewportState } from '../lib/types';
import { setupCanvas } from '../lib/canvasUtils';

interface RendererConfig {
  margin: { top: number; right: number; bottom: number; left: number };
  onViewportChange?: (viewport: ViewportState) => void;
}

export function useChartRenderer(config: RendererConfig) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 300 });
  const [viewport, setViewport] = useState<ViewportState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const viewportRef = useRef<ViewportState | null>(null);

  // Sync viewport ref
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  // Handle Container Resizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      // Prevent dimensions from going to 0
      const w = Math.max(100, width);
      const h = Math.max(100, height);
      setDimensions({ width: w, height: h });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Update canvas setup on dimension change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setupCanvas(canvas, dimensions.width, dimensions.height);
  }, [dimensions]);

  // Reset viewport when bounds or scale changes (if parent needs override)
  const setChartViewport = useCallback((vp: ViewportState) => {
    setViewport(vp);
  }, []);

  // Interaction: Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!viewportRef.current || !canvasRef.current) return;
    e.preventDefault();

    const { margin } = config;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - margin.left;
    const plotWidth = dimensions.width - margin.left - margin.right;
    
    // Zoom factor based on wheel direction
    const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;

    const currentVp = viewportRef.current;
    const xRange = currentVp.xMax - currentVp.xMin;
    
    // Zoom centered around mouse cursor if within plot area, else center
    let mousePct = 0.5;
    if (mouseX >= 0 && mouseX <= plotWidth) {
      mousePct = mouseX / plotWidth;
    }

    const newRange = xRange * zoomFactor;
    const zoomPoint = currentVp.xMin + xRange * mousePct;

    const newXMin = zoomPoint - newRange * mousePct;
    const newXMax = zoomPoint + newRange * (1 - mousePct);

    // Zoom Y scale proportionally
    const yRange = currentVp.yMax - currentVp.yMin;
    const newYRange = yRange * zoomFactor;
    const yCenter = currentVp.yMin + yRange / 2;
    const newYMin = yCenter - newYRange / 2;
    const newYMax = yCenter + newYRange / 2;

    const nextVp = {
      xMin: newXMin,
      xMax: newXMax,
      yMin: Math.max(0, newYMin),
      yMax: newYMax,
    };

    setViewport(nextVp);
    if (config.onViewportChange) {
      config.onViewportChange(nextVp);
    }
  }, [dimensions, config]);

  // Interaction: Panning handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!viewportRef.current || e.button !== 0) return; // Only left click
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Only set hover within plot margin boundaries
    const { margin } = config;
    if (
      x >= margin.left && 
      x <= dimensions.width - margin.right && 
      y >= margin.top && 
      y <= dimensions.height - margin.bottom
    ) {
      setHoverPosition({ x, y });
    } else {
      setHoverPosition(null);
    }

    if (!isPanning || !panStartRef.current || !viewportRef.current) return;

    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    panStartRef.current = { x: e.clientX, y: e.clientY };

    const currentVp = viewportRef.current;
    const plotWidth = dimensions.width - margin.left - margin.right;
    const plotHeight = dimensions.height - margin.top - margin.bottom;

    const xSpan = currentVp.xMax - currentVp.xMin;
    const ySpan = currentVp.yMax - currentVp.yMin;

    // Shift bounds based on pixels dragged
    const shiftX = (dx / plotWidth) * xSpan;
    const shiftY = (dy / plotHeight) * ySpan;

    const nextVp = {
      xMin: currentVp.xMin - shiftX,
      xMax: currentVp.xMax - shiftX,
      yMin: Math.max(0, currentVp.yMin + shiftY), // y-coordinates are inverted on canvas
      yMax: currentVp.yMax + shiftY,
    };

    setViewport(nextVp);
    if (config.onViewportChange) {
      config.onViewportChange(nextVp);
    }
  }, [isPanning, dimensions, config]);

  const handleMouseUpOrLeave = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
    if (!isPanning) {
      setHoverPosition(null);
    }
  }, [isPanning]);

  return {
    containerRef,
    canvasRef,
    dimensions,
    viewport,
    setChartViewport,
    hoverPosition,
    interactionProps: {
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUpOrLeave,
      onMouseLeave: handleMouseUpOrLeave,
      style: { cursor: isPanning ? 'grabbing' : 'crosshair' }
    }
  };
}
