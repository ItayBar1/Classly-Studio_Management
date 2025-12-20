import { supabaseAdmin } from '../config/supabase';

export interface RoomDTO {
    branch_id: string;
    name: string;
    capacity: number;
    is_active?: boolean;
}

export class RoomService {

    static async getAll(studioId: string) {
        const { data, error } = await supabaseAdmin
            .from('studio_rooms')
            .select('*, branch:branches(name)') // Join branch to show branch name if needed
            .eq('studio_id', studioId)
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    }

    static async getByBranch(branchId: string) {
        const { data, error } = await supabaseAdmin
            .from('studio_rooms')
            .select('*')
            .eq('branch_id', branchId)
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    }

    static async create(studioId: string, data: RoomDTO) {
        const { data: room, error } = await supabaseAdmin
            .from('studio_rooms')
            .insert({
                studio_id: studioId,
                ...data
            })
            .select()
            .single();

        if (error) throw error;
        return room;
    }

    static async update(roomId: string, data: Partial<RoomDTO>) {
        const { data: room, error } = await supabaseAdmin
            .from('studio_rooms')
            .update(data)
            .eq('id', roomId)
            .select()
            .single();

        if (error) throw error;
        return room;
    }

    static async delete(roomId: string) {
        const { error } = await supabaseAdmin
            .from('studio_rooms')
            .delete()
            .eq('id', roomId);

        if (error) throw error;
        return true;
    }
}
