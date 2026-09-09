import { Router } from 'express';
import { getSystemStatus, getMeshNodes } from '../controllers/system.controller.js';

const router = Router();

router.get('/status', getSystemStatus);
router.get('/nodes', getMeshNodes);
router.get('/mesh/nodes', getMeshNodes);

export default router;
