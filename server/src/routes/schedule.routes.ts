import { Router } from 'express';
import {
  getSchedules,
  createSchedule,
  toggleSchedule,
  deleteSchedule,
} from '../controllers/schedule.controller.js';

const router = Router();

router.get('/', getSchedules);
router.post('/', createSchedule);
router.patch('/:id', toggleSchedule);
router.delete('/:id', deleteSchedule);

export default router;
