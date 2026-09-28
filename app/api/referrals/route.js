import { supabaseAdmin } from '@/lib/supabase';
import { emailReferral } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const teacher_id = searchParams.get('teacher_id');

  let query = supabaseAdmin
    .from('referrals')
    .select('*, categories(name), counsellors(name, email)')
    .order('created_at', { ascending: false });

  if (teacher_id) query = query.eq('teacher_id', teacher_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  const { teacher_id, teacher_name, student_id, student_name, student_email, category_id, counsellor_id, notes } = body;

  if (!teacher_id || !student_id || !category_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Resolve counsellor if not provided
  let resolvedCounsellorId = counsellor_id;
  let counsellor = null;

  if (!resolvedCounsellorId) {
    const { data: mapping } = await supabaseAdmin
      .from('category_counsellor_map')
      .select('counsellor_id, counsellors(id, name, email)')
      .eq('category_id', category_id)
      .limit(1)
      .single();
    resolvedCounsellorId = mapping?.counsellor_id;
    counsellor = mapping?.counsellors;
  } else {
    const { data: c } = await supabaseAdmin.from('counsellors').select('*').eq('id', resolvedCounsellorId).single();
    counsellor = c;
  }

  // Get category
  const { data: category } = await supabaseAdmin.from('categories').select('name').eq('id', category_id).single();

  // Create referral record
  const { data: referral, error: refError } = await supabaseAdmin
    .from('referrals')
    .insert({ teacher_id, teacher_name, student_id, student_name, student_email, category_id, counsellor_id: resolvedCounsellorId, notes })
    .select()
    .single();

  if (refError) return NextResponse.json({ error: refError.message }, { status: 500 });

  // Auto-create session for the student
  const { data: session, error: sessError } = await supabaseAdmin
    .from('sessions')
    .insert({
      requester_id: student_id,
      requester_name: student_name,
      requester_email: student_email,
      requester_type: 'student',
      category_id,
      counsellor_id: resolvedCounsellorId,
      requester_notes: notes,
      referred_by_id: teacher_id,
      referred_by_name: teacher_name,
      status: 'pending',
    })
    .select()
    .single();

  if (sessError) return NextResponse.json({ error: sessError.message }, { status: 500 });

  // Link referral to session
  await supabaseAdmin.from('referrals').update({ session_id: session.id, status: 'session_created' }).eq('id', referral.id);

  // Send emails
  try {
    await emailReferral({
      studentName: student_name,
      studentEmail: student_email,
      teacherName: teacher_name,
      counsellorName: counsellor?.name,
      counsellorEmail: counsellor?.email,
      category: category?.name,
      notes,
    });
  } catch (e) {
    console.error('Email error:', e);
  }

  return NextResponse.json({ referral, session });
}
