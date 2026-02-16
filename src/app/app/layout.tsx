'use client';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/app/BottomNav';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Auth routes that don't need authentication
  const authRoutes = ['/app/onboarding', '/app/login', '/app/register'];
  const isAuthRoute = authRoutes.includes(pathname);
  const isAppRoot = pathname === '/app';

  useEffect(() => {
    // Don't redirect while loading or on app root (it handles its own redirect)
    if (isLoading || isAppRoot) return;

    // Small delay to ensure state has propagated
    const timer = setTimeout(() => {
      if (!user && !isAuthRoute) {
        // Not authenticated and trying to access protected route
        console.log('🔒 Not authenticated, redirecting to login');
        router.replace('/app/login');
      } else if (user && isAuthRoute) {
        // Already authenticated but on auth route
        console.log('✅ Authenticated, redirecting to home');
        router.replace('/app/home');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, isLoading, pathname, router, isAuthRoute, isAppRoot]);

  // Show loading state only during initial load
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show bottom nav only for authenticated routes
  const showBottomNav = user && !isAuthRoute && !isAppRoot;

  return (
    <div className="min-h-screen bg-slate-950">
      <main className={showBottomNav ? 'pb-20' : ''}>{children}</main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </AuthProvider>
  );
}
