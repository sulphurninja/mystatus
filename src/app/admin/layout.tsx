'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') return;

    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const cachedAdmin = localStorage.getItem('adminUser');
    if (cachedAdmin) {
      try {
        const admin = JSON.parse(cachedAdmin);
        const permissions: string[] = admin.permissions || [];

        if (admin.role === 'sub-admin') {
          const canAccessVendors = pathname.startsWith('/admin/vendors') &&
            (permissions.includes('vendors.create') || permissions.includes('vendors.approve'));
          const canAccessAds = pathname.startsWith('/admin/advertisements') &&
            (permissions.includes('advertisements.create') || permissions.includes('advertisements.approve'));

          if (!canAccessVendors && !canAccessAds) {
            if (permissions.includes('vendors.create') || permissions.includes('vendors.approve')) {
              router.push('/admin/vendors');
            } else if (permissions.includes('advertisements.create') || permissions.includes('advertisements.approve')) {
              router.push('/admin/advertisements');
            } else {
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminUser');
              router.push('/admin/login');
            }
          }
        }
      } catch {}
    }
  }, [pathname, router]);

  // Don't wrap login page with admin layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
