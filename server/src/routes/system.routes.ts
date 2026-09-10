import { Router } from 'express';
import {
  getSystemStatus,
  getMeshNodes,
  getRouterConfig,
  saveRouterConfig,
  testRouterConnection,
  getDnsGatewayStats,
} from '../controllers/system.controller.js';

const router = Router();

router.get('/status', getSystemStatus);
router.get('/nodes', getMeshNodes);
router.get('/mesh/nodes', getMeshNodes);

// Router hardware integration routes
router.get('/router', getRouterConfig);
router.post('/router', saveRouterConfig);
router.post('/router/test', testRouterConnection);

// DNS Gateway Sinkhole stats
router.get('/dns/stats', getDnsGatewayStats);

export default router;
