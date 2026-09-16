import { Router } from 'express';
import ContactController from '../controllers/ContactController.js';

const router = Router();

router.post('/', ContactController.createContact);
router.get('/', ContactController.listContacts);
router.get('/:id', ContactController.getContact);
router.put('/:id', ContactController.updateContact);
router.delete('/:id', ContactController.deleteContact);

export default router;
