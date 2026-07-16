import { useState, useEffect, useCallback, useRef } from 'react';

interface VirtualizationConfig {
  rowHeight: number;
  overscan?: number;
  totalCount: number;
}

export function useVirtualization({
  rowHeight,
  overscan = 10,
  totalCount
}: VirtualizationConfig) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);

  // ResizeObserver to track container height
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      setViewportHeight(container.clientHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize(); // Initial measurement

    return () => resizeObserver.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Compute virtual layout
  const totalHeight = totalCount * rowHeight;
  
  let startIndex = Math.floor(scrollTop / rowHeight) - overscan;
  startIndex = Math.max(0, startIndex);

  let endIndex = Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan;
  endIndex = Math.min(totalCount - 1, endIndex);

  // Offset translateY to position the visible block correctly
  const offsetY = startIndex * rowHeight;

  return {
    containerRef,
    startIndex,
    endIndex,
    offsetY,
    totalHeight,
    handleScroll
  };
}
