import { Request, Response } from 'express';
import { deviceService } from '../services/device.service.js';

export const getDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const devices = await deviceService.getAll();
    res.json(devices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getDeviceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const device = await deviceService.getById(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    res.json(device);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const patchDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { nickname, category } = req.body;
    let updated;
    if (nickname !== undefined) {
      if (!nickname.trim()) {
        res.status(422).json({ error: 'Nickname must not be empty', field: 'nickname' });
        return;
      }
      updated = await deviceService.updateNickname(id, nickname);
    }
    if (category !== undefined) {
      updated = await deviceService.updateCategory(id, category);
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const pauseDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await deviceService.pause(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const resumeDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await deviceService.resume(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const kickDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await deviceService.kick(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const blockDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { notes } = req.body;
    const result = await deviceService.block(id, notes);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const unblockDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await deviceService.unblock(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const throttleDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { downloadLimitKbps, uploadLimitKbps } = req.body;
    const result = await deviceService.throttle(
      id,
      Number(downloadLimitKbps) || 5000,
      Number(uploadLimitKbps) || 2000
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const removeThrottle = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await deviceService.removeThrottle(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const pauseAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await deviceService.pauseAll(req.body.excludeWhitelisted !== false);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const resumeAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await deviceService.resumeAll();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const scanDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const devices = await deviceService.rescan();
    res.json({ message: 'Subnet scan completed', count: devices.length, devices });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

