'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import FilterBar from '@/components/admin/FilterBar';
import AdminModal from '@/components/admin/AdminModal';
import StatusPill from '@/components/admin/StatusPill';
import { useAdminPagination } from '@/hooks/useAdminPagination';

interface MyStatusAd {
  _id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  isActive: boolean;
  totalShares: number;
  createdAt: string;
}

const categories = [
  { value: 'motivation', label: 'Motivation' },
  { value: 'inspiration', label: 'Inspiration' },
  { value: 'success', label: 'Success' },
  { value: 'mindset', label: 'Mindset' },
  { value: 'goals', label: 'Goals' },
  { value: 'positivity', label: 'Positivity' },
];

export default function MyStatusAdsPage() {
  const [mystatusAds, setMystatusAds] = useState<MyStatusAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    image: '',
    category: 'motivation',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingAd, setEditingAd] = useState<MyStatusAd | null>(null);
  const pagination = useAdminPagination(20);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    loadMyStatusAds();
  }, [pagination.page, pagination.limit]);

  const loadMyStatusAds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      const response = await fetch(`/api/admin/mystatus-ads?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMystatusAds(data.mystatusAds || []);
        if (data.pagination) pagination.setFromResponse(data.pagination);
      } else {
        setMystatusAds([]);
      }
    } catch (error) {
      console.error('Error loading MyStatus ads:', error);
      setMystatusAds([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewAd({
      title: '',
      description: '',
      image: '',
      category: 'motivation',
    });
    setSelectedFile(null);
    setEditingAd(null);
  };

  const closeModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleCreateAd = async () => {
    if (!newAd.title || !newAd.description || !newAd.category) return;
    if (!selectedFile && !newAd.image) {
      alert('Please select an image file or provide an image URL');
      return;
    }

    let imageUrl = newAd.image;

    if (selectedFile) {
      const uploaded = await uploadImage();
      if (!uploaded) return;
      imageUrl = uploaded;
    }

    try {
      const method = editingAd ? 'PUT' : 'POST';
      const url = editingAd
        ? `/api/admin/mystatus-ads/${editingAd._id}`
        : '/api/admin/mystatus-ads';

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
          category: newAd.category,
        }),
      });
      if (response.ok) {
        await loadMyStatusAds();
        closeModal();
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.message || `Failed to ${editingAd ? 'update' : 'create'} MyStatus ad`);
      }
    } catch (error) {
      console.error(`Error ${editingAd ? 'updating' : 'creating'} MyStatus ad:`, error);
      alert(`Failed to ${editingAd ? 'update' : 'create'} MyStatus ad`);
    }
  };

  const toggleAdStatus = async (adId: string) => {
    try {
      const response = await fetch(`/api/admin/mystatus-ads/${adId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        setMystatusAds((prev) =>
          prev.map((ad) => (ad._id === adId ? { ...ad, isActive: !ad.isActive } : ad))
        );
      }
    } catch (error) {
      console.error('Error toggling mystatus ad status:', error);
    }
  };

  const editAd = (ad: MyStatusAd) => {
    setEditingAd(ad);
    setSelectedFile(null);
    setNewAd({
      title: ad.title,
      description: ad.description,
      image: ad.image,
      category: ad.category,
    });
    setShowAddModal(true);
  };

  const deleteAd = async (adId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this MyStatus ad? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/mystatus-ads/${adId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        await loadMyStatusAds();
      }
    } catch (error) {
      console.error('Error deleting mystatus ad:', error);
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

  const filteredAds = mystatusAds.filter((ad) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      ad.title.toLowerCase().includes(term) ||
      ad.description.toLowerCase().includes(term) ||
      ad.category.toLowerCase().includes(term)
    );
  });

  const columns: DataTableColumn<MyStatusAd>[] = [
    {
      key: 'ad',
      header: 'Ad',
      render: (ad) => (
        <div className="max-w-xs">
          <p className="font-semibold truncate">{ad.title}</p>
          <p className="text-xs text-[var(--admin-muted)] line-clamp-2">{ad.description}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (ad) => <span className="capitalize">{ad.category}</span>,
    },
    {
      key: 'shares',
      header: 'Shares',
      render: (ad) => <span className="tabular-nums">{ad.totalShares}</span>,
    },
    {
      key: 'created',
      header: 'Created',
      render: (ad) => (
        <span className="text-xs text-[var(--admin-muted)]">
          {new Date(ad.createdAt).toLocaleDateString('en-IN')}
        </span>
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
          <button
            type="button"
            onClick={() => toggleAdStatus(ad._id)}
            className="admin-btn admin-btn-secondary !py-1 !px-2 !text-xs"
          >
            {ad.isActive ? 'Deactivate' : 'Activate'}
          </button>
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
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Heart}
        title="MyStatus Ads"
        description="Create and manage motivational content for the MyStatus community."
        actions={
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="admin-btn admin-btn-primary"
          >
            Add MyStatus Ad
          </button>
        }
      />

      <StatStrip
        items={[
          { label: 'Total Ads', value: pagination.total },
          {
            label: 'Active (page)',
            value: mystatusAds.filter((ad) => ad.isActive).length,
          },
          {
            label: 'Shares (page)',
            value: mystatusAds.reduce((sum, ad) => sum + ad.totalShares, 0),
          },
          { label: 'Categories', value: categories.length },
        ]}
      />

      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter this page by title, description, or category…"
      />

      <DataTable
        columns={columns}
        rows={filteredAds}
        rowKey={(row) => row._id}
        loading={loading}
        emptyTitle="No MyStatus ads found"
        emptyDescription={
          searchTerm
            ? 'Try adjusting your filter.'
            : 'Get started by creating your first motivational ad.'
        }
        emptyAction={
          !searchTerm ? (
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
        title={editingAd ? 'Edit MyStatus Ad' : 'Add New MyStatus Ad'}
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
                  ? 'Update MyStatus Ad'
                  : 'Create MyStatus Ad'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="admin-label">Title *</label>
            <input
              type="text"
              className="admin-input"
              value={newAd.title}
              onChange={(e) => setNewAd((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Motivational title"
            />
          </div>

          <div>
            <label className="admin-label">Category *</label>
            <select
              className="admin-select"
              value={newAd.category}
              onChange={(e) => setNewAd((prev) => ({ ...prev, category: e.target.value }))}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="admin-label">Description *</label>
            <textarea
              rows={4}
              className="admin-input min-h-[100px] resize-y"
              value={newAd.description}
              onChange={(e) => setNewAd((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Write an inspiring message…"
            />
          </div>

          <div>
            <label className="admin-label">Image *</label>
            <div className="space-y-3">
              <div className="border border-dashed border-[var(--admin-border)] rounded-[10px] p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="mystatus-image-upload"
                />
                <label htmlFor="mystatus-image-upload" className="cursor-pointer block">
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-medium text-[var(--admin-text)]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-[var(--admin-faint)] mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-[var(--admin-text)]">
                        Click to upload image
                      </p>
                      <p className="text-xs text-[var(--admin-faint)] mt-1">
                        PNG, JPG, WebP up to 5MB
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
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
