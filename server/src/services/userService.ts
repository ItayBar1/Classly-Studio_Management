import { supabaseAdmin } from '../config/supabase';
import { logger } from '../logger';

export class UserService {
  /**
   * שליפת פרופיל משתמש מלא לפי ID
   */
  static async getUserProfile(userId: string) {
    const serviceLogger = logger.child({ service: 'UserService', method: 'getUserProfile' });
    serviceLogger.info({ userId }, 'Fetching user profile');
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      serviceLogger.error({ err: error }, 'Failed to fetch user profile');
      throw new Error(`Error fetching user profile: ${error.message}`);
    }

    serviceLogger.info({ userId }, 'User profile fetched successfully');
    return data;
  }

  /**
   * בדיקת קיים סטודיו לפי מספר סידורי
   */
  static async validateStudioSerial(serialNumber: string) {
    const serviceLogger = logger.child({ service: 'UserService', method: 'validateStudioSerial' });
    serviceLogger.info({ serialNumber }, 'Validating studio serial number');

    const { data, error } = await supabaseAdmin
      .from('studios')
      .select('id, name')
      .eq('serial_number', serialNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        serviceLogger.warn({ serialNumber }, 'Studio serial number not found');
      }
      serviceLogger.error({ err: error }, 'Failed to validate studio serial');
      throw new Error(`Error validating studio serial: ${error.message}`);
    }

    serviceLogger.info({ studioId: data.id }, 'Studio serial validated successfully');
    return data;
  }
}