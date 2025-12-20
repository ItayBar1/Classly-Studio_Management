import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { InvitationController } from '../controllers/invitationController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();


/**
 * @route   GET /api/users/validate-studio/:serialNumber
 * @desc    Validate studio serial number for registration
 * @access  Public
 */
router.get('/validate-studio/:serialNumber', UserController.validateStudio);

/**
 * @route   GET /api/users/invitations/:token
 * @desc    Validate an invitation token
 * @access  Public
 */
router.get('/invitations/:token', InvitationController.validateInvite);

router.use(authenticateUser);

/**
 * @route   POST /api/users/invitations
 * @desc    Create a new invitation (Admin/SuperAdmin)
 * @access  Authenticated (Admin/SuperAdmin)
 */
router.post('/invitations', InvitationController.createInvite);

/**
 * @route   POST /api/users/invitations/accept
 * @desc    Accept an invitation to upgrade role
 * @access  Authenticated (User accepting the invite)
 */
router.post('/invitations/accept', InvitationController.acceptInvite);

/**
 * @route   GET /api/users/me
 * @desc    Get current logged-in user profile
 * @access  Authenticated User
 */
router.get('/me', UserController.getMe);

export default router;