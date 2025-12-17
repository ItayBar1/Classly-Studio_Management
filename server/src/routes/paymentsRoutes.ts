import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();

// החלת אימות משתמש על כל הנתיבים (אופציונלי - תלוי בדרישות האבטחה שלך)
router.use(authenticateUser);

/**
 * @route   GET /api/payments
 * @desc    Get all payment history
 * @access  Admin
 */
router.get('/', requireRole(['admin', 'instructor']), PaymentController.getAll); // אפשר להסיר instructor אם זה רק לאדמין

/**
 * @route   POST /api/payment/create-intent
 * @desc    Create a new Stripe Payment Intent
 * @access  Authenticated User (Student)
 */
router.post('/create-intent', PaymentController.createIntent);

/**
 * @route   POST /api/payment/confirm
 * @desc    Confirm payment and update database status
 * @access  Authenticated User
 */
router.post('/confirm', PaymentController.confirmPayment);

export default router;