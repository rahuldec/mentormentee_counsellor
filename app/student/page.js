'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import WellbeingStars from '@/components/WellbeingStars';
import { format } from 'date-fns';

const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif';

const NAV = [
  { key: 'sessions', label: 'My Sessions', icon: '◷' },
  { key: 'new',      label: 'New Request',  icon: '+' },
];

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

export default function StudentPage() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [sessions, setSessions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('sessions');
  const [form, setForm]         = useState({ category_id: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [reopenModal, setReopenModal] = useState(null);
  const [reopenNotes, setReopenNotes] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    setForm({ category_id: '', notes: '' }); setTab('sessions'); loadData(user.id); setSubmitting(false);
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F2F2F7', fontFamily: SF }}>
      <div className="spinner" />
    </div>
  );

  const completed = sessions.filter(s => s.status === 'completed').length;
  const pending   = sessions.filter(s => s.status === 'pending' || s.status === 'reopened').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F2F2F7', fontFamily: SF }}>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 30 }} />}

      {/* SIDEBAR */}
      <aside style={{ position: 'fixed', left: 0, top: 0, width: 230, height: '100vh', background: '#1A2540', display: 'flex', flexDirection: 'column', zIndex: 40, padding: '20px 10px' }} className="st-sidebar">

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
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 12px 6px' }}>My Counselling</div>
          {NAV.map(n => (
            <button key={n.key} onClick={() => { setTab(n.key); setSidebarOpen(false); }} style={{
              height: 40, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px',
              borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
              background: tab === n.key ? '#E84A0C' : 'transparent',
              color: tab === n.key ? '#FFFFFF' : '#8E8E93',
              fontFamily: SF, transition: 'all 0.15s', width: '100%', textAlign: 'left',
            }}>
              <span style={{ width: 18, textAlign: 'center', fontSize: n.key === 'new' ? 18 : 14 }}>{n.icon}</span>
              <span>{n.label}</span>
              {n.key === 'sessions' && sessions.length > 0 && (
                <span style={{ marginLeft: 'auto', background: tab === 'sessions' ? 'rgba(255,255,255,0.25)' : '#253451', color: tab === 'sessions' ? 'white' : '#8E8E93', fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '1px 7px' }}>{sessions.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Stats at bottom of sidebar */}
        {sessions.length > 0 && (
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
            {[
              { label: 'Total',     value: sessions.length, color: '#E84A0C' },
              { label: 'Completed', value: completed,       color: '#30D158' },
              { label: 'Pending',   value: pending,         color: '#FFD60A' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: 230, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }} className="st-main">

        {/* TOPBAR */}
        <header style={{ height: 56, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(60,60,67,0.18)', display: 'flex', alignItems: 'center', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10, gap: 12 }}>
          <button onClick={() => setSidebarOpen(o => !o)} className="st-hamburger" style={{ display: 'none', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#1A2540', padding: 4 }}>☰</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#000000', letterSpacing: '-0.4px' }}>{tab === 'new' ? 'New Request' : 'My Sessions'}</div>
          </div>
          {tab === 'sessions' && (
            <button onClick={() => setTab('new')} style={{ background: '#E84A0C', color: 'white', border: 'none', borderRadius: 20, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SF }}>
              + New Request
            </button>
          )}
        </header>

        {/* CONTENT */}
        <section style={{ padding: '20px 24px 40px', flex: 1 }}>

          {/* NEW REQUEST FORM */}
          {tab === 'new' && (
            <div style={{ maxWidth: 520 }}>
              <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '16px 18px', borderBottom: '0.5px solid rgba(60,60,67,0.18)' }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#000000' }}>Counselling Request</div>
                  <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 3 }}>We'll match you with the right counsellor</div>
                </div>
                <form onSubmit={submitSession} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Category</div>
                    <select className="input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required style={{ fontFamily: SF }}>
                      <option value="">Select a category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Notes (optional)</div>
                    <textarea className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Briefly describe what you'd like to discuss..." rows={3} style={{ fontFamily: SF }} />
                  </div>
                  {error && <p style={{ color: '#FF3B30', fontSize: 13, margin: 0 }}>{error}</p>}
                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <button type="submit" disabled={submitting} style={{ flex: 1, background: '#E84A0C', color: 'white', fontWeight: 600, border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1, fontFamily: SF }}>
                      {submitting ? 'Submitting…' : 'Submit Request'}
                    </button>
                    <button type="button" onClick={() => setTab('sessions')} style={{ padding: '13px 18px', background: '#F2F2F7', border: 'none', borderRadius: 12, fontSize: 15, color: '#3C3C43', cursor: 'pointer', fontFamily: SF }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SESSIONS LIST */}
          {tab === 'sessions' && (
            <>
              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <div style={{ width: 72, height: 72, borderRadius: 22, background: '#FEE8DC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 }}>💬</div>
                  <div style={{ fontWeight: 700, fontSize: 19, color: '#000000', marginBottom: 6, letterSpacing: '-0.3px' }}>No sessions yet</div>
                  <div style={{ fontSize: 14, color: '#8E8E93', marginBottom: 24 }}>Start a counselling session to get help</div>
                  <button onClick={() => setTab('new')} style={{ background: '#E84A0C', color: 'white', fontWeight: 600, fontSize: 15, border: 'none', borderRadius: 12, padding: '13px 28px', cursor: 'pointer', fontFamily: SF }}>Get Started</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
                  {sessions.map(s => (
                    <div key={s.id} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderLeft: `4px solid ${statusColor(s.status)}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15, color: '#000000', letterSpacing: '-0.2px', marginBottom: 2 }}>{s.categories?.name || 'Unknown Category'}</div>
                          <div style={{ fontSize: 12, color: '#8E8E93' }}>{format(new Date(s.created_at), 'dd MMM yyyy')}</div>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>

                      {s.counsellors && (
                        <div style={{ fontSize: 13, color: '#3C3C43', marginBottom: 6 }}>
                          Counsellor: <span style={{ fontWeight: 600, color: '#E84A0C' }}>{s.counsellors.name}</span>
                        </div>
                      )}

                      {s.scheduled_at && (
                        <div style={{ background: '#FFF5F0', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, color: '#C04010', marginBottom: 6, fontWeight: 500 }}>
                          📅 {format(new Date(s.scheduled_at), 'dd MMM yyyy, hh:mm a')}
                          {s.location && <span style={{ color: '#8E8E93', fontWeight: 400 }}> · 📍 {s.location}</span>}
                        </div>
                      )}

                      {s.requester_notes && (
                        <div style={{ fontSize: 12.5, color: '#8E8E93', fontStyle: 'italic', borderLeft: '3px solid rgba(60,60,67,0.18)', paddingLeft: 9, marginBottom: 6 }}>
                          "{s.requester_notes}"
                        </div>
                      )}

                      {s.decline_reason && (
                        <div style={{ background: '#FFF0F0', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#FF3B30', marginBottom: 6 }}>
                          Reason: {s.decline_reason}
                        </div>
                      )}

                      {s.remarks && (
                        <div style={{ borderTop: '0.5px solid rgba(60,60,67,0.12)', paddingTop: 8, marginTop: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Session Remarks</div>
                          <WellbeingStars value={s.remarks.counsellor_wellbeing_score} readOnly />
                          {s.remarks.student_notes && <p style={{ fontSize: 12.5, color: '#3C3C43', marginTop: 5 }}>{s.remarks.student_notes}</p>}
                        </div>
                      )}

                      {(s.status === 'completed' || s.status === 'declined') && (
                        <button onClick={() => { setReopenModal(s); setReopenNotes(''); }} style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: '#FF2D55', background: '#FFF0F5', border: 'none', borderRadius: 9, padding: '7px 14px', cursor: 'pointer', fontFamily: SF }}>
                          ↩ Re-open Session
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Re-open Modal */}
      {reopenModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setReopenModal(null); }}>
          <div className="modal" style={{ fontFamily: SF }}>
            <div style={{ fontWeight: 700, fontSize: 19, color: '#000000', marginBottom: 2, letterSpacing: '-0.3px' }}>Re-open Session</div>
            <div style={{ fontSize: 13, color: '#8E8E93', marginBottom: 16 }}>{reopenModal.categories?.name}</div>
            {reopenModal.scheduled_at && (
              <div style={{ background: '#F2F2F7', borderRadius: 10, padding: '10px 13px', marginBottom: 16, fontSize: 12.5, color: '#3C3C43' }}>
                <div style={{ fontWeight: 600, marginBottom: 3, fontSize: 11, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Previous session</div>
                <div>📅 {format(new Date(reopenModal.scheduled_at), 'dd MMM yyyy, hh:mm a')}</div>
                {reopenModal.location && <div>📍 {reopenModal.location}</div>}
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Reason (optional)</div>
              <textarea className="input" rows={3} value={reopenNotes} onChange={e => setReopenNotes(e.target.value)} placeholder="What would you like to discuss?" style={{ fontFamily: SF }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={reopenSession} disabled={submitting} style={{ flex: 1, background: '#FF2D55', color: 'white', fontWeight: 600, borderRadius: 12, padding: '13px 0', fontSize: 15, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: SF }}>
                {submitting ? 'Re-opening…' : '↩ Re-open'}
              </button>
              <button onClick={() => setReopenModal(null)} style={{ padding: '13px 18px', background: '#F2F2F7', border: 'none', borderRadius: 12, fontSize: 15, color: '#3C3C43', cursor: 'pointer', fontFamily: SF }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .st-sidebar { transform: translateX(-100%); transition: transform 0.25s; }
          .st-main { margin-left: 0 !important; }
          .st-hamburger { display: block !important; }
        }
      `}</style>
    </div>
  );
}

function statusColor(status) {
  return { pending: '#FF9F0A', accepted: '#30D158', declined: '#FF3B30', rescheduled: '#E84A0C', completed: '#5E5CE6', reopened: '#FF2D55' }[status] || '#8E8E93';
}
