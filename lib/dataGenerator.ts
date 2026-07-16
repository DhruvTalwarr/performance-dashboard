import { DataPoint } from './types';

// Deterministic random helper to ensure consistency if needed, or normal Math.random for real-time
function generateNoise(amplitude: number): number {
  return (Math.random() - 0.5) * amplitude;
}

const CATEGORIES: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

const BASE_CONFIGS = {
  A: { base: 60, amplitude: 10, noise: 5, freq: 0.0001, trend: 0.01 },
  B: { base: 40, amplitude: 15, noise: 8, freq: 0.0002, trend: -0.005 },
  C: { base: 80, amplitude: 5, noise: 3, freq: 0.00005, trend: 0.02 },
  D: { base: 20, amplitude: 20, noise: 12, freq: 0.0003, trend: 0.008 }
};

export function generateSinglePoint(timestamp: number, category?: 'A' | 'B' | 'C' | 'D'): DataPoint {
  const cat = category || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const config = BASE_CONFIGS[cat];

  // Trend + Sine wave + Noise + Occasional Spike
  const trendOffset = (timestamp % 3600000) * config.trend * 0.001; // hourly repeating trend
  const sineWave = Math.sin(timestamp * config.freq) * config.amplitude;
  const noise = generateNoise(config.noise);
  
  // 0.5% chance of a spike
  const isSpike = Math.random() < 0.005;
  const spike = isSpike ? (Math.random() > 0.5 ? 40 : -30) : 0;

  const value = Math.max(0, config.base + sineWave + trendOffset + noise + spike);

  // Metric 1: correlation metric (e.g., throughput, depends on value and category)
  const metric1 = Math.max(0, value * 1.5 + generateNoise(5));

  // Metric 2: correlation metric (e.g., latency, inversely proportional to metric1 under high load, or random walk)
  const metric2 = Math.max(5, 200 - value * 1.8 + generateNoise(15) + (isSpike ? 150 : 0));

  return {
    timestamp,
    value: parseFloat(value.toFixed(2)),
    category: cat,
    metric1: parseFloat(metric1.toFixed(2)),
    metric2: parseFloat(metric2.toFixed(2))
  };
}

export function generateBulkData(count: number, intervalMs = 100): DataPoint[] {
  const data: DataPoint[] = new Array(count);
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    // Generate timestamps backwards from now
    const timestamp = now - (count - 1 - i) * intervalMs;
    // Distribute categories evenly
    const category = CATEGORIES[i % CATEGORIES.length];
    data[i] = generateSinglePoint(timestamp, category);
  }

  return data;
}
