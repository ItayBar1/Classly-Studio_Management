import { supabaseAdmin as supabase } from '../config/supabase';
import { logger } from '../logger';

export class InstructorService {

    /**
     * Get all instructors for a specific studio
     */
    static async getAllInstructors(studioId: string) {
        const serviceLogger = logger.child({ service: 'InstructorService', method: 'getAllInstructors' });
        serviceLogger.info({ studioId }, 'Fetching all instructors');
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, phone_number, profile_image_url, status, created_at')
            .in('role', ['INSTRUCTOR', 'ADMIN'])
            .eq('studio_id', studioId); // Filter by studio

        if (error) {
            serviceLogger.error({ err: error }, 'Failed to fetch instructors');
            throw new Error(error.message);
        }
        return data;
    }

    /**
     * Get single instructor details
     */
    static async getInstructorById(id: string) {
        const serviceLogger = logger.child({ service: 'InstructorService', method: 'getInstructorById' });
        serviceLogger.info({ id }, 'Fetching instructor by id');
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .eq('role', 'INSTRUCTOR')
            .single();

        if (error) {
            serviceLogger.error({ err: error }, 'Failed to fetch instructor by id');
            throw new Error(error.message);
        }
        return data;
    }

    /**
     * Soft delete instructor (change status to INACTIVE)
     */
    static async softDeleteInstructor(id: string) {
        const serviceLogger = logger.child({ service: 'InstructorService', method: 'softDeleteInstructor' });
        serviceLogger.info({ id }, 'Soft deleting instructor');
        const { error } = await supabase
            .from('users')
            .update({ status: 'INACTIVE' })
            .eq('id', id)
            .eq('role', 'INSTRUCTOR'); // Additional guard to delete only instructors

        if (error) {
            serviceLogger.error({ err: error }, 'Failed to soft delete instructor');
            throw new Error(error.message);
        }
        return true;
    }

    /**
     * Get earnings/commissions for an instructor
     * Based on 'instructor_commissions' table from PRD
     */
    static async getEarnings(instructorId: string) {
        const serviceLogger = logger.child({ service: 'InstructorService', method: 'getEarnings' });
        serviceLogger.info({ instructorId }, 'Fetching instructor earnings');
        const { data, error } = await supabase
            .from('instructor_commissions')
            .select(`
                *,
                class:classes(name)
            `)
            .eq('instructor_id', instructorId)
            .order('created_at', { ascending: false });

        if (error) {
            serviceLogger.error({ err: error }, 'Failed to fetch instructor earnings');
            throw new Error(error.message);
        }
        return data;
    }
}
