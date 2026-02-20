'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface VendorLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/vendor/dashboard', icon: 'Dashboard' },
  { name: 'My Ads', href: '/vendor/ads', icon: 'Ads' },
  { name: 'Create Ad', href: '/vendor/ads/create', icon: 'Create' },
];

export default function VendorLayout({ children }: VendorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      const data = localStorage.getItem('vendorData');
      if (data) {
        const vendor = JSON.parse(data);
        setVendorName(vendor.businessName || vendor.name || 'Vendor');
      }
    } catch {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorData');
    router.push('/vendor/login');
  };

  const renderIcon = (icon: string, isActive: boolean) => {
    const cls = `w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`;
    switch (icon) {
      case 'Dashboard':
        return (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
          </svg>
        );
      case 'Ads':
        return (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      case 'Create':
        return (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-20 px-6 bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-violet-600 font-bold text-lg">MS</span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-400 rounded-full animate-pulse"></div>
          </div>
          <div className="ml-4">
            <h1 className="text-white font-bold text-xl tracking-tight">MyStatus</h1>
            <p className="text-violet-100 text-xs font-medium">Vendor Portal</p>
          </div>
        </div>
      </div>

      {vendorName && (
        <div className="px-6 py-4 border-b border-slate-700/50">
          <p className="text-slate-400 text-xs">Logged in as</p>
          <p className="text-slate-200 font-semibold text-sm truncate">{vendorName}</p>
        </div>
      )}

      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/vendor/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex items-center px-4 py-4 text-sm font-medium rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 shadow-lg shadow-violet-500/10 border border-violet-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 hover:shadow-md'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-violet-400 to-purple-500 rounded-r-full"></div>
                )}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mr-4 transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-br from-violet-400 to-purple-500 shadow-lg'
                    : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                }`}>
                  {renderIcon(item.icon, isActive)}
                </div>
                <span className={`font-medium transition-colors ${
                  isActive ? 'text-violet-300' : 'text-slate-400 group-hover:text-slate-200'
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-6">
        <button
          onClick={handleLogout}
          className="group flex items-center w-full px-4 py-4 text-sm font-medium text-slate-400 hover:text-slate-200 rounded-2xl hover:bg-slate-700/30 transition-all duration-200 hover:shadow-md"
        >
          <div className="w-9 h-9 bg-slate-700/50 rounded-xl flex items-center justify-center mr-4 group-hover:bg-red-500/20 transition-colors">
            <svg className="w-5 h-5 text-slate-400 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-sm bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="hidden lg:flex lg:min-h-screen">
        <div className="w-72 bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col shadow-2xl">
          <SidebarContent />
        </div>
        <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="min-h-screen">{children}</div>
        </div>
      </div>

      <div className="lg:hidden">
        <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <SidebarContent />
        </div>

        <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-700/30 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">MS</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
          {children}
        </div>
      </div>
    </div>
  );
}
