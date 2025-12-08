'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalUsers: number;
  totalVendors: number;
  totalAdvertisements: number;
  totalShares: number;
  totalRevenue: number;
  monthlyGrowth: {
    users: number;
    vendors: number;
    revenue: number;
  };
  topVendors: Array<{
    name: string;
    businessName: string;
    totalShares: number;
    totalEarnings: number;
  }>;
  topAdvertisements: Array<{
    title: string;
    vendor: string;
    shares: number;
    revenue: number;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/analytics', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadingState = (
    <div className="p-6 lg:p-8">
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-64 bg-slate-800/50 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-2xl border border-slate-700/50" />
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) return loadingState;
  if (!analytics) return null;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
          </div>
          <p className="text-slate-400 text-lg font-medium">
            Comprehensive insights into platform performance
          </p>
        </div>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Users',
            value: analytics.totalUsers.toLocaleString(),
            delta: `+${analytics.monthlyGrowth.users}%`,
            color: 'from-blue-500 to-indigo-600',
            icon: (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            ),
            sub: 'Registered users'
          },
          {
            title: 'Active Vendors',
            value: analytics.totalVendors.toLocaleString(),
            delta: `+${analytics.monthlyGrowth.vendors}%`,
            color: 'from-emerald-500 to-teal-600',
            icon: (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            ),
            sub: 'Business partners'
          },
          {
            title: 'Total Shares',
            value: analytics.totalShares.toLocaleString(),
            delta: '+18.2%',
            color: 'from-purple-500 to-pink-600',
            icon: (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            ),
            sub: 'Advertisement shares'
          },
          {
            title: 'Total Revenue',
            value: `₹${analytics.totalRevenue.toLocaleString()}`,
            delta: `+${analytics.monthlyGrowth.revenue}%`,
            color: 'from-amber-500 to-orange-600',
            icon: (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            ),
            sub: 'Rewards paid'
          },
        ].map((card, idx) => (
          <div key={idx} className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1">
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
            <div className="relative flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                {card.icon}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-100">{card.value}</p>
                <p className="text-sm text-emerald-400">{card.delta}</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-100">{card.title}</h3>
            <p className="text-sm text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Vendors */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-slate-100">Top Performing Vendors</h2>
          </div>

          <div className="divide-y divide-slate-700/50">
            {analytics.topVendors.map((vendor, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4 text-white font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{vendor.businessName}</h3>
                    <p className="text-sm text-slate-400">{vendor.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-100">{vendor.totalShares} shares</p>
                  <p className="text-sm text-emerald-400">₹{vendor.totalEarnings}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Advertisements */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-slate-100">Most Shared Advertisements</h2>
          </div>

          <div className="divide-y divide-slate-700/50">
            {analytics.topAdvertisements.map((ad, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-4 text-white font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{ad.title}</h3>
                    <p className="text-sm text-slate-400">{ad.vendor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-100">{ad.shares} shares</p>
                  <p className="text-sm text-emerald-400">₹{ad.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Conversion Rate',
            value: '68.5%',
            color: 'from-blue-500 to-indigo-600',
            icon: (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
            sub: 'Shares → Verifications',
            progress: 68.5
          },
          {
            title: 'Average Reward',
            value: `₹${(analytics.totalRevenue / analytics.totalShares).toFixed(1)}`,
            color: 'from-emerald-500 to-teal-600',
            icon: (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            ),
            sub: 'Per successful share'
          },
          {
            title: 'Platform Growth',
            value: '+24.7%',
            color: 'from-purple-500 to-pink-600',
            icon: (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ),
            sub: 'Month over month'
          },
        ].map((card, idx) => (
          <div key={idx} className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1">
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  {card.icon}
                </div>
                {card.progress && (
                  <div className="text-right">
                    <div className="w-16 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${card.color} transition-all duration-1000`}
                        style={{ width: `${card.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">{card.title}</h3>
              <div className="text-3xl font-bold text-slate-100 mb-1">{card.value}</div>
              <p className="text-sm text-slate-400">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
