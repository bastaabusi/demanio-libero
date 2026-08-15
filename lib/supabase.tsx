import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Crea e asporta il client che useremo in tutto il sito
export const supabase = createClient(supabaseUrl, supabaseAnonKey);