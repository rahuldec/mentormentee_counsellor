import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json();
  const { session_id, counsellor_notes, student_notes, counsellor_wellbeing_score, student_wellbeing_score } = body;

  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('remarks')
    .upsert({
      session_id,
      counsellor_notes,
      student_notes,
      counsellor_wellbeing_score,
      student_wellbeing_score,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'session_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark session as completed
  await supabaseAdmin.from('sessions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', session_id);

  return NextResponse.json(data);
}
