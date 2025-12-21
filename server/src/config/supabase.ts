import { createClient } from '@supabase/supabase-js';
import { environment } from './env';

const { url, serviceRoleKey } = environment.supabase;

if (!url || !serviceRoleKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

export const supabaseAdmin = createClient(url, serviceRoleKey);
