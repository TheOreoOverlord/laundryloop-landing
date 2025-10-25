import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client using public environment variables.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);