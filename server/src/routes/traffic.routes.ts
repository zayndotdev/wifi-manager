import { Router } from 'express';
import { getRecentDomains, blockDomain, unblockDomain } from '../controllers/traffic.controller.js';

const router = Router();

router.get('/recent', getRecentDomains);
router.post('/block', blockDomain);
router.delete('/block', unblockDomain);

export default router;
