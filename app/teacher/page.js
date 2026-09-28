'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { format } from 'date-fns';

export default function TeacherPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student_id: '', student_name: '', student_email: '', category_id: '', counsellor_id: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const uid = sessionStorage.getItem('user_id');
    if (!uid) { router.push('/'); return; }
    const u = { id: uid, name: sessionStorage.getItem('name') || uid };
    setUser(u);
    loadData(uid);
  }, [router]);

  async function loadData(uid) {
    setLoading(true);
    const [refRes, catRes, cRes] = await Promise.all([
      fetch(`/api/referrals?teacher_id=${uid}`),
      fetch('/api/categories'),
      fetch('/api/counsellors'),
    ]);
    setReferrals(await refRes.json());
    setCategories(await catRes.json());
    setCounsellors(await cRes.json());
    setLoading(false);
  }

  async function submitReferral(e) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacher_id: user.id,
        teacher_name: user.name,
        ...form,
      }),
    });
    if (res.ok) {
      setSuccess('Student referred successfully!');
      setShowForm(false);
      setForm({ student_id: '', student_name: '', student_email: '', category_id: '', counsellor_id: '', notes: '' });
      loadData(user.id);
      setTimeout(() => setSuccess(''), 3000);
    }
    setSubmitting(false);
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900">Referrals</h1>
            <p className="text-xs text-gray-500">{user?.name} · Teacher</p>
          </div>
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
            + Refer Student
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}

        {showForm && (
          <div className="bg-white rounded-xl border mb-4 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Refer Student to Counselling</h2>
            <form onSubmit={submitReferral} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Student ID</label>
                  <input type="text" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} placeholder="STU001" required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Student Name</label>
                  <input type="text" value={form.student_name} onChange={e => setForm({ ...form, student_name: e.target.value })} placeholder="Full name" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Student Email</label>
                <input type="email" value={form.student_email} onChange={e => setForm({ ...form, student_email: e.target.value })} placeholder="student@school.edu" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Category</label>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Preferred Counsellor (optional)</label>
                <select value={form.counsellor_id} onChange={e => setForm({ ...form, counsellor_id: e.target.value })} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Auto-assign by category</option>
                  {counsellors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Reason for referral..." className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">{submitting ? 'Submitting...' : 'Submit Referral'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {referrals.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p>No referrals made yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map(r => (
              <div key={r.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{r.student_name || r.student_id}</p>
                    <p className="text-xs text-gray-400">{r.categories?.name}</p>
                    <p className="text-xs text-gray-400">{format(new Date(r.created_at), 'dd MMM yyyy')}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'session_created' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {r.status === 'session_created' ? 'Session Created' : 'Pending'}
                  </span>
                </div>
                {r.counsellors && <p className="text-xs text-gray-500 mt-1">Counsellor: {r.counsellors.name}</p>}
                {r.notes && <p className="text-xs text-gray-500 mt-1 italic">"{r.notes}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
