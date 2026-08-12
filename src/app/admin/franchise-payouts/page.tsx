'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminPagination } from '@/hooks/useAdminPagination';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import FilterBar from '@/components/admin/FilterBar';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import StatusPill from '@/components/admin/StatusPill';

type PayoutRun = {
  _id: string;
  payoutDate: string;
  status: string;
  totalPaid: number;
  totalRecipients: number;
  createdAt: string;
};

type DailyPayout = {
  _id: string;
  payoutDate: string;
  amount: number;
  level: number;
  paidTo?: { name: string; email: string; referralCode?: string };
  referredUser?: { name: string; email: string; referralCode?: string };
  franchiseKey?: { key: string; price: number };
};

function runTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  const s = status.toLowerCase();
  if (s === 'completed') return 'success';
  if (s === 'running' || s === 'pending') return 'warning';
  if (s === 'failed') return 'danger';
  return 'neutral';
}

export default function FranchisePayoutsPage() {
  const { toast } = useToast();
  const [runs, setRuns] = useState<PayoutRun[]>([]);
  const [payouts, setPayouts] = useState<DailyPayout[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [running, setRunning] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const runsPager = useAdminPagination(20);
  const payoutsPager = useAdminPagination(20);

  const formatInr = (value: unknown) => {
    const n = typeof value === 'number' ? value : Number(value);
    return (Number.isFinite(n) ? n : 0).toFixed(2);
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '/admin/login';
    }
  }, []);

  useEffect(() => {
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, runsPager.page, runsPager.limit]);

  useEffect(() => {
    loadPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, payoutsPager.page, payoutsPager.limit]);

  const loadRuns = async () => {
    try {
      setLoadingRuns(true);
      const params = new URLSearchParams({
        date,
        page: String(runsPager.page),
        limit: String(runsPager.limit),
      });
      const res = await fetch(`/api/admin/franchise-payouts?${params.toString()}`, {
        headers: { ...getAuthHeaders() },
      });
      const data = await res.json();
      if (data.success) {
        setRuns(data.data || []);
        runsPager.setFromResponse(data.pagination || {});
      } else {
        setRuns([]);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load payout runs',
        variant: 'destructive',
      });
      setRuns([]);
    } finally {
      setLoadingRuns(false);
    }
  };

  const loadPayouts = async () => {
    try {
      setLoadingPayouts(true);
      const params = new URLSearchParams({
        date,
        payouts: 'true',
        page: String(payoutsPager.page),
        limit: String(payoutsPager.limit),
      });
      const res = await fetch(`/api/admin/franchise-payouts?${params.toString()}`, {
        headers: { ...getAuthHeaders() },
      });
      const data = await res.json();
      if (data.success) {
        setPayouts(data.data || []);
        payoutsPager.setFromResponse(data.pagination || {});
      } else {
        setPayouts([]);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load daily payouts',
        variant: 'destructive',
      });
      setPayouts([]);
    } finally {
      setLoadingPayouts(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadRuns(), loadPayouts()]);
  };

  const runPayouts = async () => {
    try {
      setRunning(true);
      const res = await fetch('/api/admin/franchise-payouts/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ date }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to run payouts');
      }
      toast({
        title: 'Success',
        description: 'Franchise payouts processed',
      });
      runsPager.setPage(1);
      payoutsPager.setPage(1);
      await refreshAll();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to run payouts',
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  };

  const pagePaid = payouts.reduce((sum, payout) => sum + (payout.amount || 0), 0);
  const completedOnPage = runs.filter((run) => run.status === 'completed').length;

  const runColumns: DataTableColumn<PayoutRun>[] = [
    {
      key: 'date',
      header: 'Payout Date',
      render: (run) => (
        <span className="font-medium tabular-nums">
          {new Date(run.payoutDate).toISOString().slice(0, 10)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (run) => <StatusPill tone={runTone(run.status)}>{run.status}</StatusPill>,
    },
    {
      key: 'paid',
      header: 'Total Paid',
      render: (run) => (
        <span className="tabular-nums text-emerald-300">INR {formatInr(run.totalPaid)}</span>
      ),
    },
    {
      key: 'recipients',
      header: 'Recipients',
      render: (run) => <span className="tabular-nums">{run.totalRecipients || 0}</span>,
    },
  ];

  const payoutColumns: DataTableColumn<DailyPayout>[] = [
    {
      key: 'recipient',
      header: 'Recipient',
      render: (payout) => (
        <div>
          <p className="font-medium">{payout.paidTo?.name || 'User'}</p>
          <p className="text-xs text-[var(--admin-muted)]">Level {payout.level}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (payout) => (
        <span className="font-semibold tabular-nums text-emerald-300">
          INR {formatInr(payout.amount)}
        </span>
      ),
    },
    {
      key: 'referred',
      header: 'Referred User',
      render: (payout) => (
        <span className="text-sm text-[var(--admin-muted)]">
          {payout.referredUser?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'key',
      header: 'Franchise Key',
      render: (payout) => (
        <code className="text-xs text-[var(--admin-muted)]">
          {payout.franchiseKey?.key || 'N/A'}
        </code>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <PageHeader
        icon={TrendingUp}
        title="Franchise Payouts"
        description="Run daily recurring payouts and review payout history."
        actions={
          <>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={refreshAll}>
              Refresh
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={running}
              onClick={runPayouts}
            >
              {running ? 'Running…' : 'Run Payouts'}
            </button>
          </>
        }
      />

      <div className="admin-panel p-4">
        <FilterBar>
          <div className="flex flex-wrap items-center gap-3">
            <label className="admin-label !mb-0" htmlFor="payoutDate">
              Payout date
            </label>
            <input
              id="payoutDate"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                runsPager.setPage(1);
                payoutsPager.setPage(1);
              }}
              className="admin-input !w-auto"
            />
          </div>
        </FilterBar>
      </div>

      <StatStrip
        items={[
          { label: 'Paid (page)', value: `INR ${formatInr(pagePaid)}` },
          { label: 'Payout rows', value: payoutsPager.total },
          { label: 'Runs', value: runsPager.total },
          { label: 'Completed (page)', value: completedOnPage },
        ]}
      />

      <div className="space-y-3">
        <h2 className="admin-display text-lg font-semibold text-[var(--admin-text)]">Payout Runs</h2>
        <DataTable
          columns={runColumns}
          rows={runs}
          rowKey={(row) => row._id}
          loading={loadingRuns}
          emptyTitle="No payout runs"
          emptyDescription="No runs recorded for this date."
          footer={
            <Pagination
              page={runsPager.page}
              totalPages={runsPager.totalPages}
              total={runsPager.total}
              limit={runsPager.limit}
              onPageChange={runsPager.setPage}
              onLimitChange={runsPager.setLimit}
            />
          }
        />
      </div>

      <div className="space-y-3">
        <h2 className="admin-display text-lg font-semibold text-[var(--admin-text)]">Daily Payouts</h2>
        <DataTable
          columns={payoutColumns}
          rows={payouts}
          rowKey={(row) => row._id}
          loading={loadingPayouts}
          emptyTitle="No daily payouts"
          emptyDescription="No payouts found for this date."
          footer={
            <Pagination
              page={payoutsPager.page}
              totalPages={payoutsPager.totalPages}
              total={payoutsPager.total}
              limit={payoutsPager.limit}
              onPageChange={payoutsPager.setPage}
              onLimitChange={payoutsPager.setLimit}
            />
          }
        />
      </div>
    </div>
  );
}
