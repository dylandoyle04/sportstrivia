import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
}

export const supabase = createClient(url, key);

export async function upsertProfile({ id, email, displayName }) {
  return supabase
    .from('users')
    .upsert({ id, email, display_name: displayName }, { onConflict: 'id' });
}
