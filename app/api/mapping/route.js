import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { category_id, counsellor_id } = await req.json();
  const { data, error } = await supabaseAdmin
    .from('category_counsellor_map')
    .insert({ category_id, counsellor_id })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req) {
  const { category_id, counsellor_id } = await req.json();
  const { error } = await supabaseAdmin
    .from('category_counsellor_map')
    .delete()
    .eq('category_id', category_id)
    .eq('counsellor_id', counsellor_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
