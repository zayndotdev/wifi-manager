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
import { Device } from '../../types/device';
import { useDevices } from '../../context/DeviceContext';
import { UserX } from 'lucide-react';

export interface KickConfirmModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

export const KickConfirmModal: React.FC<KickConfirmModalProps> = ({
  device,
  isOpen,
  onClose,
}) => {
  const { kickDevice } = useDevices();

  if (!device) return null;

  const handleKick = async () => {
    await kickDevice(device.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600">
            <UserX className="h-4 w-4" />
            <DialogTitle>Kick Device Off Wi-Fi</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to forcibly disconnect {device.nickname || device.hostname}?
          </DialogDescription>
        </DialogHeader>

        <p className="text-xs text-foreground-secondary leading-relaxed py-1">
          This sends an immediate 802.11 deauthentication frame to the client. The device will be
          disconnected from the access point. If it knows the Wi-Fi password, it may attempt to
          re-associate automatically unless banned.
        </p>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleKick}>
            Yes, Disconnect Device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
