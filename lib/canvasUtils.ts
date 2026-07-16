import { DataPoint } from './types';

export function getCategoryColor(cat: 'A' | 'B' | 'C' | 'D', isDark: boolean, alpha = 1): string {
  if (isDark) {
    switch (cat) {
      case 'A': return `hsla(217, 91%, 60%, ${alpha})`;
      case 'B': return `hsla(142, 70%, 45%, ${alpha})`;
      case 'C': return `hsla(48, 96%, 53%, ${alpha})`;
      case 'D': return `hsla(347, 87%, 58%, ${alpha})`;
    }
  } else {
    switch (cat) {
      case 'A': return `hsla(221, 83%, 53%, ${alpha})`;
      case 'B': return `hsla(142, 76%, 36%, ${alpha})`;
      case 'C': return `hsla(38, 92%, 50%, ${alpha})`;
      case 'D': return `hsla(347, 77%, 50%, ${alpha})`;
    }
  }
  return `rgba(128, 128, 128, ${alpha})`;
}

// Scale canvas for device pixel ratio to prevent blurriness
export function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D | null {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
  return ctx;
}

// Fast Min-Max Downsampling: shrinks N points to 2 * targetCount points, preserving peaks and troughs
export function downsampleMinMax(data: DataPoint[], targetCount: number): DataPoint[] {
  const n = data.length;
  if (n <= targetCount * 2 || targetCount <= 0) return data;

  const downsampled: DataPoint[] = [];
  const bucketSize = n / targetCount;

  for (let i = 0; i < targetCount; i++) {
    const start = Math.floor(i * bucketSize);
    const end = Math.min(Math.floor((i + 1) * bucketSize), n);

    if (start >= end) continue;

    let minIndex = start;
    let maxIndex = start;
    let minValue = data[start].value;
    let maxValue = data[start].value;

    for (let j = start + 1; j < end; j++) {
      const val = data[j].value;
      if (val < minValue) {
        minValue = val;
        minIndex = j;
      }
      if (val > maxValue) {
        maxValue = val;
        maxIndex = j;
      }
    }

    // Add min and max in chronological order
    if (minIndex < maxIndex) {
      downsampled.push(data[minIndex]);
      downsampled.push(data[maxIndex]);
    } else if (minIndex > maxIndex) {
      downsampled.push(data[maxIndex]);
      downsampled.push(data[minIndex]);
    } else {
      downsampled.push(data[minIndex]);
    }
  }

  return downsampled;
}

// Draw a grid on the canvas background
export function drawCanvasGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  margin: { top: number; right: number; bottom: number; left: number },
  xTicks: number[],
  yTicks: number[],
  xScale: (v: number) => number,
  yScale: (v: number) => number,
  isDark: boolean
) {
  ctx.save();
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);

  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Vertical grid lines
  xTicks.forEach(tick => {
    const x = xScale(tick);
    if (x >= margin.left && x <= width - margin.right) {
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, height - margin.bottom);
      ctx.stroke();
    }
  });

  // Horizontal grid lines
  yTicks.forEach(tick => {
    const y = yScale(tick);
    if (y >= margin.top && y <= height - margin.bottom) {
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }
  });

  ctx.restore();
}

// Projection scaler helper
export function makeScaler(
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number
): (val: number) => number {
  const domainRange = domainMax - domainMin;
  const rangeRange = rangeMax - rangeMin;
  
  if (domainRange === 0) {
    return () => rangeMin + rangeRange / 2;
  }
  
  return (val: number) => {
    return rangeMin + ((val - domainMin) / domainRange) * rangeRange;
  };
}

// Reverse scaler helper (screen pixel coordinates back to domain value, useful for tooltips & panning)
export function makeInvertScaler(
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number
): (pixel: number) => number {
  const domainRange = domainMax - domainMin;
  const rangeRange = rangeMax - rangeMin;

  if (rangeRange === 0) {
    return () => domainMin;
  }

  return (pixel: number) => {
    return domainMin + ((pixel - rangeMin) / rangeRange) * domainRange;
  };
}
