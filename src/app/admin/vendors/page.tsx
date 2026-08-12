'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import FilterBar from '@/components/admin/FilterBar';
import AdminModal from '@/components/admin/AdminModal';
import StatusPill from '@/components/admin/StatusPill';
import { useAdminPagination } from '@/hooks/useAdminPagination';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  businessName: string;
  phone?: string;
  walletBalance: number;
  adsRemaining?: number;
  totalAds: number;
  totalShares: number;
  totalEarnings: number;
  status?: 'pending' | 'active' | 'rejected';
  isActive: boolean;
  createdAt: string;
}

interface Package {
  _id: string;
  name: string;
  price: number;
  adLimit: number;
  isActive: boolean;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState('');
  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    phone: '',
  });
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordVendor, setPasswordVendor] = useState<Vendor | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const pagination = useAdminPagination(20);
  const router = useRouter();

  const getAdminUser = () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('adminUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const canCreateVendors = () => {
    const admin = getAdminUser();
    return admin?.role !== 'sub-admin' || admin?.permissions?.includes('vendors.create');
  };

  const canApproveVendors = () => {
    const admin = getAdminUser();
    return admin?.role !== 'sub-admin' || admin?.permissions?.includes('vendors.approve');
  };

  const isMainAdmin = () => getAdminUser()?.role !== 'sub-admin';

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    loadVendors();
  }, [pagination.page, pagination.limit, search]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (search.trim()) params.set('search', search.trim());

      const response = await fetch(`/api/admin/vendors?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
        if (data.pagination) pagination.setFromResponse(data.pagination);
      } else {
        setVendors([]);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async () => {
    try {
      const response = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(newVendor),
      });

      if (response.ok) {
        await loadVendors();
        setNewVendor({ name: '', email: '', password: '', businessName: '', phone: '' });
        setShowAddModal(false);
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.message || 'Failed to create vendor');
      }
    } catch (error) {
      console.error('Error adding vendor:', error);
      alert('Error adding vendor');
    }
  };

  const loadPackages = async () => {
    try {
      const res = await fetch('/api/admin/packages?page=1&limit=100', {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setPackages((data.packages || []).filter((p: Package) => p.isActive));
      }
    } catch (e) {
      console.error('Error loading packages:', e);
    }
  };

  const openAssignModal = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setSelectedPackageId('');
    setAssignMessage('');
    loadPackages();
    setShowAssignModal(true);
  };

  const handleAssignPackage = async () => {
    if (!selectedVendor || !selectedPackageId) return;
    setAssigning(true);
    setAssignMessage('');
    try {
      const res = await fetch(`/api/admin/vendors/${selectedVendor._id}/assign-package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ packageId: selectedPackageId }),
      });
      const data = await res.json();
      if (data.success) {
        setAssignMessage(data.message);
        await loadVendors();
        setTimeout(() => setShowAssignModal(false), 2000);
      } else {
        setAssignMessage(data.message || 'Failed to assign package');
      }
    } catch (e) {
      setAssignMessage('Error assigning package');
    } finally {
      setAssigning(false);
    }
  };

  const updateVendorStatus = async (vendorId: string, status: 'active' | 'rejected') => {
    try {
      setStatusLoading(vendorId);
      const res = await fetch('/api/admin/vendors/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ vendorId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setVendors((prev) =>
          prev.map((v) =>
            v._id === vendorId ? { ...v, status, isActive: status === 'active' } : v
          )
        );
      } else {
        console.error('Status update failed:', data.message);
      }
    } catch (e) {
      console.error('Status update error:', e);
    } finally {
      setStatusLoading(null);
    }
  };

  const openPasswordModal = (vendor: Vendor) => {
    setPasswordVendor(vendor);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const saveVendorPassword = async () => {
    if (!passwordVendor || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch(`/api/admin/vendors/${passwordVendor._id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Failed to set password');
      } else {
        alert('Password updated');
        setShowPasswordModal(false);
      }
    } catch (e) {
      console.error('Password update error:', e);
      alert('Error updating password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const statusTone = (vendor: Vendor) => {
    if (vendor.status === 'active' || (!vendor.status && vendor.isActive)) return 'success' as const;
    if (vendor.status === 'pending') return 'warning' as const;
    return 'danger' as const;
  };

  const statusLabel = (vendor: Vendor) => {
    if (vendor.status) return vendor.status;
    return vendor.isActive ? 'active' : 'inactive';
  };

  const columns: DataTableColumn<Vendor>[] = [
    {
      key: 'vendor',
      header: 'Vendor',
      render: (vendor) => (
        <div>
          <p className="font-semibold">{vendor.name}</p>
          <p className="text-xs text-[var(--admin-faint)]">ID: {vendor._id.slice(-8)}</p>
        </div>
      ),
    },
    {
      key: 'business',
      header: 'Business',
      render: (vendor) => vendor.businessName,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (vendor) => (
        <div>
          <p>{vendor.email}</p>
          {vendor.phone ? (
            <p className="text-xs text-[var(--admin-muted)]">{vendor.phone}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (vendor) => (
        <span className="tabular-nums text-emerald-300">₹{vendor.walletBalance}</span>
      ),
    },
    {
      key: 'adsLeft',
      header: 'Ads Left',
      render: (vendor) => (
        <span className="tabular-nums">{vendor.adsRemaining || 0}</span>
      ),
    },
    {
      key: 'totalAds',
      header: 'Total Ads',
      render: (vendor) => <span className="tabular-nums">{vendor.totalAds}</span>,
    },
    {
      key: 'earnings',
      header: 'Earnings',
      render: (vendor) => (
        <span className="tabular-nums text-emerald-300">₹{vendor.totalEarnings}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (vendor) => (
        <StatusPill tone={statusTone(vendor)}>{statusLabel(vendor)}</StatusPill>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (vendor) => (
        <div className="flex flex-wrap gap-2">
          {isMainAdmin() && (
            <>
              <button
                type="button"
                onClick={() => openAssignModal(vendor)}
                className="admin-btn admin-btn-secondary !py-1 !px-2 !text-xs"
              >
                Assign Package
              </button>
              <button
                type="button"
                onClick={() => openPasswordModal(vendor)}
                className="admin-btn admin-btn-ghost !py-1 !px-2 !text-xs"
              >
                Set Password
              </button>
            </>
          )}
          {canApproveVendors() && vendor.status !== 'active' && (
            <button
              type="button"
              onClick={() => updateVendorStatus(vendor._id, 'active')}
              disabled={statusLoading === vendor._id}
              className="admin-btn admin-btn-primary !py-1 !px-2 !text-xs"
            >
              {statusLoading === vendor._id ? 'Saving…' : 'Approve'}
            </button>
          )}
          {canApproveVendors() && vendor.status !== 'rejected' && (
            <button
              type="button"
              onClick={() => updateVendorStatus(vendor._id, 'rejected')}
              disabled={statusLoading === vendor._id}
              className="admin-btn admin-btn-danger !py-1 !px-2 !text-xs"
            >
              {statusLoading === vendor._id ? 'Saving…' : 'Reject'}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Store}
        title="Vendors"
        description="Manage business partners, approvals, packages, and passwords."
        actions={
          canCreateVendors() ? (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="admin-btn admin-btn-primary"
            >
              Add Vendor
            </button>
          ) : null
        }
      />

      <StatStrip
        items={[
          { label: 'Total', value: pagination.total },
          {
            label: 'Active (page)',
            value: vendors.filter((v) => v.status === 'active' || v.isActive).length,
          },
          {
            label: 'Earnings (page)',
            value: `₹${vendors.reduce((sum, v) => sum + (v.totalEarnings || 0), 0).toLocaleString()}`,
          },
        ]}
      />

      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          pagination.setPage(1);
        }}
        searchPlaceholder="Search name, email, or business…"
      />

      <DataTable
        columns={columns}
        rows={vendors}
        rowKey={(row) => row._id}
        loading={loading}
        emptyTitle="No vendors yet"
        emptyDescription="Get started by adding your first vendor partner."
        emptyAction={
          canCreateVendors() ? (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="admin-btn admin-btn-primary"
            >
              Add First Vendor
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
          />
        }
      />

      <AdminModal
        open={showPasswordModal && !!passwordVendor}
        title="Set Vendor Password"
        onClose={() => setShowPasswordModal(false)}
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={passwordSaving}
              onClick={saveVendorPassword}
            >
              {passwordSaving ? 'Saving…' : 'Save Password'}
            </button>
          </>
        }
      >
        {passwordVendor ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--admin-muted)]">
              for {passwordVendor.name} ({passwordVendor.businessName})
            </p>
            <div>
              <label className="admin-label">New Password (min 6 chars)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="admin-input"
                placeholder="Enter new password"
              />
            </div>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={showAssignModal && !!selectedVendor}
        title="Assign Package"
        onClose={() => setShowAssignModal(false)}
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setShowAssignModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={assigning || !selectedPackageId}
              onClick={handleAssignPackage}
            >
              {assigning ? 'Assigning…' : 'Assign Package'}
            </button>
          </>
        }
      >
        {selectedVendor ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--admin-muted)]">
              to {selectedVendor.name} ({selectedVendor.businessName})
            </p>
            <div className="admin-panel px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-[var(--admin-muted)]">Current ads remaining</span>
              <span className="font-semibold tabular-nums">
                {selectedVendor.adsRemaining || 0}
              </span>
            </div>
            {assignMessage ? (
              <div
                className={`px-3 py-2 rounded-lg text-sm border ${
                  assignMessage.includes('assigned') || assignMessage.includes('added')
                    ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
                    : 'border-red-500/30 text-red-300 bg-red-500/10'
                }`}
              >
                {assignMessage}
              </div>
            ) : null}
            {packages.length === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">
                No active packages available. Create packages first in Packages.
              </p>
            ) : (
              <div className="space-y-2">
                <label className="admin-label">Select a Package</label>
                {packages.map((pkg) => (
                  <button
                    key={pkg._id}
                    type="button"
                    onClick={() => setSelectedPackageId(pkg._id)}
                    className={`w-full text-left px-4 py-3 rounded-[10px] border transition-colors ${
                      selectedPackageId === pkg._id
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-[var(--admin-border)] hover:border-[var(--admin-border-strong)]'
                    }`}
                  >
                    <p className="font-semibold text-[var(--admin-text)]">{pkg.name}</p>
                    <p className="text-sm text-[var(--admin-muted)]">
                      {pkg.adLimit} ads · ₹{pkg.price.toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={showAddModal}
        title="Add New Vendor"
        onClose={() => setShowAddModal(false)}
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleAddVendor}>
              Create Vendor
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="admin-label">Full Name</label>
            <input
              type="text"
              className="admin-input"
              placeholder="Enter full name"
              value={newVendor.name}
              onChange={(e) => setNewVendor((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="admin-label">Email Address</label>
            <input
              type="email"
              className="admin-input"
              placeholder="Enter email address"
              value={newVendor.email}
              onChange={(e) => setNewVendor((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="admin-label">Password</label>
            <input
              type="password"
              className="admin-input"
              placeholder="Create a secure password"
              value={newVendor.password}
              onChange={(e) => setNewVendor((prev) => ({ ...prev, password: e.target.value }))}
            />
          </div>
          <div>
            <label className="admin-label">Business Name</label>
            <input
              type="text"
              className="admin-input"
              placeholder="Enter business name"
              value={newVendor.businessName}
              onChange={(e) =>
                setNewVendor((prev) => ({ ...prev, businessName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="admin-label">Phone Number (optional)</label>
            <input
              type="tel"
              className="admin-input"
              placeholder="Enter phone number"
              value={newVendor.phone}
              onChange={(e) => setNewVendor((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
