'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BadgePercent } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import AdminModal from '@/components/admin/AdminModal';
import StatusPill from '@/components/admin/StatusPill';
import { useAdminPagination, paginateArray } from '@/hooks/useAdminPagination';

interface ProductKeyTier {
  _id?: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  commissions: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
    level6: number;
  };
  recurringDirect: {
    amount: number;
    type: 'amount' | 'percent';
  };
  isActive: boolean;
}

const emptyTier: ProductKeyTier = {
  name: '',
  minPrice: 0,
  maxPrice: 0,
  commissions: {
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    level5: 0,
    level6: 0,
  },
  recurringDirect: {
    amount: 0,
    type: 'amount',
  },
  isActive: true,
};

export default function ProductKeysPage() {
  const router = useRouter();
  const [tiers, setTiers] = useState<ProductKeyTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [message, setMessage] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<ProductKeyTier | null>(null);
  const pagination = useAdminPagination(10);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    loadTiers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadTiers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/product-keys', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await response.json();

      if (data.success) {
        setTiers(data.data || []);
      } else {
        setMessage(data.message || 'Failed to load product key tiers');
      }
    } catch {
      setMessage('Failed to load product key tiers');
    } finally {
      setLoading(false);
    }
  };

  const pageSlice = useMemo(
    () => paginateArray(tiers, pagination.page, pagination.limit),
    [tiers, pagination.page, pagination.limit]
  );

  const saveTiers = async (nextTiers: ProductKeyTier[]) => {
    for (const tier of nextTiers) {
      if (!tier.name.trim()) {
        setMessage('All tiers must have a name');
        return false;
      }
      if (tier.minPrice > tier.maxPrice) {
        setMessage(`Invalid price range for "${tier.name}"`);
        return false;
      }
    }

    try {
      setSaving(true);
      setMessage('');
      const response = await fetch('/api/admin/product-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(nextTiers),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Product key tiers saved successfully');
        await loadTiers();
        return true;
      }
      setMessage(data.message || 'Failed to save product key tiers');
      return false;
    } catch {
      setMessage('Failed to save product key tiers');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const initializeTiers = async () => {
    try {
      setInitializing(true);
      const response = await fetch('/api/admin/product-keys', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (data.success) {
        await loadTiers();
        setMessage('Default product key tiers initialized');
      } else {
        setMessage(data.message || 'Failed to initialize tiers');
      }
    } catch {
      setMessage('Failed to initialize tiers');
    } finally {
      setInitializing(false);
    }
  };

  const openAdd = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMinPrice = lastTier ? lastTier.maxPrice + 1 : 0;
    setEditIndex(null);
    setDraft({
      ...emptyTier,
      name: `Tier ${tiers.length + 1}`,
      minPrice: newMinPrice,
      maxPrice: newMinPrice + 10000,
    });
  };

  const openEdit = (absoluteIndex: number) => {
    setEditIndex(absoluteIndex);
    setDraft({ ...tiers[absoluteIndex], commissions: { ...tiers[absoluteIndex].commissions }, recurringDirect: { ...tiers[absoluteIndex].recurringDirect } });
  };

  const removeTier = async (absoluteIndex: number) => {
    if (!confirm('Remove this tier?')) return;
    const next = tiers.filter((_, i) => i !== absoluteIndex);
    setTiers(next);
    await saveTiers(next);
  };

  const persistDraft = async () => {
    if (!draft) return;
    const next = [...tiers];
    if (editIndex === null) {
      next.push(draft);
    } else {
      next[editIndex] = draft;
    }
    const ok = await saveTiers(next);
    if (ok) {
      setDraft(null);
      setEditIndex(null);
    }
  };

  const resetToDefaults = async () => {
    const defaults: ProductKeyTier[] = [
      {
        name: 'Standard',
        minPrice: 0,
        maxPrice: 5000,
        commissions: { level1: 500, level2: 300, level3: 200, level4: 100, level5: 50, level6: 50 },
        recurringDirect: { amount: 0, type: 'amount' },
        isActive: true,
      },
      {
        name: 'Premium',
        minPrice: 5001,
        maxPrice: 15000,
        commissions: { level1: 1500, level2: 900, level3: 600, level4: 300, level5: 150, level6: 150 },
        recurringDirect: { amount: 0, type: 'amount' },
        isActive: true,
      },
      {
        name: 'VIP',
        minPrice: 15001,
        maxPrice: 50000,
        commissions: { level1: 5000, level2: 3000, level3: 2000, level4: 1000, level5: 500, level6: 500 },
        recurringDirect: { amount: 0, type: 'amount' },
        isActive: true,
      },
    ];
    setTiers(defaults);
    await saveTiers(defaults);
  };

  const updateDraft = (field: string, value: unknown) => {
    if (!draft) return;
    if (field.startsWith('commissions.')) {
      const level = field.split('.')[1];
      setDraft({
        ...draft,
        commissions: {
          ...draft.commissions,
          [level]: Math.max(0, value as number),
        },
      });
      return;
    }
    if (field.startsWith('recurringDirect.')) {
      const key = field.split('.')[1] as 'amount' | 'type';
      setDraft({
        ...draft,
        recurringDirect: {
          ...draft.recurringDirect,
          [key]: key === 'amount' ? Math.max(0, value as number) : value,
        },
      });
      return;
    }
    setDraft({ ...draft, [field]: value });
  };

  const columns: DataTableColumn<ProductKeyTier & { __index: number }>[] = [
      {
        key: 'name',
        header: 'Tier',
        render: (row) => (
          <div>
            <p className="font-semibold">{row.name}</p>
            <StatusPill tone={row.isActive ? 'success' : 'neutral'}>
              {row.isActive ? 'Active' : 'Inactive'}
            </StatusPill>
          </div>
        ),
      },
      {
        key: 'range',
        header: 'Price range',
        render: (row) => (
          <span className="tabular-nums">
            ₹{row.minPrice} – ₹{row.maxPrice}
          </span>
        ),
      },
      {
        key: 'total',
        header: 'One-time total',
        render: (row) => (
          <span className="tabular-nums text-emerald-300">
            ₹{Object.values(row.commissions).reduce((sum, v) => sum + v, 0)}
          </span>
        ),
      },
      {
        key: 'recurring',
        header: 'Recurring',
        render: (row) => (
          <span className="tabular-nums">
            {row.recurringDirect.amount}
            {row.recurringDirect.type === 'percent' ? '%' : ' INR'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="admin-btn admin-btn-secondary !py-1.5 !px-3"
              onClick={() => openEdit(row.__index)}
            >
              Edit
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-danger !py-1.5 !px-3"
              onClick={() => removeTier(row.__index)}
            >
              Remove
            </button>
          </div>
        ),
      },
    ];

  const rows = pageSlice.items.map((tier, i) => ({
    ...tier,
    __index: pagination.offset + i,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BadgePercent}
        title="Product keys"
        description="Configure one-time (6 levels) and recurring direct commissions"
        actions={
          <div className="flex flex-wrap gap-2">
            {tiers.length === 0 ? (
              <button
                type="button"
                onClick={initializeTiers}
                disabled={initializing}
                className="admin-btn admin-btn-secondary"
              >
                {initializing ? 'Initializing…' : 'Initialize defaults'}
              </button>
            ) : null}
            <button type="button" onClick={resetToDefaults} className="admin-btn admin-btn-ghost">
              Reset defaults
            </button>
            <button type="button" onClick={openAdd} className="admin-btn admin-btn-primary">
              Add tier
            </button>
          </div>
        }
      />

      {message ? <div className="admin-panel px-4 py-3 text-sm">{message}</div> : null}

      <StatStrip
        items={[
          { label: 'Tiers', value: tiers.length },
          { label: 'Active', value: tiers.filter((t) => t.isActive).length },
          {
            label: 'Price span',
            value:
              tiers.length > 0
                ? `₹${Math.min(...tiers.map((t) => t.minPrice))}–₹${Math.max(...tiers.map((t) => t.maxPrice))}`
                : '—',
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r._id || `${r.name}-${r.__index}`}
        loading={loading}
        emptyTitle="No product key tiers"
        emptyDescription="Initialize defaults or add a tier to get started"
        emptyAction={
          <button type="button" onClick={openAdd} className="admin-btn admin-btn-primary">
            Add tier
          </button>
        }
        footer={
          <Pagination
            page={pageSlice.page}
            totalPages={pageSlice.totalPages}
            total={pageSlice.total}
            limit={pagination.limit}
            onPageChange={pagination.setPage}
            onLimitChange={pagination.setLimit}
            limitOptions={[5, 10, 20]}
          />
        }
      />

      <AdminModal
        open={!!draft}
        title={editIndex === null ? 'Add product key tier' : 'Edit product key tier'}
        onClose={() => {
          setDraft(null);
          setEditIndex(null);
        }}
        wide
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                setDraft(null);
                setEditIndex(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={saving}
              onClick={persistDraft}
            >
              {saving ? 'Saving…' : 'Save tier'}
            </button>
          </>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="admin-label">Name</label>
                <input
                  className="admin-input"
                  value={draft.name}
                  onChange={(e) => updateDraft('name', e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 mt-6 text-sm">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => updateDraft('isActive', e.target.checked)}
                />
                Active
              </label>
              <div>
                <label className="admin-label">Min price (INR)</label>
                <input
                  type="number"
                  min={0}
                  className="admin-input"
                  value={draft.minPrice}
                  onChange={(e) => updateDraft('minPrice', parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <div>
                <label className="admin-label">Max price (INR)</label>
                <input
                  type="number"
                  min={0}
                  className="admin-input"
                  value={draft.maxPrice}
                  onChange={(e) => updateDraft('maxPrice', parseInt(e.target.value, 10) || 0)}
                />
              </div>
            </div>

            <div>
              <p className="admin-label">One-time commission (6 levels)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <div key={level}>
                    <label className="admin-label">Level {level}</label>
                    <input
                      type="number"
                      min={0}
                      className="admin-input"
                      value={draft.commissions[`level${level}` as keyof typeof draft.commissions]}
                      onChange={(e) =>
                        updateDraft(`commissions.level${level}`, parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="admin-label">Recurring amount</label>
                <input
                  type="number"
                  min={0}
                  className="admin-input"
                  value={draft.recurringDirect.amount}
                  onChange={(e) =>
                    updateDraft('recurringDirect.amount', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <label className="admin-label">Recurring type</label>
                <select
                  className="admin-input"
                  value={draft.recurringDirect.type}
                  onChange={(e) =>
                    updateDraft('recurringDirect.type', e.target.value as 'amount' | 'percent')
                  }
                >
                  <option value="amount">Amount</option>
                  <option value="percent">Percent</option>
                </select>
              </div>
            </div>
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}
