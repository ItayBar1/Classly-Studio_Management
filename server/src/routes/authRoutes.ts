import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { validate } from "../middleware/validate";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", validate(registerSchema), AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login and get JWT token
 * @access  Public
 */
router.post("/login", validate(loginSchema), AuthController.login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request a password reset email
 * @access  Public
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with a valid token
 * @access  Public
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Lean session check — returns id, role, studio_id from the HttpOnly cookie.
 *          Called on every app mount to determine auth state.
 * @access  Public (reads cookie directly, no authenticateUser middleware to keep it lean)
 */
router.get("/me", AuthController.me);

/**
 * @route   POST /api/auth/logout
 * @desc    Clear the auth cookie
 * @access  Public
 */
router.post("/logout", AuthController.logout);

export default router;
