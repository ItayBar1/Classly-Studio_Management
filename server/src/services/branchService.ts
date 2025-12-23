
import { supabaseAdmin } from '../config/supabase';

export interface BranchDTO {
    name: string;
    address: string;
    city: string;
    phone_number: string;
    is_active?: boolean;
}

export class BranchService {

    static async getAll(studioId: string) {
        const { data, error } = await supabaseAdmin
            .from('branches')
            .select('*')
            .eq('studio_id', studioId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    }

    static async create(studioId: string, data: BranchDTO) {
        const { data: branch, error } = await supabaseAdmin
            .from('branches')
            .insert({
                studio_id: studioId,
                ...data
            })
            .select()
            .single();

        if (error) throw error;

        // Auto-create default room
        if (branch) {
            await supabaseAdmin.from('studio_rooms').insert({
                studio_id: studioId,
                branch_id: branch.id,
                name: 'אולם ראשי',
                capacity: 20,
                is_active: true
            });
        }

        return branch;
    }

    static async update(branchId: string, studioId: string, data: Partial<BranchDTO>) {
        const { data: branch, error } = await supabaseAdmin
            .from('branches')
            .update(data)
            .eq('id', branchId)
            .eq('studio_id', studioId)
            .select()
            .single();

        if (error) throw error;
        return branch;
    }

    static async delete(branchId: string, studioId: string) {
        // Soft delete (set inactive) or hard delete?
        // User asked to 'remove', but usually hard delete is risky with dependencies.
        // We will do hard delete but let FK constraints fail if used.
        // Or better: check usage first. For now, simple Delete.
        const { error } = await supabaseAdmin
            .from('branches')
            .delete()
            .eq('id', branchId)
            .eq('studio_id', studioId);

        if (error) throw error;
        return true;
    }
}
