import { Router } from 'express';
import { RoomController } from '../controllers/roomController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateUser);

router.get('/', RoomController.getAll);
router.get('/branch/:branchId', RoomController.getByBranch);
router.post('/', requireRole(['ADMIN', 'SUPER_ADMIN']), RoomController.create);
router.put('/:id', requireRole(['ADMIN', 'SUPER_ADMIN']), RoomController.update);
router.delete('/:id', requireRole(['ADMIN', 'SUPER_ADMIN']), RoomController.delete);

export default router;
