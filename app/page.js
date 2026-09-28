'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLES = [
  { key: 'student',    label: 'Student',    icon: '🎓', color: '#4F46E5' },
  { key: 'employee',   label: 'Employee',   icon: '👔', color: '#0891B2' },
  { key: 'counsellor', label: 'Counsellor', icon: '🧠', color: '#059669' },
  { key: 'teacher',    label: 'Teacher',    icon: '📚', color: '#D97706' },
  { key: 'admin',      label: 'Admin',      icon: '⚙️', color: '#7C3AED' },
];

export default function Home() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [role, setRole]     = useState('student');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Strip any value containing '{' — unresolved ERP placeholders
    const clean = (v) => (v && !v.includes('{')) ? v : null;

    const regNo  = clean(params.get('regNo'));
    const mobile = clean(params.get('mobile'));
    const n      = clean(params.get('name'));
    const e      = clean(params.get('email'));

    if (regNo) {
      sessionStorage.clear();
      sessionStorage.setItem('user_id', regNo);
      sessionStorage.setItem('role', 'student');
      if (n) sessionStorage.setItem('name', n);
      if (e) sessionStorage.setItem('email', e);
      router.push('/student');
    } else if (mobile) {
      const empId = clean(params.get('empId') || params.get('emp_id'));
      const resolvedId = empId || mobile;
      sessionStorage.clear();
      sessionStorage.setItem('user_id', resolvedId);
      sessionStorage.setItem('role', 'employee');
      if (n) sessionStorage.setItem('name', n);
      if (e) sessionStorage.setItem('email', e);
      router.push('/employee');
    }
  }, [router]);

  const handleLogin = (selectedRole) => {
    if (!userId) return;
    sessionStorage.setItem('user_id', userId);
    sessionStorage.setItem('role', selectedRole);
    sessionStorage.setItem('name', name);
    sessionStorage.setItem('email', email);
    router.push(`/${selectedRole}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(150deg, #EEF2FF 0%, #F0F9FF 50%, #F5F3FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 4px 32px rgba(79,70,229,0.12)', padding: '36px 28px', width: '100%', maxWidth: 380 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #4F46E5, #818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}>
            <svg width="30" height="30" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E2A3B', margin: '0 0 4px' }}>Counselling Portal</h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Dev access — select your role</p>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div>
            <label className="label">ID / Reg No / Mobile</label>
            <input className="input" type="text" value={userId} onChange={e => setUserId(e.target.value)} placeholder="e.g. STU001 or 9876543210" />
          </div>
          <div>
            <label className="label">Full Name</label>
            <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
          </div>
        </div>

        {/* Role buttons */}
        <label className="label" style={{ marginBottom: 10 }}>Enter as</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ROLES.map(r => (
            <button
              key={r.key}
              onClick={() => handleLogin(r.key)}
              disabled={!userId}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 14,
                border: role === r.key ? `2px solid ${r.color}` : '1.5px solid #E2E8F0',
                background: role === r.key ? `${r.color}10` : 'white',
                color: role === r.key ? r.color : '#475569',
                fontWeight: 600, fontSize: 14, cursor: userId ? 'pointer' : 'not-allowed',
                opacity: userId ? 1 : 0.5, transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { if (userId) { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.background = `${r.color}10`; } }}
              onMouseLeave={e => { if (role !== r.key) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = 'white'; } }}
            >
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{r.icon}</span>
              <span>{r.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 18, color: '#CBD5E1' }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
