import { Request, Response } from 'express';
import { trafficService } from '../services/traffic.service.js';

export const getRecentDomains = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string;
    const result = await trafficService.getRecentDomains(category);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const blockDomain = async (req: Request, res: Response): Promise<void> => {
  try {
    const { domain } = req.body;
    if (!domain) {
      res.status(400).json({ error: 'Domain is required' });
      return;
    }
    const result = await trafficService.blockDomain(domain);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const unblockDomain = async (req: Request, res: Response): Promise<void> => {
  try {
    const { domain } = req.body;
    if (!domain) {
      res.status(400).json({ error: 'Domain is required' });
      return;
    }
    const result = await trafficService.unblockDomain(domain);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
