'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import WellbeingStars from '@/components/WellbeingStars';
import { format } from 'date-fns';

const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif';
const TABS = ['Pending', 'Upcoming', 'Completed', 'All'];

function Avatar({ name, size = 36 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#E84A0C', '#D97706', '#2D8A4E', '#7C5CBC', '#DB2777', '#0891B2'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `${color}1A`, color, fontSize: size * 0.38, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    const c = counsellors.find(x => x.employee_id === uid || x.email === email || x.mobile === uid);
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
  const upcomingCount = sessions.filter(s => s.status === 'accepted' || s.status === 'rescheduled').length;

  const filtered = sessions.filter(s => {
    if (tab === 'Pending')   return s.status === 'pending' || s.status === 'reopened';
    if (tab === 'Upcoming')  return s.status === 'accepted' || s.status === 'rescheduled';
    if (tab === 'Completed') return s.status === 'completed' || s.status === 'declined';
    return true;
  });

  const tabCount = { Pending: pendingCount, Upcoming: upcomingCount, Completed: sessions.filter(s => s.status === 'completed' || s.status === 'declined').length, All: sessions.length };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F2F2F7', fontFamily: SF }}>
      <div className="spinner" />
    </div>
  );

  if (!counsellorId) return (
    <div style={{ minHeight: '100vh', background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: SF }}>
      <div style={{ background: 'white', borderRadius: 18, padding: 36, textAlign: 'center', maxWidth: 340, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>🔍</div>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#000000', marginBottom: 8, letterSpacing: '-0.3px' }}>Profile Not Found</div>
        <div style={{ fontSize: 14, color: '#8E8E93', lineHeight: 1.6 }}>Ask admin to add your employee ID: <strong style={{ color: '#E84A0C' }}>{user?.id}</strong></div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F2F2F7', fontFamily: SF }}>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 30 }} />}

      {/* SIDEBAR */}
      <aside style={{ position: 'fixed', left: 0, top: 0, width: 230, height: '100vh', background: '#1A2540', display: 'flex', flexDirection: 'column', zIndex: 40, padding: '20px 10px' }} className="co-sidebar">

        {/* Brand */}
        <div style={{ padding: '4px 10px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="https://okiedokie-erp-images.s3.ap-south-1.amazonaws.com/Okie%20Dokie/2025/12/sourceURL/26aebcbe10f4ac5a3e8b-611ed1b9032568edd4f3-Okie_Dokie_App_icon__2___2_-removebg-preview.png" alt="OkieDokie" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, objectFit: 'contain', background: 'white', padding: 3 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#FFFFFF', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Okie Dokie</div>
              <div style={{ color: '#E84A0C', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 2 }}>Counseling</div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#253451', color: '#E84A0C', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              {(user?.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#FFFFFF' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Counsellor</div>
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 12px 6px' }}>My Queue</div>
          {['Pending', 'Upcoming'].map(t => (
            <button key={t} onClick={() => { setTab(t); setSidebarOpen(false); }} style={{
              height: 40, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px',
              borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
              background: tab === t ? '#E84A0C' : 'transparent',
              color: tab === t ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
              fontFamily: SF, transition: 'all 0.15s', width: '100%', textAlign: 'left',
            }}>
              <span style={{ width: 18, textAlign: 'center', fontSize: 13 }}>
                {t === 'Pending' ? '⏳' : '📅'}
              </span>
              <span>{t}</span>
              {tabCount[t] > 0 && (
                <span style={{ marginLeft: 'auto', background: tab === t ? 'rgba(255,255,255,0.25)' : '#253451', color: tab === t ? 'white' : '#8E8E93', fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '1px 7px' }}>{tabCount[t]}</span>
              )}
            </button>
          ))}
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '12px 12px 6px' }}>History</div>
          {['Completed', 'All'].map(t => (
            <button key={t} onClick={() => { setTab(t); setSidebarOpen(false); }} style={{
              height: 40, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px',
              borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
              background: tab === t ? '#E84A0C' : 'transparent',
              color: tab === t ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
              fontFamily: SF, transition: 'all 0.15s', width: '100%', textAlign: 'left',
            }}>
              <span style={{ width: 18, textAlign: 'center', fontSize: 13 }}>
                {t === 'Completed' ? '✓' : '◷'}
              </span>
              <span>{t}</span>
              {tabCount[t] > 0 && (
                <span style={{ marginLeft: 'auto', background: tab === t ? 'rgba(255,255,255,0.25)' : '#253451', color: tab === t ? 'white' : '#8E8E93', fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '1px 7px' }}>{tabCount[t]}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Summary */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
          {[
            { label: 'Total',    value: sessions.length,  color: '#E84A0C' },
            { label: 'Pending',  value: pendingCount,      color: '#FF9F0A' },
            { label: 'Upcoming', value: upcomingCount,     color: '#30D158' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: 230, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }} className="co-main">

        {/* TOPBAR */}
        <header style={{ height: 56, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(60,60,67,0.18)', display: 'flex', alignItems: 'center', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10, gap: 12 }}>
          <button onClick={() => setSidebarOpen(o => !o)} className="co-hamburger" style={{ display: 'none', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#1A2540', padding: 4 }}>☰</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#000000', letterSpacing: '-0.4px' }}>{tab} Sessions</div>
            <div style={{ fontSize: 11, color: '#8E8E93', marginTop: 1 }}>{filtered.length} session{filtered.length !== 1 ? 's' : ''}</div>
          </div>
          {pendingCount > 0 && (
            <div style={{ background: '#FF9F0A', color: 'white', fontSize: 12, fontWeight: 700, borderRadius: 12, padding: '4px 10px' }}>
              {pendingCount} pending
            </div>
          )}
        </header>

        {/* CONTENT */}
        <section style={{ padding: '20px 24px 40px', flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ width: 68, height: 68, borderRadius: 22, background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 30 }}>✓</div>
              <div style={{ fontWeight: 600, fontSize: 17, color: '#8E8E93', letterSpacing: '-0.2px' }}>No sessions here</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
              {filtered.map(s => (
                <div key={s.id} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderLeft: `4px solid ${statusColor(s.status)}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 8 }}>
                    <Avatar name={s.requester_name || s.requester_id} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#000000', letterSpacing: '-0.2px', marginBottom: 1 }}>{s.requester_name || s.requester_id}</div>
                      <div style={{ fontSize: 12, color: '#8E8E93', fontWeight: 500 }}>{s.requester_type} · {s.categories?.name}</div>
                      <div style={{ fontSize: 11, color: '#C7C7CC', marginTop: 1 }}>{format(new Date(s.created_at), 'dd MMM yyyy')}</div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  {s.requester_notes && (
                    <div style={{ fontSize: 12.5, color: '#8E8E93', fontStyle: 'italic', borderLeft: '3px solid rgba(60,60,67,0.15)', paddingLeft: 9, marginBottom: 8 }}>
                      "{s.requester_notes}"
                    </div>
                  )}

                  {s.scheduled_at && (
                    <div style={{ background: '#FFF5F0', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, color: '#C04010', marginBottom: 8, fontWeight: 500 }}>
                      📅 {format(new Date(s.scheduled_at), 'dd MMM yyyy, hh:mm a')}
                      {s.location && <span style={{ color: '#8E8E93', fontWeight: 400 }}> · 📍 {s.location}</span>}
                    </div>
                  )}

                  {s.remarks && (
                    <div style={{ background: '#F0FDF4', borderRadius: 9, padding: '8px 11px', marginBottom: 8, border: '1px solid #D1FAE5' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#166534', marginBottom: 4 }}>Remarks saved</div>
                      <WellbeingStars value={s.remarks.counsellor_wellbeing_score} readOnly />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 6 }}>
                    {(s.status === 'pending' || s.status === 'reopened') && (<>
                      <button onClick={() => { setActionModal({ session: s, type: 'accept' }); setForm({}); }} style={actionBtn('#30D158', '#F0FDF4', '#166534')}>Accept</button>
                      <button onClick={() => { setActionModal({ session: s, type: 'decline' }); setForm({}); }} style={actionBtn('#FF3B30', '#FFF0F0', '#FF3B30')}>Decline</button>
                    </>)}
                    {(s.status === 'accepted' || s.status === 'rescheduled') && (<>
                      <button onClick={() => { setActionModal({ session: s, type: 'reschedule' }); setForm({ scheduled_at: s.scheduled_at?.slice(0, 16), location: s.location }); }} style={actionBtn('#8E8E93', '#F2F2F7', '#3C3C43')}>Reschedule</button>
                      <button onClick={() => { setActionModal({ session: s, type: 'remarks' }); setForm(s.remarks || {}); }} style={actionBtn('#E84A0C', '#FFF5F0', '#E84A0C')}>Add Remarks</button>
                    </>)}
                    {s.status === 'completed' && !s.remarks && (
                      <button onClick={() => { setActionModal({ session: s, type: 'remarks' }); setForm({}); }} style={actionBtn('#E84A0C', '#FFF5F0', '#E84A0C')}>Add Remarks</button>
                    )}
                    {s.remarks && (
                      <button onClick={() => { setActionModal({ session: s, type: 'remarks' }); setForm(s.remarks); }} style={actionBtn('#8E8E93', '#F2F2F7', '#3C3C43')}>Edit Remarks</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ACTION MODALS */}
      {actionModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setActionModal(null); }}>
          <div className="modal" style={{ fontFamily: SF }}>
            {(actionModal.type === 'accept' || actionModal.type === 'reschedule') && (<>
              <div style={{ fontWeight: 700, fontSize: 19, color: '#000000', marginBottom: 2, letterSpacing: '-0.3px' }}>
                {actionModal.type === 'accept' ? 'Accept Session' : 'Reschedule Session'}
              </div>
              <div style={{ fontSize: 13, color: '#8E8E93', marginBottom: 20 }}>For {actionModal.session.requester_name}</div>
              <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Date & Time</div>
                  <input type="datetime-local" className="input" value={form.scheduled_at || ''} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} required style={{ fontFamily: SF }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Location</div>
                  <input type="text" className="input" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Room 204, Block A" style={{ fontFamily: SF }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={submitting} style={{ flex: 1, background: '#30D158', color: 'white', fontWeight: 600, border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 15, cursor: 'pointer', fontFamily: SF, opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Saving…' : 'Confirm'}</button>
                  <button type="button" onClick={() => setActionModal(null)} style={{ padding: '13px 18px', background: '#F2F2F7', border: 'none', borderRadius: 12, fontSize: 15, color: '#3C3C43', cursor: 'pointer', fontFamily: SF }}>Cancel</button>
                </div>
              </form>
            </>)}

            {actionModal.type === 'decline' && (<>
              <div style={{ fontWeight: 700, fontSize: 19, color: '#000000', marginBottom: 2, letterSpacing: '-0.3px' }}>Decline Session</div>
              <div style={{ fontSize: 13, color: '#8E8E93', marginBottom: 20 }}>From {actionModal.session.requester_name}</div>
              <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Reason (optional)</div>
                  <textarea className="input" value={form.decline_reason || ''} onChange={e => setForm({ ...form, decline_reason: e.target.value })} rows={3} placeholder="Reason for declining…" style={{ fontFamily: SF }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={submitting} style={{ flex: 1, background: '#FF3B30', color: 'white', fontWeight: 600, border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 15, cursor: 'pointer', fontFamily: SF, opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Saving…' : 'Decline'}</button>
                  <button type="button" onClick={() => setActionModal(null)} style={{ padding: '13px 18px', background: '#F2F2F7', border: 'none', borderRadius: 12, fontSize: 15, color: '#3C3C43', cursor: 'pointer', fontFamily: SF }}>Cancel</button>
                </div>
              </form>
            </>)}

            {actionModal.type === 'remarks' && (<>
              <div style={{ fontWeight: 700, fontSize: 19, color: '#000000', marginBottom: 2, letterSpacing: '-0.3px' }}>Session Remarks</div>
              <div style={{ fontSize: 13, color: '#8E8E93', marginBottom: 20 }}>For {actionModal.session.requester_name}</div>
              <form onSubmit={saveRemarks} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Counsellor Notes</div>
                  <textarea className="input" value={form.counsellor_notes || ''} onChange={e => setForm({ ...form, counsellor_notes: e.target.value })} rows={3} placeholder="Session observations…" style={{ fontFamily: SF }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Student's Notes</div>
                  <textarea className="input" value={form.student_notes || ''} onChange={e => setForm({ ...form, student_notes: e.target.value })} rows={2} placeholder="What the student shared…" style={{ fontFamily: SF }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 9 }}>Counsellor Wellbeing Score</div>
                  <WellbeingStars value={form.counsellor_wellbeing_score} onChange={v => setForm({ ...form, counsellor_wellbeing_score: v })} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 9 }}>Student Self-Reported Score</div>
                  <WellbeingStars value={form.student_wellbeing_score} onChange={v => setForm({ ...form, student_wellbeing_score: v })} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={submitting} style={{ flex: 1, background: '#E84A0C', color: 'white', fontWeight: 600, border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 15, cursor: 'pointer', fontFamily: SF, opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Saving…' : 'Save Remarks'}</button>
                  <button type="button" onClick={() => setActionModal(null)} style={{ padding: '13px 18px', background: '#F2F2F7', border: 'none', borderRadius: 12, fontSize: 15, color: '#3C3C43', cursor: 'pointer', fontFamily: SF }}>Cancel</button>
                </div>
              </form>
            </>)}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .co-sidebar { transform: translateX(-100%); transition: transform 0.25s; }
          .co-main { margin-left: 0 !important; }
          .co-hamburger { display: block !important; }
        }
      `}</style>
    </div>
  );
}

function statusColor(status) {
  return { pending: '#FF9F0A', accepted: '#30D158', declined: '#FF3B30', rescheduled: '#E84A0C', completed: '#5E5CE6', reopened: '#FF2D55' }[status] || '#8E8E93';
}

function actionBtn(border, bg, color) {
  return { fontSize: 13, fontWeight: 600, color, background: bg, border: `1px solid ${border}22`, borderRadius: 9, padding: '7px 14px', cursor: 'pointer', fontFamily: SF };
}
