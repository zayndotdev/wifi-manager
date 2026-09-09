import * as React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { WebSocketProvider } from './context/WebSocketContext';
import { DeviceProvider, useDevices } from './context/DeviceContext';
import { TooltipProvider } from './components/ui/Tooltip';
import { AppShell } from './components/layout/AppShell';

import { OverviewView } from './components/views/OverviewView';
import { DevicesView } from './components/views/DevicesView';
import { DeviceDetailDrawer } from './components/views/DeviceDetailDrawer';
import { DeviceDetailView } from './components/views/DeviceDetailView';
import { ActivityView } from './components/views/ActivityView';
import { RulesView } from './components/views/RulesView';
import { SecurityView } from './components/views/SecurityView';
import { SettingsView } from './components/views/SettingsView';
import { ThrottleModal } from './components/views/ThrottleModal';
import { KickConfirmModal } from './components/views/KickConfirmModal';
import { Device } from './types/device';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [viewingDeviceId, setViewingDeviceId] = React.useState<string | null>(null);
  const { devices, selectedDevice, setSelectedDevice } = useDevices();

  const [throttleDevice, setThrottleDevice] = React.useState<Device | null>(null);
  const [kickDevice, setKickDevice] = React.useState<Device | null>(null);

  // Helper to parse route from hash or pathname
  const parseCurrentRoute = React.useCallback(() => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    const pathname = window.location.pathname.replace(/^\//, '');
    const route = hash || pathname;

    if (route.startsWith('devices/')) {
      const devId = route.replace('devices/', '');
      return { tab: 'devices', deviceId: devId || null };
    }

    const validTabs = ['overview', 'devices', 'activity', 'rules', 'security', 'settings'];
    if (validTabs.includes(route)) {
      return { tab: route, deviceId: null };
    }

    return { tab: 'overview', deviceId: null };
  }, []);

  // Listen to URL hash & popstate changes for back/forward navigation & deep-linking
  React.useEffect(() => {
    const syncRouteFromUrl = () => {
      const { tab, deviceId } = parseCurrentRoute();
      setActiveTab(tab);
      setViewingDeviceId(deviceId);
    };

    window.addEventListener('hashchange', syncRouteFromUrl);
    window.addEventListener('popstate', syncRouteFromUrl);

    // Initial sync
    syncRouteFromUrl();

    return () => {
      window.removeEventListener('hashchange', syncRouteFromUrl);
      window.removeEventListener('popstate', syncRouteFromUrl);
    };
  }, [parseCurrentRoute]);

  const handleSelectDevice = (id: string) => {
    const found = devices.find((d) => d.id === id) || null;
    setSelectedDevice(found);
  };

  const handleOpenFullDetails = (id: string) => {
    setSelectedDevice(null);
    setViewingDeviceId(id);
    window.location.hash = `#/devices/${id}`;
  };

  const handleBackFromDevice = () => {
    setViewingDeviceId(null);
    setActiveTab('devices');
    window.location.hash = `#/devices`;
  };

  const handleTabChange = (tab: string) => {
    setViewingDeviceId(null);
    setActiveTab(tab);
    window.location.hash = `#/${tab}`;
  };

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      hideTabs={!!viewingDeviceId}
    >
      {viewingDeviceId ? (
        <DeviceDetailView
          deviceId={viewingDeviceId}
          onBack={handleBackFromDevice}
          onOpenThrottleModal={setThrottleDevice}
          onOpenKickModal={setKickDevice}
        />
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewView
              onSelectDevice={handleSelectDevice}
              onNavigateTab={handleTabChange}
              onOpenFullDetails={handleOpenFullDetails}
            />
          )}

          {activeTab === 'devices' && (
            <DevicesView
              onSelectDevice={handleSelectDevice}
              onOpenThrottleModal={setThrottleDevice}
              onOpenKickModal={setKickDevice}
              onOpenFullDetails={handleOpenFullDetails}
            />
          )}

          {activeTab === 'activity' && <ActivityView />}

          {activeTab === 'rules' && <RulesView />}

          {activeTab === 'security' && <SecurityView />}

          {activeTab === 'settings' && <SettingsView />}
        </>
      )}

      {/* Slide-over Device Inspector Drawer */}
      <DeviceDetailDrawer
        device={selectedDevice}
        isOpen={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
        onOpenThrottleModal={setThrottleDevice}
        onOpenKickModal={setKickDevice}
        onOpenFullDetails={handleOpenFullDetails}
      />

      {/* Speed Limiter Modal */}
      <ThrottleModal
        device={throttleDevice}
        isOpen={!!throttleDevice}
        onClose={() => setThrottleDevice(null)}
      />

      {/* Kick Device Confirmation Modal */}
      <KickConfirmModal
        device={kickDevice}
        isOpen={!!kickDevice}
        onClose={() => setKickDevice(null)}
      />
    </AppShell>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TooltipProvider delayDuration={150}>
          <WebSocketProvider>
            <DeviceProvider>
              <AppContent />
            </DeviceProvider>
          </WebSocketProvider>
        </TooltipProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
