'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function VerificationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('verificationToken');
    router.push('/verification/login');
  };

  const isActive = pathname === '/verification';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="hidden lg:flex lg:min-h-screen">
        <div className="w-72 bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col shadow-2xl">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center h-20 px-6 bg-gradient-to-r from-violet-500 to-indigo-600 shadow-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-violet-600 font-bold text-lg">MS</span>
                </div>
                <div className="ml-4">
                  <h1 className="text-white font-bold text-xl tracking-tight">MyStatus</h1>
                  <p className="text-violet-100 text-xs font-medium">Verification Panel</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6">
              <Link
                href="/verification"
                className={`group relative flex items-center px-4 py-4 text-sm font-medium rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-500/20 to-indigo-500/20 text-violet-300 shadow-lg shadow-violet-500/10 border border-violet-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-violet-400 to-indigo-500 rounded-r-full"></div>
                )}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mr-4 ${
                  isActive ? 'bg-gradient-to-br from-violet-400 to-indigo-500 shadow-lg' : 'bg-slate-700/50'
                }`}>
                  <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Verifications
              </Link>
            </nav>

            <div className="p-4 border-t border-slate-700/50">
              <button
                onClick={handleLogout}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-200 hover:bg-slate-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1">{children}</div>
      </div>

      <div className="lg:hidden">
        <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 px-4 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold">Verification Panel</p>
              <p className="text-xs text-slate-400">MyStatus</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
            >
              Logout
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
