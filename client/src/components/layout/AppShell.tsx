import * as React from 'react';
import { TopNavbar } from './TopNavbar';
import { LayoutDashboard, Smartphone, Activity, Clock, ShieldAlert, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AppShellProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hideTabs?: boolean;
  children: React.ReactNode;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'devices', label: 'Devices', icon: Smartphone },
  { id: 'activity', label: 'Activity & Domains', icon: Activity },
  { id: 'rules', label: 'Rules & Bedtime', icon: Clock },
  { id: 'security', label: 'Security', icon: ShieldAlert },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  setActiveTab,
  hideTabs = false,
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150">
      {/* Top Header */}
      <TopNavbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Sub-Navigation Tabs Bar (Hidden on Standalone Dedicated Pages) */}
      {!hideTabs && (
        <div className="w-full border-b border-border bg-card/50 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 cursor-pointer select-none',
                    isActive
                      ? 'bg-secondary text-foreground shadow-subtle border border-border'
                      : 'text-foreground-secondary hover:text-foreground hover:bg-secondary/60'
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-foreground-muted')} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-4 text-center text-xs text-foreground-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Wi-Fi Sentinel v2.4.1 • Enterprise Gateway Engine</span>
          <span className="text-[11px] text-foreground-muted">Live Telemetry & Access Control Active</span>
        </div>
      </footer>
    </div>
  );
};
