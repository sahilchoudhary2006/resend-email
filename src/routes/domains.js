import { Router } from 'express';
import DomainController from '../controllers/DomainController.js';

const router = Router();

router.post('/', DomainController.addDomain);
router.get('/', DomainController.listDomains);
router.post('/:id/verify', DomainController.verifyDomain);
router.delete('/:id', DomainController.removeDomain);

export default router;
