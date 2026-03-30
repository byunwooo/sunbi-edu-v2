import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const result: Record<string, unknown> = {
    url_set: !!url,
    url_value: url ? url.substring(0, 30) + '...' : 'NOT SET',
    key_set: !!key,
    key_starts: key ? key.substring(0, 20) + '...' : 'NOT SET',
  };

  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const { data, error } = await supabase.from('branches').select('name').limit(1);
      result.db_connected = !error;
      result.db_error = error?.message || null;
      result.db_data = data;
    } catch (e) {
      result.db_connected = false;
      result.db_error = String(e);
    }
  }

  return NextResponse.json(result);
}
