import { supabaseAdmin } from '../config/supabase';
import { logger } from '../logger';

export class UserService {
  /**
   * Retrieve a full user profile by ID
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
   * Validate studio existence by serial number
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
        return null;
      }
      serviceLogger.error({ err: error }, 'Failed to validate studio serial');
      throw new Error(`Error validating studio serial: ${error.message}`);
    }

    serviceLogger.info({ studioId: data.id }, 'Studio serial validated successfully');
    return data;
  }

  /**
   * SECURITY: Create a pending registration with validated studio_id
   * This prevents clients from self-assigning to arbitrary studios via metadata
   */
  static async createPendingRegistration(email: string, studioId: string, invitationToken?: string, role?: string) {
    const serviceLogger = logger.child({ service: 'UserService', method: 'createPendingRegistration' });
    serviceLogger.info({ email, studioId, role }, 'Creating pending registration with validated studio');

    // Delete any existing unused pending registrations for this email
    const { error: deleteError } = await supabaseAdmin
      .from('pending_registrations')
      .delete()
      .eq('email', email)
      .eq('used', false);

    if (deleteError) {
      // Log but don't fail - this is just cleanup
      serviceLogger.warn({ err: deleteError }, 'Failed to delete old pending registrations');
    }

    // Create new pending registration
    const { data, error } = await supabaseAdmin
      .from('pending_registrations')
      .insert({
        email,
        studio_id: studioId,
        invitation_token: invitationToken || null,
        role: role || null,
      })
      .select()
      .single();

    if (error) {
      serviceLogger.error({ err: error }, 'Failed to create pending registration');
      throw new Error(`Error creating pending registration: ${error.message}`);
    }

    serviceLogger.info({ email, studioId, role }, 'Pending registration created successfully');
    return data;
  }
}
