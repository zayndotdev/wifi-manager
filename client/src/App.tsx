import * as React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { WebSocketProvider } from './context/WebSocketContext';
import { DeviceProvider, useDevices } from './context/DeviceContext';
import { TooltipProvider } from './components/ui/Tooltip';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingFallback } from './components/common/LoadingFallback';
import { NotFoundView } from './components/views/NotFoundView';
import { ThrottleModal } from './components/views/ThrottleModal';
import { KickConfirmModal } from './components/views/KickConfirmModal';
import { DeviceDetailDrawer } from './components/views/DeviceDetailDrawer';
import { Device } from './types/device';

// Route-level code-splitting with React.lazy
const OverviewView = React.lazy(() =>
  import('./components/views/OverviewView').then((m) => ({ default: m.OverviewView }))
);
const DevicesView = React.lazy(() =>
  import('./components/views/DevicesView').then((m) => ({ default: m.DevicesView }))
);
const DeviceDetailView = React.lazy(() =>
  import('./components/views/DeviceDetailView').then((m) => ({ default: m.DeviceDetailView }))
);
const ActivityView = React.lazy(() =>
  import('./components/views/ActivityView').then((m) => ({ default: m.ActivityView }))
);
const RulesView = React.lazy(() =>
  import('./components/views/RulesView').then((m) => ({ default: m.RulesView }))
);
const SecurityView = React.lazy(() =>
  import('./components/views/SecurityView').then((m) => ({ default: m.SecurityView }))
);
const SettingsView = React.lazy(() =>
  import('./components/views/SettingsView').then((m) => ({ default: m.SettingsView }))
);

// Wrapper for dedicated device profile route (/devices/:id)
const DeviceProfileWrapper: React.FC<{
  onOpenThrottleModal: (device: Device) => void;
  onOpenKickModal: (device: Device) => void;
}> = ({ onOpenThrottleModal, onOpenKickModal }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return <Navigate to="/devices" replace />;
  }

  return (
    <DeviceDetailView
      deviceId={id}
      onBack={() => navigate('/devices')}
      onOpenThrottleModal={onOpenThrottleModal}
      onOpenKickModal={onOpenKickModal}
    />
  );
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { devices, selectedDevice, setSelectedDevice } = useDevices();

  const [throttleDevice, setThrottleDevice] = React.useState<Device | null>(null);
  const [kickDevice, setKickDevice] = React.useState<Device | null>(null);

  // 1. Auto-migrate legacy hash bookmarks (e.g. `/#/devices` -> `/devices`)
  React.useEffect(() => {
    if (window.location.hash.startsWith('#/')) {
      const targetPath = window.location.hash.replace(/^#/, '');
      window.history.replaceState(null, '', targetPath);
      navigate(targetPath, { replace: true });
    }
  }, [navigate]);

  // 2. Dynamic document title updater
  React.useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Overview',
      '/devices': `Devices (${devices.length})`,
      '/activity': 'Activity & DNS',
      '/rules': 'Rules & Bedtime',
      '/security': 'Security & Threats',
      '/settings': 'Gateway Settings',
    };

    let titleSuffix = 'Overview';
    if (titles[location.pathname]) {
      titleSuffix = titles[location.pathname];
    } else if (location.pathname.startsWith('/devices/')) {
      titleSuffix = 'Device Profile';
    }

    document.title = `Wi-Fi Sentinel — ${titleSuffix}`;
  }, [location.pathname, devices.length]);

  const handleSelectDevice = (id: string) => {
    const found = devices.find((d) => d.id === id) || null;
    setSelectedDevice(found);
  };

  const handleOpenFullDetails = (id: string) => {
    setSelectedDevice(null);
    navigate(`/devices/${id}`);
  };

  return (
    <AppShell>
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <OverviewView
                onSelectDevice={handleSelectDevice}
                onNavigateTab={(tab) => navigate(`/${tab === 'overview' ? '' : tab}`)}
                onOpenFullDetails={handleOpenFullDetails}
              />
            }
          />
          <Route path="/overview" element={<Navigate to="/" replace />} />

          <Route
            path="/devices"
            element={
              <DevicesView
                onSelectDevice={handleSelectDevice}
                onOpenThrottleModal={setThrottleDevice}
                onOpenKickModal={setKickDevice}
                onOpenFullDetails={handleOpenFullDetails}
              />
            }
          />

          <Route
            path="/devices/:id"
            element={
              <DeviceProfileWrapper
                onOpenThrottleModal={setThrottleDevice}
                onOpenKickModal={setKickDevice}
              />
            }
          />

          <Route path="/activity" element={<ActivityView />} />
          <Route path="/rules" element={<RulesView />} />
          <Route path="/security" element={<SecurityView />} />
          <Route path="/settings" element={<SettingsView />} />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </React.Suspense>

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

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <WebSocketProvider>
            <DeviceProvider>
              <TooltipProvider>
                <BrowserRouter>
                  <AppContent />
                </BrowserRouter>
              </TooltipProvider>
            </DeviceProvider>
          </WebSocketProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
