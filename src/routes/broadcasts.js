import { Router } from 'express';
import BroadcastController from '../controllers/BroadcastController.js';

const router = Router();

router.post('/', BroadcastController.createBroadcast);
router.get('/', BroadcastController.listBroadcasts);
router.get('/:id', BroadcastController.getBroadcast);
router.post('/:id/send', BroadcastController.sendBroadcast);

export default router;
