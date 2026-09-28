import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('email_config')
    .select('*')
    .order('event');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req) {
  const body = await req.json();
  const { event, recipients, subject, body: emailBody, enabled } = body;
  if (!event) return NextResponse.json({ error: 'Event required' }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from('email_config')
    .update({ recipients, subject, body: emailBody, enabled, updated_at: new Date().toISOString() })
    .eq('event', event)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
