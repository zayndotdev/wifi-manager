import * as React from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Activity, ArrowDown, ArrowUp, Gauge, RefreshCw, Zap } from 'lucide-react';

export const SpeedtestWidget: React.FC<{ onComplete?: (result: any) => void; className?: string }> = ({
  onComplete,
  className = '',
}) => {
  const [isRunning, setIsRunning] = React.useState(false);
  const [stage, setStage] = React.useState<'idle' | 'ping' | 'download' | 'upload' | 'done'>('idle');
  const [ping, setPing] = React.useState<number | null>(null);
  const [jitter, setJitter] = React.useState<number | null>(null);
  const [downloadSpeed, setDownloadSpeed] = React.useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = React.useState<number | null>(null);
  const [progress, setProgress] = React.useState(0);

  const startTest = async () => {
    setIsRunning(true);
    setPing(null);
    setJitter(null);
    setDownloadSpeed(null);
    setUploadSpeed(null);
    setProgress(10);

    try {
      // 1. Ping stage
      setStage('ping');
      const pingRes = await api.getSpeedtestPing();
      setPing(pingRes.pingMs);
      setJitter(pingRes.jitterMs);
      setProgress(35);

      // 2. Download stage
      setStage('download');
      const downRes = await api.runSpeedtestDownload(6); // 6MB stream
      setDownloadSpeed(downRes.speedMbps);
      setProgress(70);

      // 3. Upload stage
      setStage('upload');
      const upRes = await api.runSpeedtestUpload(3); // 3MB payload
      setUploadSpeed(upRes.speedMbps);
      setProgress(100);

      setStage('done');
      if (onComplete) {
        onComplete({
          ping: pingRes.pingMs,
          jitter: pingRes.jitterMs,
          downloadSpeed: downRes.speedMbps,
          uploadSpeed: upRes.speedMbps,
        });
      }
    } catch (err) {
      console.error('Speedtest error:', err);
      setStage('done');
    } finally {
      setIsRunning(false);
    }
  };

  const getPingRating = (ms: number) => {
    if (ms <= 5) return { label: 'Ultra Low', color: 'text-emerald-500' };
    if (ms <= 20) return { label: 'Optimal', color: 'text-emerald-500' };
    if (ms <= 60) return { label: 'Good', color: 'text-amber-500' };
    return { label: 'High Latency', color: 'text-rose-500' };
  };

  return (
    <Card className={`p-4 sm:p-5 border border-border-subtle bg-bg-card/70 backdrop-blur-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-sm sm:text-base">Diagnostic Gateway Speedtest</h3>
            <p className="text-xs text-text-muted">Real hardware throughput & latency test against local gateway</p>
          </div>
        </div>

        <Button
          onClick={startTest}
          disabled={isRunning}
          variant="primary"
          size="sm"
          className="self-start sm:self-auto gap-1.5"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Testing {stage}...
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              {stage === 'done' ? 'Retest Gateway' : 'Run Speedtest'}
            </>
          )}
        </Button>
      </div>

      {isRunning && (
        <div className="w-full bg-border-subtle/50 h-1.5 rounded-full overflow-hidden mb-4">
          <div
            className="bg-primary h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Ping Card */}
        <div className="p-3 rounded-lg border border-border-subtle/80 bg-bg-card-subtle/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-text-muted mb-1">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-text-muted" /> Latency
            </span>
            {ping !== null && <span className={`text-[10px] font-semibold ${getPingRating(ping).color}`}>{getPingRating(ping).label}</span>}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
              {ping !== null ? ping : stage === 'ping' ? '...' : '--'}
            </span>
            <span className="text-xs text-text-muted">ms</span>
          </div>
        </div>

        {/* Jitter Card */}
        <div className="p-3 rounded-lg border border-border-subtle/80 bg-bg-card-subtle/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-text-muted mb-1">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-text-muted" /> Jitter
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
              {jitter !== null ? jitter : stage === 'ping' ? '...' : '--'}
            </span>
            <span className="text-xs text-text-muted">ms</span>
          </div>
        </div>

        {/* Download Card */}
        <div className="p-3 rounded-lg border border-border-subtle/80 bg-bg-card-subtle/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-text-muted mb-1">
            <span className="flex items-center gap-1 text-emerald-500 font-medium">
              <ArrowDown className="w-3.5 h-3.5" /> Download
            </span>
            {stage === 'download' && <span className="text-[10px] text-primary animate-pulse">Streaming...</span>}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
              {downloadSpeed !== null ? downloadSpeed : stage === 'download' ? '...' : '--'}
            </span>
            <span className="text-xs text-text-muted">Mbps</span>
          </div>
        </div>

        {/* Upload Card */}
        <div className="p-3 rounded-lg border border-border-subtle/80 bg-bg-card-subtle/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-text-muted mb-1">
            <span className="flex items-center gap-1 text-sky-500 font-medium">
              <ArrowUp className="w-3.5 h-3.5" /> Upload
            </span>
            {stage === 'upload' && <span className="text-[10px] text-sky-500 animate-pulse">Uploading...</span>}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
              {uploadSpeed !== null ? uploadSpeed : stage === 'upload' ? '...' : '--'}
            </span>
            <span className="text-xs text-text-muted">Mbps</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
