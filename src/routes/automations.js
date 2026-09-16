import { Router } from 'express';
import AutomationController from '../controllers/AutomationController.js';

const router = Router();

router.post('/', AutomationController.createAutomation);
router.get('/', AutomationController.listAutomations);
router.get('/:id', AutomationController.getAutomation);
router.put('/:id', AutomationController.updateAutomation);
router.delete('/:id', AutomationController.deleteAutomation);

export default router;
