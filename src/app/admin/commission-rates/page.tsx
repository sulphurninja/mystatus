'use client';

import { useState, useEffect, useMemo } from 'react';
import { Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminPagination, paginateArray } from '@/hooks/useAdminPagination';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import StatusPill from '@/components/admin/StatusPill';

interface CommissionRate {
  level: number;
  referralBonus: number;
  levelBonus: number;
  keyPurchaseBonus: number;
  isActive: boolean;
}

export default function CommissionRatesPage() {
  const [rates, setRates] = useState<CommissionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const { toast } = useToast();
  const pagination = useAdminPagination(10);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '/admin/login';
      return;
    }
    loadRates();
  }, []);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadRates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/commission-rates', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await response.json();

      if (data.success) {
        setRates(data.data || []);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to load commission rates',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load commission rates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRate = (level: number, field: keyof CommissionRate, value: number | boolean) => {
    if (typeof value === 'number') {
      if (field === 'referralBonus' && value < 0) value = 0;
      if (field === 'referralBonus' && value > 5000) value = 5000;
      if ((field === 'levelBonus' || field === 'keyPurchaseBonus') && value < 0) value = 0;
      if ((field === 'levelBonus' || field === 'keyPurchaseBonus') && value > 100) value = 100;
    }

    setRates((prev) =>
      prev.map((rate) => (rate.level === level ? { ...rate, [field]: value } : rate))
    );
  };

  const saveRates = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/commission-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(rates),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Commission rates updated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to update commission rates',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update commission rates',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const initializeRates = async () => {
    try {
      setInitializing(true);
      const response = await fetch('/api/admin/commission-rates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (data.success) {
        await loadRates();
        toast({
          title: 'Success',
          description: 'Commission rates initialized successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to initialize commission rates',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to initialize commission rates',
        variant: 'destructive',
      });
    } finally {
      setInitializing(false);
    }
  };

  const resetToDefault = () => {
    const defaultRates: CommissionRate[] = [
      { level: 1, referralBonus: 500, levelBonus: 0, keyPurchaseBonus: 0, isActive: true },
      { level: 2, referralBonus: 300, levelBonus: 0, keyPurchaseBonus: 0, isActive: true },
      { level: 3, referralBonus: 200, levelBonus: 0, keyPurchaseBonus: 0, isActive: true },
      { level: 4, referralBonus: 100, levelBonus: 0, keyPurchaseBonus: 0, isActive: true },
      { level: 5, referralBonus: 50, levelBonus: 0, keyPurchaseBonus: 0, isActive: true },
      { level: 6, referralBonus: 50, levelBonus: 0, keyPurchaseBonus: 0, isActive: true },
    ];
    setRates(defaultRates);
    pagination.setPage(1);
  };

  const activeRates = rates.filter((r) => r.isActive);
  const totalCommission = activeRates.reduce((sum, r) => sum + r.referralBonus, 0);
  const avgCommission =
    activeRates.length > 0 ? Math.round(totalCommission / activeRates.length) : 0;

  const paged = useMemo(
    () => paginateArray(rates, pagination.page, pagination.limit),
    [rates, pagination.page, pagination.limit]
  );

  useEffect(() => {
    pagination.setFromResponse({
      page: paged.page,
      limit: paged.limit,
      total: paged.total,
      totalPages: paged.totalPages,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paged.page, paged.limit, paged.total, paged.totalPages]);

  const columns: DataTableColumn<CommissionRate>[] = [
    {
      key: 'level',
      header: 'Level',
      render: (rate) => <span className="font-medium">Level {rate.level}</span>,
    },
    {
      key: 'bonus',
      header: 'Commission Amount (₹)',
      render: (rate) => (
        <input
          type="number"
          value={rate.referralBonus}
          onChange={(e) =>
            updateRate(rate.level, 'referralBonus', parseFloat(e.target.value) || 0)
          }
          className="admin-input !max-w-[160px]"
          min={0}
          max={5000}
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (rate) => (
        <StatusPill tone={rate.isActive ? 'success' : 'neutral'}>
          {rate.isActive ? 'Active' : 'Inactive'}
        </StatusPill>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        icon={Percent}
        title="Commission Rates"
        description="Manage MLM commission rates for every network level."
        actions={
          <>
            {rates.length === 0 ? (
              <button
                type="button"
                onClick={initializeRates}
                disabled={initializing}
                className="admin-btn admin-btn-secondary"
              >
                {initializing ? 'Initializing…' : 'Initialize Rates'}
              </button>
            ) : null}
            <button type="button" onClick={resetToDefault} className="admin-btn admin-btn-secondary">
              Reset to Defaults
            </button>
            <button
              type="button"
              onClick={saveRates}
              disabled={saving || loading}
              className="admin-btn admin-btn-primary"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        }
      />

      <StatStrip
        items={[
          { label: 'Total Commission', value: `₹${totalCommission}` },
          { label: 'Active Levels', value: activeRates.length },
          {
            label: 'Range',
            value:
              activeRates.length > 0
                ? `₹${Math.min(...activeRates.map((r) => r.referralBonus))}–₹${Math.max(
                    ...activeRates.map((r) => r.referralBonus)
                  )}`
                : '—',
          },
          { label: 'Average Level', value: `₹${avgCommission}` },
        ]}
      />

      <DataTable
        columns={columns}
        rows={paged.items}
        rowKey={(row) => String(row.level)}
        loading={loading}
        emptyTitle="No commission rates"
        emptyDescription="Initialize default rates to get started."
        emptyAction={
          <button
            type="button"
            onClick={initializeRates}
            disabled={initializing}
            className="admin-btn admin-btn-primary"
          >
            {initializing ? 'Initializing…' : 'Initialize Rates'}
          </button>
        }
        footer={
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={pagination.setPage}
            onLimitChange={pagination.setLimit}
            limitOptions={[6, 10, 20]}
          />
        }
      />

      <div className="admin-panel p-5 space-y-3">
        <h3 className="admin-display text-base font-semibold">How commissions work</h3>
        <p className="text-sm text-[var(--admin-muted)]">
          Each active level earns a fixed amount when someone joins in their network. Configure flat
          amounts for up to 6 levels — no percentage math.
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {activeRates.map((rate) => (
            <div
              key={rate.level}
              className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel-elevated)] px-2 py-2 text-center"
            >
              <p className="text-[11px] text-[var(--admin-faint)]">L{rate.level}</p>
              <p className="text-sm font-semibold text-emerald-300 tabular-nums">
                ₹{rate.referralBonus}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
