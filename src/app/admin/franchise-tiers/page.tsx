'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import AdminModal from '@/components/admin/AdminModal';
import StatusPill from '@/components/admin/StatusPill';
import { useAdminPagination, paginateArray } from '@/hooks/useAdminPagination';

interface FranchiseTier {
  _id?: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  dailyCommissions: Record<string, number>;
  isActive: boolean;
}

const levelKeys = Array.from({ length: 30 }, (_, i) => `level${i + 1}`);

const buildEmptyDailyCommissions = () =>
  levelKeys.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as Record<string, number>);

const emptyTier: FranchiseTier = {
  name: '',
  minPrice: 0,
  maxPrice: 0,
  dailyCommissions: buildEmptyDailyCommissions(),
  isActive: true,
};

export default function FranchiseTiersPage() {
  const router = useRouter();
  const [tiers, setTiers] = useState<FranchiseTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [message, setMessage] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<FranchiseTier | null>(null);
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
      const response = await fetch('/api/admin/franchise-tiers', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await response.json();

      if (data.success) {
        const normalized = (data.data || []).map((tier: FranchiseTier) => ({
          ...tier,
          dailyCommissions: {
            ...buildEmptyDailyCommissions(),
            ...tier.dailyCommissions,
          },
        }));
        setTiers(normalized);
      } else {
        setMessage(data.message || 'Failed to load franchise tiers');
      }
    } catch {
      setMessage('Failed to load franchise tiers');
    } finally {
      setLoading(false);
    }
  };

  const pageSlice = useMemo(
    () => paginateArray(tiers, pagination.page, pagination.limit),
    [tiers, pagination.page, pagination.limit]
  );

  const saveTiers = async (nextTiers: FranchiseTier[]) => {
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
      const response = await fetch('/api/admin/franchise-tiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(nextTiers),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Franchise tiers saved successfully');
        await loadTiers();
        return true;
      }
      setMessage(data.message || 'Failed to save franchise tiers');
      return false;
    } catch {
      setMessage('Failed to save franchise tiers');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const initializeTiers = async () => {
    try {
      setInitializing(true);
      const response = await fetch('/api/admin/franchise-tiers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (data.success) {
        await loadTiers();
        setMessage('Default franchise tiers initialized');
      } else {
        setMessage(data.message || 'Failed to initialize tiers');
      }
    } catch {
      setMessage('Failed to initialize tiers');
    } finally {
      setInitializing(false);
    }
  };

  const clearTiers = async () => {
    if (!confirm('Delete all franchise tiers?')) return;
    try {
      setInitializing(true);
      const response = await fetch('/api/admin/franchise-tiers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (data.success) {
        setTiers([]);
        setMessage('Franchise tiers deleted');
      } else {
        setMessage(data.message || 'Failed to delete tiers');
      }
    } catch {
      setMessage('Failed to delete tiers');
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
      dailyCommissions: buildEmptyDailyCommissions(),
    });
  };

  const openEdit = (absoluteIndex: number) => {
    setEditIndex(absoluteIndex);
    setDraft({
      ...tiers[absoluteIndex],
      dailyCommissions: { ...tiers[absoluteIndex].dailyCommissions },
    });
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
    if (editIndex === null) next.push(draft);
    else next[editIndex] = draft;
    const ok = await saveTiers(next);
    if (ok) {
      setDraft(null);
      setEditIndex(null);
    }
  };

  const updateDraft = (field: string, value: unknown) => {
    if (!draft) return;
    if (field.startsWith('dailyCommissions.')) {
      const level = field.split('.')[1];
      setDraft({
        ...draft,
        dailyCommissions: {
          ...draft.dailyCommissions,
          [level]: Math.max(0, value as number),
        },
      });
      return;
    }
    setDraft({ ...draft, [field]: value });
  };

  const columns: DataTableColumn<FranchiseTier & { __index: number }>[] = [
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
        header: 'Daily total',
        render: (row) => (
          <span className="tabular-nums text-emerald-300">
            ₹
            {Object.values(row.dailyCommissions)
              .reduce((sum, val) => sum + (val || 0), 0)
              .toFixed(2)}
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
        icon={Layers}
        title="Franchise tiers"
        description="Daily recurring payouts up to 30 levels"
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
            ) : (
              <button
                type="button"
                onClick={clearTiers}
                disabled={initializing}
                className="admin-btn admin-btn-danger"
              >
                Delete all
              </button>
            )}
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
          { label: 'Levels', value: 30, hint: 'Per tier' },
        ]}
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r._id || `${r.name}-${r.__index}`}
        loading={loading}
        emptyTitle="No franchise tiers"
        emptyDescription="Initialize defaults or add a tier"
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
        title={editIndex === null ? 'Add franchise tier' : 'Edit franchise tier'}
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
                <label className="admin-label">Min key price (INR)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="admin-input"
                  value={draft.minPrice}
                  onChange={(e) => updateDraft('minPrice', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="admin-label">Max key price (INR)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="admin-input"
                  value={draft.maxPrice}
                  onChange={(e) => updateDraft('maxPrice', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div>
              <p className="admin-label">Daily commission (30 levels)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {levelKeys.map((levelKey, idx) => (
                  <div key={levelKey}>
                    <label className="admin-label">L{idx + 1}</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="admin-input"
                      value={draft.dailyCommissions[levelKey] || 0}
                      onChange={(e) =>
                        updateDraft(
                          `dailyCommissions.${levelKey}`,
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}
