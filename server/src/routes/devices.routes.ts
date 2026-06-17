import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { registerDevice, deregisterDevice } from '../controllers/devices.controller';

const router = Router();
router.post('/', requireAuth, registerDevice);
router.delete('/', requireAuth, deregisterDevice);
export default router;
