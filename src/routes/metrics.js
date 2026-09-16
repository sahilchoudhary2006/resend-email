import { Router } from 'express';
import MetricsController from '../controllers/MetricsController.js';

const router = Router();

router.get('/overview', MetricsController.getOverview);

export default router;
