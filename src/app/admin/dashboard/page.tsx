'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Store,
  Megaphone,
  BadgeCheck,
  Share2,
  CircleDollarSign,
  KeyRound,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import EmptyState from '@/components/admin/EmptyState';
import StatusPill from '@/components/admin/StatusPill';

interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalAdvertisements: number;
  pendingVerifications: number;
  totalShares: number;
  totalRevenue: number;
}

type ActivityItem = {
  title?: string;
  description?: string;
  time?: string;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVendors: 0,
    totalAdvertisements: 0,
    pendingVerifications: 0,
    totalShares: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    loadDashboardStats();
    loadRecentActivity();
  }, []);

  const authHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadDashboardStats = async () => {
    try {
      const headers = authHeaders();
      const [usersRes, vendorsRes, adsRes, sharesRes] = await Promise.all([
        fetch('/api/admin/stats/users', { headers }),
        fetch('/api/admin/stats/vendors', { headers }),
        fetch('/api/admin/stats/advertisements', { headers }),
        fetch('/api/admin/stats/shares', { headers }),
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
        totalRevenue: shares.revenue || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setStats({
        totalUsers: 0,
        totalVendors: 0,
        totalAdvertisements: 0,
        pendingVerifications: 0,
        totalShares: 0,
        totalRevenue: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/activity/recent', {
        headers: authHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities || []);
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const quickActions = [
    {
      title: 'Add New Vendor',
      description: 'Onboard a business partner',
      href: '/admin/vendors',
      icon: Store,
    },
    {
      title: 'Generate Keys',
      description: 'Create activation codes',
      href: '/admin/activation-keys',
      icon: KeyRound,
    },
    {
      title: 'Open Verification Panel',
      description: 'Review pending shares',
      href: '/verification',
      icon: ShieldCheck,
      badge: stats.pendingVerifications > 0 ? String(stats.pendingVerifications) : null,
    },
    {
      title: 'Platform Analytics',
      description: 'View detailed insights',
      href: '/admin/analytics',
      icon: BarChart3,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={LayoutDashboard} title="Dashboard" description="Loading platform overview…" />
        <div className="admin-panel p-8 text-sm text-[var(--admin-muted)]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Monitor platform performance and jump into common admin tasks."
      />

      <StatStrip
        items={[
          { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users },
          { label: 'Active Vendors', value: stats.totalVendors.toLocaleString(), icon: Store },
          { label: 'Live Ads', value: stats.totalAdvertisements.toLocaleString(), icon: Megaphone },
          {
            label: 'Pending Reviews',
            value: stats.pendingVerifications.toLocaleString(),
            hint: stats.pendingVerifications > 10 ? 'Needs attention' : 'Awaiting verification',
            icon: BadgeCheck,
          },
          { label: 'Total Shares', value: stats.totalShares.toLocaleString(), icon: Share2 },
          {
            label: 'Revenue',
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            hint: 'Platform earnings',
            icon: CircleDollarSign,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="admin-display text-lg font-semibold text-[var(--admin-text)]">Quick actions</h2>
          <div className="admin-panel divide-y divide-[var(--admin-border)]">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--admin-text)]">{action.title}</p>
                      <p className="text-sm text-[var(--admin-muted)]">{action.description}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {action.badge ? <StatusPill tone="warning">{action.badge}</StatusPill> : null}
                    <span className="text-sm text-[var(--admin-faint)]">Open →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="admin-display text-lg font-semibold text-[var(--admin-text)]">Recent activity</h2>
          {recentActivity.length === 0 ? (
            <EmptyState title="No recent activity" description="New activity will show up here." />
          ) : (
            <div className="admin-panel divide-y divide-[var(--admin-border)]">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="px-4 py-4">
                  <p className="truncate text-sm font-semibold text-[var(--admin-text)]">
                    {activity.title || 'Activity'}
                  </p>
                  {activity.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--admin-muted)]">
                      {activity.description}
                    </p>
                  ) : null}
                  {activity.time ? (
                    <p className="mt-2 text-xs text-[var(--admin-faint)]">{activity.time}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
