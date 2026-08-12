'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import AdminModal from '@/components/admin/AdminModal';
import StatusPill from '@/components/admin/StatusPill';
import { useAdminPagination } from '@/hooks/useAdminPagination';

interface ActivationKey {
  _id: string;
  key: string;
  isUsed: boolean;
  usedBy?: {
    name: string;
    email?: string;
  };
  usedAt?: string;
  price: number;
  isForSale: boolean;
  soldBy?: {
    name: string;
    email?: string;
  };
  soldAt?: string;
  purchasedBy?: {
    name: string;
    email?: string;
  };
  purchasedAt?: string;
  createdBy?: {
    name: string;
    email?: string;
  };
  createdAt: string;
}

export default function ActivationKeysPage() {
  const [keys, setKeys] = useState<ActivationKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [generatePrice, setGeneratePrice] = useState(2000);
  const [generateForSale, setGenerateForSale] = useState(true);
  const pagination = useAdminPagination(25);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    loadActivationKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadActivationKeys = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      const response = await fetch(`/api/admin/activation-keys?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setKeys(data.keys || []);
        pagination.setFromResponse(data.pagination || {});
      } else {
        setKeys([]);
      }
    } catch (error) {
      console.error('Error loading activation keys:', error);
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const generateKeys = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/admin/activation-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          count: generateCount,
          price: generatePrice,
          isForSale: generateForSale,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate keys');
      }

      await loadActivationKeys();
      setShowGenerateModal(false);
      setGenerateCount(10);
      setGeneratePrice(2000);
      setGenerateForSale(true);
    } catch (error) {
      console.error('Error generating keys:', error);
    } finally {
      setGenerating(false);
    }
  };

  const toggleKeyForSale = async (keyId: string) => {
    try {
      const response = await fetch(`/api/admin/activation-keys/${keyId}/toggle-sale`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        await loadActivationKeys();
      }
    } catch (error) {
      console.error('Error toggling key sale status:', error);
    }
  };

  const exportToCSV = () => {
    if (!keys.length) return;
    const csvData = keys.map((key) => ({
      Key: key.key,
      Status: key.isUsed ? 'Used' : key.isForSale ? 'For Sale' : 'Generated',
      Price: key.price,
      'For Sale': key.isForSale ? 'Yes' : 'No',
      'Used By': key.usedBy ? key.usedBy.name : '',
      'User Email': key.usedBy?.email || '',
      'Purchased By': key.purchasedBy ? key.purchasedBy.name : '',
      'Purchaser Email': key.purchasedBy?.email || '',
      'Sold By': key.soldBy ? key.soldBy.name : '',
      'Seller Email': key.soldBy?.email || '',
      'Created Date': new Date(key.createdAt).toLocaleDateString(),
      'Used Date': key.usedAt ? new Date(key.usedAt).toLocaleDateString() : '',
      'Purchased Date': key.purchasedAt ? new Date(key.purchasedAt).toLocaleDateString() : '',
      'Sold Date': key.soldAt ? new Date(key.soldAt).toLocaleDateString() : '',
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row) =>
        Object.values(row)
          .map((value) => (typeof value === 'string' && value.includes(',') ? `"${value}"` : value))
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `activation_keys_export_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const person = (p?: { name: string; email?: string } | null) =>
    p ? (
      <div>
        <p className="font-medium">{p.name}</p>
        {p.email ? <p className="text-xs text-[var(--admin-muted)]">{p.email}</p> : null}
      </div>
    ) : (
      <span className="text-[var(--admin-faint)]">—</span>
    );

  const columns: DataTableColumn<ActivationKey>[] = [
      {
        key: 'key',
        header: 'Key',
        render: (row) => (
          <code className="text-xs font-mono break-all text-[var(--admin-muted)]">{row.key}</code>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <StatusPill
            tone={row.isUsed ? 'success' : row.isForSale ? 'warning' : 'neutral'}
          >
            {row.isUsed ? 'Used' : row.isForSale ? 'For sale' : 'Generated'}
          </StatusPill>
        ),
      },
      {
        key: 'price',
        header: 'Price',
        render: (row) => <span className="tabular-nums">₹{row.price}</span>,
      },
      {
        key: 'sale',
        header: 'For sale',
        render: (row) => (row.isForSale ? 'Yes' : 'No'),
      },
      {
        key: 'usedBy',
        header: 'Used by',
        render: (row) => person(row.usedBy),
      },
      {
        key: 'purchasedBy',
        header: 'Purchased by',
        render: (row) => person(row.purchasedBy),
      },
      {
        key: 'soldBy',
        header: 'Sold by',
        render: (row) => person(row.soldBy),
      },
      {
        key: 'created',
        header: 'Created',
        render: (row) => (
          <span className="text-[var(--admin-muted)]">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) =>
          !row.isUsed ? (
            <button
              type="button"
              onClick={() => toggleKeyForSale(row._id)}
              className="admin-btn admin-btn-secondary !py-1.5 !px-3"
            >
              {row.isForSale ? 'Remove sale' : 'Put for sale'}
            </button>
          ) : (
            <span className="text-xs text-[var(--admin-faint)]">—</span>
          ),
      },
    ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={KeyRound}
        title="Activation keys"
        description="Generate and manage user activation keys"
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportToCSV}
              className="admin-btn admin-btn-secondary"
              disabled={!keys.length}
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setShowGenerateModal(true)}
              className="admin-btn admin-btn-primary"
            >
              Generate keys
            </button>
          </div>
        }
      />

      <StatStrip
        items={[
          { label: 'Total keys', value: pagination.total },
          {
            label: 'Used (page)',
            value: keys.filter((k) => k.isUsed).length,
            hint: 'Current page',
          },
          {
            label: 'Available (page)',
            value: keys.filter((k) => !k.isUsed).length,
            hint: 'Current page',
          },
          {
            label: 'For sale (page)',
            value: keys.filter((k) => k.isForSale && !k.isUsed).length,
            hint: 'Current page',
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={keys}
        rowKey={(k) => k._id}
        loading={loading}
        emptyTitle="No activation keys"
        emptyDescription="Generate your first activation keys to get started"
        emptyAction={
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="admin-btn admin-btn-primary"
          >
            Generate keys
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
            limitOptions={[10, 25, 50]}
          />
        }
      />

      <AdminModal
        open={showGenerateModal}
        title="Generate keys"
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
              disabled={generating}
              onClick={generateKeys}
            >
              {generating ? 'Generating…' : 'Generate keys'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="admin-label">Number of keys</label>
            <input
              type="number"
              min={1}
              max={100}
              className="admin-input"
              value={generateCount}
              onChange={(e) => setGenerateCount(parseInt(e.target.value, 10) || 10)}
            />
            <p className="mt-1 text-xs text-[var(--admin-faint)]">Maximum 100 per batch</p>
          </div>
          <div>
            <label className="admin-label">Price per key (₹)</label>
            <input
              type="number"
              min={0}
              step={100}
              className="admin-input"
              value={generatePrice}
              onChange={(e) => setGeneratePrice(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <label className="flex items-center justify-between gap-3 rounded-[var(--admin-radius)] border border-[var(--admin-border)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Available for sale</p>
              <p className="text-xs text-[var(--admin-muted)]">
                Users can purchase these keys on the marketplace
              </p>
            </div>
            <input
              type="checkbox"
              checked={generateForSale}
              onChange={(e) => setGenerateForSale(e.target.checked)}
            />
          </label>
        </div>
      </AdminModal>
    </div>
  );
}
