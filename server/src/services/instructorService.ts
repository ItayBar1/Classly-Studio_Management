import { supabase } from '../config/supabase';

export class InstructorService {
    static async getAllInstructors() {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'INSTRUCTOR')
            .eq('status', 'ACTIVE'); // Or omit status to see all
        if (error) throw new Error(error.message);
        return data;
    }

    static async softDeleteInstructor(id: string) {
        // Soft delete logic as per PRD
        const { error } = await supabase
            .from('users')
            .update({ status: 'INACTIVE' })
            .eq('id', id);
        if (error) throw new Error(error.message);
    }
}