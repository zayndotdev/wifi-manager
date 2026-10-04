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
  probeDeviceHandler,
  probeAllHandler,
  throttleUnknownHandler,
  pauseUnknownHandler,
  resumeUnknownHandler,
} from '../controllers/device.controller.js';

const router = Router();

// Device collections and global actions
router.get('/', getDevices);
router.post('/scan', scanDevices);
router.post('/probe-all', probeAllHandler);
router.post('/pause-all', pauseAll);
router.post('/resume-all', resumeAll);

// Anti-Leech / Bandwidth Guard routes (must be before /:id)
router.post('/guard/throttle-unknown', throttleUnknownHandler);
router.post('/guard/pause-unknown', pauseUnknownHandler);
router.post('/guard/resume-unknown', resumeUnknownHandler);

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
router.post('/:id/probe', probeDeviceHandler);

export default router;
