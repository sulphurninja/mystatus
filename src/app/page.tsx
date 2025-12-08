'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to admin login after 3 seconds
    const timer = setTimeout(() => {
      router.push('/admin/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

      <div className="max-w-md w-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-8 text-center relative">
        {/* Logo */}
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <span className="text-white font-bold text-2xl">MS</span>
        </div>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-4">
          MyStatus
        </h1>
        <p className="text-slate-400 mb-8 text-lg">MLM Platform Administration</p>

        <div className="space-y-4">
          <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500">Redirecting to admin login...</p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <Link
            href="/admin/login"
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
          >
            Click here if not redirected
          </Link>
        </div>
      </div>
    </div>
  );
}
