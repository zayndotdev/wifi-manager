import * as React from 'react';
import { formatSpeed } from '../../lib/formatters';

interface LiveSpeedChartProps {
  currentDownloadBps: number;
  currentUploadBps: number;
  height?: number;
  showLegend?: boolean;
  className?: string;
}

interface SpeedPoint {
  time: number;
  down: number;
  up: number;
}

export const LiveSpeedChart: React.FC<LiveSpeedChartProps> = ({
  currentDownloadBps,
  currentUploadBps,
  height = 160,
  showLegend = true,
  className = '',
}) => {
  const [history, setHistory] = React.useState<SpeedPoint[]>(() => {
    const initial: SpeedPoint[] = [];
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      initial.push({ time: now - i * 1000, down: 0, up: 0 });
    }
    return initial;
  });

  React.useEffect(() => {
    setHistory((prev) => {
      const now = Date.now();
      const next = [...prev.slice(-45), { time: now, down: currentDownloadBps, up: currentUploadBps }];
      return next;
    });
  }, [currentDownloadBps, currentUploadBps]);

  const maxVal = React.useMemo(() => {
    let max = 100000; // minimum scale ~100 KB/s
    for (const p of history) {
      if (p.down > max) max = p.down;
      if (p.up > max) max = p.up;
    }
    return max * 1.15; // 15% headroom
  }, [history]);

  const peakDown = React.useMemo(() => Math.max(0, ...history.map((h) => h.down)), [history]);
  const peakUp = React.useMemo(() => Math.max(0, ...history.map((h) => h.up)), [history]);

  // Construct SVG points
  const width = 600;
  const paddingBottom = 20;
  const graphHeight = height - paddingBottom;

  const getDownY = (val: number) => graphHeight - (val / maxVal) * graphHeight + 5;
  const getUpY = (val: number) => graphHeight - (val / maxVal) * graphHeight + 5;
  const getX = (idx: number) => (idx / (history.length - 1)) * width;

  const downPoints = history.map((p, i) => `${getX(i).toFixed(1)},${getDownY(p.down).toFixed(1)}`).join(' ');
  const upPoints = history.map((p, i) => `${getX(i).toFixed(1)},${getUpY(p.up).toFixed(1)}`).join(' ');

  const downArea = `${downPoints} ${width},${graphHeight} 0,${graphHeight}`;
  const upArea = `${upPoints} ${width},${graphHeight} 0,${graphHeight}`;

  return (
    <div className={`flex flex-col select-none ${className}`}>
      {showLegend && (
        <div className="flex items-center justify-between text-xs pb-2 border-b border-border-subtle mb-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              <span className="text-text-muted">Download:</span>
              <span className="font-semibold text-text-primary tabular-nums">{formatSpeed(currentDownloadBps)}</span>
              <span className="text-[10px] text-text-muted">(Peak: {formatSpeed(peakDown)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm" />
              <span className="text-text-muted">Upload:</span>
              <span className="font-semibold text-text-primary tabular-nums">{formatSpeed(currentUploadBps)}</span>
              <span className="text-[10px] text-text-muted">(Peak: {formatSpeed(peakUp)})</span>
            </div>
          </div>
          <span className="text-[11px] text-text-muted font-mono">Rolling 45s Activity</span>
        </div>
      )}

      <div className="relative w-full overflow-hidden" style={{ height }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="downGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={graphHeight * 0.25} x2={width} y2={graphHeight * 0.25} stroke="currentColor" className="text-border-subtle/50" strokeDasharray="3 3" />
          <line x1="0" y1={graphHeight * 0.5} x2={width} y2={graphHeight * 0.5} stroke="currentColor" className="text-border-subtle/50" strokeDasharray="3 3" />
          <line x1="0" y1={graphHeight * 0.75} x2={width} y2={graphHeight * 0.75} stroke="currentColor" className="text-border-subtle/50" strokeDasharray="3 3" />
          <line x1="0" y1={graphHeight} x2={width} y2={graphHeight} stroke="currentColor" className="text-border-subtle" />

          {/* Download fill and stroke */}
          <polygon points={downArea} fill="url(#downGrad)" />
          <polyline points={downPoints} fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Upload fill and stroke */}
          <polygon points={upArea} fill="url(#upGrad)" />
          <polyline points={upPoints} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};
