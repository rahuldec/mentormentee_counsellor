'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import WellbeingStars from '@/components/WellbeingStars';
import { format } from 'date-fns';

const TABS = [
  { key: 'Sessions',   icon: '📋' },
  { key: 'Reports',    icon: '📊' },
  { key: 'Counsellors',icon: '👤' },
  { key: 'Categories', icon: '🏷️' },
  { key: 'Mapping',    icon: '🔗' },
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

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF', paddingBottom: 32 }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚙️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E2A3B' }}>Admin Dashboard</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>{user?.name} · {sessions.length} sessions total</div>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 0 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '8px 14px', fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? '#4F46E5' : '#64748B',
                borderBottom: tab === t.key ? '2.5px solid #4F46E5' : '2.5px solid transparent',
                background: 'none', border: 'none', borderBottom: tab === t.key ? '2.5px solid #4F46E5' : '2.5px solid transparent',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}>
                {t.icon} {t.key}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 0' }}>
        {msg.text && (
          <div style={{ background: msg.type === 'error' ? '#FFF1F2' : '#ECFDF5', border: `1px solid ${msg.type === 'error' ? '#FFE4E6' : '#A7F3D0'}`, color: msg.type === 'error' ? '#E11D48' : '#065F46', borderRadius: 12, padding: '11px 16px', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
            {msg.type === 'error' ? '✗' : '✓'} {msg.text}
          </div>
        )}

        {/* SESSIONS */}
        {tab === 'Sessions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sessions.map(s => (
              <div key={s.id} className={`session-card ${s.status}`}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1E2A3B' }}>{s.requester_name || s.requester_id} <span style={{ fontWeight: 400, fontSize: 12, color: '#94A3B8' }}>({s.requester_type})</span></div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{s.categories?.name} · {format(new Date(s.created_at), 'dd MMM yyyy')}</div>
                    {s.counsellors && <div style={{ fontSize: 12, color: '#4F46E5', marginTop: 2 }}>Counsellor: {s.counsellors.name}</div>}
                    {s.scheduled_at && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>📅 {format(new Date(s.scheduled_at), 'dd MMM yyyy, hh:mm a')}</div>}
                    {s.remarks && <div style={{ marginTop: 4 }}><WellbeingStars value={s.remarks.counsellor_wellbeing_score} readOnly /></div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <StatusBadge status={s.status} />
                    <button onClick={() => { setReassignModal(s); setNewCounsellorId(s.counsellor_id || ''); }} style={{ fontSize: 11, color: '#4F46E5', background: '#EEF2FF', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontWeight: 500 }}>Reassign</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REPORTS */}
        {tab === 'Reports' && (
          <div>
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E2A3B', marginBottom: 16 }}>Generate Report</div>
              <form onSubmit={runReport} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                  <label className="label">{reportType === 'counsellor' ? 'Counsellor' : reportType === 'category' ? 'Category' : 'ID (leave blank for all)'}</label>
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
                    <input type="text" className="input" style={{ marginTop: 6 }} value={reportId} onChange={e => setReportId(e.target.value)} placeholder="Student/Employee ID (or leave blank for all)" />
                  )}
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Run Report</button>
              </form>
            </div>

            {reportData && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Total Sessions', value: reportData.stats.total, color: '#4F46E5' },
                    { label: 'Completed', value: reportData.stats.byStatus.completed || 0, color: '#059669' },
                    { label: 'Avg Wellbeing', value: reportData.stats.avgWellbeing || '—', color: '#F59E0B' },
                  ].map(stat => (
                    <div key={stat.label} className="card" style={{ padding: '14px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {reportData.sessions.map(s => (
                    <div key={s.id} className="card" style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1E2A3B' }}>{s.requester_name || s.requester_id}</div>
                        <StatusBadge status={s.status} />
                      </div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{s.categories?.name} · {s.counsellors?.name} · {format(new Date(s.created_at), 'dd MMM yyyy')}</div>
                      {s.remarks && <div style={{ marginTop: 4 }}><WellbeingStars value={s.remarks.counsellor_wellbeing_score} readOnly /></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COUNSELLORS */}
        {tab === 'Counsellors' && (
          <div>
            <div className="card" style={{ padding: 20, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E2A3B', marginBottom: 16 }}>Add Counsellor</div>
              <form onSubmit={addCounsellor} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label className="label">Name</label><input type="text" className="input" style={{ marginTop: 6 }} value={newCounsellor.name} onChange={e => setNewCounsellor({ ...newCounsellor, name: e.target.value })} required /></div>
                  <div><label className="label">Employee ID</label><input type="text" className="input" style={{ marginTop: 6 }} value={newCounsellor.employee_id} onChange={e => setNewCounsellor({ ...newCounsellor, employee_id: e.target.value })} /></div>
                </div>
                <div><label className="label">Email</label><input type="email" className="input" style={{ marginTop: 6 }} value={newCounsellor.email} onChange={e => setNewCounsellor({ ...newCounsellor, email: e.target.value })} required /></div>
                <div><label className="label">Mobile</label><input type="text" className="input" style={{ marginTop: 6 }} value={newCounsellor.mobile} onChange={e => setNewCounsellor({ ...newCounsellor, mobile: e.target.value })} /></div>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%' }}>{submitting ? 'Adding...' : 'Add Counsellor'}</button>
              </form>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {counsellors.map(c => (
                <div key={c.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', color: '#4F46E5', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(c.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1E2A3B' }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{c.email}{c.employee_id && ` · ${c.employee_id}`}</div>
                    </div>
                  </div>
                  <button onClick={() => deleteCounsellor(c.id)} style={{ fontSize: 12, color: '#E11D48', background: '#FFF1F2', border: '1px solid #FFE4E6', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIES */}
        {tab === 'Categories' && (
          <div>
            <div className="card" style={{ padding: 20, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E2A3B', marginBottom: 14 }}>Add Category</div>
              <form onSubmit={addCategory} style={{ display: 'flex', gap: 8 }}>
                <input type="text" className="input" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Category name" required />
                <button type="submit" disabled={submitting} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Add</button>
              </form>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {categories.map(c => (
                <div key={c.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4F46E5' }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#1E2A3B' }}>{c.name}</span>
                  </div>
                  <button onClick={() => deleteCategory(c.id)} style={{ fontSize: 12, color: '#E11D48', background: '#FFF1F2', border: '1px solid #FFE4E6', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MAPPING */}
        {tab === 'Mapping' && (
          <div>
            <div className="card" style={{ padding: 20, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E2A3B', marginBottom: 16 }}>Map Category → Counsellor</div>
              <form onSubmit={addMapping} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%' }}>{submitting ? 'Adding...' : 'Add Mapping'}</button>
              </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {categories.filter(c => c.category_counsellor_map?.length > 0).map(cat => (
                <div key={cat.id} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1E2A3B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4F46E5', display: 'inline-block' }} />
                    {cat.name}
                  </div>
                  {cat.category_counsellor_map.map(m => (
                    <div key={m.counsellor_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 14, paddingTop: 6, paddingBottom: 6, borderTop: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
                        <span style={{ color: '#94A3B8' }}>→</span>
                        <span style={{ fontWeight: 500 }}>{m.counsellors?.name}</span>
                      </div>
                      <button onClick={() => removeMapping(cat.id, m.counsellor_id)} style={{ fontSize: 11, color: '#E11D48', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Remove</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reassign Modal */}
      {reassignModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setReassignModal(null); }}>
          <div className="modal">
            <div style={{ fontWeight: 700, fontSize: 17, color: '#1E2A3B', marginBottom: 4 }}>Reassign Counsellor</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>{reassignModal.requester_name} · {reassignModal.categories?.name}</div>
            <form onSubmit={reassign} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select className="input" value={newCounsellorId} onChange={e => setNewCounsellorId(e.target.value)} required>
                <option value="">Select counsellor...</option>
                {counsellors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Reassign</button>
                <button type="button" className="btn-ghost" onClick={() => setReassignModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
