'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';

export default function DashboardPage() {
  const { role } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (role === 'ADMIN') {
      router.replace('/admin/dashboard');
    } else if (role === 'NON_ADMIN') {
      router.replace('/sales/dashboard');
    } else {
      router.replace('/login');
    }
  }, [role, router]);

  return null;
}
