import nodemailer from 'nodemailer';
import { environment } from '../config/env';
import { logger } from '../logger';

const emailLog = logger.child({ service: 'EmailService' });

/**
 * Creates a nodemailer transporter.
 * Falls back to console logging if SMTP is not configured.
 */
const createTransporter = () => {
  const { smtp } = environment;

  if (!smtp.host || !smtp.user || !smtp.pass) {
    emailLog.warn('SMTP not configured. Emails will be logged to console instead of sent.');
    return null;
  }

  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });
};

const transporter = createTransporter();

export class EmailService {
  /**
   * Sends a password reset email with a reset link.
   * Falls back to logging the link if SMTP is not configured.
   */
  static async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${environment.frontendUrl}/reset-password?token=${resetToken}`;

    if (!transporter) {
      emailLog.info(
        { to, resetUrl },
        '📧 SMTP not configured — Password reset link (use this for testing):'
      );
      console.log(`\n🔗 Password Reset Link for ${to}:\n   ${resetUrl}\n`);
      return;
    }

    try {
      await transporter.sendMail({
        from: environment.smtp.from || `"Classly" <${environment.smtp.user}>`,
        to,
        subject: 'Classly - איפוס סיסמה',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #4f46e5; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Classly</h1>
              <p style="color: #c7d2fe; margin: 8px 0 0;">פלטפורמה לניהול סטודיו וחוגים</p>
            </div>
            <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1e293b; margin-top: 0;">איפוס סיסמה</h2>
              <p style="color: #475569; line-height: 1.6;">קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור למטה כדי לבחור סיסמה חדשה:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  איפוס סיסמה
                </a>
              </div>
              <p style="color: #94a3b8; font-size: 14px;">הקישור תקף ל-60 דקות בלבד.</p>
              <p style="color: #94a3b8; font-size: 14px;">אם לא ביקשת איפוס סיסמה, אנא התעלם ממייל זה.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="color: #cbd5e1; font-size: 12px; text-align: center;">© Classly - כל הזכויות שמורות</p>
            </div>
          </div>
        `,
      });

      emailLog.info({ to }, 'Password reset email sent successfully');
    } catch (error) {
      emailLog.error({ err: error, to }, 'Failed to send password reset email');
      // Still log the URL as fallback
      console.log(`\n🔗 Fallback — Password Reset Link for ${to}:\n   ${resetUrl}\n`);
      throw error;
    }
  }
}
