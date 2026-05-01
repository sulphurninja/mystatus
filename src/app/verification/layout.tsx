'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import VerificationLayout from '@/components/verification/VerificationLayout';

export default function VerificationLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/verification/login') return;

    const token = localStorage.getItem('verificationToken');
    if (!token) {
      router.push('/verification/login');
    }
  }, [pathname, router]);

  if (pathname === '/verification/login') {
    return <>{children}</>;
  }

  return <VerificationLayout>{children}</VerificationLayout>;
}
