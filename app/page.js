'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');

  useEffect(() => {
    // Read params from URL (ERP integration)
    const params = new URLSearchParams(window.location.search);
    const regNo = params.get('regNo');   // student
    const mobile = params.get('mobile'); // employee
    const n = params.get('name');
    const e = params.get('email');

    if (regNo) {
      sessionStorage.setItem('user_id', regNo);
      sessionStorage.setItem('role', 'student');
      if (n) sessionStorage.setItem('name', n);
      if (e) sessionStorage.setItem('email', e);
      router.push('/student');
    } else if (mobile) {
      sessionStorage.setItem('user_id', mobile);
      sessionStorage.setItem('role', 'employee');
      if (n) sessionStorage.setItem('name', n);
      if (e) sessionStorage.setItem('email', e);
      router.push('/employee');
    }
  }, [router]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!userId || !role) return;
    sessionStorage.setItem('user_id', userId);
    sessionStorage.setItem('role', role);
    sessionStorage.setItem('name', name);
    sessionStorage.setItem('email', email);
    router.push(`/${role}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Counselling Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Dev mode — enter your details</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Employee/Student ID</label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="e.g. EMP001 or STU123"
              required
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="student">Student</option>
              <option value="employee">Employee</option>
              <option value="counsellor">Counsellor</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Enter Portal
          </button>
        </form>
      </div>
    </div>
  );
}
