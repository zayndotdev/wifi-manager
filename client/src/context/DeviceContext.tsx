import * as React from 'react';
import { Device } from '../types/device';
import { api } from '../lib/api';
import { useWebSocket } from './WebSocketContext';
import { useToast } from '../components/ui/Toast';

interface DeviceContextType {
  devices: Device[];
  selectedDevice: Device | null;
  setSelectedDevice: (device: Device | null) => void;
  isLoading: boolean;
  error: string | null;
  refreshDevices: () => Promise<void>;
  updateNickname: (id: string, nickname: string) => Promise<void>;
  updateCategory: (id: string, category: string) => Promise<void>;
  pauseDevice: (id: string) => Promise<void>;
  resumeDevice: (id: string) => Promise<void>;
  kickDevice: (id: string) => Promise<void>;
  blockDevice: (id: string, notes?: string) => Promise<void>;
  unblockDevice: (id: string) => Promise<void>;
  throttleDevice: (id: string, downloadLimitKbps: number, uploadLimitKbps: number) => Promise<void>;
  removeThrottle: (id: string) => Promise<void>;
  pauseAllDevices: () => Promise<void>;
  resumeAllDevices: () => Promise<void>;
  isScanning: boolean;
  scanNetwork: () => Promise<void>;
}

const DeviceContext = React.createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = React.useState<Device | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isScanning, setIsScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { latestTick, addListener } = useWebSocket();
  const { toast } = useToast();

  const refreshDevices = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getDevices();
      setDevices((prev) => {
        const prevMap = new Map(prev.map((d) => [d.id, d]));
        return data.map((d) => {
          const p = prevMap.get(d.id);
          const isOff = d.status === 'offline';
          return {
            ...d,
            todayBytesTotal: Math.max(d.todayBytesTotal || 0, p?.todayBytesTotal || 0),
            currentDownloadBps: isOff ? 0 : (p?.currentDownloadBps ?? d.currentDownloadBps),
            currentUploadBps: isOff ? 0 : (p?.currentUploadBps ?? d.currentUploadBps),
          };
        });
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch devices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scanNetwork = React.useCallback(async () => {
    try {
      setIsScanning(true);
      toast({ type: 'info', title: 'Scanning Wi-Fi Subnet', description: 'Discovering active physical devices on network...' });
      const res = await api.scanDevices();
      setDevices(res.devices);
      toast({ type: 'success', title: 'Network Scan Complete', description: `Discovered ${res.count} active physical devices.` });
    } catch (err: any) {
      toast({ type: 'error', title: 'Scan Failed', description: err.message });
    } finally {
      setIsScanning(false);
    }
  }, [toast]);

  React.useEffect(() => {
    refreshDevices();
    const timer = setInterval(() => {
      refreshDevices();
    }, 10000);
    return () => clearInterval(timer);
  }, [refreshDevices]);

  // Real-time automatic synchronization when devices connect/disconnect
  React.useEffect(() => {
    const unsubscribe = addListener('devices_updated', (data: any) => {
      if (data?.devices && Array.isArray(data.devices)) {
        setDevices((prev) => {
          const prevMap = new Map(prev.map((d) => [d.id, d]));
          return data.devices.map((d: Device) => {
            const p = prevMap.get(d.id);
            const isOff = d.status === 'offline';
            return {
              ...d,
              currentDownloadBps: isOff ? 0 : (d.currentDownloadBps || 0),
              currentUploadBps: isOff ? 0 : (d.currentUploadBps || 0),
              todayBytesTotal: Math.max(d.todayBytesTotal || 0, p?.todayBytesTotal || 0),
            };
          });
        });
      }
    });
    return unsubscribe;
  }, [addListener]);

  // Update live speeds and accumulate bytes from WebSocket tick
  React.useEffect(() => {
    if (!latestTick?.deviceSpeeds) return;
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.status === 'offline') {
          return {
            ...dev,
            currentDownloadBps: 0,
            currentUploadBps: 0,
          };
        }
        const speed = latestTick.deviceSpeeds[dev.id];
        if (speed) {
          const delta = (speed.downBps || 0) + (speed.upBps || 0);
          return {
            ...dev,
            currentDownloadBps: speed.downBps,
            currentUploadBps: speed.upBps,
            todayBytesTotal: (dev.todayBytesTotal || 0) + delta,
          };
        }
        return dev;
      })
    );

    // Also sync selectedDevice if open
    setSelectedDevice((prev) => {
      if (!prev) return prev;
      if (prev.status === 'offline') {
        return {
          ...prev,
          currentDownloadBps: 0,
          currentUploadBps: 0,
        };
      }
      if (!latestTick.deviceSpeeds[prev.id]) return prev;
      const speed = latestTick.deviceSpeeds[prev.id];
      const delta = (speed.downBps || 0) + (speed.upBps || 0);
      return {
        ...prev,
        currentDownloadBps: speed.downBps,
        currentUploadBps: speed.upBps,
        todayBytesTotal: (prev.todayBytesTotal || 0) + delta,
      };
    });
  }, [latestTick]);

  // Listen for new device joined broadcast
  React.useEffect(() => {
    const unsubJoin = addListener('device_joined', (payload: any) => {
      if (payload.device) {
        setDevices((prev) => {
          const exists = prev.find((d) => d.id === payload.device.id);
          if (exists) return prev;
          return [payload.device, ...prev];
        });
        toast({
          type: 'info',
          title: 'New Device Joined',
          description: `${payload.device.nickname || payload.device.hostname} (${payload.device.vendor}) connected to Wi-Fi`,
        });
      }
    });

    const unsubUpdate = addListener('device_updated', (payload: any) => {
      if (payload.device) {
        setDevices((prev) =>
          prev.map((d) => (d.id === payload.device.id ? { ...d, ...payload.device } : d))
        );
        if (selectedDevice?.id === payload.device.id) {
          setSelectedDevice((curr) => (curr ? { ...curr, ...payload.device } : null));
        }
      }
    });

    return () => {
      unsubJoin();
      unsubUpdate();
    };
  }, [addListener, toast, selectedDevice?.id]);

  // Actions with optimistic UI
  const updateNickname = async (id: string, nickname: string) => {
    const previous = devices.find((d) => d.id === id);
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, nickname } : d)));
    try {
      const updated = await api.updateDeviceNickname(id, nickname);
      setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)));
      if (selectedDevice?.id === id) setSelectedDevice(updated);
      toast({ type: 'success', title: 'Device Renamed', description: `Saved as "${nickname}"` });
    } catch (err: any) {
      if (previous) {
        setDevices((prev) => prev.map((d) => (d.id === id ? previous : d)));
      }
      toast({ type: 'error', title: 'Failed to update name', description: err.message });
      throw err;
    }
  };

  const updateCategory = async (id: string, category: string) => {
    try {
      const updated = await api.updateDeviceCategory(id, category);
      setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)));
      if (selectedDevice?.id === id) setSelectedDevice(updated);
      toast({ type: 'success', title: 'Category Updated' });
    } catch (err: any) {
      toast({ type: 'error', title: 'Error', description: err.message });
    }
  };

  const pauseDevice = async (id: string) => {
    const dev = devices.find((d) => d.id === id);
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: 'paused', currentDownloadBps: 0, currentUploadBps: 0 } : d
      )
    );
    try {
      await api.pauseDevice(id);
      toast({
        type: 'warning',
        title: 'Internet Paused',
        description: `Internet blocked for ${dev?.nickname || dev?.hostname}`,
      });
    } catch (err: any) {
      if (dev) {
        setDevices((prev) => prev.map((d) => (d.id === id ? dev : d)));
      }
      toast({ type: 'error', title: 'Action Failed', description: err.message });
    }
  };

  const resumeDevice = async (id: string) => {
    const dev = devices.find((d) => d.id === id);
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'active' } : d)));
    try {
      await api.resumeDevice(id);
      toast({
        type: 'success',
        title: 'Internet Restored',
        description: `Access restored for ${dev?.nickname || dev?.hostname}`,
      });
    } catch (err: any) {
      if (dev) {
        setDevices((prev) => prev.map((d) => (d.id === id ? dev : d)));
      }
      toast({ type: 'error', title: 'Action Failed', description: err.message });
    }
  };

  const kickDevice = async (id: string) => {
    const dev = devices.find((d) => d.id === id);
    try {
      await api.kickDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
      if (selectedDevice?.id === id) setSelectedDevice(null);
      toast({
        type: 'info',
        title: 'Device Disconnected',
        description: `${dev?.nickname || dev?.hostname} kicked off Wi-Fi`,
      });
    } catch (err: any) {
      toast({ type: 'error', title: 'Kick Failed', description: err.message });
    }
  };

  const blockDevice = async (id: string, notes?: string) => {
    const dev = devices.find((d) => d.id === id);
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'blocked' } : d)));
    try {
      await api.blockDevice(id, notes);
      toast({
        type: 'error',
        title: 'Device Blocked',
        description: `${dev?.nickname || dev?.hostname} added to blacklist`,
      });
    } catch (err: any) {
      if (dev) {
        setDevices((prev) => prev.map((d) => (d.id === id ? dev : d)));
      }
      toast({ type: 'error', title: 'Block Failed', description: err.message });
    }
  };

  const unblockDevice = async (id: string) => {
    try {
      await api.unblockDevice(id);
      setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'active' } : d)));
      toast({ type: 'success', title: 'Device Unblocked' });
    } catch (err: any) {
      toast({ type: 'error', title: 'Unblock Failed', description: err.message });
    }
  };

  const throttleDevice = async (
    id: string,
    downloadLimitKbps: number,
    uploadLimitKbps: number
  ) => {
    try {
      const updated = await api.throttleDevice(id, downloadLimitKbps, uploadLimitKbps);
      setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)));
      if (selectedDevice?.id === id) setSelectedDevice(updated);
      toast({
        type: 'warning',
        title: 'Speed Limit Applied',
        description: `Cap: ${downloadLimitKbps} Kbps down / ${uploadLimitKbps} Kbps up`,
      });
    } catch (err: any) {
      toast({ type: 'error', title: 'Throttle Failed', description: err.message });
    }
  };

  const removeThrottle = async (id: string) => {
    try {
      await api.removeThrottle(id);
      setDevices((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, isThrottled: false, throttleLimits: undefined } : d
        )
      );
      toast({ type: 'success', title: 'Speed Limit Removed' });
    } catch (err: any) {
      toast({ type: 'error', title: 'Error', description: err.message });
    }
  };

  const pauseAllDevices = async () => {
    try {
      const res = await api.pauseAllDevices(true);
      setDevices((prev) =>
        prev.map((d) => (d.status === 'active' ? { ...d, status: 'paused' } : d))
      );
      toast({
        type: 'warning',
        title: 'Global Pause Active',
        description: `Paused ${res.pausedDevicesCount} devices (whitelisted devices exempt)`,
      });
    } catch (err: any) {
      toast({ type: 'error', title: 'Failed', description: err.message });
    }
  };

  const resumeAllDevices = async () => {
    try {
      await api.resumeAllDevices();
      setDevices((prev) =>
        prev.map((d) => (d.status === 'paused' ? { ...d, status: 'active' } : d))
      );
      toast({ type: 'success', title: 'Internet Resumed for All Devices' });
    } catch (err: any) {
      toast({ type: 'error', title: 'Failed', description: err.message });
    }
  };

  return (
    <DeviceContext.Provider
      value={{
        devices,
        selectedDevice,
        setSelectedDevice,
        isLoading,
        error,
        refreshDevices,
        updateNickname,
        updateCategory,
        pauseDevice,
        resumeDevice,
        kickDevice,
        blockDevice,
        unblockDevice,
        throttleDevice,
        removeThrottle,
        pauseAllDevices,
        resumeAllDevices,
        isScanning,
        scanNetwork,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevices = () => {
  const ctx = React.useContext(DeviceContext);
  if (!ctx) throw new Error('useDevices must be used within DeviceProvider');
  return ctx;
};
