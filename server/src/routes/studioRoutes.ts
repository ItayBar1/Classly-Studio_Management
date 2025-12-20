
import { Router } from 'express';
import { StudioController } from '../controllers/studioController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateUser);

/**
 * @route   GET /api/studios/my-studio
 * @desc    Get the current admin's studio
 * @access  Admin
 */
router.get('/my-studio', requireRole(['ADMIN', 'SUPER_ADMIN']), StudioController.getMyStudio);

/**
 * @route   POST /api/studios
 * @desc    Create a new studio (One time)
 * @access  Admin
 */
router.post('/', requireRole(['ADMIN', 'SUPER_ADMIN']), StudioController.create);

/**
 * @route   PUT /api/studios/:id
 * @desc    Update studio details
 * @access  Admin (Owner)
 */
router.put('/:id', requireRole(['ADMIN', 'SUPER_ADMIN']), StudioController.update);

export default router;
