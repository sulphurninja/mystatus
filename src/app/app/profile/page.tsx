'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/app/AppHeader';
import CoinAmount from '@/components/app/CoinAmount';
import {
  User,
  Mail,
  Phone,
  Key,
  Wallet,
  ShoppingBag,
  Users,
  Share2,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  Camera,
  Award,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [referralStats, setReferralStats] = useState({ total: 0, active: 0 });

  const handleLogout = () => {
    logout();
    router.replace('/app/login');
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const loadReferralStats = async () => {
      try {
        const response = await fetch('/api/users/referral', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const result = await response.json();
        const total = Number(
          result?.data?.stats?.totalReferrals ?? result?.data?.totalReferrals ?? 0
        );
        const active = Number(
          result?.data?.stats?.activeReferrals ?? result?.data?.activeReferrals ?? 0
        );

        if (isMounted) {
          setReferralStats({
            total: Number.isFinite(total) ? total : 0,
            active: Number.isFinite(active) ? active : 0,
          });
        }
      } catch (error) {
        console.error('Failed to load referral stats:', error);
      }
    };

    loadReferralStats();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const totalStars = 7;
  // 1 base star for every account + 1 bonus star if they have at least 1 referral
  const brightStars = Math.min(
    totalStars,
    1 + (referralStats.total > 0 ? 1 : 0)
  );

  const menuSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Edit Profile',
          href: '/app/edit-profile',
          color: 'text-blue-400',
        },
        {
          icon: Wallet,
          label: 'Wallet',
          href: '/app/wallet',
          color: 'text-emerald-400',
        },
        {
          icon: ShoppingBag,
          label: 'Marketplace',
          href: '/app/marketplace',
          color: 'text-purple-400',
        },
        {
          icon: Key,
          label: 'Purchased Keys',
          href: '/app/purchased-keys',
          color: 'text-amber-400',
        },
      ],
    },
    {
      title: 'Activity',
      items: [
        {
          icon: FileText,
          label: 'My Shares',
          href: '/app/my-shares',
          color: 'text-teal-400',
        },
        {
          icon: FileText,
          label: 'Transaction History',
          href: '/app/transaction-history',
          color: 'text-cyan-400',
        },
        {
          icon: Users,
          label: 'Referral Network',
          href: '/app/referral',
          color: 'text-pink-400',
        },
      ],
    },
    {
      title: 'More',
      items: [
        {
          icon: Share2,
          label: 'Share App',
          href: '/app/share-app',
          color: 'text-indigo-400',
        },
        {
          icon: HelpCircle,
          label: 'Help & Support',
          href: '/app/support',
          color: 'text-slate-400',
        },
        {
          icon: Shield,
          label: 'Privacy Policy',
          href: '/privacy',
          color: 'text-slate-400',
        },
        {
          icon: FileText,
          label: 'Terms of Service',
          href: '/terms',
          color: 'text-slate-400',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <AppHeader title="Profile" showBack={false} />

      <div className="max-w-md mx-auto px-4 pb-6">
        {/* Profile Header */}
        <div className="py-6">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6">
            <div className="flex items-center gap-4 mb-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center overflow-hidden">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center border-2 border-slate-900 transition-colors">
                  <Camera className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-100 mb-1">{user?.name}</h2>
                <p className="text-sm text-slate-400 mb-2">{user?.email}</p>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: totalStars }).map((_, index) => {
                    const isBright = index < brightStars;
                    return (
                      <Star
                        key={`referral-star-${index}`}
                        className={`w-4 h-4 ${isBright ? 'text-amber-400' : 'text-slate-600'}`}
                        fill={isBright ? 'currentColor' : 'none'}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                    <p className="text-xs font-semibold text-emerald-400">
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  {user?.keyTier && (
                    <div className="px-2.5 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center gap-1">
                      <Award className="w-3 h-3 text-purple-400" />
                      <p className="text-xs font-semibold text-purple-400">
                        {user.keyTier.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Balance</p>
                <CoinAmount amount={user?.balance || 0} size="sm" showIcon={false} />
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Withdrawn</p>
                <p className="text-sm font-bold text-slate-100">
                  ₹{user?.totalWithdrawn || 0}
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Referrals</p>
                <p className="text-sm font-bold text-slate-100">{referralStats.total}</p>
              </div>
            </div>

            {/* Activation Key */}
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">Activation Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {user?.activationKey}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Code Card */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300 mb-1">Your Referral Code</p>
                <p className="text-2xl font-bold text-purple-400">{user?.referralCode}</p>
              </div>
              <Link
                href="/app/share-app"
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors"
              >
                Share
              </Link>
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 px-2">
              {section.title}
            </h3>
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
              {section.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors ${
                      index !== section.items.length - 1 ? 'border-b border-slate-700/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900/50 rounded-xl flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className="text-slate-200 font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 mb-6"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>

        {/* App Version */}
        <p className="text-center text-xs text-slate-600">MyStatus v1.2.4</p>
      </div>
    </div>
  );
}
