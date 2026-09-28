import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // student, employee, counsellor, category
  const id = searchParams.get('id');

  let query = supabaseAdmin
    .from('sessions')
    .select('*, categories(name), counsellors(name, email), remarks(counsellor_wellbeing_score, student_wellbeing_score, counsellor_notes, student_notes)')
    .order('created_at', { ascending: false });

  if (type === 'student' || type === 'employee') {
    if (id) query = query.eq('requester_id', id);
    query = query.eq('requester_type', type);
  } else if (type === 'counsellor' && id) {
    query = query.eq('counsellor_id', id);
  } else if (type === 'category' && id) {
    query = query.eq('category_id', id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Summary stats
  const total = data.length;
  const byStatus = data.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {});
  const avgWellbeing = data.filter(s => s.remarks?.counsellor_wellbeing_score).reduce((acc, s, _, arr) => acc + s.remarks.counsellor_wellbeing_score / arr.length, 0);

  return NextResponse.json({ sessions: data, stats: { total, byStatus, avgWellbeing: avgWellbeing.toFixed(1) } });
}
