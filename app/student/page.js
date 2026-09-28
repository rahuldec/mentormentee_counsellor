'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import WellbeingStars from '@/components/WellbeingStars';
import { format } from 'date-fns';

function Avatar({ name, size = 40 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#7C3AED', '#DB2777'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: `${color}20`, color, fontSize: size * 0.38, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function StudentPage() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [sessions, setSessions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ category_id: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [reopenModal, setReopenModal] = useState(null); // session to reopen
  const [reopenNotes, setReopenNotes] = useState('');

  useEffect(() => {
    const uid = sessionStorage.getItem('user_id');
    // Reject unresolved ERP placeholders stored from a previous bad visit
    if (!uid || uid.includes('{')) { sessionStorage.clear(); router.push('/'); return; }
    const storedName = sessionStorage.getItem('name');
    const displayName = (storedName && !storedName.includes('{')) ? storedName : uid;
    const u = { id: uid, name: displayName, email: sessionStorage.getItem('email') || '', role: sessionStorage.getItem('role') || 'student' };
    setUser(u);
    loadData(uid);
  }, [router]);

  async function loadData(uid) {
    setLoading(true);
    const [sessRes, catRes] = await Promise.all([fetch(`/api/sessions?requester_id=${uid}`), fetch('/api/categories')]);
    setSessions(await sessRes.json());
    setCategories(await catRes.json());
    setLoading(false);
  }

  async function submitSession(e) {
    e.preventDefault();
    setSubmitting(true); setError('');
    const res = await fetch('/api/sessions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester_id: user.id, requester_name: user.name, requester_email: user.email, requester_type: user.role, category_id: form.category_id, requester_notes: form.notes }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSubmitting(false); return; }
    setShowForm(false); setForm({ category_id: '', notes: '' }); loadData(user.id); setSubmitting(false);
  }

  async function reopenSession() {
    setSubmitting(true);
    await fetch(`/api/sessions/${reopenModal.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reopen', requester_notes: reopenNotes }),
    });
    setReopenModal(null); setReopenNotes(''); setSubmitting(false);
    loadData(user.id);
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF', paddingBottom: 32 }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={user?.name} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E2A3B', lineHeight: 1.2 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', textTransform: 'capitalize' }}>{user?.role} · My Sessions</div>
            </div>
          </div>
          <button className="btn-primary" style={{ fontSize: 13, padding: '9px 16px', whiteSpace: 'nowrap' }} onClick={() => setShowForm(true)}>
            + New Request
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '16px 16px 0' }}>
        {/* Stats strip */}
        {sessions.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Total', value: sessions.length, color: '#4F46E5' },
              { label: 'Completed', value: sessions.filter(s => s.status === 'completed').length, color: '#059669' },
              { label: 'Pending', value: sessions.filter(s => s.status === 'pending' || s.status === 'reopened').length, color: '#F59E0B' },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* New Session Form */}
        {showForm && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: '#1E2A3B', margin: 0 }}>New Counselling Request</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>×</button>
            </div>
            <form onSubmit={submitSession} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required>
                  <option value="">Select a category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Briefly describe what you'd like to discuss..." rows={3} />
              </div>
              {error && <p style={{ color: '#E11D48', fontSize: 13 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1 }}>{submitting ? 'Submitting...' : 'Submit Request'}</button>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Sessions */}
        {sessions.length === 0 && !showForm ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>💬</div>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#1E2A3B', marginBottom: 6 }}>No sessions yet</div>
            <div style={{ fontSize: 14, color: '#94A3B8' }}>Tap "+ New Request" to start a counselling session</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.map(s => (
              <div key={s.id} className={`session-card ${s.status}`}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#1E2A3B', marginBottom: 2 }}>{s.categories?.name || 'Unknown Category'}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>{format(new Date(s.created_at), 'dd MMM yyyy')}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                {s.counsellors && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Counsellor:</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#4F46E5' }}>{s.counsellors.name}</span>
                  </div>
                )}

                {s.scheduled_at && (
                  <div style={{ background: '#EEF2FF', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#4338CA', marginBottom: 6 }}>
                    📅 {format(new Date(s.scheduled_at), 'dd MMM yyyy, hh:mm a')}
                    {s.location && <span> &nbsp;·&nbsp; 📍 {s.location}</span>}
                  </div>
                )}

                {s.requester_notes && (
                  <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', borderLeft: '3px solid #E2E8F0', paddingLeft: 8, marginBottom: 6 }}>
                    "{s.requester_notes}"
                  </div>
                )}

                {s.decline_reason && (
                  <div style={{ background: '#FFF1F2', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#E11D48', marginBottom: 6 }}>
                    Reason: {s.decline_reason}
                  </div>
                )}

                {s.remarks && (
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Session Remarks</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>Wellbeing:</span>
                      <WellbeingStars value={s.remarks.counsellor_wellbeing_score} readOnly />
                    </div>
                    {s.remarks.student_notes && <p style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{s.remarks.student_notes}</p>}
                  </div>
                )}

                {s.referred_by_name && (
                  <div style={{ fontSize: 12, color: '#7C3AED', marginTop: 4 }}>↗ Referred by {s.referred_by_name}</div>
                )}

                {(s.status === 'completed' || s.status === 'declined') && (
                  <button onClick={() => { setReopenModal(s); setReopenNotes(''); }} style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: '#EC4899', background: '#FDF2F8', border: '1px solid #FBCFE8', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>
                    ↩ Re-open Session
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Re-open Modal */}
      {reopenModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setReopenModal(null); }}>
          <div className="modal">
            <div style={{ fontWeight: 700, fontSize: 17, color: '#1E2A3B', marginBottom: 4 }}>Re-open Session</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 6 }}>{reopenModal.categories?.name}</div>

            {/* Show previous session details for reference */}
            {reopenModal.scheduled_at && (
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: '#475569' }}>
                <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Previous session</div>
                <div>📅 {format(new Date(reopenModal.scheduled_at), 'dd MMM yyyy, hh:mm a')}</div>
                {reopenModal.location && <div>📍 {reopenModal.location}</div>}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label className="label" style={{ marginBottom: 6 }}>Reason for re-opening (optional)</label>
              <textarea
                className="input"
                rows={3}
                value={reopenNotes}
                onChange={e => setReopenNotes(e.target.value)}
                placeholder="What would you like to discuss in the follow-up session?"
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={reopenSession}
                disabled={submitting}
                style={{ flex: 1, background: 'linear-gradient(135deg, #DB2777, #EC4899)', color: 'white', fontWeight: 600, borderRadius: 12, padding: '11px 0', fontSize: 14, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? 'Re-opening...' : '↩ Re-open'}
              </button>
              <button className="btn-ghost" onClick={() => setReopenModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
