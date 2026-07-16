import { useState, useEffect, useRef, useCallback } from 'react';
import { PerformanceMetrics } from '../lib/types';
import { PerformanceTracker } from '../lib/performanceUtils';

export function usePerformanceMonitor(
  activePointsCount: number,
  renderedPointsCount: number,
  initialProcessingTime = 0
) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderTime: 0,
    processingTime: initialProcessingTime,
    activePointsCount: 0,
    renderedPointsCount: 0
  });

  const trackerRef = useRef<PerformanceTracker | null>(null);
  const renderTimesRef = useRef<number[]>([]);
  const processingTimesRef = useRef<number[]>([]);
  const fpsRef = useRef(60);

  // Initialize tracker
  useEffect(() => {
    trackerRef.current = new PerformanceTracker();
    
    let animFrameId: number;
    const loop = () => {
      if (trackerRef.current) {
        fpsRef.current = trackerRef.current.tick();
      }
      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  // Periodic UI update (throttled to every 300ms to avoid clogging the react render cycle)
  useEffect(() => {
    const interval = setInterval(() => {
      const tracker = trackerRef.current;
      const mem = tracker ? tracker.getMemory() : null;

      // Average the render times collected in this period
      const renders = renderTimesRef.current;
      const avgRender = renders.length > 0 
        ? renders.reduce((a, b) => a + b, 0) / renders.length 
        : 0;
      renderTimesRef.current = [];

      // Average processing times collected
      const procs = processingTimesRef.current;
      const avgProc = procs.length > 0
        ? procs.reduce((a, b) => a + b, 0) / procs.length
        : 0;
      processingTimesRef.current = [];

      setMetrics({
        fps: fpsRef.current,
        renderTime: parseFloat(avgRender.toFixed(2)),
        processingTime: parseFloat((avgProc || initialProcessingTime).toFixed(2)),
        activePointsCount,
        renderedPointsCount,
        memoryUsed: mem ? mem.usedJSHeapSize / (1024 * 1024) : undefined,
        memoryLimit: mem ? mem.jsHeapSizeLimit / (1024 * 1024) : undefined
      });
    }, 300);

    return () => clearInterval(interval);
  }, [activePointsCount, renderedPointsCount, initialProcessingTime]);

  const reportRenderTime = useCallback((timeMs: number) => {
    renderTimesRef.current.push(timeMs);
  }, []);

  const reportProcessingTime = useCallback((timeMs: number) => {
    processingTimesRef.current.push(timeMs);
  }, []);

  return {
    metrics,
    reportRenderTime,
    reportProcessingTime
  };
}
