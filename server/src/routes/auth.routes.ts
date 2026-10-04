import { Router } from 'express';
import { login, getMe, changePassword, logout } from '../controllers/auth.controller.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', optionalAuth, getMe);
router.post('/change-password', requireAuth, changePassword);
router.post('/logout', logout);

export default router;
