'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentPage from '@/app/student/page';

export default function EmployeePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isCounsellor, setIsCounsellor] = useState(false);

  useEffect(() => {
    const uid = sessionStorage.getItem('user_id');
    const email = sessionStorage.getItem('email');
    if (!uid || uid.includes('{')) { sessionStorage.clear(); router.push('/'); return; }

    fetch('/api/counsellors')
      .then(r => r.json())
      .then(counsellors => {
        const found = counsellors.some(
          c => c.employee_id === uid || c.email === email
        );
        if (found) {
          sessionStorage.setItem('role', 'counsellor');
          router.replace('/counsellor');
        } else {
          sessionStorage.setItem('role', 'employee');
          setChecking(false);
        }
      })
      .catch(() => {
        sessionStorage.setItem('role', 'employee');
        setChecking(false);
      });
  }, [router]);

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F0F4FF' }}>
        <div className="spinner" />
      </div>
    );
  }

  return <StudentPage />;
}
