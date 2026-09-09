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

  const handleSelectDevice = (id: string) => {
    const found = devices.find((d) => d.id === id) || null;
    setSelectedDevice(found);
  };

  const handleOpenFullDetails = (id: string) => {
    setSelectedDevice(null);
    setViewingDeviceId(id);
  };

  const handleTabChange = (tab: string) => {
    setViewingDeviceId(null);
    setActiveTab(tab);
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={handleTabChange}>
      {viewingDeviceId ? (
        <DeviceDetailView
          deviceId={viewingDeviceId}
          onBack={() => setViewingDeviceId(null)}
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
