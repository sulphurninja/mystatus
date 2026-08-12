'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import EmptyState from '@/components/admin/EmptyState';

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
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={BarChart3} title="Analytics" description="Loading insights…" />
        <div className="admin-panel p-8 text-sm text-[var(--admin-muted)]">Loading…</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <PageHeader icon={BarChart3} title="Analytics" description="Comprehensive platform performance insights." />
        <EmptyState title="Unable to load analytics" description="Try refreshing the page." />
      </div>
    );
  }

  const avgReward =
    analytics.totalShares > 0
      ? (analytics.totalRevenue / analytics.totalShares).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        description="Comprehensive insights into platform performance."
        actions={
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="admin-select !w-auto"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        }
      />

      <StatStrip
        items={[
          {
            label: 'Total Users',
            value: analytics.totalUsers.toLocaleString(),
            hint: `+${analytics.monthlyGrowth.users}% growth`,
          },
          {
            label: 'Active Vendors',
            value: analytics.totalVendors.toLocaleString(),
            hint: `+${analytics.monthlyGrowth.vendors}% growth`,
          },
          {
            label: 'Total Shares',
            value: analytics.totalShares.toLocaleString(),
          },
          {
            label: 'Total Revenue',
            value: `₹${analytics.totalRevenue.toLocaleString()}`,
            hint: `+${analytics.monthlyGrowth.revenue}% growth`,
          },
        ]}
      />

      <StatStrip
        items={[
          { label: 'Live Ads', value: analytics.totalAdvertisements.toLocaleString() },
          { label: 'Avg Reward', value: `₹${avgReward}`, hint: 'Per share' },
          {
            label: 'Conversion Rate',
            value: '68.5%',
            hint: 'Shares → verifications',
          },
          { label: 'Platform Growth', value: '+24.7%', hint: 'Month over month' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <h2 className="admin-display text-lg font-semibold text-[var(--admin-text)]">
            Top performing vendors
          </h2>
          {analytics.topVendors.length === 0 ? (
            <EmptyState title="No vendor data" />
          ) : (
            <div className="admin-panel divide-y divide-[var(--admin-border)]">
              {analytics.topVendors.map((vendor, index) => (
                <div key={`${vendor.businessName}-${index}`} className="flex items-center justify-between gap-3 px-4 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-semibold tabular-nums text-[var(--admin-faint)] w-5">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--admin-text)] truncate">
                        {vendor.businessName}
                      </p>
                      <p className="text-sm text-[var(--admin-muted)] truncate">{vendor.name}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[var(--admin-text)]">
                      {vendor.totalShares} shares
                    </p>
                    <p className="text-sm text-emerald-300">₹{vendor.totalEarnings}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="admin-display text-lg font-semibold text-[var(--admin-text)]">
            Most shared advertisements
          </h2>
          {analytics.topAdvertisements.length === 0 ? (
            <EmptyState title="No advertisement data" />
          ) : (
            <div className="admin-panel divide-y divide-[var(--admin-border)]">
              {analytics.topAdvertisements.map((ad, index) => (
                <div key={`${ad.title}-${index}`} className="flex items-center justify-between gap-3 px-4 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-semibold tabular-nums text-[var(--admin-faint)] w-5">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--admin-text)] truncate">{ad.title}</p>
                      <p className="text-sm text-[var(--admin-muted)] truncate">{ad.vendor}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[var(--admin-text)]">{ad.shares} shares</p>
                    <p className="text-sm text-emerald-300">₹{ad.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
