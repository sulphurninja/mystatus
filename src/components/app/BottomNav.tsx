'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, TrendingUp, User } from 'lucide-react';

const navItems = [
  { name: 'Home', href: '/app/home', icon: Home },
  { name: 'Discover', href: '/app/discover', icon: Compass },
  { name: 'Earnings', href: '/app/earnings', icon: TrendingUp },
  { name: 'Profile', href: '/app/profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Blur Background */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl border-t border-white/5" />
      
      <div className="relative max-w-md mx-auto px-4 py-3 safe-bottom">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 group"
              >
                <div
                  className={`relative p-2 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20'
                      : 'group-hover:bg-white/5'
                  }`}
                >
                  {/* Active Indicator Glow */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 blur-lg" />
                  )}
                  <Icon
                    className={`relative w-5 h-5 transition-all duration-300 ${
                      isActive
                        ? 'text-emerald-400'
                        : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium mt-1 transition-colors duration-300 ${
                    isActive
                      ? 'text-emerald-400'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
