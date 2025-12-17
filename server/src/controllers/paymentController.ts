import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { logger } from '../logger';

export class PaymentController {
  
  /**
   * יצירת Payment Intent חדש
   */
  static async createIntent(req: Request, res: Response) {
    const requestLog = req.logger || logger.child({ controller: 'PaymentController', method: 'createIntent' });
    
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
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * אישור תשלום (לאחר סליקה מוצלחת בצד לקוח)
   */
  static async confirmPayment(req: Request, res: Response) {
    const requestLog = req.logger || logger.child({ controller: 'PaymentController', method: 'confirmPayment' });

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
      res.status(500).json({ error: error.message });
    }
  }
}