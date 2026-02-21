'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    phone: ''
  });
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordVendor, setPasswordVendor] = useState<Vendor | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadVendors();
  }, []);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    }
  };

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/vendors', {
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
      }
    } catch (error) {
      console.error('Error adding vendor:', error);
    }
  };

  const loadPackages = async () => {
    try {
      const res = await fetch('/api/admin/packages', {
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

  const toggleVendorStatus = (vendorId: string) => {
    setVendors(prev => prev.map(vendor =>
      vendor._id === vendorId
        ? { ...vendor, isActive: !vendor.isActive }
        : vendor
    ));
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
        setVendors(prev => prev.map(v =>
          v._id === vendorId
            ? { ...v, status, isActive: status === 'active' }
            : v
        ));
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

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Vendor Management
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">
          Manage business partners and their performance metrics
        </p>
      </div>

      {/* Add Vendor Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Vendor</span>
          </div>
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-slate-700 rounded-2xl"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-6 bg-slate-700 rounded-lg w-1/3"></div>
                    <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-16 bg-slate-700 rounded-xl"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-100 mb-2">No Vendors Yet</h3>
          <p className="text-slate-400 mb-6">Get started by adding your first vendor partner</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5"
          >
            Add First Vendor
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-100">{vendors.length}</p>
                  <p className="text-slate-400 text-sm">Total Vendors</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-100">{vendors.filter(v => v.isActive).length}</p>
                  <p className="text-slate-400 text-sm">Active Vendors</p>
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
                    ₹{vendors.reduce((sum, v) => sum + v.totalEarnings, 0).toLocaleString()}
                  </p>
                  <p className="text-slate-400 text-sm">Total Earnings</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vendors Table */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead className="bg-slate-800/80 text-slate-300">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Vendor</th>
                    <th className="px-6 py-4 font-semibold">Business</th>
                    <th className="px-6 py-4 font-semibold">Contact</th>
                    <th className="px-6 py-4 font-semibold">Balance</th>
                    <th className="px-6 py-4 font-semibold">Ads Left</th>
                    <th className="px-6 py-4 font-semibold">Total Ads</th>
                    <th className="px-6 py-4 font-semibold">Earnings</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {vendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-lg font-bold text-white">
                              {vendor.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{vendor.name}</p>
                            <p className="text-xs text-slate-400">ID: {vendor._id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-100 font-medium">{vendor.businessName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-slate-100">{vendor.email}</p>
                          {vendor.phone && <p className="text-slate-400 text-sm">{vendor.phone}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-emerald-400">₹{vendor.walletBalance}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${(vendor.adsRemaining || 0) > 0 ? 'text-violet-400' : 'text-slate-500'}`}>
                          {vendor.adsRemaining || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-100">{vendor.totalAds}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-emerald-400">₹{vendor.totalEarnings}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          vendor.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : vendor.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {vendor.status ? vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1) : (vendor.isActive ? 'Active' : 'Inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openAssignModal(vendor)}
                            className="px-3 py-1 bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 rounded-lg text-xs font-medium transition-all duration-200 border border-violet-500/30"
                          >
                            Assign Package
                          </button>
                          <button
                            onClick={() => openPasswordModal(vendor)}
                            className="px-3 py-1 bg-slate-700/40 text-slate-200 hover:bg-slate-600/50 border border-slate-600/50 rounded-lg text-xs font-medium transition-all duration-200"
                          >
                            Set Password
                          </button>
                          {vendor.status !== 'active' && (
                            <button
                              onClick={() => updateVendorStatus(vendor._id, 'active')}
                              disabled={statusLoading === vendor._id}
                              className="px-3 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50"
                            >
                              {statusLoading === vendor._id ? 'Approving...' : 'Approve'}
                            </button>
                          )}
                          {vendor.status !== 'rejected' && (
                            <button
                              onClick={() => updateVendorStatus(vendor._id, 'rejected')}
                              disabled={statusLoading === vendor._id}
                              className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50"
                            >
                              {statusLoading === vendor._id ? 'Saving...' : 'Reject'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      {showPasswordModal && passwordVendor && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl max-w-md w-full border border-slate-700/50 shadow-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-100">Set Vendor Password</h3>
                <p className="text-slate-400 text-sm">for {passwordVendor.name} ({passwordVendor.businessName})</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl flex items-center justify-center transition"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">New Password (min 6 chars)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                placeholder="Enter new password"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={saveVendorPassword}
                disabled={passwordSaving}
                className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {passwordSaving ? 'Saving...' : 'Save Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Package Modal */}
      {showAssignModal && selectedVendor && (
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
                  <h3 className="text-2xl font-bold text-slate-100">Assign Package</h3>
                  <p className="text-slate-400 text-sm">to {selectedVendor.name} ({selectedVendor.businessName})</p>
                </div>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-8 pb-8 space-y-5">
              <div className="bg-slate-700/30 rounded-xl p-4 flex items-center justify-between">
                <span className="text-slate-400 text-sm">Current ads remaining</span>
                <span className="text-violet-400 font-bold text-lg">{selectedVendor.adsRemaining || 0}</span>
              </div>

              {assignMessage && (
                <div className={`px-4 py-3 rounded-xl text-sm ${
                  assignMessage.includes('assigned') || assignMessage.includes('added')
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {assignMessage}
                </div>
              )}

              {packages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">No active packages available.</p>
                  <p className="text-slate-500 text-sm mt-1">Create packages first in the Packages section.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-300">Select a Package</label>
                  {packages.map((pkg) => (
                    <div
                      key={pkg._id}
                      onClick={() => setSelectedPackageId(pkg._id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selectedPackageId === pkg._id
                          ? 'bg-violet-500/20 border-violet-500/50 shadow-lg shadow-violet-500/10'
                          : 'bg-slate-700/20 border-slate-700/30 hover:border-slate-600/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-100 font-semibold">{pkg.name}</p>
                          <p className="text-slate-400 text-sm">{pkg.adLimit} ads &middot; ₹{pkg.price.toLocaleString()}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedPackageId === pkg._id ? 'border-violet-400 bg-violet-400' : 'border-slate-600'
                        }`}>
                          {selectedPackageId === pkg._id && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-6 py-4 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-slate-200 rounded-2xl font-semibold transition-all duration-200 border border-slate-600/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignPackage}
                  disabled={assigning || !selectedPackageId}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assigning ? 'Assigning...' : 'Assign Package'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl max-w-lg w-full border border-slate-700/50 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-8 pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-100">Add New Vendor</h3>
                  <p className="text-slate-400 text-sm">Create a new business partner account</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="px-8 pb-8">
              <div className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-1 h-4 bg-emerald-400 rounded-full"></div>
                    <h4 className="text-lg font-semibold text-slate-100">Personal Information</h4>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter full name"
                        value={newVendor.name}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={newVendor.email}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        placeholder="Create a secure password"
                        value={newVendor.password}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-1 h-4 bg-teal-400 rounded-full"></div>
                    <h4 className="text-lg font-semibold text-slate-100">Business Information</h4>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Business Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter business name"
                        value={newVendor.businessName}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, businessName: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number <span className="text-slate-500">(Optional)</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={newVendor.phone}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-4 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-slate-200 rounded-2xl font-semibold transition-all duration-200 border border-slate-600/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddVendor}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Create Vendor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
