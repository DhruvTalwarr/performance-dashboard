# Telemetry Analytics Engine - Performance-Critical Dashboard

A submission-ready, high-performance real-time telemetry visualization dashboard capable of rendering and streaming **10,000+ data points smoothly at 60fps**. Built from scratch in **Next.js 14 (App Router) & TypeScript** without external charting or state management libraries.

---

## Technical Stack & Decisions

1. **Next.js 14+ (App Router) & TypeScript**: Strict component separation. Page routes act as Server Components for initial load, while interactive elements are Client Components.
2. **Custom Hybrid Canvas + SVG Chart Rendering**:
   - **Canvas (Core drawing)**: Fast paint cycles for series lines, high-density scatter plots, heatmaps, and bar graphs. Draws 10k+ points in milliseconds.
   - **SVG (Overlays)**: Renders axes, scale ticks, guidelines, hover crosshairs, and hover selections.
3. **Manual Table Virtualization**: Renders only the visible rows in the viewport container (plus 10 rows overscan) to handle large logs without DOM bloat.
4. **React Context State**: State is localized to a specialized `DataProvider` using `useTransition` for non-blocking filter operations.
5. **No Forbidden Libraries**: Completely free of D3, Chart.js, Recharts, Redux, Zustand, or other heavyweight runtime utilities.

---

## Folder Structure

```
performance-dashboard/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   └── data/
│   │       └── route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── charts/
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── ScatterPlot.tsx
│   │   └── Heatmap.tsx
│   ├── controls/
│   │   ├── FilterPanel.tsx
│   │   └── TimeRangeSelector.tsx
│   ├── ui/
│   │   ├── DataTable.tsx
│   │   └── PerformanceMonitor.tsx
│   └── providers/
│       └── DataProvider.tsx
├── hooks/
│   ├── useDataStream.ts
│   ├── useChartRenderer.ts
│   ├── usePerformanceMonitor.ts
│   └── useVirtualization.ts
├── lib/
│   ├── dataGenerator.ts
│   ├── performanceUtils.ts
│   ├── canvasUtils.ts
│   └── types.ts
├── package.json
├── next.config.js
└── tsconfig.json
```

---

## Getting Started

### Prerequisites
- Node.js v18.x or later
- npm or yarn

### Installation
```bash
npm install
```

### Run Locally (Development)
```bash
npm run dev
```
Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to view the dashboard.

### Build for Production
To bundle and optimize the application:
```bash
npm run build
npm run start
```

---

## Features
- **Real-Time Data Streaming**: Simulates live points arriving every 100ms.
- **Sliding Window Buffer**: Limits data memory footprints with automatic ring buffers.
- **Advanced Controls**: Controls for tick pressure (up to 1,000 pts/100ms) and buffer limit sizes (up to 100,000 pts).
- **Interactive Graphs**: Smooth panning, zooming (mouse wheel), hover crosshairs, and legends.
- **Manual Virtual Table**: Supports columns sorting and filtering across thousands of lines.
- **Diagnostics Panel**: Tracks real-time FPS, Heap allocations, canvas paint latencies, and stress tests.

---

## Browser Compatibility
- Google Chrome (Full support, including `performance.memory` heap tracking).
- Firefox & Safari (Full canvas acceleration, with fallback estimated memory stats).
- Mobile & Tablet: Scalable layout stacking and touch inputs support.
