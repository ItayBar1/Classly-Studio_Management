
import { Router } from 'express';
import { BranchController } from '../controllers/branchController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateUser);

router.get('/', requireRole(['ADMIN', 'SUPER_ADMIN']), BranchController.getAll);
router.post('/', requireRole(['ADMIN', 'SUPER_ADMIN']), BranchController.create);
router.put('/:id', requireRole(['ADMIN', 'SUPER_ADMIN']), BranchController.update);
router.delete('/:id', requireRole(['ADMIN', 'SUPER_ADMIN']), BranchController.delete);

export default router;
