import { Response } from 'express';
import { authService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  const result = await authService.login(username, password);
  if (!result) {
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  res.json({
    message: 'Authentication successful',
    token: result.token,
    user: result.user,
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  res.json({
    user: req.user,
  });
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body || {};
  const username = req.user?.username || 'admin';

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(422).json({ error: 'New password must be at least 6 characters.' });
    return;
  }

  const success = await authService.changePassword(username, currentPassword, newPassword);
  if (!success) {
    res.status(400).json({ error: 'Current password incorrect.' });
    return;
  }

  res.json({ message: 'Password changed successfully.' });
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.json({ message: 'Logged out successfully.' });
};
