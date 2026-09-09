import { Request, Response } from 'express';
import { securityService } from '../services/security.service.js';

export const getAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await securityService.getAlerts();
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const dismissAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await securityService.markAsRead(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
