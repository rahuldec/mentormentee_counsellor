'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import WellbeingStars from '@/components/WellbeingStars';
import { format } from 'date-fns';

function Avatar({ name, size = 42 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#E84A0C', '#D97706', '#2D8A4E', '#7C5CBC', '#DB2777', '#0891B2'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: 14, background: `${color}18`, color, fontSize: size * 0.38, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${color}30` }}>
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
  const [reopenModal, setReopenModal] = useState(null);
  const [reopenNotes, setReopenNotes] = useState('');

  useEffect(() => {
    const uid = sessionStorage.getItem('user_id');
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F5F5' }}>
      <div className="spinner" />
    </div>
  );

  const completed = sessions.filter(s => s.status === 'completed').length;
  const pending   = sessions.filter(s => s.status === 'pending' || s.status === 'reopened').length;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #F0E6DA' }}>
        <div style={{ maxWidth: 540, margin: '0 auto', padding: '16px 16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={user?.name} size={44} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#1A1A1A', letterSpacing: '-0.2px' }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: '#E84A0C', fontWeight: 600, textTransform: 'capitalize', marginTop: 1 }}>{user?.role}</div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={{ background: '#E84A0C', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 12, padding: '10px 16px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(232,74,12,0.35)' }}
            >
              + New Request
            </button>
          </div>

          {/* Stats */}
          {sessions.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16 }}>
              {[
                { label: 'Total', value: sessions.length, color: '#E84A0C' },
                { label: 'Completed', value: completed, color: '#2D8A4E' },
                { label: 'Pending', value: pending, color: '#F59E0B' },
              ].map(s => (
                <div key={s.label} style={{ background: '#F5F5F5', borderRadius: 12, padding: '10px 12px', textAlign: 'center', border: '1px solid #F0E6DA' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#8C7B6B', marginTop: 2, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px 0' }}>
        {/* New session form */}
        {showForm && (
          <div className="card" style={{ padding: 20, marginBottom: 16, border: '1.5px solid #F0E6DA' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#1A1A1A' }}>New Counselling Request</div>
                <div style={{ fontSize: 12, color: '#B8A99A', marginTop: 2 }}>We'll match you with a counsellor</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: '#FEF0E8', border: 'none', color: '#E84A0C', fontSize: 18, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, lineHeight: 1 }}>×</button>
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
              {error && <p style={{ color: '#C0392B', fontSize: 13, margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, background: '#1A1A1A', color: 'white', fontWeight: 700, border: 'none', borderRadius: 12, padding: '12px 0', fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Empty state */}
        {sessions.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: '#FEE8DC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 }}>💬</div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#1A1A1A', marginBottom: 6 }}>No sessions yet</div>
            <div style={{ fontSize: 14, color: '#B8A99A', marginBottom: 20 }}>Tap "+ New Request" to start a counselling session</div>
            <button onClick={() => setShowForm(true)} style={{ background: '#E84A0C', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', borderRadius: 12, padding: '12px 24px', cursor: 'pointer' }}>
              Get Started
            </button>
          </div>
        )}

        {/* Session cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map(s => (
            <div key={s.id} className={`session-card ${s.status}`}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', marginBottom: 2 }}>{s.categories?.name || 'Unknown Category'}</div>
                  <div style={{ fontSize: 12, color: '#B8A99A' }}>{format(new Date(s.created_at), 'dd MMM yyyy')}</div>
                </div>
                <StatusBadge status={s.status} />
              </div>

              {s.counsellors && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#8C7B6B' }}>Counsellor:</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#E84A0C' }}>{s.counsellors.name}</span>
                </div>
              )}

              {s.scheduled_at && (
                <div style={{ background: '#FFF5F0', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#C04010', marginBottom: 6, fontWeight: 600 }}>
                  📅 {format(new Date(s.scheduled_at), 'dd MMM yyyy, hh:mm a')}
                  {s.location && <span style={{ color: '#8C7B6B', fontWeight: 400 }}> · 📍 {s.location}</span>}
                </div>
              )}

              {s.requester_notes && (
                <div style={{ fontSize: 12, color: '#8C7B6B', fontStyle: 'italic', borderLeft: '3px solid #EDE0D4', paddingLeft: 8, marginBottom: 6 }}>
                  "{s.requester_notes}"
                </div>
              )}

              {s.decline_reason && (
                <div style={{ background: '#FEF0F0', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#C0392B', marginBottom: 6 }}>
                  Reason: {s.decline_reason}
                </div>
              )}

              {s.remarks && (
                <div style={{ borderTop: '1px solid #F5EBE0', paddingTop: 8, marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8C7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Session Remarks</div>
                  <WellbeingStars value={s.remarks.counsellor_wellbeing_score} readOnly />
                  {s.remarks.student_notes && <p style={{ fontSize: 12, color: '#7A6550', marginTop: 4 }}>{s.remarks.student_notes}</p>}
                </div>
              )}

              {s.referred_by_name && (
                <div style={{ fontSize: 12, color: '#7C5CBC', marginTop: 4 }}>↗ Referred by {s.referred_by_name}</div>
              )}

              {(s.status === 'completed' || s.status === 'declined') && (
                <button
                  onClick={() => { setReopenModal(s); setReopenNotes(''); }}
                  style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: '#DB2777', background: '#FDF2F8', border: '1.5px solid #FBCFE8', borderRadius: 10, padding: '7px 14px', cursor: 'pointer' }}
                >
                  ↩ Re-open Session
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Re-open Modal */}
      {reopenModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setReopenModal(null); }}>
          <div className="modal">
            <div style={{ fontWeight: 800, fontSize: 17, color: '#1A1A1A', marginBottom: 2 }}>Re-open Session</div>
            <div style={{ fontSize: 13, color: '#B8A99A', marginBottom: 12 }}>{reopenModal.categories?.name}</div>

            {reopenModal.scheduled_at && (
              <div style={{ background: '#F5F5F5', borderRadius: 10, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: '#7A6550', border: '1px solid #EDE0D4' }}>
                <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 11, color: '#B8A99A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Previous session</div>
                <div>📅 {format(new Date(reopenModal.scheduled_at), 'dd MMM yyyy, hh:mm a')}</div>
                {reopenModal.location && <div>📍 {reopenModal.location}</div>}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label className="label" style={{ marginBottom: 6 }}>Reason for re-opening (optional)</label>
              <textarea className="input" rows={3} value={reopenNotes} onChange={e => setReopenNotes(e.target.value)} placeholder="What would you like to discuss in the follow-up?" />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={reopenSession} disabled={submitting} style={{ flex: 1, background: 'linear-gradient(135deg, #DB2777, #EC4899)', color: 'white', fontWeight: 700, borderRadius: 12, padding: '12px 0', fontSize: 14, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
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
