import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/Dialog';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { Lock, LogOut, KeyRound, UserCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const AdminLoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { user, isAuthenticated, login, logout, changePassword } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [isChangingPass, setIsChangingPass] = React.useState(false);
  const [currentPass, setCurrentPass] = React.useState('');
  const [newPass, setNewPass] = React.useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await login(username, password);
    setIsSubmitting(false);

    if (res.success) {
      toast({ title: 'Welcome Admin', description: 'Administrative session unlocked.', type: 'success' });
      setPassword('');
      onClose();
    } else {
      toast({ title: 'Authentication Failed', description: res.error || 'Check username and password', type: 'error' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) {
      toast({ title: 'Invalid Password', description: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    const res = await changePassword(currentPass, newPass);
    setIsSubmitting(false);

    if (res.success) {
      toast({ title: 'Password Changed', description: 'Admin credentials updated successfully.', type: 'success' });
      setCurrentPass('');
      setNewPass('');
      setIsChangingPass(false);
    } else {
      toast({ title: 'Update Failed', description: res.error || 'Current password incorrect', type: 'error' });
    }
  };

  const handleLogout = async () => {
    await logout();
    toast({ title: 'Logged Out', description: 'Admin session closed.', type: 'info' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              {isAuthenticated ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {isAuthenticated ? 'Admin Session Active' : 'Gateway Administrator'}
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground-muted mt-0.5">
                {isAuthenticated
                  ? `Logged in as ${user?.username} (${user?.role})`
                  : 'Enter administrator credentials to unlock protected controls'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isAuthenticated ? (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-lg bg-secondary/50 border border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-emerald-500" />
                <div>
                  <div className="text-sm font-semibold text-foreground">{user?.username}</div>
                  <div className="text-xs text-foreground-muted">Role: {user?.role}</div>
                </div>
              </div>
              <Badge variant="online" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Verified</span>
              </Badge>
            </div>

            {isChangingPass ? (
              <form onSubmit={handleChangePassword} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground-secondary mb-1">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground-secondary mb-1">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" variant="primary" size="sm" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Updating...' : 'Save New Password'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsChangingPass(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center gap-2"
                  onClick={() => setIsChangingPass(true)}
                >
                  <KeyRound className="w-4 h-4 text-primary" />
                  <span>Change Admin Password</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-center gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Session</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-xs font-semibold text-foreground-secondary mb-1">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="admin"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground-secondary mb-1">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="h-8 text-xs font-mono"
              />
              <div className="flex items-center gap-1.5 mt-2 p-2 rounded bg-secondary/50 border border-border text-[11px] text-foreground-muted">
                <span>Default credentials:</span>
                <code className="px-1.5 py-0.5 bg-card rounded text-foreground font-mono text-[10px] font-semibold border border-border">
                  admin / sentinel2026!
                </code>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting} className="gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Authenticating...' : 'Unlock Gateway'}</span>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
