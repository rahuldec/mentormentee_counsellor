'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import WellbeingStars from '@/components/WellbeingStars';
import { format } from 'date-fns';

const TABS = ['Pending', 'Upcoming', 'Completed', 'All'];

function Avatar({ name, size = 36 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#7C3AED', '#DB2777'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: `${color}20`, color, fontSize: size * 0.38, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function CounsellorPage() {
  const router = useRouter();
  const [user, setUser]           = useState(null);
  const [sessions, setSessions]   = useState([]);
  const [counsellorId, setCounsellorId] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('Pending');
  const [actionModal, setActionModal] = useState(null);
  const [form, setForm]           = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const uid = sessionStorage.getItem('user_id');
    if (!uid) { router.push('/'); return; }
    const u = { id: uid, name: sessionStorage.getItem('name') || uid, email: sessionStorage.getItem('email') || '' };
    setUser(u);
    loadCounsellor(uid, u.email);
  }, [router]);

  async function loadCounsellor(uid, email) {
    const res = await fetch('/api/counsellors');
    const counsellors = await res.json();
    const c = counsellors.find(x => x.employee_id === uid || x.email === email);
    if (c) { setCounsellorId(c.id); loadSessions(c.id); }
    else setLoading(false);
  }

  async function loadSessions(cid) {
    setLoading(true);
    const [assignedRes, categoriesRes] = await Promise.all([
      fetch(`/api/sessions?counsellor_id=${cid}`),
      fetch('/api/categories'),
    ]);
    const assigned = await assignedRes.json();
    const categories = await categoriesRes.json();
    const myCategoryIds = categories.filter(cat => cat.category_counsellor_map?.some(m => m.counsellor_id === cid)).map(cat => cat.id);
    let unassigned = [];
    if (myCategoryIds.length > 0) {
      const ur = await fetch(`/api/sessions?unassigned=true&category_ids=${myCategoryIds.join(',')}`);
      unassigned = await ur.json();
    }
    const merged = [...assigned];
    unassigned.forEach(s => { if (!merged.find(m => m.id === s.id)) merged.push(s); });
    setSessions(merged);
    setLoading(false);
  }

  async function handleAction(e) {
    e.preventDefault(); setSubmitting(true);
    const { session, type } = actionModal;
    let body = { action: type };
    if (type === 'accept' || type === 'reschedule') { body.scheduled_at = form.scheduled_at; body.location = form.location; }
    else if (type === 'decline') { body.decline_reason = form.decline_reason; }
    await fetch(`/api/sessions/${session.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setActionModal(null); setForm({}); setSubmitting(false); loadSessions(counsellorId);
  }

  async function saveRemarks(e) {
    e.preventDefault(); setSubmitting(true);
    const { session } = actionModal;
    await fetch('/api/remarks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: session.id, counsellor_notes: form.counsellor_notes, student_notes: form.student_notes, counsellor_wellbeing_score: form.counsellor_wellbeing_score, student_wellbeing_score: form.student_wellbeing_score }),
    });
    setActionModal(null); setForm({}); setSubmitting(false); loadSessions(counsellorId);
  }

  const pendingCount = sessions.filter(s => s.status === 'pending' || s.status === 'reopened').length;
  const filtered = sessions.filter(s => {
    if (tab === 'Pending') return s.status === 'pending' || s.status === 'reopened';
    if (tab === 'Upcoming') return s.status === 'accepted' || s.status === 'rescheduled';
    if (tab === 'Completed') return s.status === 'completed' || s.status === 'declined';
    return true;
  });

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;

  if (!counsellorId) return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ padding: 32, textAlign: 'center', maxWidth: 340 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#1E2A3B', marginBottom: 8 }}>Profile Not Found</div>
        <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>Ask admin to add your employee ID: <strong style={{ color: '#4F46E5' }}>{user?.id}</strong></div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF', paddingBottom: 32 }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #059669, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" fill="white" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E2A3B' }}>Counsellor Dashboard</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>{user?.name}</div>
          </div>
          {pendingCount > 0 && (
            <div style={{ marginLeft: 'auto', background: '#EF4444', color: 'white', fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '3px 10px', minWidth: 28, textAlign: 'center' }}>
              {pendingCount}
            </div>
          )}
        </div>
        {/* Tabs */}
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 16px 12px' }}>
          <div className="pill-tabs">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} className={`pill-tab ${tab === t ? 'active' : ''}`}>
                {t}
                {t === 'Pending' && pendingCount > 0 && (
                  <span style={{ marginLeft: 5, background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 5px' }}>{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 0' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#64748B' }}>No sessions here</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(s => (
              <div key={s.id} className={`session-card ${s.status}`}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <Avatar name={s.requester_name || s.requester_id} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1E2A3B', marginBottom: 2 }}>{s.requester_name || s.requester_id}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'capitalize' }}>{s.requester_type} · {s.categories?.name}</div>
                    <div style={{ fontSize: 11, color: '#CBD5E1' }}>{format(new Date(s.created_at), 'dd MMM yyyy')}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                {s.requester_notes && (
                  <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', borderLeft: '3px solid #E2E8F0', paddingLeft: 8, marginBottom: 8 }}>
                    "{s.requester_notes}"
                  </div>
                )}

                {s.scheduled_at && (
                  <div style={{ background: '#EEF2FF', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#4338CA', marginBottom: 8 }}>
                    📅 {format(new Date(s.scheduled_at), 'dd MMM yyyy, hh:mm a')}
                    {s.location && <span> · 📍 {s.location}</span>}
                  </div>
                )}

                {s.referred_by_name && (
                  <div style={{ fontSize: 12, color: '#7C3AED', marginBottom: 8 }}>↗ Referred by {s.referred_by_name}</div>
                )}

                {s.remarks && (
                  <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#166534', marginBottom: 4 }}>Remarks saved</div>
                    <WellbeingStars value={s.remarks.counsellor_wellbeing_score} readOnly />
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {(s.status === 'pending' || s.status === 'reopened') && (
                    <>
                      <button onClick={() => { setActionModal({ session: s, type: 'accept' }); setForm({}); }} className="btn-success">Accept</button>
                      <button onClick={() => { setActionModal({ session: s, type: 'decline' }); setForm({}); }} className="btn-danger">Decline</button>
                    </>
                  )}
                  {(s.status === 'accepted' || s.status === 'rescheduled') && (
                    <>
                      <button onClick={() => { setActionModal({ session: s, type: 'reschedule' }); setForm({ scheduled_at: s.scheduled_at?.slice(0, 16), location: s.location }); }} className="btn-ghost">Reschedule</button>
                      <button onClick={() => { setActionModal({ session: s, type: 'remarks' }); setForm(s.remarks || {}); }} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>Add Remarks</button>
                    </>
                  )}
                  {s.status === 'completed' && !s.remarks && (
                    <button onClick={() => { setActionModal({ session: s, type: 'remarks' }); setForm({}); }} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>Add Remarks</button>
                  )}
                  {s.remarks && (
                    <button onClick={() => { setActionModal({ session: s, type: 'remarks' }); setForm(s.remarks); }} className="btn-ghost">Edit Remarks</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {actionModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) { setActionModal(null); } }}>
          <div className="modal">
            {(actionModal.type === 'accept' || actionModal.type === 'reschedule') && (
              <>
                <div style={{ fontWeight: 700, fontSize: 17, color: '#1E2A3B', marginBottom: 4 }}>{actionModal.type === 'accept' ? 'Accept Session' : 'Reschedule Session'}</div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>For {actionModal.session.requester_name}</div>
                <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div><label className="label">Date & Time</label><input type="datetime-local" className="input" style={{ marginTop: 6 }} value={form.scheduled_at || ''} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} required /></div>
                  <div><label className="label">Location</label><input type="text" className="input" style={{ marginTop: 6 }} value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Room 204, Block A" /></div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button type="submit" disabled={submitting} className="btn-success" style={{ flex: 1, padding: '11px 0', fontSize: 14 }}>{submitting ? 'Saving...' : 'Confirm'}</button>
                    <button type="button" className="btn-ghost" onClick={() => setActionModal(null)}>Cancel</button>
                  </div>
                </form>
              </>
            )}
            {actionModal.type === 'decline' && (
              <>
                <div style={{ fontWeight: 700, fontSize: 17, color: '#1E2A3B', marginBottom: 4 }}>Decline Session</div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>From {actionModal.session.requester_name}</div>
                <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div><label className="label">Reason (optional)</label><textarea className="input" style={{ marginTop: 6 }} value={form.decline_reason || ''} onChange={e => setForm({ ...form, decline_reason: e.target.value })} rows={3} placeholder="Reason for declining..." /></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" disabled={submitting} className="btn-danger" style={{ flex: 1, padding: '11px 0', fontSize: 14, background: '#EF4444', color: 'white', borderColor: '#EF4444' }}>{submitting ? 'Saving...' : 'Decline'}</button>
                    <button type="button" className="btn-ghost" onClick={() => setActionModal(null)}>Cancel</button>
                  </div>
                </form>
              </>
            )}
            {actionModal.type === 'remarks' && (
              <>
                <div style={{ fontWeight: 700, fontSize: 17, color: '#1E2A3B', marginBottom: 4 }}>Session Remarks</div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>For {actionModal.session.requester_name}</div>
                <form onSubmit={saveRemarks} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div><label className="label">Counsellor Notes</label><textarea className="input" style={{ marginTop: 6 }} value={form.counsellor_notes || ''} onChange={e => setForm({ ...form, counsellor_notes: e.target.value })} rows={3} placeholder="Session observations and notes..." /></div>
                  <div><label className="label">Student's Notes / Shared</label><textarea className="input" style={{ marginTop: 6 }} value={form.student_notes || ''} onChange={e => setForm({ ...form, student_notes: e.target.value })} rows={2} placeholder="What the student shared..." /></div>
                  <div>
                    <label className="label" style={{ marginBottom: 8 }}>Counsellor Wellbeing Score</label>
                    <WellbeingStars value={form.counsellor_wellbeing_score} onChange={v => setForm({ ...form, counsellor_wellbeing_score: v })} />
                  </div>
                  <div>
                    <label className="label" style={{ marginBottom: 8 }}>Student Self-Reported Score</label>
                    <WellbeingStars value={form.student_wellbeing_score} onChange={v => setForm({ ...form, student_wellbeing_score: v })} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1, padding: '11px 0', fontSize: 14 }}>{submitting ? 'Saving...' : 'Save Remarks'}</button>
                    <button type="button" className="btn-ghost" onClick={() => setActionModal(null)}>Cancel</button>
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
