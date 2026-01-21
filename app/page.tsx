'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';

export default function HomePage() {
  const router = useRouter();
  const { role } = useStore();

  useEffect(() => {
    if (role) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [role, router]);

  return null;
}