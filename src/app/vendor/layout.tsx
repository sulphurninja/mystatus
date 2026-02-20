'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import VendorLayout from '@/components/vendor/VendorLayout';

export default function VendorLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/vendor/login') return;

    const token = localStorage.getItem('vendorToken');
    if (!token) {
      router.push('/vendor/login');
    }
  }, [pathname, router]);

  if (pathname === '/vendor/login') {
    return <>{children}</>;
  }

  return <VendorLayout>{children}</VendorLayout>;
}
