'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import FilterBar from '@/components/admin/FilterBar';
import AdminModal from '@/components/admin/AdminModal';
import StatusPill from '@/components/admin/StatusPill';
import { useAdminPagination } from '@/hooks/useAdminPagination';

type FranchiseKeyItem = {
  _id: string;
  key: string;
  price: number;
  isUsed: boolean;
  isForSale: boolean;
  payoutPlan?: {
    id: string;
    isActive: boolean;
    lastPaidAt?: string;
    startDate?: string;
  } | null;
  usedBy?: { name: string; email: string } | null;
  purchasedBy?: { name: string; email: string } | null;
  createdAt?: string;
};

export default function FranchiseKeysPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keys, setKeys] = useState<FranchiseKeyItem[]>([]);
  const [count, setCount] = useState(10);
  const [price, setPrice] = useState(10000);
  const [isForSale, setIsForSale] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [message, setMessage] = useState('');
  const pagination = useAdminPagination(25);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    loadKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadKeys = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      const res = await fetch(`/api/admin/franchise-keys?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (data.success) {
        setKeys(data.keys || []);
        pagination.setFromResponse(data.pagination || {});
      } else {
        setKeys([]);
        setMessage(data.message || 'Failed to load franchise keys');
      }
    } catch {
      setKeys([]);
      setMessage('Failed to load franchise keys');
    } finally {
      setLoading(false);
    }
  };

  const generateKeys = async () => {
    try {
      setSaving(true);
      setMessage('');
      const res = await fetch('/api/admin/franchise-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ count, price, isForSale }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(data.message || 'Franchise keys generated');
        setShowGenerateModal(false);
        await loadKeys();
      } else {
        setMessage(data.message || 'Failed to generate keys');
      }
    } catch {
      setMessage('Failed to generate keys');
    } finally {
      setSaving(false);
    }
  };

  const togglePlan = async (planId: string) => {
    try {
      const res = await fetch(`/api/admin/franchise-plans/${planId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to toggle plan');
      }
      await loadKeys();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to toggle payout plan';
      setMessage(msg);
    }
  };

  const displayedKeys = showActiveOnly ? keys.filter((item) => item.isUsed) : keys;

  const columns: DataTableColumn<FranchiseKeyItem>[] = [
      {
        key: 'key',
        header: 'Key',
        render: (row) => (
          <code className="text-xs font-mono text-[var(--admin-muted)]">{row.key}</code>
        ),
      },
      {
        key: 'price',
        header: 'Price',
        render: (row) => (
          <span className="tabular-nums">₹{Number(row.price || 0).toFixed(2)}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <div className="space-y-1">
            <StatusPill tone={row.isUsed ? 'success' : 'neutral'}>
              {row.isUsed ? 'Used' : 'Unused'}
            </StatusPill>
            <div>
              <StatusPill tone={row.isForSale ? 'warning' : 'neutral'}>
                {row.isForSale ? 'For sale' : 'Not for sale'}
              </StatusPill>
            </div>
          </div>
        ),
      },
      {
        key: 'usedBy',
        header: 'Used by',
        render: (row) =>
          row.usedBy ? (
            <div>
              <p className="font-medium">{row.usedBy.name}</p>
              <p className="text-xs text-[var(--admin-muted)]">{row.usedBy.email}</p>
            </div>
          ) : (
            <span className="text-[var(--admin-faint)]">—</span>
          ),
      },
      {
        key: 'payout',
        header: 'Payout',
        render: (row) =>
          row.payoutPlan ? (
            <StatusPill tone={row.payoutPlan.isActive ? 'success' : 'danger'}>
              {row.payoutPlan.isActive ? 'Active' : 'Paused'}
            </StatusPill>
          ) : (
            <span className="text-[var(--admin-faint)]">—</span>
          ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) =>
          row.payoutPlan ? (
            <button
              type="button"
              onClick={() => togglePlan(row.payoutPlan!.id)}
              className="admin-btn admin-btn-secondary !py-1.5 !px-3"
            >
              {row.payoutPlan.isActive ? 'Pause' : 'Resume'}
            </button>
          ) : (
            <span className="text-xs text-[var(--admin-faint)]">—</span>
          ),
      },
    ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Key}
        title="Franchise keys"
        description="Generate and manage franchise keys for recurring payouts"
        actions={
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="admin-btn admin-btn-primary"
          >
            Generate keys
          </button>
        }
      />

      {message ? (
        <div className="admin-panel px-4 py-3 text-sm">{message}</div>
      ) : null}

      <StatStrip
        items={[
          { label: 'Total keys', value: pagination.total },
          {
            label: 'Used (page)',
            value: keys.filter((k) => k.isUsed).length,
            hint: 'Current page',
          },
          {
            label: 'For sale (page)',
            value: keys.filter((k) => k.isForSale && !k.isUsed).length,
            hint: 'Current page',
          },
          { label: 'Showing', value: displayedKeys.length },
        ]}
      />

      <FilterBar>
        <button
          type="button"
          className={`admin-btn ${showActiveOnly ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setShowActiveOnly((v) => !v)}
        >
          {showActiveOnly ? 'Show all on page' : 'Active only (page)'}
        </button>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={displayedKeys}
        rowKey={(k) => k._id}
        loading={loading}
        emptyTitle="No franchise keys"
        emptyDescription={
          showActiveOnly
            ? 'No used keys on this page'
            : 'Generate franchise keys to get started'
        }
        emptyAction={
          !showActiveOnly ? (
            <button
              type="button"
              onClick={() => setShowGenerateModal(true)}
              className="admin-btn admin-btn-primary"
            >
              Generate keys
            </button>
          ) : undefined
        }
        footer={
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={pagination.setPage}
            onLimitChange={pagination.setLimit}
            limitOptions={[10, 25, 50]}
          />
        }
      />

      <AdminModal
        open={showGenerateModal}
        title="Generate franchise keys"
        onClose={() => setShowGenerateModal(false)}
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setShowGenerateModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={saving}
              onClick={generateKeys}
            >
              {saving ? 'Generating…' : 'Generate keys'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="admin-label">Count</label>
            <input
              type="number"
              min={1}
              max={100}
              className="admin-input"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div>
            <label className="admin-label">Price (INR)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="admin-input"
              value={price}
              onChange={(e) => {
                const next = parseFloat(e.target.value);
                setPrice(Number.isFinite(next) ? next : 0);
              }}
            />
          </div>
          <div>
            <label className="admin-label">For sale</label>
            <select
              className="admin-input"
              value={isForSale ? 'yes' : 'no'}
              onChange={(e) => setIsForSale(e.target.value === 'yes')}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
