import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // שים לב: זה ה-Service Role, לא ה-Anon!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in .env');
}

// קליינט עם הרשאות אדמין מלאות לשימוש השרת
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);