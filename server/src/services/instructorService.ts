import { supabase } from '../config/supabase';

export class InstructorService {
    
    /**
     * Get all instructors for a specific studio
     */
    static async getAllInstructors(studioId: string) {
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, phone_number, profile_image_url, status, created_at')
            .eq('role', 'INSTRUCTOR')
            .eq('studio_id', studioId); // סינון לפי סטודיו

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * Get single instructor details
     */
    static async getInstructorById(id: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .eq('role', 'INSTRUCTOR')
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * Soft delete instructor (change status to INACTIVE)
     */
    static async softDeleteInstructor(id: string) {
        const { error } = await supabase
            .from('users')
            .update({ status: 'INACTIVE' })
            .eq('id', id)
            .eq('role', 'INSTRUCTOR'); // הגנה נוספת לוודא שמוחקים רק מדריך

        if (error) throw new Error(error.message);
        return true;
    }

    /**
     * Get earnings/commissions for an instructor
     * Based on 'instructor_commissions' table from PRD
     */
    static async getEarnings(instructorId: string) {
        const { data, error } = await supabase
            .from('instructor_commissions')
            .select(`
                *,
                class:classes(name)
            `)
            .eq('instructor_id', instructorId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }
}