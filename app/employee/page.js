'use client';
// Employee view is identical to student view with role=employee
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeePage() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to student page — same UI, role is stored in sessionStorage
    router.replace('/student');
  }, [router]);
  return null;
}
