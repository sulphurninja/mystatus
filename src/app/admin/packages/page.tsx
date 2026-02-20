'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const [formData, setFormData] = useState({ name: '', description: '', price: '', adLimit: '' });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) router.push('/admin/login');
    loadPackages();
  }, []);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadPackages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/packages', { headers: { ...getAuthHeaders() } });
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages || []);
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
      adLimit: String(pkg.adLimit)
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
        adLimit: Number(formData.adLimit)
      };

      const url = editingPkg
        ? `/api/admin/packages/${editingPkg._id}`
        : '/api/admin/packages';

      const res = await fetch(url, {
        method: editingPkg ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await loadPackages();
        setShowModal(false);
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
        body: JSON.stringify({ isActive: !pkg.isActive })
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
        headers: { ...getAuthHeaders() }
      });
      await loadPackages();
    } catch (e) {
      console.error('Error deleting package:', e);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-violet-400 to-purple-500 rounded-full"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Package Management
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">
          Create and manage ad packages for vendors
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="group relative bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Package</span>
          </div>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-700 rounded-lg w-2/3"></div>
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-12 bg-slate-700 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-100 mb-2">No Packages Yet</h3>
          <p className="text-slate-400 mb-6">Create your first ad package for vendors</p>
          <button onClick={openCreate} className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5">
            Create First Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg._id} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-100">{pkg.name}</h3>
                    {pkg.description && (
                      <p className="text-slate-400 text-sm mt-1">{pkg.description}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    pkg.isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {pkg.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                      {pkg.adLimit}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">Ads Included</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                      ₹{pkg.price.toLocaleString()}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">Price</p>
                  </div>
                </div>

                <div className="bg-slate-700/20 rounded-xl p-3 text-center">
                  <p className="text-slate-300 text-sm">
                    ₹{(pkg.price / pkg.adLimit).toFixed(0)} per ad
                  </p>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => openEdit(pkg)}
                    className="flex-1 px-4 py-2.5 bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 rounded-xl text-sm font-medium transition-all duration-200 border border-slate-600/50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(pkg)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      pkg.isActive
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30'
                    }`}
                  >
                    {pkg.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => deletePkg(pkg)}
                    className="px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-medium transition-all duration-200 border border-red-500/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl max-w-lg w-full border border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between p-8 pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-100">
                    {editingPkg ? 'Edit Package' : 'Create Package'}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {editingPkg ? 'Update package details' : 'Define a new ad package for vendors'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-8 pb-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Package Name</label>
                <input
                  type="text"
                  placeholder="e.g. Basic, Premium, Enterprise"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description <span className="text-slate-500">(Optional)</span></label>
                <textarea
                  placeholder="Brief description of the package"
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="500"
                    value={formData.price}
                    onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))}
                    className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Ad Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={formData.adLimit}
                    onChange={(e) => setFormData(p => ({ ...p, adLimit: e.target.value }))}
                    className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                  />
                </div>
              </div>

              {formData.price && formData.adLimit && Number(formData.adLimit) > 0 && (
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 text-center">
                  <p className="text-violet-300 text-sm">
                    Cost per ad: <span className="font-bold text-lg">₹{(Number(formData.price) / Number(formData.adLimit)).toFixed(0)}</span>
                  </p>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-4 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-slate-200 rounded-2xl font-semibold transition-all duration-200 border border-slate-600/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.name || !formData.price || !formData.adLimit}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : editingPkg ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
