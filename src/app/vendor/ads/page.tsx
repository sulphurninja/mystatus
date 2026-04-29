'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Ad {
  _id: string;
  title: string;
  description: string;
  image: string;
  rewardAmount: number;
  isActive: boolean;
  totalShares: number;
  totalVerifiedShares: number;
  totalRewardsPaid: number;
  createdAt: string;
  activatedAt?: string | null;
}

export default function VendorAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [adsRemaining, setAdsRemaining] = useState(0);
  const router = useRouter();

  useEffect(() => {
    loadAds();
    loadProfile();
  }, []);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadAds = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vendor/ads', { headers: { ...getAuthHeaders() } });
      if (res.ok) {
        const data = await res.json();
        setAds(data.ads || []);
      } else if (res.status === 401) {
        router.push('/vendor/login');
      }
    } catch (e) {
      console.error('Error loading ads:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/vendor/profile', { headers: { ...getAuthHeaders() } });
      if (res.ok) {
        const data = await res.json();
        setAdsRemaining(data.vendor?.adsRemaining || 0);
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  };

  const formatDateTime = (value?: string | null) =>
    value
      ? new Date(value).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })
      : 'Not active yet';

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-violet-400 to-purple-500 rounded-full"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            My Advertisements
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">
          Manage your ad campaigns &middot; {adsRemaining} ads remaining
        </p>
      </div>

      <div className="flex justify-end">
        {adsRemaining > 0 ? (
          <Link
            href="/vendor/ads/create"
            className="group relative bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Ad</span>
            </div>
          </Link>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-6 py-3 rounded-2xl text-sm font-medium">
            No ads remaining — Contact admin for a new package
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <div className="animate-pulse space-y-4">
                <div className="h-40 bg-slate-700 rounded-xl"></div>
                <div className="h-6 bg-slate-700 rounded-lg w-2/3"></div>
                <div className="h-4 bg-slate-700 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-100 mb-2">No Ads Yet</h3>
          <p className="text-slate-400 mb-6">Create your first advertisement to start reaching users</p>
          {adsRemaining > 0 && (
            <Link
              href="/vendor/ads/create"
              className="inline-block bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Create First Ad
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <div key={ad._id} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative">
                <img src={ad.image} alt={ad.title} className="w-full h-48 object-cover" />
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                    ad.isActive
                      ? 'bg-emerald-500/80 text-white'
                      : 'bg-red-500/80 text-white'
                  }`}>
                    {ad.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold text-slate-100">{ad.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-2">{ad.description}</p>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-400">₹{ad.rewardAmount}</p>
                    <p className="text-slate-500 text-xs">Reward</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-400">{ad.totalShares}</p>
                    <p className="text-slate-500 text-xs">Shares</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-violet-400">{ad.totalVerifiedShares}</p>
                    <p className="text-slate-500 text-xs">Verified</p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-700/20 p-3 space-y-1 text-xs">
                  <p className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Uploaded</span>
                    <span className="text-slate-300">{formatDateTime(ad.createdAt)}</span>
                  </p>
                  <p className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Fully Active</span>
                    <span className={ad.isActive ? 'text-emerald-300' : 'text-slate-400'}>{formatDateTime(ad.activatedAt)}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
