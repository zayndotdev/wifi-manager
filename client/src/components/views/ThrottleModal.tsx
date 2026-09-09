import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { Device } from '../../types/device';
import { useDevices } from '../../context/DeviceContext';
import { Sliders } from 'lucide-react';

export interface ThrottleModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ThrottleModal: React.FC<ThrottleModalProps> = ({
  device,
  isOpen,
  onClose,
}) => {
  const { throttleDevice, removeThrottle } = useDevices();

  const [downloadLimit, setDownloadLimit] = React.useState<number>(5000); // Kbps
  const [uploadLimit, setUploadLimit] = React.useState<number>(2000); // Kbps

  React.useEffect(() => {
    if (device?.throttleLimits) {
      setDownloadLimit(device.throttleLimits.downloadLimitKbps);
      setUploadLimit(device.throttleLimits.uploadLimitKbps);
    } else {
      setDownloadLimit(5000);
      setUploadLimit(2000);
    }
  }, [device]);

  if (!device) return null;

  const handleApply = async () => {
    await throttleDevice(device.id, downloadLimit, uploadLimit);
    onClose();
  };

  const handleRemove = async () => {
    await removeThrottle(device.id);
    onClose();
  };

  const presets = [
    { label: 'Strict (1 Mbps)', down: 1000, up: 500 },
    { label: 'Standard (5 Mbps)', down: 5000, up: 2000 },
    { label: 'Video HD (15 Mbps)', down: 15000, up: 5000 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <DialogTitle>Bandwidth Speed Limiter (QoS)</DialogTitle>
          </div>
          <DialogDescription>
            Throttle download & upload speeds for {device.nickname || device.hostname}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Quick Speed Presets
            </label>
            <div className="flex gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setDownloadLimit(p.down);
                    setUploadLimit(p.up);
                  }}
                  className="flex-1 py-1 px-2 rounded text-xs border border-border bg-secondary/60 hover:bg-secondary text-foreground transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Download Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-foreground">Download Speed Cap</span>
              <span className="font-mono font-medium text-primary">
                {(downloadLimit / 1000).toFixed(1)} Mbps
              </span>
            </div>
            <Slider
              min={500}
              max={50000}
              step={500}
              value={[downloadLimit]}
              onValueChange={([val]) => setDownloadLimit(val)}
            />
          </div>

          {/* Upload Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-foreground">Upload Speed Cap</span>
              <span className="font-mono font-medium text-primary">
                {(uploadLimit / 1000).toFixed(1)} Mbps
              </span>
            </div>
            <Slider
              min={250}
              max={20000}
              step={250}
              value={[uploadLimit]}
              onValueChange={([val]) => setUploadLimit(val)}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {device.isThrottled ? (
            <Button variant="outline" size="sm" onClick={handleRemove}>
              Remove Limit
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button size="sm" onClick={handleApply}>
            Apply Speed Limit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
