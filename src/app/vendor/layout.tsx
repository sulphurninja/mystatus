'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';

const VendorShell = dynamic(() => import('@/components/vendor/VendorLayout'), {
  ssr: false,
});

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

  return <VendorShell>{children}</VendorShell>;
}
