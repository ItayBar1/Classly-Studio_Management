import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateUser);

/**
 * @route   GET /api/users/me
 * @desc    Get current logged-in user profile
 * @access  Authenticated User
 */
router.get('/me', UserController.getMe);

export default router;