import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Input } from '../ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/Dialog';
import { api } from '../../lib/api';
import { BedtimeSchedule } from '../../types/rules';
import { useDevices } from '../../context/DeviceContext';
import { useToast } from '../ui/Toast';
import { Moon, Plus, Clock, Ban, Trash2, Check, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

export const RulesView: React.FC = () => {
  const { devices, unblockDevice } = useDevices();
  const { toast } = useToast();

  const [schedules, setSchedules] = React.useState<BedtimeSchedule[]>([]);
  const [activeTab, setActiveTab] = React.useState<'schedules' | 'blacklist'>('schedules');
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  // Form state
  const [name, setName] = React.useState('');
  const [startTime, setStartTime] = React.useState('21:00');
  const [endTime, setEndTime] = React.useState('07:00');
  const [selectedDays, setSelectedDays] = React.useState<number[]>([1, 2, 3, 4]);
  const [selectedDevices, setSelectedDevices] = React.useState<string[]>([]);

  const fetchSchedules = React.useCallback(async () => {
    try {
      const data = await api.getSchedules();
      setSchedules(data);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleToggleSchedule = async (id: string, currentEnabled: boolean) => {
    try {
      await api.toggleSchedule(id, !currentEnabled);
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled: !currentEnabled } : s))
      );
      toast({
        type: 'success',
        title: 'Schedule Updated',
        description: `Schedule is now ${!currentEnabled ? 'active' : 'disabled'}`,
      });
    } catch (err: any) {
      toast({ type: 'error', title: 'Error', description: err.message });
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await api.deleteSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      toast({ type: 'info', title: 'Schedule Deleted' });
    } catch (err: any) {
      toast({ type: 'error', title: 'Error', description: err.message });
    }
  };

  const handleCreateSchedule = async () => {
    if (!name.trim()) return;
    try {
      const created = await api.createSchedule({
        name,
        daysOfWeek: selectedDays,
        startTime,
        endTime,
        deviceIds: selectedDevices,
        enabled: true,
      });
      setSchedules((prev) => [...prev, created]);
      setIsAddOpen(false);
      setName('');
      toast({ type: 'success', title: 'Bedtime Curfew Created' });
    } catch (err: any) {
      toast({ type: 'error', title: 'Failed to create', description: err.message });
    }
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const blockedDevices = devices.filter((d) => d.status === 'blocked');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sub tabs switcher */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('schedules')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer',
              activeTab === 'schedules'
                ? 'bg-secondary text-foreground font-semibold shadow-subtle'
                : 'text-foreground-secondary hover:text-foreground'
            )}
          >
            Bedtime Curfews ({schedules.length})
          </button>
          <button
            onClick={() => setActiveTab('blacklist')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer',
              activeTab === 'blacklist'
                ? 'bg-secondary text-foreground font-semibold shadow-subtle'
                : 'text-foreground-secondary hover:text-foreground'
            )}
          >
            MAC Blacklist ({blockedDevices.length})
          </button>
        </div>

        {activeTab === 'schedules' && (
          <Button size="sm" className="gap-1.5 text-xs" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>New Bedtime Rule</span>
          </Button>
        )}
      </div>

      {/* SCHEDULES VIEW */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((sch) => {
            return (
              <Card key={sch.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Moon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{sch.name}</h4>
                      <p className="text-xs text-foreground-secondary font-mono mt-0.5">
                        {sch.startTime} → {sch.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sch.enabled}
                      onCheckedChange={() => handleToggleSchedule(sch.id, sch.enabled)}
                    />
                    <button
                      onClick={() => handleDeleteSchedule(sch.id)}
                      className="p-1 text-foreground-muted hover:text-rose-500 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Days of week chips */}
                <div className="flex gap-1">
                  {dayLabels.map((lbl, idx) => {
                    const isSelected = sch.daysOfWeek.includes(idx);
                    return (
                      <span
                        key={lbl}
                        className={cn(
                          'h-6 w-8 rounded text-[10px] flex items-center justify-center font-medium border',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary/60 text-foreground-muted border-border'
                        )}
                      >
                        {lbl}
                      </span>
                    );
                  })}
                </div>

                {/* Target devices chips */}
                <div className="pt-3 border-t border-border flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-foreground-muted">Governed Devices:</span>
                  {sch.deviceIds.map((devId) => {
                    const dev = devices.find((d) => d.id === devId);
                    return (
                      <Badge key={devId} variant="neutral">
                        {dev?.nickname || dev?.hostname || devId}
                      </Badge>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* BLACKLIST VIEW */}
      {activeTab === 'blacklist' && (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 border-b border-border text-foreground-secondary uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 font-semibold">Device / Hostname</th>
                <th className="p-3 font-semibold">MAC Address</th>
                <th className="p-3 font-semibold">Vendor</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {blockedDevices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-foreground-muted">
                    Zero devices currently blacklisted. Network is open to approved clients.
                  </td>
                </tr>
              ) : (
                blockedDevices.map((dev) => (
                  <tr key={dev.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-3 font-semibold text-foreground">
                      {dev.nickname || dev.hostname}
                    </td>
                    <td className="p-3 font-mono text-rose-600">{dev.mac}</td>
                    <td className="p-3 text-foreground-secondary">{dev.vendor}</td>
                    <td className="p-3">
                      <Badge variant="blocked">Permanently Banned</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => unblockDevice(dev.id)}
                      >
                        Unban Device
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* CREATE BEDTIME RULE DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Bedtime Curfew Schedule</DialogTitle>
            <DialogDescription>
              Automatically cut off WAN internet on selected devices during bedtime hours.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Rule Title
              </label>
              <Input
                placeholder="e.g. School Nights Curfew"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Start Cutoff Time
                </label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  End / Restore Time
                </label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Repeat on Days
              </label>
              <div className="flex gap-1">
                {dayLabels.map((lbl, idx) => {
                  const isSelected = selectedDays.includes(idx);
                  return (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => {
                        setSelectedDays((prev) =>
                          prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
                        );
                      }}
                      className={cn(
                        'h-8 flex-1 rounded text-xs font-medium border transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary/60 text-foreground-secondary border-border'
                      )}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Apply to Devices
              </label>
              <div className="max-h-36 overflow-y-auto divide-y divide-border border border-border rounded-md p-1">
                {devices.map((dev) => {
                  const isSelected = selectedDevices.includes(dev.id);
                  return (
                    <div
                      key={dev.id}
                      onClick={() => {
                        setSelectedDevices((prev) =>
                          prev.includes(dev.id)
                            ? prev.filter((id) => id !== dev.id)
                            : [...prev, dev.id]
                        );
                      }}
                      className="flex items-center justify-between p-1.5 hover:bg-secondary rounded cursor-pointer text-xs"
                    >
                      <span className="font-medium text-foreground">
                        {dev.nickname || dev.hostname} ({dev.vendor})
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateSchedule}>
              Save Bedtime Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
