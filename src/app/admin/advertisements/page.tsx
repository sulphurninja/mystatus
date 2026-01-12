'use client';

import { useState, useEffect } from 'react';

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
  createdAt: string;
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
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    loadAdvertisements();
    loadVendors();
  }, []);

  const loadAdvertisements = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      };

      const response = await fetch('/api/admin/advertisements', {
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setAdvertisements(data.advertisements || []);
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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      };

      const response = await fetch('/api/admin/vendors', {
        headers,
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

  const handleCreateAd = async () => {
    if (!newAd.title || !newAd.description || !newAd.rewardAmount || !newAd.vendorId) return;
    if (!selectedFile && !newAd.image) {
      alert('Please select an image file or provide an image URL');
      return;
    }

    let imageUrl = newAd.image;

    // Upload file if selected
    if (selectedFile) {
      const uploadedUrl = await uploadImage();
      if (!uploadedUrl) return; // Upload failed
      imageUrl = uploadedUrl;
    }

    try {
      const method = editingAd ? 'PUT' : 'POST';
      const url = editingAd ? `/api/admin/advertisements/${editingAd._id}` : '/api/admin/advertisements';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      };

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          title: newAd.title,
          description: newAd.description,
          image: imageUrl,
          rewardAmount: parseFloat(newAd.rewardAmount),
          vendorId: newAd.vendorId,
          verificationPeriodHours: newAd.verificationPeriodHours !== '' ? parseInt(newAd.verificationPeriodHours) : 8,
        }),
      });
      if (response.ok) {
        await loadAdvertisements();
        setShowAddModal(false);
        setNewAd({
          title: '',
          description: '',
          image: '',
          rewardAmount: '',
          vendorId: '',
          verificationPeriodHours: '8',
        });
        setSelectedFile(null);
        setEditingAd(null);
      }
    } catch (error) {
      console.error(`Error ${editingAd ? 'updating' : 'creating'} advertisement:`, error);
    }
  };

  const toggleAdStatus = async (adId: string) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      };

      const response = await fetch(`/api/admin/advertisements/${adId}/status`, {
        method: 'PUT',
        headers,
      });

      if (response.ok) {
        setAdvertisements(prev => prev.map(ad =>
          ad._id === adId
            ? { ...ad, isActive: !ad.isActive }
            : ad
        ));
      }
    } catch (error) {
      console.error('Error toggling ad status:', error);
    }
  };

  const editAd = (ad: Advertisement) => {
    setEditingAd(ad);
    setSelectedFile(null);
    setNewAd({
      title: ad.title,
      description: ad.description,
      image: ad.image,
      rewardAmount: ad.rewardAmount.toString(),
      vendorId: ad.vendor._id,
      verificationPeriodHours: ad.verificationPeriodHours.toString(),
    });
    setShowAddModal(true);
  };

  const deleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this advertisement? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/advertisements/${adId}`, {
        method: 'DELETE',
        headers: getAuthHeaders() as Record<string, string>,
      });

      if (response.ok) {
        await loadAdvertisements();
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Clear any existing URL
      setNewAd(prev => ({ ...prev, image: '' }));
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

  const filteredAds = advertisements.filter(ad =>
    ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Advertisement Management
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">
          Monitor and manage all advertisements on the platform
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{advertisements.length}</p>
              <p className="text-slate-400 text-sm">Total Ads</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{advertisements.filter(ad => ad.isActive).length}</p>
              <p className="text-slate-400 text-sm">Active Ads</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{advertisements.reduce((sum, ad) => sum + ad.totalShares, 0)}</p>
              <p className="text-slate-400 text-sm">Total Shares</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">
                ₹{advertisements.reduce((sum, ad) => sum + ad.totalRewardsPaid, 0).toLocaleString()}
              </p>
              <p className="text-slate-400 text-sm">Rewards Paid</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search advertisements by title, vendor, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <select className="px-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Advertisement</span>
            </div>
          </button>
        </div>
      </div>

      {/* Advertisements Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 animate-pulse">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-slate-700 rounded-2xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-6 bg-slate-700 rounded-lg w-3/4"></div>
                  <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-16 bg-slate-700 rounded-xl"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-100 mb-2">No Advertisements Found</h3>
          <p className="text-slate-400 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first advertisement'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Create First Ad
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAds.map((ad) => (
            <div key={ad._id} className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1">
              {/* Status Indicator */}
              <div className="absolute top-4 right-4">
                <div className={`w-3 h-3 rounded-full ${ad.isActive ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-red-400'
                  }`}></div>
              </div>

              {/* Header */}
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-100 mb-1 line-clamp-2">{ad.title}</h3>
                  <p className="text-slate-400 text-sm mb-1">{ad.vendor.businessName}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400 font-semibold">₹{ad.rewardAmount}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-500 text-sm">
                      {ad.verificationPeriodHours === 0 ? 'Instant' : `${ad.verificationPeriodHours}h`} verify
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-300 text-sm mb-6 line-clamp-3">{ad.description}</p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span className="text-xs font-medium text-slate-400">Shares</span>
                  </div>
                  <p className="text-lg font-bold text-slate-100">{ad.totalShares}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium text-slate-400">Verified</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-400">{ad.totalVerifiedShares}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-xs font-medium text-slate-400">Paid</span>
                  </div>
                  <p className="text-lg font-bold text-amber-400">₹{ad.totalRewardsPaid}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${ad.isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                  {ad.isActive ? 'Active' : 'Inactive'}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleAdStatus(ad._id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${ad.isActive
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                      }`}
                  >
                    {ad.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => editAd(ad)}
                    className="px-3 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl text-xs font-medium transition-all duration-200 border border-blue-500/30"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAd(ad._id)}
                    className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl text-xs font-medium transition-all duration-200 border border-red-500/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Advertisement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}
              </h3>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAd.title}
                      onChange={(e) => setNewAd(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="Advertisement title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reward Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newAd.rewardAmount}
                      onChange={(e) => setNewAd(prev => ({ ...prev, rewardAmount: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newAd.description}
                    onChange={(e) => setNewAd(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    placeholder="Describe your advertisement..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor *
                    </label>
                    <select
                      required
                      value={newAd.vendorId}
                      onChange={(e) => setNewAd(prev => ({ ...prev, vendorId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Period (hours) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="24"
                      value={newAd.verificationPeriodHours}
                      onChange={(e) => setNewAd(prev => ({ ...prev, verificationPeriodHours: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image *
                  </label>
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        {selectedFile ? (
                          <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Click to upload image</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 5MB</p>
                          </div>
                        )}
                      </label>
                    </div>

                    <div className="text-center">
                      <span className="text-sm text-gray-500">or</span>
                    </div>

                    <input
                      type="url"
                      value={newAd.image}
                      onChange={(e) => {
                        setNewAd(prev => ({ ...prev, image: e.target.value }));
                        if (e.target.value) setSelectedFile(null); // Clear file if URL is entered
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              </form>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingAd(null);
                    setSelectedFile(null);
                  }}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAd}
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    editingAd ? 'Update Advertisement' : 'Create Advertisement'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
