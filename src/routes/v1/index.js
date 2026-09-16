import { Router } from 'express';
import domainRoutes from '../domains.js';
import templateRoutes from '../templates.js';
import contactRoutes from '../contacts.js';
import broadcastRoutes from '../broadcasts.js';
import metricsRoutes from '../metrics.js';
import automationRoutes from '../automations.js';

const router = Router();

router.use('/domains', domainRoutes);
router.use('/templates', templateRoutes);
router.use('/contacts', contactRoutes);
router.use('/broadcasts', broadcastRoutes);
router.use('/metrics', metricsRoutes);
router.use('/automations', automationRoutes);

router.get('/status', (req, res) => {
  res.json({ message: 'API v1 is operational' });
});

export default router;
