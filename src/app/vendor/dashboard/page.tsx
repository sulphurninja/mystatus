'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface VendorData {
  _id: string;
  name: string;
  email: string;
  businessName: string;
  walletBalance: number;
  adsRemaining: number;
  totalAds: number;
  totalShares: number;
  totalEarnings: number;
}

interface Ad {
  _id: string;
  title: string;
  image: string;
  rewardAmount: number;
  isActive: boolean;
  totalShares: number;
  totalVerifiedShares: number;
  createdAt: string;
}

interface PackageHistory {
  _id: string;
  adsAllotted: number;
  adsUsed: number;
  price: number;
  status: string;
  createdAt: string;
  package: { name: string; price: number; adLimit: number } | null;
}

export default function VendorDashboard() {
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [recentAds, setRecentAds] = useState<Ad[]>([]);
  const [packageHistory, setPackageHistory] = useState<PackageHistory[]>([]);
  const [stats, setStats] = useState({ totalAds: 0, activeAds: 0, adsRemaining: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vendor/dashboard', {
        headers: { ...getAuthHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setVendor(data.data.vendor);
        setRecentAds(data.data.recentAds || []);
        setPackageHistory(data.data.packageHistory || []);
        setStats(data.data.stats);
      } else if (res.status === 401) {
        localStorage.removeItem('vendorToken');
        localStorage.removeItem('vendorData');
        router.push('/vendor/login');
      }
    } catch (e) {
      console.error('Error loading dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-800/50 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-violet-400 to-purple-500 rounded-full"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Welcome, {vendor?.name}
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">{vendor?.businessName}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 backdrop-blur-xl rounded-2xl p-6 border border-violet-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-100">{stats.adsRemaining}</p>
              <p className="text-slate-400 text-sm">Ads Remaining</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-100">{stats.totalAds}</p>
              <p className="text-slate-400 text-sm">Total Ads</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-100">{stats.activeAds}</p>
              <p className="text-slate-400 text-sm">Active Ads</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-100">₹{(vendor?.walletBalance || 0).toLocaleString()}</p>
              <p className="text-slate-400 text-sm">Wallet Balance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      {stats.adsRemaining > 0 && (
        <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Ready to create an ad?</h3>
            <p className="text-slate-400 text-sm">You have {stats.adsRemaining} ad{stats.adsRemaining > 1 ? 's' : ''} remaining in your package</p>
          </div>
          <Link
            href="/vendor/ads/create"
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap"
          >
            Create Ad
          </Link>
        </div>
      )}

      {stats.adsRemaining === 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-amber-300">No ads remaining</h3>
          <p className="text-slate-400 text-sm">Contact the admin to get a new package assigned to your account.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Ads */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-100">Recent Ads</h2>
              <Link href="/vendor/ads" className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
                View All &rarr;
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentAds.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No ads created yet</p>
            ) : (
              <div className="space-y-4">
                {recentAds.map((ad) => (
                  <div key={ad._id} className="flex items-center space-x-4 p-3 rounded-xl bg-slate-700/20 hover:bg-slate-700/30 transition-colors">
                    <img src={ad.image} alt={ad.title} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-100 font-medium truncate">{ad.title}</p>
                      <p className="text-slate-400 text-xs">₹{ad.rewardAmount} reward &middot; {ad.totalShares} shares</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      ad.isActive
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {ad.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Package History */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-slate-100">Package History</h2>
          </div>
          <div className="p-6">
            {packageHistory.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No packages assigned yet</p>
            ) : (
              <div className="space-y-4">
                {packageHistory.map((ph) => (
                  <div key={ph._id} className="p-4 rounded-xl bg-slate-700/20 border border-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-100 font-semibold">
                        {ph.package?.name || 'Package'}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        ph.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : ph.status === 'exhausted'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {ph.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-slate-400">₹{ph.price}</span>
                      <span className="text-slate-600">&middot;</span>
                      <span className="text-slate-400">{ph.adsUsed}/{ph.adsAllotted} ads used</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-700/50 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (ph.adsUsed / ph.adsAllotted) * 100)}%` }}
                      />
                    </div>
                    <p className="text-slate-500 text-xs mt-2">
                      {new Date(ph.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
