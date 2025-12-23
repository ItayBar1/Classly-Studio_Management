
import { supabaseAdmin } from '../config/supabase';

export interface CreateStudioDTO {
    name: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
    website_url?: string;
}

export class StudioService {

    // Helper method for exponential backoff
    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

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

        // 2. Generate a unique serial number with hybrid approach
        // Format: YYMMDD-XXXX where YYMMDD is date-based and XXXX is random
        // This reduces collision probability significantly
        let serialNumber = '';
        let isUnique = false;
        const maxAttempts = 10;
        let attempts = 0;

        while (!isUnique && attempts < maxAttempts) {
            // Use date-based prefix for better distribution
            const now = new Date();
            const datePrefix = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD format
            const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit random
            serialNumber = `${datePrefix}-${randomSuffix}`;

            const { data: collision } = await supabaseAdmin
                .from('studios')
                .select('id')
                .eq('serial_number', serialNumber)
                .single();

            if (!collision) {
                isUnique = true;
            } else {
                attempts++;
                // Exponential backoff: wait before retry to reduce database load
                if (attempts < maxAttempts) {
                    const delay = Math.pow(2, attempts) * 100;
                    await this.sleep(delay);
                }
            }
        }

        if (!isUnique) {
            throw new Error(
                'Unable to generate a unique studio serial number after multiple attempts. ' +
                'Please try again in a moment. If the problem persists, contact support.'
            );
        }

        // 3. Create Studio
        const { data: studio, error: createError } = await supabaseAdmin
        // Use database RPC to handle the entire operation in a single transaction
        // This ensures atomicity - either all operations succeed or none do
        const { data: result, error } = await supabaseAdmin
            .rpc('create_studio_with_transaction', {
                p_admin_id: adminId,
                p_name: data.name,
                p_description: data.description || null,
                p_contact_email: data.contact_email || null,
                p_contact_phone: data.contact_phone || null,
                p_website_url: data.website_url || null,
            });

        if (error) throw error;

        if (!result || result.length === 0) {
            throw new Error('Studio creation returned no data. The operation may have failed.');
        }

        // The RPC function returns studio and branch information
        // We need to fetch the full studio record to return the expected format
        const { data: studio, error: fetchError } = await supabaseAdmin
            .from('studios')
            .select('*')
            .eq('id', result[0].studio_id)
            .single();

        if (fetchError) throw fetchError;

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
