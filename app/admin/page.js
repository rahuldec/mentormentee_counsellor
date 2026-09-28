'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import WellbeingStars from '@/components/WellbeingStars';
import { format } from 'date-fns';

const NAV = [
  { key: 'Sessions',    icon: '◷', label: 'Sessions' },
  { key: 'Counsellors', icon: '👤', label: 'Counsellors' },
  { key: 'Categories',  icon: '🏷️', label: 'Categories' },
  { key: 'Mapping',     icon: '⇄',  label: 'Mapping' },
  { key: 'Reports',     icon: '▥',  label: 'Reports' },
];

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser]           = useState(null);
  const [tab, setTab]             = useState('Sessions');
  const [sessions, setSessions]   = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);

  const [newCounsellor, setNewCounsellor] = useState({ name: '', email: '', mobile: '', employee_id: '' });
  const [newCategory, setNewCategory]     = useState('');
  const [mapForm, setMapForm]             = useState({ category_id: '', counsellor_id: '' });
  const [submitting, setSubmitting]       = useState(false);
  const [msg, setMsg]                     = useState({ text: '', type: 'success' });

  const [reportType, setReportType]   = useState('student');
  const [reportId, setReportId]       = useState('');
  const [reportData, setReportData]   = useState(null);
  const [reassignModal, setReassignModal] = useState(null);
  const [newCounsellorId, setNewCounsellorId] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const uid = sessionStorage.getItem('user_id');
    if (!uid) { router.push('/'); return; }
    setUser({ id: uid, name: sessionStorage.getItem('name') || uid });
    loadAll();
  }, [router]);

  async function loadAll() {
    setLoading(true);
    const [sRes, cRes, catRes] = await Promise.all([fetch('/api/sessions'), fetch('/api/counsellors'), fetch('/api/categories')]);
    setSessions(await sRes.json()); setCounsellors(await cRes.json()); setCategories(await catRes.json());
    setLoading(false);
  }

  function flash(text, type = 'success') { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'success' }), 3000); }

  async function addCounsellor(e) {
    e.preventDefault(); setSubmitting(true);
    const res = await fetch('/api/counsellors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCounsellor) });
    if (res.ok) { flash('Counsellor added!'); setNewCounsellor({ name: '', email: '', mobile: '', employee_id: '' }); loadAll(); }
    setSubmitting(false);
  }

  async function deleteCounsellor(id) {
    if (!confirm('Delete this counsellor?')) return;
    await fetch('/api/counsellors', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    loadAll();
  }

  async function addCategory(e) {
    e.preventDefault(); setSubmitting(true);
    const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategory }) });
    if (res.ok) { flash('Category added!'); setNewCategory(''); loadAll(); }
    setSubmitting(false);
  }

  async function deleteCategory(id) {
    if (!confirm('Delete this category?')) return;
    await fetch('/api/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    loadAll();
  }

  async function addMapping(e) {
    e.preventDefault(); setSubmitting(true);
    const res = await fetch('/api/mapping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mapForm) });
    if (res.ok) { flash('Mapping added!'); setMapForm({ category_id: '', counsellor_id: '' }); loadAll(); }
    else { const d = await res.json(); flash(d.error || 'Error', 'error'); }
    setSubmitting(false);
  }

  async function removeMapping(category_id, counsellor_id) {
    await fetch('/api/mapping', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category_id, counsellor_id }) });
    loadAll();
  }

  async function runReport(e) {
    e.preventDefault();
    const res = await fetch(`/api/reports?type=${reportType}&id=${reportId}`);
    setReportData(await res.json());
  }

  async function reassign(e) {
    e.preventDefault();
    await fetch(`/api/sessions/${reassignModal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reassign', counsellor_id: newCounsellorId }) });
    setReassignModal(null); loadAll();
  }

  const pending   = sessions.filter(s => s.status === 'pending' || s.status === 'reopened').length;
  const completed = sessions.filter(s => s.status === 'completed').length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F5F5' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5F5', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 30 }} />
      )}

      {/* SIDEBAR */}
      <aside style={{
        position: 'fixed', left: 0, top: 0, width: 240, height: '100vh',
        background: '#111827', color: 'white', display: 'flex', flexDirection: 'column',
        zIndex: 40, padding: '20px 12px',
        transform: sidebarOpen ? 'translateX(0)' : undefined,
      }}
        className="admin-sidebar"
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 10px 24px' }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #E84A0C, #F97316)', display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>⚙️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Admin Panel</div>
            <div style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>Counselling Portal</div>
          </div>
        </div>

        <div style={{ color: '#6B7280', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px 8px' }}>Workspace</div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV.map(n => (
            <button key={n.key} onClick={() => { setTab(n.key); setSidebarOpen(false); }} style={{
              height: 42, display: 'flex', alignItems: 'center', gap: 11, padding: '0 12px',
              borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: tab === n.key ? '#E84A0C' : 'transparent',
              color: tab === n.key ? 'white' : '#9CA3AF',
              transition: 'all 0.15s', textAlign: 'left', width: '100%',
            }}
              onMouseEnter={e => { if (tab !== n.key) { e.currentTarget.style.background = '#1F2937'; e.currentTarget.style.color = 'white'; } }}
              onMouseLeave={e => { if (tab !== n.key) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; } }}
            >
              <span style={{ width: 20, textAlign: 'center', fontSize: 15 }}>{n.icon}</span>
              <span>{n.label}</span>
              {n.key === 'Sessions' && pending > 0 && (
                <span style={{ marginLeft: 'auto', background: tab === n.key ? 'rgba(255,255,255,0.3)' : '#E84A0C', color: 'white', fontSize: 10, fontWeight: 800, borderRadius: 10, padding: '1px 6px' }}>{pending}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid #273244', paddingTop: 14 }}>
          <button onClick={() => router.push('/')} style={{
            height: 42, display: 'flex', alignItems: 'center', gap: 11, padding: '0 12px',
            borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, color: '#9CA3AF',
            background: 'transparent', width: '100%', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1F2937'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
          >
            <span style={{ width: 20, textAlign: 'center' }}>↪</span>
            <span>Back to Portal</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }} className="admin-main">

        {/* TOPBAR */}
        <header style={{
          height: 64, background: 'white', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mobile hamburger */}
            <button onClick={() => setSidebarOpen(o => !o)} className="hamburger" style={{ display: 'none', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#374151' }}>☰</button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', letterSpacing: '-0.3px' }}>{NAV.find(n => n.key === tab)?.label}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{sessions.length} total sessions · {counsellors.length} counsellors</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {msg.text && (
              <div style={{ background: msg.type === 'error' ? '#FEF0F0' : '#ECFDF5', border: `1px solid ${msg.type === 'error' ? '#FADADD' : '#A7F3D0'}`, color: msg.type === 'error' ? '#C0392B' : '#166534', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                {msg.type === 'error' ? '✗' : '✓'} {msg.text}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FEE8DC', color: '#E84A0C', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>
                {(user?.name || 'A')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#111827' }}>{user?.name}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF' }}>Administrator</div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <section style={{ padding: '24px 28px 40px', flex: 1 }}>

          {/* KPI CARDS — Sessions tab only */}
          {tab === 'Sessions' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
              {[
                { label: 'Total Sessions',  value: sessions.length,       icon: '◷', color: '#E84A0C', bg: '#FEE8DC' },
                { label: 'Counsellors',     value: counsellors.length,    icon: '👤', color: '#2D8A4E', bg: '#D1FAE5' },
                { label: 'Pending',         value: pending,               icon: '⏳', color: '#D97706', bg: '#FEF3C7' },
                { label: 'Completed',       value: completed,             icon: '✓',  color: '#4338CA', bg: '#EEF2FF' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 13, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 500 }}>{s.label}</span>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, color: s.color, display: 'grid', placeItems: 'center', fontSize: 14 }}>{s.icon}</div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: '-0.8px' }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* SESSIONS TABLE */}
          {tab === 'Sessions' && (
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 13, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>All Sessions</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Latest counselling activity</div>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['STUDENT / EMPLOYEE', 'CATEGORY', 'COUNSELLOR', 'DATE', 'STATUS', ''].map(h => (
                        <th key={h} style={{ background: '#FAFAFA', color: '#6B7280', fontSize: 10, fontWeight: 600, textAlign: 'left', padding: '11px 18px', borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '13px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#FEE8DC', color: '#E84A0C', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>
                              {(s.requester_name || s.requester_id || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 12, color: '#111827' }}>{s.requester_name || s.requester_id}</div>
                              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{s.requester_type}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '13px 18px', fontSize: 12, color: '#374151' }}>{s.categories?.name || '—'}</td>
                        <td style={{ padding: '13px 18px', fontSize: 12, color: '#374151' }}>{s.counsellors?.name || <span style={{ color: '#D97706', fontStyle: 'italic' }}>Unassigned</span>}</td>
                        <td style={{ padding: '13px 18px', fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                          {format(new Date(s.created_at), 'dd MMM yyyy')}
                          {s.scheduled_at && <div style={{ color: '#374151', marginTop: 2 }}>📅 {format(new Date(s.scheduled_at), 'dd MMM')}</div>}
                        </td>
                        <td style={{ padding: '13px 18px' }}><StatusBadge status={s.status} /></td>
                        <td style={{ padding: '13px 18px' }}>
                          <button onClick={() => { setReassignModal(s); setNewCounsellorId(s.counsellor_id || ''); }}
                            style={{ fontSize: 11, color: '#E84A0C', background: '#FEF0E8', border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            Reassign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COUNSELLORS */}
          {tab === 'Counsellors' && (
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 13, padding: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 18 }}>Add Counsellor</div>
                <form onSubmit={addCounsellor} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label className="label">Name</label><input type="text" className="input" style={{ marginTop: 6 }} value={newCounsellor.name} onChange={e => setNewCounsellor({ ...newCounsellor, name: e.target.value })} required /></div>
                    <div><label className="label">Employee ID</label><input type="text" className="input" style={{ marginTop: 6 }} value={newCounsellor.employee_id} onChange={e => setNewCounsellor({ ...newCounsellor, employee_id: e.target.value })} /></div>
                  </div>
                  <div><label className="label">Email</label><input type="email" className="input" style={{ marginTop: 6 }} value={newCounsellor.email} onChange={e => setNewCounsellor({ ...newCounsellor, email: e.target.value })} required /></div>
                  <div><label className="label">Mobile</label><input type="text" className="input" style={{ marginTop: 6 }} value={newCounsellor.mobile} onChange={e => setNewCounsellor({ ...newCounsellor, mobile: e.target.value })} /></div>
                  <button type="submit" disabled={submitting} style={{ background: '#E84A0C', color: 'white', border: 'none', borderRadius: 9, height: 42, fontWeight: 600, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? 'Adding...' : 'Add Counsellor'}
                  </button>
                </form>
              </div>

              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 13, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Counsellors ({counsellors.length})</div>
                </div>
                {counsellors.map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < counsellors.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEE8DC', color: '#E84A0C', fontSize: 14, fontWeight: 800, display: 'grid', placeItems: 'center' }}>
                        {(c.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{c.email}{c.employee_id && ` · ${c.employee_id}`}{c.mobile && ` · ${c.mobile}`}</div>
                      </div>
                    </div>
                    <button onClick={() => deleteCounsellor(c.id)} style={{ fontSize: 11, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORIES */}
          {tab === 'Categories' && (
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 13, padding: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 16 }}>Add Category</div>
                <form onSubmit={addCategory} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label className="label">Category Name</label><input type="text" className="input" style={{ marginTop: 6 }} value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="e.g. Academic Stress" required /></div>
                  <button type="submit" disabled={submitting} style={{ background: '#E84A0C', color: 'white', border: 'none', borderRadius: 9, height: 42, fontWeight: 600, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? 'Adding...' : 'Add Category'}
                  </button>
                </form>
              </div>

              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 13, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Categories ({categories.length})</div>
                </div>
                {categories.map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: i < categories.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E84A0C', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.name}</span>
                    </div>
                    <button onClick={() => deleteCategory(c.id)} style={{ fontSize: 11, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MAPPING */}
          {tab === 'Mapping' && (
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 13, padding: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 16 }}>Map Category → Counsellor</div>
                <form onSubmit={addMapping} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <div>
                    <label className="label">Category</label>
                    <select className="input" style={{ marginTop: 6 }} value={mapForm.category_id} onChange={e => setMapForm({ ...mapForm, category_id: e.target.value })} required>
                      <option value="">Select category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Counsellor</label>
                    <select className="input" style={{ marginTop: 6 }} value={mapForm.counsellor_id} onChange={e => setMapForm({ ...mapForm, counsellor_id: e.target.value })} required>
                      <option value="">Select counsellor...</option>
                      {counsellors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={submitting} style={{ background: '#E84A0C', color: 'white', border: 'none', borderRadius: 9, height: 42, fontWeight: 600, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? 'Adding...' : 'Add Mapping'}
                  </button>
                </form>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {categories.filter(c => c.category_counsellor_map?.length > 0).map(cat => (
                  <div key={cat.id} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 13, overflow: 'hidden' }}>
                    <div style={{ padding: '13px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E84A0C' }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{cat.name}</span>
                    </div>
                    {cat.category_counsellor_map.map((m, i) => (
                      <div key={m.counsellor_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px 11px 32px', borderBottom: i < cat.category_counsellor_map.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151' }}>
                          <span style={{ color: '#9CA3AF' }}>→</span>
                          <span style={{ fontWeight: 500 }}>{m.counsellors?.name}</span>
                        </div>
                        <button onClick={() => removeMapping(cat.id, m.counsellor_id)} style={{ fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', fontWeight: 600 }}>Remove</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REPORTS */}
          {tab === 'Reports' && (
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 13, padding: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 18 }}>Generate Report</div>
                <form onSubmit={runReport} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <div>
                    <label className="label">Report Type</label>
                    <select className="input" style={{ marginTop: 6 }} value={reportType} onChange={e => { setReportType(e.target.value); setReportId(''); setReportData(null); }}>
                      <option value="student">Student-wise</option>
                      <option value="employee">Employee-wise</option>
                      <option value="counsellor">Counsellor-wise</option>
                      <option value="category">Category-wise</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">{reportType === 'counsellor' ? 'Counsellor' : reportType === 'category' ? 'Category' : 'ID (blank = all)'}</label>
                    {reportType === 'counsellor' ? (
                      <select className="input" style={{ marginTop: 6 }} value={reportId} onChange={e => setReportId(e.target.value)}>
                        <option value="">All counsellors</option>
                        {counsellors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    ) : reportType === 'category' ? (
                      <select className="input" style={{ marginTop: 6 }} value={reportId} onChange={e => setReportId(e.target.value)}>
                        <option value="">All categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    ) : (
                      <input type="text" className="input" style={{ marginTop: 6 }} value={reportId} onChange={e => setReportId(e.target.value)} placeholder="Student/Employee ID" />
                    )}
                  </div>
                  <button type="submit" style={{ background: '#E84A0C', color: 'white', border: 'none', borderRadius: 9, height: 42, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Run Report</button>
                </form>
              </div>

              {reportData && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Total Sessions', value: reportData.stats.total, color: '#E84A0C', bg: '#FEE8DC' },
                      { label: 'Completed',      value: reportData.stats.byStatus.completed || 0, color: '#2D8A4E', bg: '#D1FAE5' },
                      { label: 'Avg Wellbeing',  value: reportData.stats.avgWellbeing || '—', color: '#D97706', bg: '#FEF3C7' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{s.label}</span>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: s.bg }} />
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 13, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E7EB' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>Sessions ({reportData.sessions.length})</div>
                    </div>
                    {reportData.sessions.map((s, i) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: i < reportData.sessions.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{s.requester_name || s.requester_id}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{s.categories?.name} · {s.counsellors?.name} · {format(new Date(s.created_at), 'dd MMM yyyy')}</div>
                          {s.remarks && <div style={{ marginTop: 4 }}><WellbeingStars value={s.remarks.counsellor_wellbeing_score} readOnly /></div>}
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </section>
      </main>

      {/* Reassign Modal */}
      {reassignModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setReassignModal(null); }}>
          <div className="modal">
            <div style={{ fontWeight: 800, fontSize: 17, color: '#1A1A1A', marginBottom: 4 }}>Reassign Counsellor</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>{reassignModal.requester_name} · {reassignModal.categories?.name}</div>
            <form onSubmit={reassign} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select className="input" value={newCounsellorId} onChange={e => setNewCounsellorId(e.target.value)} required>
                <option value="">Select counsellor...</option>
                {counsellors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ flex: 1, background: '#E84A0C', color: 'white', border: 'none', borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Reassign</button>
                <button type="button" className="btn-ghost" onClick={() => setReassignModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .admin-sidebar { transform: translateX(-100%); transition: transform 0.25s; }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-main { margin-left: 0 !important; }
          .hamburger { display: block !important; }
        }
        @media (max-width: 640px) {
          .admin-main section { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}
