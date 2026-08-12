'use client';

import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import FilterBar from '@/components/admin/FilterBar';
import AdminModal from '@/components/admin/AdminModal';
import StatusPill from '@/components/admin/StatusPill';
import { useAdminPagination } from '@/hooks/useAdminPagination';

interface Advertisement {
  _id: string;
  title: string;
  description: string;
  image: string;
  rewardAmount: number;
  vendor: {
    _id: string;
    name: string;
    businessName: string;
  };
  isActive: boolean;
  totalShares: number;
  totalVerifiedShares: number;
  totalRewardsPaid: number;
  verificationPeriodHours: number;
  commissionEnabled?: boolean;
  commissionNote?: string;
  createdAt: string;
  activatedAt?: string | null;
}

export default function AdvertisementsPage() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendors, setVendors] = useState<{ _id: string; businessName: string }[]>([]);
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    image: '',
    rewardAmount: '',
    vendorId: '',
    verificationPeriodHours: '8',
    commissionEnabled: false,
    commissionNote: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const pagination = useAdminPagination(20);

  const getAdminUser = () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('adminUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const canAddAdvertisements = () => {
    const admin = getAdminUser();
    return admin?.role !== 'sub-admin' || admin?.permissions?.includes('advertisements.create');
  };

  const canApproveAdvertisements = () => {
    const admin = getAdminUser();
    return admin?.role !== 'sub-admin' || admin?.permissions?.includes('advertisements.approve');
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    loadAdvertisements();
  }, [pagination.page, pagination.limit, searchTerm]);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadAdvertisements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const response = await fetch(`/api/admin/advertisements?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAdvertisements(data.advertisements || []);
        if (data.pagination) pagination.setFromResponse(data.pagination);
      } else {
        setAdvertisements([]);
      }
    } catch (error) {
      console.error('Error loading advertisements:', error);
      setAdvertisements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    try {
      const response = await fetch('/api/admin/vendors?page=1&limit=100', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      } else {
        setVendors([]);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendors([]);
    }
  };

  const resetForm = () => {
    setNewAd({
      title: '',
      description: '',
      image: '',
      rewardAmount: '',
      vendorId: '',
      verificationPeriodHours: '8',
      commissionEnabled: false,
      commissionNote: '',
    });
    setSelectedFile(null);
    setEditingAd(null);
  };

  const closeModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleCreateAd = async () => {
    if (
      !newAd.title.trim() ||
      !newAd.description.trim() ||
      newAd.rewardAmount === '' ||
      !newAd.vendorId
    ) {
      alert('Please fill in title, description, reward amount, and vendor');
      return;
    }
    if (!selectedFile && !newAd.image) {
      alert('Please select an image file or provide an image URL');
      return;
    }
    if (vendors.length === 0) {
      alert(
        'No vendors available. Create a vendor first, or ensure your account can load the vendor list.'
      );
      return;
    }

    let imageUrl = newAd.image;

    if (selectedFile) {
      const uploadedUrl = await uploadImage();
      if (!uploadedUrl) return;
      imageUrl = uploadedUrl;
    }

    try {
      const method = editingAd ? 'PUT' : 'POST';
      const url = editingAd
        ? `/api/admin/advertisements/${editingAd._id}`
        : '/api/admin/advertisements';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          title: newAd.title,
          description: newAd.description,
          image: imageUrl,
          mediaType:
            selectedFile?.type?.startsWith('video/') ||
            /\.(mp4|webm|mov|m4v)(\?|$)/i.test(imageUrl) ||
            imageUrl.includes('/video/upload/')
              ? 'video'
              : 'image',
          rewardAmount: parseFloat(newAd.rewardAmount),
          vendorId: newAd.vendorId,
          verificationPeriodHours:
            newAd.verificationPeriodHours !== ''
              ? parseInt(newAd.verificationPeriodHours, 10)
              : 8,
          commissionEnabled: newAd.commissionEnabled,
          commissionNote: newAd.commissionNote?.trim() || '',
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        await loadAdvertisements();
        closeModal();
      } else {
        alert(result.message || `Failed to ${editingAd ? 'update' : 'create'} advertisement`);
      }
    } catch (error) {
      console.error(`Error ${editingAd ? 'updating' : 'creating'} advertisement:`, error);
      alert(`Failed to ${editingAd ? 'update' : 'create'} advertisement. Please try again.`);
    }
  };

  const toggleAdStatus = async (adId: string) => {
    try {
      const response = await fetch(`/api/admin/advertisements/${adId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const result = await response.json();
        setAdvertisements((prev) =>
          prev.map((ad) =>
            ad._id === adId
              ? {
                  ...ad,
                  isActive: !!result?.advertisement?.isActive,
                  activatedAt: result?.advertisement?.activatedAt ?? ad.activatedAt,
                }
              : ad
          )
        );
      } else {
        const result = await response.json().catch(() => ({}));
        alert(result.message || 'Failed to update advertisement status');
      }
    } catch (error) {
      console.error('Error toggling ad status:', error);
      alert('Failed to update advertisement status');
    }
  };

  const editAd = (ad: Advertisement) => {
    if (!ad.vendor?._id) {
      alert('This advertisement has no vendor linked. Assign a vendor before editing.');
      return;
    }
    setEditingAd(ad);
    setSelectedFile(null);
    setNewAd({
      title: ad.title,
      description: ad.description,
      image: ad.image,
      rewardAmount: ad.rewardAmount.toString(),
      vendorId: ad.vendor._id,
      verificationPeriodHours: ad.verificationPeriodHours.toString(),
      commissionEnabled: !!ad.commissionEnabled,
      commissionNote: ad.commissionNote || '',
    });
    setShowAddModal(true);
  };

  const deleteAd = async (adId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this advertisement? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/advertisements/${adId}`, {
        method: 'DELETE',
        headers: getAuthHeaders() as Record<string, string>,
      });

      if (response.ok) {
        await loadAdvertisements();
      } else {
        const result = await response.json().catch(() => ({}));
        alert(result.message || 'Failed to delete advertisement');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Failed to delete advertisement');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewAd((prev) => ({ ...prev, image: '' }));
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.data.url;
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.message}`);
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const formatDateTime = (value?: string | null) =>
    value
      ? new Date(value).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : 'Not active yet';

  const columns: DataTableColumn<Advertisement>[] = [
    {
      key: 'ad',
      header: 'Advertisement',
      render: (ad) => (
        <div className="max-w-xs">
          <p className="font-semibold truncate">{ad.title}</p>
          <p className="text-xs text-[var(--admin-muted)] line-clamp-2">{ad.description}</p>
        </div>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (ad) => ad.vendor?.businessName || 'Unknown vendor',
    },
    {
      key: 'reward',
      header: 'Reward',
      render: (ad) => <span className="tabular-nums text-emerald-300">₹{ad.rewardAmount}</span>,
    },
    {
      key: 'verify',
      header: 'Verify',
      render: (ad) =>
        ad.verificationPeriodHours === 0 ? 'Instant' : `${ad.verificationPeriodHours}h`,
    },
    {
      key: 'shares',
      header: 'Shares',
      render: (ad) => (
        <div className="text-xs">
          <p className="tabular-nums">{ad.totalShares} total</p>
          <p className="tabular-nums text-emerald-300">{ad.totalVerifiedShares} verified</p>
        </div>
      ),
    },
    {
      key: 'paid',
      header: 'Paid',
      render: (ad) => (
        <span className="tabular-nums text-emerald-300">₹{ad.totalRewardsPaid}</span>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (ad) => (
        <div className="text-xs text-[var(--admin-muted)] space-y-1">
          <p>Uploaded: {formatDateTime(ad.createdAt)}</p>
          <p>Active: {formatDateTime(ad.activatedAt)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (ad) => (
        <StatusPill tone={ad.isActive ? 'success' : 'danger'}>
          {ad.isActive ? 'Active' : 'Inactive'}
        </StatusPill>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (ad) => (
        <div className="flex flex-wrap gap-2">
          {canApproveAdvertisements() && (
            <button
              type="button"
              onClick={() => toggleAdStatus(ad._id)}
              className="admin-btn admin-btn-secondary !py-1 !px-2 !text-xs"
            >
              {ad.isActive ? 'Deactivate' : 'Activate'}
            </button>
          )}
          {canAddAdvertisements() && (
            <>
              <button
                type="button"
                onClick={() => editAd(ad)}
                className="admin-btn admin-btn-ghost !py-1 !px-2 !text-xs"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => deleteAd(ad._id)}
                className="admin-btn admin-btn-danger !py-1 !px-2 !text-xs"
              >
                Delete
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Megaphone}
        title="Advertisements"
        description="Monitor and manage all advertisements on the platform."
        actions={
          canAddAdvertisements() ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="admin-btn admin-btn-primary"
            >
              Add Advertisement
            </button>
          ) : null
        }
      />

      <StatStrip
        items={[
          { label: 'Total Ads', value: pagination.total },
          {
            label: 'Active (page)',
            value: advertisements.filter((ad) => ad.isActive).length,
          },
          {
            label: 'Shares (page)',
            value: advertisements.reduce((sum, ad) => sum + ad.totalShares, 0),
          },
          {
            label: 'Rewards (page)',
            value: `₹${advertisements
              .reduce((sum, ad) => sum + ad.totalRewardsPaid, 0)
              .toLocaleString()}`,
          },
        ]}
      />

      <FilterBar
        search={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          pagination.setPage(1);
        }}
        searchPlaceholder="Search by title or description…"
      />

      <DataTable
        columns={columns}
        rows={advertisements}
        rowKey={(row) => row._id}
        loading={loading}
        emptyTitle="No advertisements found"
        emptyDescription={
          searchTerm
            ? 'Try adjusting your search terms.'
            : 'Get started by creating your first advertisement.'
        }
        emptyAction={
          !searchTerm && canAddAdvertisements() ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="admin-btn admin-btn-primary"
            >
              Create First Ad
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
        open={showAddModal}
        title={editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}
        onClose={closeModal}
        wide
        footer={
          <>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={uploading}
              onClick={handleCreateAd}
            >
              {uploading
                ? 'Uploading…'
                : editingAd
                  ? 'Update Advertisement'
                  : 'Create Advertisement'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Title *</label>
              <input
                type="text"
                className="admin-input"
                value={newAd.title}
                onChange={(e) => setNewAd((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Advertisement title"
              />
            </div>
            <div>
              <label className="admin-label">Reward Amount (₹) *</label>
              <input
                type="number"
                min="0"
                className="admin-input"
                value={newAd.rewardAmount}
                onChange={(e) => setNewAd((prev) => ({ ...prev, rewardAmount: e.target.value }))}
                placeholder="50"
              />
            </div>
          </div>

          <div>
            <label className="admin-label">Description *</label>
            <textarea
              rows={4}
              className="admin-input min-h-[100px] resize-y"
              value={newAd.description}
              onChange={(e) => setNewAd((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your advertisement…"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Vendor *</label>
              <select
                className="admin-select"
                value={newAd.vendorId}
                onChange={(e) => setNewAd((prev) => ({ ...prev, vendorId: e.target.value }))}
              >
                <option value="">Select a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.businessName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-label">Verification Period (hours) *</label>
              <input
                type="number"
                min="0"
                max="24"
                className="admin-input"
                value={newAd.verificationPeriodHours}
                onChange={(e) =>
                  setNewAd((prev) => ({ ...prev, verificationPeriodHours: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--admin-text)]">
              <input
                type="checkbox"
                checked={newAd.commissionEnabled}
                onChange={(e) =>
                  setNewAd((prev) => ({ ...prev, commissionEnabled: e.target.checked }))
                }
              />
              Enable commission (e.g. 2% if you sell this)
            </label>
            {newAd.commissionEnabled ? (
              <input
                type="text"
                maxLength={200}
                className="admin-input"
                value={newAd.commissionNote}
                onChange={(e) =>
                  setNewAd((prev) => ({ ...prev, commissionNote: e.target.value }))
                }
                placeholder="e.g. 2% commission if you sell this property"
              />
            ) : null}
          </div>

          <div>
            <label className="admin-label">Media (image or video) *</label>
            <div className="space-y-3">
              <div className="border border-dashed border-[var(--admin-border)] rounded-[10px] p-4 text-center">
                <input
                  type="file"
                  accept="image/*,video/mp4,video/webm,video/quicktime,video/x-m4v"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-medium text-[var(--admin-text)]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-[var(--admin-faint)] mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        {selectedFile.type.startsWith('video/') ? ' · video' : ' · image'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-[var(--admin-text)]">
                        Click to upload image or video
                      </p>
                      <p className="text-xs text-[var(--admin-faint)] mt-1">
                        PNG, JPG, WebP, MP4, WebM up to 50MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
              <p className="text-center text-xs text-[var(--admin-faint)]">or</p>
              <input
                type="url"
                className="admin-input"
                value={newAd.image}
                onChange={(e) => {
                  setNewAd((prev) => ({ ...prev, image: e.target.value }));
                  if (e.target.value) setSelectedFile(null);
                }}
                placeholder="https://example.com/ad.jpg or .mp4"
              />
            </div>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
