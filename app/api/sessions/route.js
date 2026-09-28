import { supabaseAdmin } from '@/lib/supabase';
import { emailSessionRequested } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const requester_id = searchParams.get('requester_id');
  const counsellor_id = searchParams.get('counsellor_id');
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('sessions')
    .select('*, categories(name), counsellors(id, name, email, mobile), remarks(counsellor_wellbeing_score, student_wellbeing_score, counsellor_notes, student_notes)')
    .order('created_at', { ascending: false });

  if (requester_id) query = query.eq('requester_id', requester_id);
  if (counsellor_id) query = query.eq('counsellor_id', counsellor_id);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  const { requester_id, requester_name, requester_email, requester_type, category_id, requester_notes, parent_session_id } = body;

  if (!requester_id || !requester_type || !category_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Find counsellor mapped to this category
  const { data: mapping } = await supabaseAdmin
    .from('category_counsellor_map')
    .select('counsellor_id, counsellors(id, name, email)')
    .eq('category_id', category_id)
    .limit(1)
    .single();

  const counsellor_id = mapping?.counsellor_id || null;
  const counsellor = mapping?.counsellors || null;

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .insert({
      requester_id,
      requester_name,
      requester_email,
      requester_type,
      category_id,
      counsellor_id,
      requester_notes,
      parent_session_id: parent_session_id || null,
      status: 'pending',
    })
    .select('*, categories(name), counsellors(name, email)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send emails
  try {
    await emailSessionRequested({
      requesterName: requester_name || requester_id,
      requesterEmail: requester_email,
      counsellorName: counsellor?.name,
      counsellorEmail: counsellor?.email,
      category: data.categories?.name,
      notes: requester_notes,
    });
  } catch (e) {
    console.error('Email error:', e);
  }

  return NextResponse.json(data);
}
