import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login and get JWT token
 * @access  Public
 */
router.post('/login', AuthController.login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request a password reset email
 * @access  Public
 */
router.post('/forgot-password', AuthController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with a valid token
 * @access  Public
 */
router.post('/reset-password', AuthController.resetPassword);

export default router;

