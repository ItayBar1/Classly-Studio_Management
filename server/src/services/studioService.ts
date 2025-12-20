
import { supabaseAdmin } from '../config/supabase';

export interface CreateStudioDTO {
    name: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
    website_url?: string;
}

export class StudioService {

    // Create a new studio + default branch + update user
    static async createStudio(adminId: string, data: CreateStudioDTO) {
        // 1. Check if user already has a studio
        const { data: existingStudio } = await supabaseAdmin
            .from('studios')
            .select('id')
            .eq('admin_id', adminId)
            .single();

        if (existingStudio) {
            throw new Error('User already has a studio');
        }

        // 2. Generate a unique 6-digit serial number
        // We try a loop to ensure uniqueness, though collision prob is low for 6 digits
        let serialNumber = '';
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
            serialNumber = Math.floor(100000 + Math.random() * 900000).toString();
            const { data: collision } = await supabaseAdmin
                .from('studios')
                .select('id')
                .eq('serial_number', serialNumber)
                .single();

            if (!collision) isUnique = true;
            attempts++;
        }

        if (!isUnique) throw new Error('Failed to generate unique serial number');

        // 3. Create Studio
        const { data: studio, error: createError } = await supabaseAdmin
            .from('studios')
            .insert({
                admin_id: adminId,
                name: data.name,
                serial_number: serialNumber,
                description: data.description,
                contact_email: data.contact_email,
                contact_phone: data.contact_phone,
                website_url: data.website_url,
            })
            .select()
            .single();

        if (createError) throw createError;

        // 4. Create Default Branch ("Main Branch")
        const { error: branchError } = await supabaseAdmin
            .from('branches')
            .insert({
                studio_id: studio.id,
                name: 'Main Branch', // Default name
                is_active: true
            });

        if (branchError) {
            // Cleanup?Ideally we run this in a real transaction but Supabase JS doesn't expose one easily.
            // For MVP we log error. Database constraints usually prevent partial garbage if setup right.
            console.error('Failed to create default branch', branchError);
        }

        // 5. Update Admin User to link to this studio
        const { error: userError } = await supabaseAdmin
            .from('users')
            .update({ studio_id: studio.id })
            .eq('id', adminId);

        if (userError) console.error('Failed to link user to studio', userError);

        return studio;
    }

    // Get Studio by Admin ID
    static async getStudioByAdmin(adminId: string) {
        const { data, error } = await supabaseAdmin
            .from('studios')
            .select('*')
            .eq('admin_id', adminId)
            .single();

        // It's okay if not found (returns null) - means user hasn't created one yet
        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            throw error;
        }
        return data;
    }

    // Update Studio
    static async updateStudio(studioId: string, updates: Partial<CreateStudioDTO>) {
        const { data, error } = await supabaseAdmin
            .from('studios')
            .update(updates)
            .eq('id', studioId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
