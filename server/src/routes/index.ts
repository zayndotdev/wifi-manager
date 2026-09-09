import { Router } from 'express';
import deviceRoutes from './device.routes.js';
import trafficRoutes from './traffic.routes.js';
import scheduleRoutes from './schedule.routes.js';
import securityRoutes from './security.routes.js';
import systemRoutes from './system.routes.js';
import { pauseAll, resumeAll } from '../controllers/device.controller.js';

const apiRouter = Router();

apiRouter.use('/devices', deviceRoutes);
apiRouter.use('/domains', trafficRoutes);
apiRouter.use('/schedules', scheduleRoutes);
apiRouter.use('/security', securityRoutes);
apiRouter.use('/system', systemRoutes);
apiRouter.use('/mesh', systemRoutes);

// Network-wide actions
apiRouter.post('/network/pause-all', pauseAll);
apiRouter.post('/network/resume-all', resumeAll);

export default apiRouter;
