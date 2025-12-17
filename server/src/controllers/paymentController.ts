import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentService';
import { logger } from '../logger';

export class PaymentController {
  
  /**
   * יצירת Payment Intent חדש
   */
  static async createIntent(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'PaymentController', method: 'createIntent' });
    requestLog.info({ body: req.body }, 'Controller entry');

    try {
      const { amount, currency, description, metadata } = req.body;

      // ולידציה בסיסית
      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }

      const result = await PaymentService.createIntent(amount, currency, description, metadata);

      requestLog.info({ amount, currency }, 'Payment intent created successfully');
      res.status(200).json(result);

    } catch (error: any) {
      requestLog.error({ err: error }, 'Error creating payment intent');
      next(error);
    }
  }

  /**
   * אישור תשלום (לאחר סליקה מוצלחת בצד לקוח)
   */
  static async confirmPayment(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'PaymentController', method: 'confirmPayment' });
    requestLog.info({ body: req.body }, 'Controller entry');

    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ error: 'Payment Intent ID is required' });
      }

      const result = await PaymentService.confirmPayment(paymentIntentId);

      requestLog.info({ paymentIntentId }, 'Payment confirmed successfully');
      res.status(200).json(result);

    } catch (error: any) {
      requestLog.error({ err: error }, 'Error confirming payment');
      next(error);
    }
  }

  /**
   * שליפת כל התשלומים
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    const requestLog = req.logger || logger.child({ controller: 'PaymentController', method: 'getAll' });
    requestLog.info({ studioId: req.studioId }, 'Controller entry');

    try {
      const studioId = req.studioId; // מגיע מ-authMiddleware

      if (!studioId) {
        return res.status(400).json({ error: 'Studio ID is missing' });
      }

      const payments = await PaymentService.getAllPayments(studioId);

      requestLog.info({ count: payments?.length }, 'Fetched payment history');
      res.status(200).json(payments);

    } catch (error: any) {
      requestLog.error({ err: error }, 'Error fetching payment history');
      next(error);
    }
  }
}