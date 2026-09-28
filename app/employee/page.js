'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const uid = sessionStorage.getItem('user_id');
    const email = sessionStorage.getItem('email');
    if (!uid) { router.push('/'); return; }

    // Check if this employee is a counsellor
    fetch('/api/counsellors')
      .then(r => r.json())
      .then(counsellors => {
        const isCounsellor = counsellors.some(
          c => c.employee_id === uid || c.email === email
        );
        if (isCounsellor) {
          sessionStorage.setItem('role', 'counsellor');
          router.replace('/counsellor');
        } else {
          setChecking(false); // stay on employee view
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render employee (student-style) view
  const StudentPage = require('@/app/student/page').default;
  return <StudentPage />;
}
