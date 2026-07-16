import { useState, useEffect, useRef, useCallback } from 'react';
import { DataPoint } from '../lib/types';
import { generateSinglePoint, generateBulkData } from '../lib/dataGenerator';

interface StreamControls {
  isStreaming: boolean;
  pointsPerTick: number;
  bufferLimit: number;
  toggleStreaming: () => void;
  setPointsPerTick: (count: number) => void;
  setBufferLimit: (limit: number) => void;
  clearBuffer: () => void;
}

export function useDataStream(
  initialCount = 10000,
  intervalMs = 100
): [DataPoint[], StreamControls, number] {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [pointsPerTick, setPointsPerTickState] = useState(1); // Default: 1 new point per 100ms
  const [bufferLimit, setBufferLimitState] = useState(20000);
  const [processingTime, setProcessingTime] = useState(0);

  const dataRef = useRef<DataPoint[]>([]);
  const isStreamingRef = useRef(isStreaming);
  const pointsPerTickRef = useRef(pointsPerTick);
  const bufferLimitRef = useRef(bufferLimit);

  // Sync refs
  useEffect(() => { isStreamingRef.current = isStreaming; }, [isStreaming]);
  useEffect(() => { pointsPerTickRef.current = pointsPerTick; }, [pointsPerTick]);
  useEffect(() => { bufferLimitRef.current = bufferLimit; }, [bufferLimit]);

  // Initial bulk load
  useEffect(() => {
    const t0 = performance.now();
    const initialData = generateBulkData(initialCount, 100);
    dataRef.current = initialData;
    setData(initialData);
    setProcessingTime(performance.now() - t0);
  }, [initialCount]);

  // Stream effect
  useEffect(() => {
    let timerId: any = null;

    const tick = () => {
      if (!isStreamingRef.current) return;

      const t0 = performance.now();
      const now = Date.now();
      const currentBuffer = dataRef.current;
      const count = pointsPerTickRef.current;
      const limit = bufferLimitRef.current;

      let nextBuffer = [...currentBuffer];

      // Add points
      for (let i = 0; i < count; i++) {
        // Space points slightly within the 100ms window
        const ts = now - (count - 1 - i) * Math.floor(intervalMs / count);
        nextBuffer.push(generateSinglePoint(ts));
      }

      // Enforce sliding window (retention limit)
      if (nextBuffer.length > limit) {
        nextBuffer = nextBuffer.slice(nextBuffer.length - limit);
      }

      dataRef.current = nextBuffer;
      setData(nextBuffer);
      setProcessingTime(performance.now() - t0);
    };

    timerId = setInterval(tick, intervalMs);

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [intervalMs]);

  const toggleStreaming = useCallback(() => {
    setIsStreaming(prev => !prev);
  }, []);

  const setPointsPerTick = useCallback((count: number) => {
    setPointsPerTickState(Math.max(1, count));
  }, []);

  const setBufferLimit = useCallback((limit: number) => {
    setBufferLimitState(Math.max(1000, limit));
  }, []);

  const clearBuffer = useCallback(() => {
    const freshData = generateBulkData(100, 100);
    dataRef.current = freshData;
    setData(freshData);
  }, []);

  const controls: StreamControls = {
    isStreaming,
    pointsPerTick,
    bufferLimit,
    toggleStreaming,
    setPointsPerTick,
    setBufferLimit,
    clearBuffer
  };

  return [data, controls, processingTime];
}
