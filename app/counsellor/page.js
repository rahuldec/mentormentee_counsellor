'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import WellbeingStars from '@/components/WellbeingStars';
import { format } from 'date-fns';

const TABS = ['Pending', 'Upcoming', 'Completed', 'All'];

export default function CounsellorPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [counsellorId, setCounsellorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Pending');
  const [actionModal, setActionModal] = useState(null); // { session, type: 'accept'|'decline'|'remarks' }
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const uid = sessionStorage.getItem('user_id');
    if (!uid) { router.push('/'); return; }
    const u = { id: uid, name: sessionStorage.getItem('name') || uid, email: sessionStorage.getItem('email') || '' };
    setUser(u);
    // Find counsellor record by employee_id or email
    loadCounsellor(uid, u.email);
  }, [router]);

  async function loadCounsellor(uid, email) {
    const res = await fetch('/api/counsellors');
    const counsellors = await res.json();
    const c = counsellors.find(x => x.employee_id === uid || x.email === email);
    if (c) {
      setCounsellorId(c.id);
      loadSessions(c.id);
    } else {
      setLoading(false);
    }
  }

  async function loadSessions(cid) {
    setLoading(true);
    const res = await fetch(`/api/sessions?counsellor_id=${cid}`);
    setSessions(await res.json());
    setLoading(false);
  }

  async function handleAction(e) {
    e.preventDefault();
    setSubmitting(true);
    const { session, type } = actionModal;
    let body = { action: type };

    if (type === 'accept' || type === 'reschedule') {
      body.scheduled_at = form.scheduled_at;
      body.location = form.location;
    } else if (type === 'decline') {
      body.decline_reason = form.decline_reason;
    }

    await fetch(`/api/sessions/${session.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setActionModal(null);
    setForm({});
    setSubmitting(false);
    loadSessions(counsellorId);
  }

  async function saveRemarks(e) {
    e.preventDefault();
    setSubmitting(true);
    const { session } = actionModal;
    await fetch('/api/remarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        counsellor_notes: form.counsellor_notes,
        student_notes: form.student_notes,
        counsellor_wellbeing_score: form.counsellor_wellbeing_score,
        student_wellbeing_score: form.student_wellbeing_score,
      }),
    });
    setActionModal(null);
    setForm({});
    setSubmitting(false);
    loadSessions(counsellorId);
  }

  const filtered = sessions.filter(s => {
    if (tab === 'Pending') return s.status === 'pending' || s.status === 'reopened';
    if (tab === 'Upcoming') return s.status === 'accepted' || s.status === 'rescheduled';
    if (tab === 'Completed') return s.status === 'completed' || s.status === 'declined';
    return true;
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  if (!counsellorId) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-gray-600 mb-2">Counsellor profile not found.</p>
        <p className="text-sm text-gray-400">Ask admin to add your employee ID: <strong>{user?.id}</strong></p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="font-bold text-gray-900">Counsellor Dashboard</h1>
          <p className="text-xs text-gray-500">{user?.name}</p>
        </div>
        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 flex gap-1 pb-0">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t}
              {t === 'Pending' && sessions.filter(s => s.status === 'pending' || s.status === 'reopened').length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {sessions.filter(s => s.status === 'pending' || s.status === 'reopened').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">✓</div>
            <p>No sessions in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(s => (
              <div key={s.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{s.requester_name || s.requester_id}</p>
                    <p className="text-xs text-gray-400">{s.requester_type} · {s.categories?.name}</p>
                    <p className="text-xs text-gray-400">{format(new Date(s.created_at), 'dd MMM yyyy')}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                {s.requester_notes && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded p-2 mb-2 italic">"{s.requester_notes}"</p>
                )}

                {s.scheduled_at && (
                  <p className="text-xs text-gray-600 mb-2">
                    📅 {format(new Date(s.scheduled_at), 'dd MMM yyyy, hh:mm a')}
                    {s.location && <span> · 📍 {s.location}</span>}
                  </p>
                )}

                {s.referred_by_name && (
                  <p className="text-xs text-purple-600 mb-2">Referred by: {s.referred_by_name}</p>
                )}

                {s.remarks && (
                  <div className="bg-green-50 rounded p-2 mb-2">
                    <p className="text-xs text-green-700 font-medium mb-1">Remarks saved</p>
                    <WellbeingStars value={s.remarks.counsellor_wellbeing_score} readOnly />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {(s.status === 'pending' || s.status === 'reopened') && (
                    <>
                      <button onClick={() => { setActionModal({ session: s, type: 'accept' }); setForm({}); }} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">Accept</button>
                      <button onClick={() => { setActionModal({ session: s, type: 'decline' }); setForm({}); }} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">Decline</button>
                    </>
                  )}
                  {(s.status === 'accepted' || s.status === 'rescheduled') && (
                    <>
                      <button onClick={() => { setActionModal({ session: s, type: 'reschedule' }); setForm({ scheduled_at: s.scheduled_at?.slice(0, 16), location: s.location }); }} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">Reschedule</button>
                      <button onClick={() => { setActionModal({ session: s, type: 'remarks' }); setForm(s.remarks || {}); }} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">Add Remarks</button>
                    </>
                  )}
                  {s.status === 'completed' && !s.remarks && (
                    <button onClick={() => { setActionModal({ session: s, type: 'remarks' }); setForm({}); }} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">Add Remarks</button>
                  )}
                  {s.remarks && (
                    <button onClick={() => { setActionModal({ session: s, type: 'remarks' }); setForm(s.remarks); }} className="text-xs border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50">Edit Remarks</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            {actionModal.type === 'accept' || actionModal.type === 'reschedule' ? (
              <>
                <h3 className="font-semibold text-gray-900 mb-4">{actionModal.type === 'accept' ? 'Accept Session' : 'Reschedule Session'}</h3>
                <form onSubmit={handleAction} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Date & Time</label>
                    <input type="datetime-local" value={form.scheduled_at || ''} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Location</label>
                    <input type="text" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Room 204, Block A" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={submitting} className="flex-1 bg-green-600 text-white font-medium py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">{submitting ? 'Saving...' : 'Confirm'}</button>
                    <button type="button" onClick={() => setActionModal(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              </>
            ) : actionModal.type === 'decline' ? (
              <>
                <h3 className="font-semibold text-gray-900 mb-4">Decline Session</h3>
                <form onSubmit={handleAction} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Reason (optional)</label>
                    <textarea value={form.decline_reason || ''} onChange={e => setForm({ ...form, decline_reason: e.target.value })} rows={3} placeholder="Reason for declining..." className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={submitting} className="flex-1 bg-red-600 text-white font-medium py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm">{submitting ? 'Saving...' : 'Decline'}</button>
                    <button type="button" onClick={() => setActionModal(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-gray-900 mb-4">Session Remarks</h3>
                <form onSubmit={saveRemarks} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Counsellor Notes</label>
                    <textarea value={form.counsellor_notes || ''} onChange={e => setForm({ ...form, counsellor_notes: e.target.value })} rows={3} placeholder="Session observations and notes..." className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Student's Notes / Shared</label>
                    <textarea value={form.student_notes || ''} onChange={e => setForm({ ...form, student_notes: e.target.value })} rows={2} placeholder="What the student shared in session..." className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block">Counsellor Wellbeing Score</label>
                    <WellbeingStars value={form.counsellor_wellbeing_score} onChange={v => setForm({ ...form, counsellor_wellbeing_score: v })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block">Student Self-Reported Score</label>
                    <WellbeingStars value={form.student_wellbeing_score} onChange={v => setForm({ ...form, student_wellbeing_score: v })} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">{submitting ? 'Saving...' : 'Save Remarks'}</button>
                    <button type="button" onClick={() => setActionModal(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
