'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function TeacherPage() {
  const router = useRouter();
  const [user, setUser]           = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ student_id: '', student_name: '', student_email: '', category_id: '', counsellor_id: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState('');

  useEffect(() => {
    const uid = sessionStorage.getItem('user_id');
    if (!uid) { router.push('/'); return; }
    const u = { id: uid, name: sessionStorage.getItem('name') || uid };
    setUser(u);
    loadData(uid);
  }, [router]);

  async function loadData(uid) {
    setLoading(true);
    const [refRes, catRes, cRes] = await Promise.all([fetch(`/api/referrals?teacher_id=${uid}`), fetch('/api/categories'), fetch('/api/counsellors')]);
    setReferrals(await refRes.json());
    setCategories(await catRes.json());
    setCounsellors(await cRes.json());
    setLoading(false);
  }

  async function submitReferral(e) {
    e.preventDefault(); setSubmitting(true);
    const res = await fetch('/api/referrals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teacher_id: user.id, teacher_name: user.name, ...form }) });
    if (res.ok) {
      setSuccess('Student referred successfully!');
      setShowForm(false);
      setForm({ student_id: '', student_name: '', student_email: '', category_id: '', counsellor_id: '', notes: '' });
      loadData(user.id);
      setTimeout(() => setSuccess(''), 3000);
    }
    setSubmitting(false);
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF', paddingBottom: 32 }}>
      <div className="page-header">
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #D97706, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📚</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E2A3B' }}>Referrals</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>{user?.name} · Teacher</div>
            </div>
          </div>
          <button className="btn-primary" style={{ fontSize: 13, padding: '9px 16px' }} onClick={() => setShowForm(true)}>+ Refer Student</button>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '16px 16px 0' }}>
        {success && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
            ✓ {success}
          </div>
        )}

        {showForm && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: '#1E2A3B', margin: 0 }}>Refer Student to Counselling</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={submitReferral} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">Student ID</label>
                  <input className="input" style={{ marginTop: 6 }} type="text" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} placeholder="STU001" required />
                </div>
                <div>
                  <label className="label">Student Name</label>
                  <input className="input" style={{ marginTop: 6 }} type="text" value={form.student_name} onChange={e => setForm({ ...form, student_name: e.target.value })} placeholder="Full name" />
                </div>
              </div>
              <div>
                <label className="label">Student Email</label>
                <input className="input" style={{ marginTop: 6 }} type="email" value={form.student_email} onChange={e => setForm({ ...form, student_email: e.target.value })} placeholder="student@school.edu" />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" style={{ marginTop: 6 }} value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required>
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Preferred Counsellor (optional)</label>
                <select className="input" style={{ marginTop: 6 }} value={form.counsellor_id} onChange={e => setForm({ ...form, counsellor_id: e.target.value })}>
                  <option value="">Auto-assign by category</option>
                  {counsellors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Reason / Notes</label>
                <textarea className="input" style={{ marginTop: 6 }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Reason for referral..." />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>{submitting ? 'Submitting...' : 'Submit Referral'}</button>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {referrals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#1E2A3B', marginBottom: 6 }}>No referrals yet</div>
            <div style={{ fontSize: 14, color: '#94A3B8' }}>Tap "+ Refer Student" to create one</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {referrals.map(r => (
              <div key={r.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1E2A3B', marginBottom: 2 }}>{r.student_name || r.student_id}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>{r.categories?.name}</div>
                    <div style={{ fontSize: 11, color: '#CBD5E1' }}>{format(new Date(r.created_at), 'dd MMM yyyy')}</div>
                    {r.counsellors && <div style={{ fontSize: 12, color: '#4F46E5', marginTop: 4 }}>Counsellor: {r.counsellors.name}</div>}
                    {r.notes && <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', marginTop: 4 }}>"{r.notes}"</div>}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '4px 10px', whiteSpace: 'nowrap',
                    background: r.status === 'session_created' ? '#ECFDF5' : '#FFFBEB',
                    color: r.status === 'session_created' ? '#065F46' : '#92400E',
                  }}>
                    {r.status === 'session_created' ? '✓ Session Created' : '⏳ Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
