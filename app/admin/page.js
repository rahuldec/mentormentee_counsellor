'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import WellbeingStars from '@/components/WellbeingStars';
import { format } from 'date-fns';

const TABS = ['Sessions', 'Reports', 'Counsellors', 'Categories', 'Mapping'];

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('Sessions');
  const [sessions, setSessions] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [newCounsellor, setNewCounsellor] = useState({ name: '', email: '', mobile: '', employee_id: '' });
  const [newCategory, setNewCategory] = useState('');
  const [mapForm, setMapForm] = useState({ category_id: '', counsellor_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  // Report filters
  const [reportType, setReportType] = useState('student');
  const [reportId, setReportId] = useState('');
  const [reportData, setReportData] = useState(null);

  // Reassign
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
    const [sRes, cRes, catRes] = await Promise.all([
      fetch('/api/sessions'),
      fetch('/api/counsellors'),
      fetch('/api/categories'),
    ]);
    setSessions(await sRes.json());
    setCounsellors(await cRes.json());
    setCategories(await catRes.json());
    setLoading(false);
  }

  async function addCounsellor(e) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/counsellors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCounsellor) });
    if (res.ok) { setMsg('Counsellor added!'); setNewCounsellor({ name: '', email: '', mobile: '', employee_id: '' }); loadAll(); }
    setSubmitting(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function deleteCounsellor(id) {
    if (!confirm('Delete this counsellor?')) return;
    await fetch('/api/counsellors', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    loadAll();
  }

  async function addCategory(e) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategory }) });
    if (res.ok) { setMsg('Category added!'); setNewCategory(''); loadAll(); }
    setSubmitting(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function deleteCategory(id) {
    if (!confirm('Delete this category?')) return;
    await fetch('/api/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    loadAll();
  }

  async function addMapping(e) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/mapping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mapForm) });
    if (res.ok) { setMsg('Mapping added!'); setMapForm({ category_id: '', counsellor_id: '' }); loadAll(); }
    else { const d = await res.json(); setMsg(d.error || 'Error'); }
    setSubmitting(false);
    setTimeout(() => setMsg(''), 3000);
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
    setReassignModal(null);
    loadAll();
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-gray-500">{user?.name}</p>
        </div>
        <div className="max-w-2xl mx-auto px-4 flex gap-1 overflow-x-auto pb-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {msg && <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded-lg mb-4">{msg}</div>}

        {/* SESSIONS TAB */}
        {tab === 'Sessions' && (
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-medium text-sm">{s.requester_name || s.requester_id} <span className="text-gray-400 font-normal">({s.requester_type})</span></p>
                    <p className="text-xs text-gray-400">{s.categories?.name} · {format(new Date(s.created_at), 'dd MMM yyyy')}</p>
                    {s.counsellors && <p className="text-xs text-gray-500">Counsellor: {s.counsellors.name}</p>}
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                {s.scheduled_at && <p className="text-xs text-gray-500">📅 {format(new Date(s.scheduled_at), 'dd MMM yyyy, hh:mm a')}{s.location && ` · 📍 ${s.location}`}</p>}
                {s.remarks && <div className="mt-1 flex items-center gap-2"><span className="text-xs text-gray-500">Wellbeing:</span><WellbeingStars value={s.remarks.counsellor_wellbeing_score} readOnly /></div>}
                <button onClick={() => { setReassignModal(s); setNewCounsellorId(s.counsellor_id || ''); }} className="mt-2 text-xs text-blue-600 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50">Reassign Counsellor</button>
              </div>
            ))}
          </div>
        )}

        {/* REPORTS TAB */}
        {tab === 'Reports' && (
          <div>
            <div className="bg-white rounded-xl border p-4 mb-4">
              <h2 className="font-semibold text-gray-900 mb-3">Generate Report</h2>
              <form onSubmit={runReport} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Report Type</label>
                  <select value={reportType} onChange={e => setReportType(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="student">Student-wise</option>
                    <option value="employee">Employee-wise</option>
                    <option value="counsellor">Counsellor-wise</option>
                    <option value="category">Category-wise</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {reportType === 'counsellor' ? 'Counsellor' : reportType === 'category' ? 'Category' : 'ID (leave blank for all)'}
                  </label>
                  {reportType === 'counsellor' ? (
                    <select value={reportId} onChange={e => setReportId(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">All counsellors</option>
                      {counsellors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : reportType === 'category' ? (
                    <select value={reportId} onChange={e => setReportId(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">All categories</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={reportId} onChange={e => setReportId(e.target.value)} placeholder="Student/Employee ID" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  )}
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 text-sm">Run Report</button>
              </form>
            </div>

            {reportData && (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white rounded-xl border p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{reportData.stats.total}</p>
                    <p className="text-xs text-gray-500">Total Sessions</p>
                  </div>
                  <div className="bg-white rounded-xl border p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{reportData.stats.byStatus.completed || 0}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="bg-white rounded-xl border p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-500">{reportData.stats.avgWellbeing || '-'}</p>
                    <p className="text-xs text-gray-500">Avg Wellbeing</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {reportData.sessions.map(s => (
                    <div key={s.id} className="bg-white rounded-xl border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{s.requester_name || s.requester_id}</p>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="text-xs text-gray-400">{s.categories?.name} · {s.counsellors?.name} · {format(new Date(s.created_at), 'dd MMM yyyy')}</p>
                      {s.remarks && <WellbeingStars value={s.remarks.counsellor_wellbeing_score} readOnly />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COUNSELLORS TAB */}
        {tab === 'Counsellors' && (
          <div>
            <div className="bg-white rounded-xl border p-4 mb-4">
              <h2 className="font-semibold text-gray-900 mb-3">Add Counsellor</h2>
              <form onSubmit={addCounsellor} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Name</label>
                    <input type="text" value={newCounsellor.name} onChange={e => setNewCounsellor({ ...newCounsellor, name: e.target.value })} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Employee ID</label>
                    <input type="text" value={newCounsellor.employee_id} onChange={e => setNewCounsellor({ ...newCounsellor, employee_id: e.target.value })} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Email</label>
                  <input type="email" value={newCounsellor.email} onChange={e => setNewCounsellor({ ...newCounsellor, email: e.target.value })} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Mobile</label>
                  <input type="text" value={newCounsellor.mobile} onChange={e => setNewCounsellor({ ...newCounsellor, mobile: e.target.value })} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">{submitting ? 'Adding...' : 'Add Counsellor'}</button>
              </form>
            </div>
            <div className="space-y-2">
              {counsellors.map(c => (
                <div key={c.id} className="bg-white rounded-xl border p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.email} {c.employee_id && `· ${c.employee_id}`}</p>
                  </div>
                  <button onClick={() => deleteCounsellor(c.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {tab === 'Categories' && (
          <div>
            <div className="bg-white rounded-xl border p-4 mb-4">
              <h2 className="font-semibold text-gray-900 mb-3">Add Category</h2>
              <form onSubmit={addCategory} className="flex gap-2">
                <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Category name" required className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" disabled={submitting} className="bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50">Add</button>
              </form>
            </div>
            <div className="space-y-2">
              {categories.map(c => (
                <div key={c.id} className="bg-white rounded-xl border p-3 flex items-center justify-between">
                  <p className="text-sm font-medium">{c.name}</p>
                  <button onClick={() => deleteCategory(c.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MAPPING TAB */}
        {tab === 'Mapping' && (
          <div>
            <div className="bg-white rounded-xl border p-4 mb-4">
              <h2 className="font-semibold text-gray-900 mb-3">Map Category → Counsellor</h2>
              <form onSubmit={addMapping} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Category</label>
                  <select value={mapForm.category_id} onChange={e => setMapForm({ ...mapForm, category_id: e.target.value })} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Counsellor</label>
                  <select value={mapForm.counsellor_id} onChange={e => setMapForm({ ...mapForm, counsellor_id: e.target.value })} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select counsellor...</option>
                    {counsellors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50">{submitting ? 'Adding...' : 'Add Mapping'}</button>
              </form>
            </div>
            <div className="space-y-2">
              {categories.filter(c => c.category_counsellor_map?.length > 0).map(cat => (
                <div key={cat.id} className="bg-white rounded-xl border p-3">
                  <p className="text-sm font-semibold text-gray-900 mb-2">{cat.name}</p>
                  {cat.category_counsellor_map.map(m => (
                    <div key={m.counsellor_id} className="flex items-center justify-between py-1">
                      <p className="text-xs text-gray-600">→ {m.counsellors?.name}</p>
                      <button onClick={() => removeMapping(cat.id, m.counsellor_id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
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
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <h3 className="font-semibold text-gray-900 mb-1">Reassign Counsellor</h3>
            <p className="text-xs text-gray-500 mb-4">Session: {reassignModal.requester_name} · {reassignModal.categories?.name}</p>
            <form onSubmit={reassign} className="space-y-3">
              <select value={newCounsellorId} onChange={e => setNewCounsellorId(e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select counsellor...</option>
                {counsellors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 text-sm">Reassign</button>
                <button type="button" onClick={() => setReassignModal(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
