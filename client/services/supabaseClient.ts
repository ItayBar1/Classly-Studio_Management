import { createClient } from '@supabase/supabase-js';

import { Database } from '../types/database'; 

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase client initialization failed: missing environment variables');
  throw new Error('Missing Supabase environment variables');
}

console.info('Creating Supabase client');
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);