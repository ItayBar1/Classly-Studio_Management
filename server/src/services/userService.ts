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
}