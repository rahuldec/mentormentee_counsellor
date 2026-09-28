import { supabaseAdmin } from '@/lib/supabase';
import { emailReminder } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Find sessions scheduled within the next 1-2 hours that haven't had reminder sent
  const { data: sessions, error } = await supabaseAdmin
    .from('sessions')
    .select('*, counsellors(name, email)')
    .in('status', ['accepted', 'rescheduled'])
    .eq('reminder_sent', false)
    .gte('scheduled_at', oneHourFromNow.toISOString())
    .lte('scheduled_at', twoHoursFromNow.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const session of sessions) {
    try {
      await emailReminder({
        requesterName: session.requester_name || session.requester_id,
        requesterEmail: session.requester_email,
        counsellorName: session.counsellors?.name,
        counsellorEmail: session.counsellors?.email,
        scheduledAt: session.scheduled_at,
        location: session.location,
      });
      await supabaseAdmin.from('sessions').update({ reminder_sent: true }).eq('id', session.id);
      sent++;
    } catch (e) {
      console.error('Reminder email failed for session', session.id, e);
    }
  }

  return NextResponse.json({ sent, total: sessions.length });
}
