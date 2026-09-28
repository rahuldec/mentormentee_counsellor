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
    if (!uid) { router.push('/'); return; }

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <StudentPage />;
}
