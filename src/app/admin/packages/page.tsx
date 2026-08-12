'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import AdminModal from '@/components/admin/AdminModal';
import StatusPill from '@/components/admin/StatusPill';
import { useAdminPagination } from '@/hooks/useAdminPagination';

interface Package {
  _id: string;
  name: string;
  description: string;
  price: number;
  adLimit: number;
  isActive: boolean;
  createdAt: string;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    adLimit: '',
  });
  const [saving, setSaving] = useState(false);
  const pagination = useAdminPagination(20);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    loadPackages();
  }, [pagination.page, pagination.limit]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadPackages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      const res = await fetch(`/api/admin/packages?${params}`, {
        headers: { ...getAuthHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages || []);
        if (data.pagination) pagination.setFromResponse(data.pagination);
      }
    } catch (e) {
      console.error('Error loading packages:', e);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPkg(null);
    setFormData({ name: '', description: '', price: '', adLimit: '' });
    setShowModal(true);
  };

  const openEdit = (pkg: Package) => {
    setEditingPkg(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: String(pkg.price),
      adLimit: String(pkg.adLimit),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.adLimit) return;
    setSaving(true);
    try {
      const body = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        adLimit: Number(formData.adLimit),
      };

      const url = editingPkg
        ? `/api/admin/packages/${editingPkg._id}`
        : '/api/admin/packages';

      const res = await fetch(url, {
        method: editingPkg ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await loadPackages();
        setShowModal(false);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to save package');
      }
    } catch (e) {
      console.error('Error saving package:', e);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (pkg: Package) => {
    try {
      await fetch(`/api/admin/packages/${pkg._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ isActive: !pkg.isActive }),
      });
      await loadPackages();
    } catch (e) {
      console.error('Error toggling status:', e);
    }
  };

  const deletePkg = async (pkg: Package) => {
    if (!confirm(`Delete package "${pkg.name}"?`)) return;
    try {
      await fetch(`/api/admin/packages/${pkg._id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });
      await loadPackages();
    } catch (e) {
      console.error('Error deleting package:', e);
    }
  };

  const columns: DataTableColumn<Package>[] = [
    {
      key: 'name',
      header: 'Package',
      render: (pkg) => (
        <div>
          <p className="font-semibold">{pkg.name}</p>
          {pkg.description ? (
            <p className="text-xs text-[var(--admin-muted)] line-clamp-2">{pkg.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'adLimit',
      header: 'Ad Limit',
      render: (pkg) => <span className="tabular-nums">{pkg.adLimit}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      render: (pkg) => (
        <span className="tabular-nums text-emerald-300">₹{pkg.price.toLocaleString()}</span>
      ),
    },
    {
      key: 'perAd',
      header: 'Per Ad',
      render: (pkg) => (
        <span className="tabular-nums text-[var(--admin-muted)]">
          ₹{pkg.adLimit > 0 ? (pkg.price / pkg.adLimit).toFixed(0) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (pkg) => (
        <StatusPill tone={pkg.isActive ? 'success' : 'danger'}>
          {pkg.isActive ? 'Active' : 'Inactive'}
        </StatusPill>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (pkg) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openEdit(pkg)}
            className="admin-btn admin-btn-secondary !py-1 !px-2 !text-xs"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => toggleStatus(pkg)}
            className="admin-btn admin-btn-ghost !py-1 !px-2 !text-xs"
          >
            {pkg.isActive ? 'Disable' : 'Enable'}
          </button>
          <button
            type="button"
            onClick={() => deletePkg(pkg)}
            className="admin-btn admin-btn-danger !py-1 !px-2 !text-xs"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Package}
        title="Packages"
        description="Create and manage ad packages for vendors."
        actions={
          <button type="button" onClick={openCreate} className="admin-btn admin-btn-primary">
            Create Package
          </button>
        }
      />

      <StatStrip
        items={[
          { label: 'Total Packages', value: pagination.total },
          {
            label: 'Active (page)',
            value: packages.filter((p) => p.isActive).length,
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={packages}
        rowKey={(row) => row._id}
        loading={loading}
        emptyTitle="No packages yet"
        emptyDescription="Create your first ad package for vendors."
        emptyAction={
          <button type="button" onClick={openCreate} className="admin-btn admin-btn-primary">
            Create First Package
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
          />
        }
      />

      <AdminModal
        open={showModal}
        title={editingPkg ? 'Edit Package' : 'Create Package'}
        onClose={() => setShowModal(false)}
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={saving || !formData.name || !formData.price || !formData.adLimit}
              onClick={handleSave}
            >
              {saving ? 'Saving…' : editingPkg ? 'Update Package' : 'Create Package'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="admin-label">Package Name</label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g. Basic, Premium, Enterprise"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="admin-label">Description (optional)</label>
            <textarea
              className="admin-input min-h-[80px] resize-y"
              placeholder="Brief description of the package"
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Price (₹)</label>
              <input
                type="number"
                min="0"
                className="admin-input"
                placeholder="500"
                value={formData.price}
                onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
              />
            </div>
            <div>
              <label className="admin-label">Ad Limit</label>
              <input
                type="number"
                min="1"
                className="admin-input"
                placeholder="10"
                value={formData.adLimit}
                onChange={(e) => setFormData((p) => ({ ...p, adLimit: e.target.value }))}
              />
            </div>
          </div>
          {formData.price && formData.adLimit && Number(formData.adLimit) > 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">
              Cost per ad:{' '}
              <span className="font-semibold text-emerald-300">
                ₹{(Number(formData.price) / Number(formData.adLimit)).toFixed(0)}
              </span>
            </p>
          ) : null}
        </div>
      </AdminModal>
    </div>
  );
}
