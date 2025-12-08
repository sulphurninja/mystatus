'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalAdvertisements: number;
  pendingVerifications: number;
  totalShares: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVendors: 0,
    totalAdvertisements: 0,
    pendingVerifications: 0,
    totalShares: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardStats();
    loadRecentActivity();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Fetch real data from API
      const token = localStorage.getItem('adminToken');
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const [usersRes, vendorsRes, adsRes, sharesRes] = await Promise.all([
        fetch('/api/admin/stats/users', { headers }),
        fetch('/api/admin/stats/vendors', { headers }),
        fetch('/api/admin/stats/advertisements', { headers }),
        fetch('/api/admin/stats/shares', { headers })
      ]);

      const users = usersRes.ok ? await usersRes.json() : { count: 0 };
      const vendors = vendorsRes.ok ? await vendorsRes.json() : { count: 0 };
      const ads = adsRes.ok ? await adsRes.json() : { count: 0 };
      const shares = sharesRes.ok ? await sharesRes.json() : { count: 0, pending: 0, revenue: 0 };

      setStats({
        totalUsers: users.count || 0,
        totalVendors: vendors.count || 0,
        totalAdvertisements: ads.count || 0,
        pendingVerifications: shares.pending || 0,
        totalShares: shares.count || 0,
        totalRevenue: shares.revenue || 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Set default values if API fails
      setStats({
        totalUsers: 0,
        totalVendors: 0,
        totalAdvertisements: 0,
        pendingVerifications: 0,
        totalShares: 0,
        totalRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/activity/recent', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities || []);
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: 'Users',
      gradient: 'from-blue-500 to-indigo-600',
      change: '+12%',
      changeType: 'increase',
      description: 'Active platform users'
    },
    {
      title: 'Active Vendors',
      value: stats.totalVendors.toString(),
      icon: 'Store',
      gradient: 'from-emerald-500 to-teal-600',
      change: '+3',
      changeType: 'increase',
      description: 'Verified business partners'
    },
    {
      title: 'Live Ads',
      value: stats.totalAdvertisements.toString(),
      icon: 'Megaphone',
      gradient: 'from-purple-500 to-pink-600',
      change: '+5',
      changeType: 'increase',
      description: 'Active advertisements'
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingVerifications.toString(),
      icon: 'Clock',
      gradient: 'from-amber-500 to-orange-600',
      change: stats.pendingVerifications > 10 ? 'High Priority' : 'Normal',
      changeType: stats.pendingVerifications > 10 ? 'warning' : 'normal',
      description: 'Awaiting verification'
    },
    {
      title: 'Total Shares',
      value: stats.totalShares.toLocaleString(),
      icon: 'Share2',
      gradient: 'from-cyan-500 to-blue-600',
      change: '+8.2%',
      changeType: 'increase',
      description: 'Advertisement shares'
    },
    {
      title: 'Revenue Generated',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: 'TrendingUp',
      gradient: 'from-green-500 to-emerald-600',
      change: '+15.3%',
      changeType: 'increase',
      description: 'Total platform earnings'
    }
  ];

  const quickActions = [
    {
      title: 'Add New Vendor',
      description: 'Onboard business partner',
      icon: 'Plus',
      href: '/admin/vendors',
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20'
    },
    {
      title: 'Generate Keys',
      description: 'Create activation codes',
      icon: 'Key',
      href: '/admin/activation-keys',
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20'
    },
    {
      title: 'Review Verifications',
      description: 'Approve pending shares',
      icon: 'CheckCircle',
      href: '/admin/verifications',
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
      badge: stats.pendingVerifications > 0 ? stats.pendingVerifications.toString() : null
    },
    {
      title: 'Platform Analytics',
      description: 'View detailed insights',
      icon: 'BarChart3',
      href: '/admin/analytics',
      gradient: 'from-purple-500 to-pink-600',
      shadow: 'shadow-purple-500/20'
    }
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-700 rounded-2xl w-80 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 bg-slate-700 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-700 rounded-2xl"></div>
              ))}
            </div>
            <div className="h-80 bg-slate-700 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">
          Monitor your platform's performance and take quick actions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1">
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>

            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon === 'Users' && (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  )}
                  {stat.icon === 'Store' && (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  )}
                  {stat.icon === 'Megaphone' && (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  )}
                  {stat.icon === 'Clock' && (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {stat.icon === 'Share2' && (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  )}
                  {stat.icon === 'TrendingUp' && (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-400 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-100 mb-1">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.description}</p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                stat.changeType === 'increase'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : stat.changeType === 'warning'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
              }`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-100">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 cursor-pointer overflow-hidden">
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>

                  <div className="relative flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${action.shadow}`}>
                      {action.icon === 'Plus' && (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                      {action.icon === 'Key' && (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      )}
                      {action.icon === 'CheckCircle' && (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {action.icon === 'BarChart3' && (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      )}
                    </div>
                    {action.badge && (
                      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                        {action.badge}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-white transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-100">Recent Activity</h2>
          </div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-slate-700/50">
                {recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="p-5 hover:bg-slate-700/20 transition-colors duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-sm">📱</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-100 truncate">{activity.title}</p>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{activity.description}</p>
                        <p className="text-xs text-slate-500 mt-2">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-slate-400 font-medium">No recent activity</p>
                <p className="text-slate-500 text-sm mt-1">Activity will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
