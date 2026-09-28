import { supabaseAdmin } from '@/lib/supabase';
import { emailSessionAccepted, emailSessionDeclined } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  const { id } = params;
  const { data, error } = await supabaseAdmin
    .from('sessions')
    .select('*, categories(name), counsellors(id, name, email, mobile), remarks(*)')
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req, { params }) {
  const { id } = params;
  const body = await req.json();
  const { action, scheduled_at, location, decline_reason, counsellor_id } = body;

  // Fetch current session
  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('*, categories(name), counsellors(name, email)')
    .eq('id', id)
    .single();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  let updates = { updated_at: new Date().toISOString() };

  if (action === 'accept') {
    updates.status = 'accepted';
    updates.scheduled_at = scheduled_at;
    updates.location = location;
    if (counsellor_id) updates.counsellor_id = counsellor_id;
  } else if (action === 'decline') {
    updates.status = 'declined';
    updates.decline_reason = decline_reason;
  } else if (action === 'reschedule') {
    updates.status = 'rescheduled';
    updates.scheduled_at = scheduled_at;
    updates.location = location;
  } else if (action === 'complete') {
    updates.status = 'completed';
  } else if (action === 'reopen') {
    updates.status = 'reopened';
  } else if (action === 'reassign') {
    updates.counsellor_id = counsellor_id;
  }

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select('*, categories(name), counsellors(name, email)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send email notifications
  try {
    if (action === 'accept' || action === 'reschedule') {
      await emailSessionAccepted({
        requesterName: session.requester_name || session.requester_id,
        requesterEmail: session.requester_email,
        counsellorName: data.counsellors?.name,
        counsellorEmail: data.counsellors?.email,
        scheduledAt: scheduled_at,
        location,
        category: session.categories?.name,
      });
    } else if (action === 'decline') {
      await emailSessionDeclined({
        requesterName: session.requester_name || session.requester_id,
        requesterEmail: session.requester_email,
        counsellorName: session.counsellors?.name,
        reason: decline_reason,
      });
    }
  } catch (e) {
    console.error('Email error:', e);
  }

  return NextResponse.json(data);
}
