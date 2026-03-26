import { Router } from "express";
import { PaymentController } from "../controllers/paymentController";
import { authenticateUser, requireRole } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import {
  createPaymentIntentSchema,
  confirmPaymentSchema,
} from "../schemas/payment.schema";

const router = Router();

// Apply authentication to all payment routes
router.use(authenticateUser);

/**
 * @route   GET /api/payments
 * @desc    Get all payment history
 * @access  Admin
 */
router.get("/", requireRole(["ADMIN", "INSTRUCTOR"]), PaymentController.getAll);

/**
 * @route   POST /api/payment/create-intent
 * @desc    Create a new Stripe Payment Intent
 * @access  Authenticated User (Student)
 */
router.post(
  "/create-intent",
  validate(createPaymentIntentSchema),
  PaymentController.createIntent
);

/**
 * @route   POST /api/payment/confirm
 * @desc    Confirm payment and update database status
 * @access  Authenticated User
 */
router.post(
  "/confirm",
  validate(confirmPaymentSchema),
  PaymentController.confirmPayment
);

export default router;
