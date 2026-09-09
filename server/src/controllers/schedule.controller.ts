import { Request, Response } from 'express';
import { scheduleService } from '../services/schedule.service.js';

export const getSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await scheduleService.getAll();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, daysOfWeek, startTime, endTime, deviceIds, action } = req.body;
    if (!name || !startTime || !endTime) {
      res.status(400).json({ error: 'Name, startTime, and endTime are required' });
      return;
    }
    const created = await scheduleService.create({
      name,
      daysOfWeek: daysOfWeek || [1, 2, 3, 4],
      startTime,
      endTime,
      deviceIds: deviceIds || [],
      action: action || 'pause_wan',
      enabled: true,
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { enabled } = req.body;
    const updated = await scheduleService.toggle(id, Boolean(enabled));
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const deleted = await scheduleService.delete(id);
    res.json({ id, deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
