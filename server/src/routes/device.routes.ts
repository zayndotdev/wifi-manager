import { Router } from 'express';
import {
  getDevices,
  getDeviceById,
  patchDevice,
  pauseDevice,
  resumeDevice,
  kickDevice,
  blockDevice,
  unblockDevice,
  throttleDevice,
  removeThrottle,
  pauseAll,
  resumeAll,
  scanDevices,
} from '../controllers/device.controller.js';

const router = Router();

// Device collections and global actions
router.get('/', getDevices);
router.post('/scan', scanDevices);
router.post('/pause-all', pauseAll);
router.post('/resume-all', resumeAll);

// Single device actions
router.get('/:id', getDeviceById);
router.patch('/:id', patchDevice);
router.post('/:id/pause', pauseDevice);
router.post('/:id/resume', resumeDevice);
router.post('/:id/kick', kickDevice);
router.post('/:id/block', blockDevice);
router.delete('/:id/block', unblockDevice);
router.post('/:id/throttle', throttleDevice);
router.delete('/:id/throttle', removeThrottle);

export default router;
