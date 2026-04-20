import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ status: 'error', message: 'DB 환경변수 미설정' }, { status: 500 });
  }

  try {
    const supabase = createClient(url, key);
    const { error } = await supabase.from('branches').select('id').limit(1);

    return NextResponse.json({
      status: error ? 'error' : 'ok',
      db_connected: !error,
    });
  } catch {
    return NextResponse.json({ status: 'error', db_connected: false }, { status: 500 });
  }
}
