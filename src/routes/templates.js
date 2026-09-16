import { Router } from 'express';
import TemplateController from '../controllers/TemplateController.js';

const router = Router();

router.post('/', TemplateController.createTemplate);
router.get('/', TemplateController.listTemplates);
router.get('/:id', TemplateController.getTemplate);
router.put('/:id', TemplateController.updateTemplate);
router.delete('/:id', TemplateController.deleteTemplate);
router.post('/:id/preview', TemplateController.previewTemplate);

export default router;
