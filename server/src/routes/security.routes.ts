import { Router } from 'express';
import { getAlerts, dismissAlert } from '../controllers/security.controller.js';

const router = Router();

router.get('/alerts', getAlerts);
router.patch('/alerts/:id', dismissAlert);

export default router;
