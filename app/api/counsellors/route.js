import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('counsellors')
    .select('*')
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  const { name, email, mobile, employee_id } = body;
  if (!name || !email) return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('counsellors').insert({ name, email, mobile, employee_id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req) {
  const body = await req.json();
  const { id, name, email, mobile, employee_id } = body;
  const { data, error } = await supabaseAdmin.from('counsellors').update({ name, email, mobile, employee_id }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req) {
  const { id } = await req.json();
  const { error } = await supabaseAdmin.from('counsellors').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
