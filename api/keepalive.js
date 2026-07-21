import { createClient } from '@supabase/supabase-js';

export default async function handler(_req, res) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    res.status(500).json({ ok: false, error: 'Missing Supabase env vars' });
    return;
  }
  const supabase = createClient(url, key);
  const { error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    res.status(500).json({ ok: false, error: error.message });
    return;
  }
  res.status(200).json({ ok: true, at: new Date().toISOString() });
}
