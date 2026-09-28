'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import WellbeingStars from '@/components/WellbeingStars';
import { format } from 'date-fns';

export default function StudentPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category_id: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const uid = sessionStorage.getItem('user_id');
    const role = sessionStorage.getItem('role');
    if (!uid) { router.push('/'); return; }
    const storedName = sessionStorage.getItem('name');
    // Clean up name — don't show unresolved ERP placeholders
    const displayName = (storedName && !storedName.includes('{')) ? storedName : uid;
    const u = { id: uid, name: displayName, email: sessionStorage.getItem('email') || '', role };
    setUser(u);
    loadData(uid);
  }, [router]);

  async function loadData(uid) {
    setLoading(true);
    const [sessRes, catRes] = await Promise.all([
      fetch(`/api/sessions?requester_id=${uid}`),
      fetch('/api/categories'),
    ]);
    setSessions(await sessRes.json());
    setCategories(await catRes.json());
    setLoading(false);
  }

  async function submitSession(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requester_id: user.id,
        requester_name: user.name,
        requester_email: user.email,
        requester_type: user.role || 'student',
        category_id: form.category_id,
        requester_notes: form.notes,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSubmitting(false); return; }
    setShowForm(false);
    setForm({ category_id: '', notes: '' });
    loadData(user.id);
    setSubmitting(false);
  }

  async function reopenSession(session) {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requester_id: user.id,
        requester_name: user.name,
        requester_email: user.email,
        requester_type: user.role || 'student',
        category_id: session.category_id,
        requester_notes: 'Re-opened from previous session',
        parent_session_id: session.id,
      }),
    });
    if (res.ok) loadData(user.id);
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900">My Sessions</h1>
            <p className="text-xs text-gray-500">{user?.name} · {user?.role}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Request
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* New Session Form */}
        {showForm && (
          <div className="bg-white rounded-xl border mb-4 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">New Counselling Request</h2>
            <form onSubmit={submitSession} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Category</label>
                <select
                  value={form.category_id}
                  onChange={e => setForm({ ...form, category_id: e.target.value })}
                  required
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Your Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Briefly describe what you'd like to discuss..."
                  rows={3}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">💬</div>
            <p className="font-medium">No sessions yet</p>
            <p className="text-sm">Tap "+ New Request" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{s.categories?.name || 'Unknown Category'}</p>
                    <p className="text-xs text-gray-400">{format(new Date(s.created_at), 'dd MMM yyyy')}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                {s.counsellors && (
                  <p className="text-xs text-gray-500 mb-1">Counsellor: <span className="font-medium text-gray-700">{s.counsellors.name}</span></p>
                )}

                {s.scheduled_at && (
                  <p className="text-xs text-gray-500 mb-1">
                    📅 {format(new Date(s.scheduled_at), 'dd MMM yyyy, hh:mm a')}
                    {s.location && ` · 📍 ${s.location}`}
                  </p>
                )}

                {s.requester_notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">"{s.requester_notes}"</p>
                )}

                {s.decline_reason && (
                  <p className="text-xs text-red-500 mt-1">Reason: {s.decline_reason}</p>
                )}

                {s.remarks && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">Session Remarks</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Wellbeing:</span>
                      <WellbeingStars value={s.remarks.counsellor_wellbeing_score} readOnly />
                    </div>
                    {s.remarks.student_notes && <p className="text-xs text-gray-600 mt-1">{s.remarks.student_notes}</p>}
                  </div>
                )}

                {s.referred_by_name && (
                  <p className="text-xs text-purple-600 mt-1">Referred by: {s.referred_by_name}</p>
                )}

                {(s.status === 'completed' || s.status === 'declined') && (
                  <button
                    onClick={() => reopenSession(s)}
                    className="mt-3 text-xs text-blue-600 font-medium border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                  >
                    Re-open Session
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
