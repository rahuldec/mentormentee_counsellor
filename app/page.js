'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLES = [
  { key: 'student',    label: 'Student',    icon: '🎓', desc: 'Raise & track counselling requests' },
  { key: 'employee',   label: 'Employee',   icon: '👔', desc: 'Staff counselling & wellbeing' },
  { key: 'counsellor', label: 'Counsellor', icon: '🧠', desc: 'Manage & respond to sessions' },
  { key: 'teacher',    label: 'Teacher',    icon: '📚', desc: 'Refer & monitor student sessions' },
  { key: 'admin',      label: 'Admin',      icon: '⚙️', desc: 'Dashboard, reports & settings' },
];

export default function Home() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [role, setRole]     = useState('student');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
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
    <div style={{ minHeight: '100vh', background: '#FEF6EE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Brand mark */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #E84A0C, #F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 4px 16px rgba(232,74,12,0.35)' }}>
          <svg width="28" height="28" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.3px' }}>Counselling Portal</div>
        <div style={{ fontSize: 13, color: '#B8A99A', marginTop: 3 }}>Student & Staff Wellbeing</div>
      </div>

      <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', padding: '28px 24px', width: '100%', maxWidth: 380 }}>
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

        <label className="label" style={{ marginBottom: 10 }}>Enter as</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ROLES.map(r => (
            <button
              key={r.key}
              onClick={() => handleLogin(r.key)}
              disabled={!userId}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 14,
                border: '1.5px solid #EDE0D4',
                background: 'white',
                cursor: userId ? 'pointer' : 'not-allowed',
                opacity: userId ? 1 : 0.45,
                transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { if (userId) { e.currentTarget.style.borderColor = '#E84A0C'; e.currentTarget.style.background = '#FFF5F0'; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#EDE0D4'; e.currentTarget.style.background = 'white'; }}
            >
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{r.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A1A' }}>{r.label}</div>
                <div style={{ fontSize: 11, color: '#B8A99A', marginTop: 1 }}>{r.desc}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 16, color: '#D4C4B8' }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
