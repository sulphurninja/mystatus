'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: 'LayoutDashboard',
    current: false
  },
  {
    name: 'Vendors',
    href: '/admin/vendors',
    icon: 'Store',
    current: false
  },
  {
    name: 'Advertisements',
    href: '/admin/advertisements',
    icon: 'Megaphone',
    current: false
  },
  {
    name: 'MyStatus Ads',
    href: '/admin/mystatus-ads',
    icon: 'Heart',
    current: false
  },
  {
    name: 'Verifications',
    href: '/admin/verifications',
    icon: 'CheckCircle',
    current: false
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: 'Users',
    current: false
  },
  {
    name: 'Wallet Management',
    href: '/admin/users/wallet-management',
    icon: 'Wallet',
    current: false
  },
  {
    name: 'Activation Keys',
    href: '/admin/activation-keys',
    icon: 'Key',
    current: false
  },
  {
    name: 'Commission Rates',
    href: '/admin/commission-rates',
    icon: 'TrendingUp',
    current: false
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: 'BarChart3',
    current: false
  }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('admin-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setDarkMode(shouldBeDark);

    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('admin-theme', newDarkMode ? 'dark' : 'light');

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-sm bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Layout */}
      <div className="hidden lg:flex lg:min-h-screen">
        {/* Sidebar */}
        <div className="w-72 bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col shadow-2xl">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-center h-20 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-emerald-600 font-bold text-lg">MS</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
                <div className="ml-4">
                  <h1 className="text-white font-bold text-xl tracking-tight">MyStatus</h1>
                  <p className="text-emerald-100 text-xs font-medium">Admin Panel</p>
                </div>
              </div>
            </div>

            {/* Theme Toggle */}
            {/* <div className="px-6 py-4">
              <button
                onClick={toggleDarkMode}
                className="group flex items-center justify-between w-full px-4 py-3 text-sm bg-slate-700/50 hover:bg-slate-600/50 rounded-xl border border-slate-600/30 transition-all duration-200 hover:border-slate-500/50"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    {darkMode ? (
                      <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-slate-300 font-medium">Theme</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-slate-400 mr-2">
                  {darkMode ? 'Light' : 'Dark'}
                </span>
                  <div className={`w-8 h-4 rounded-full transition-colors ${darkMode ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${darkMode ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                  </div>
                </div>
              </button>
            </div> */}

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6">
              <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                      className={`group relative flex items-center px-4 py-4 text-sm font-medium rounded-2xl transition-all duration-200 ${
                      isActive
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 shadow-lg shadow-emerald-500/10 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 hover:shadow-md'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-r-full"></div>
                      )}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mr-4 transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg'
                          : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                      }`}>
                        {item.icon === 'LayoutDashboard' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                          </svg>
                        )}
                        {item.icon === 'Store' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        )}
                        {item.icon === 'Megaphone' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                          </svg>
                        )}
                        {item.icon === 'Heart' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                        {item.icon === 'CheckCircle' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {item.icon === 'Users' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        )}
                        {item.icon === 'Wallet' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        )}
                        {item.icon === 'Key' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        )}
                        {item.icon === 'TrendingUp' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        )}
                        {item.icon === 'BarChart3' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        )}
                      </div>
                      <span className={`font-medium transition-colors ${
                        isActive ? 'text-emerald-300' : 'text-slate-400 group-hover:text-slate-200'
                      }`}>
                    {item.name}
                      </span>
                  </Link>
                );
              })}
              </div>
            </nav>

            {/* Logout */}
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
        </div>

        {/* Main content */}
        <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="min-h-screen">
          {children}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-center h-20 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-emerald-600 font-bold text-lg">MS</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
                <div className="ml-4">
                  <h1 className="text-white font-bold text-xl tracking-tight">MyStatus</h1>
                  <p className="text-emerald-100 text-xs font-medium">Admin Panel</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6">
              <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                      className={`group relative flex items-center px-4 py-4 text-sm font-medium rounded-2xl transition-all duration-200 ${
                      isActive
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 shadow-lg shadow-emerald-500/10 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 hover:shadow-md'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-r-full"></div>
                      )}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mr-4 transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg'
                          : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                      }`}>
                        {item.icon === 'LayoutDashboard' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                          </svg>
                        )}
                        {item.icon === 'Store' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        )}
                        {item.icon === 'Megaphone' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                          </svg>
                        )}
                        {item.icon === 'Heart' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                        {item.icon === 'CheckCircle' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {item.icon === 'Users' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        )}
                        {item.icon === 'Wallet' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        )}
                        {item.icon === 'Key' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        )}
                        {item.icon === 'TrendingUp' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        )}
                        {item.icon === 'BarChart3' && (
                          <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        )}
                      </div>
                      <span className={`font-medium transition-colors ${
                        isActive ? 'text-emerald-300' : 'text-slate-400 group-hover:text-slate-200'
                      }`}>
                    {item.name}
                      </span>
                  </Link>
                );
              })}
              </div>
            </nav>

            {/* Logout */}
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
        </div>

        {/* Mobile Header */}
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
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">MS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
          {children}
        </div>
      </div>
    </div>
  );
}
