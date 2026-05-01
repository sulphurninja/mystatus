'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminVerificationsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/verification');
  }, [router]);

  return null;
}
