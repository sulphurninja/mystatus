'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const [generateCount, setGenerateCount] = useState(10);
  const [generatePrice, setGeneratePrice] = useState(2000);
  const [generateForSale, setGenerateForSale] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadActivationKeys();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    }
  };

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  };

  const loadActivationKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/activation-keys', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setKeys(data.keys || []);
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
      const response = await fetch('/api/admin/activation-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          count: generateCount,
          price: generatePrice,
          isForSale: generateForSale
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
    }
  };

  const usedCount = keys.filter(key => key.isUsed).length;
  const unusedCount = keys.filter(key => !key.isUsed).length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Activation Keys
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">
          Generate and manage user activation keys
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{keys.length}</p>
              <p className="text-slate-400 text-sm">Total Keys</p>
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
              <p className="text-2xl font-bold text-slate-100">{usedCount}</p>
              <p className="text-slate-400 text-sm">Used Keys</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{unusedCount}</p>
              <p className="text-slate-400 text-sm">Available Keys</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">
                ₹{keys.filter(k => k.isForSale).reduce((sum, k) => sum + k.price, 0).toLocaleString()}
              </p>
              <p className="text-slate-400 text-sm">Market Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Keys Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowGenerateModal(true)}
          className="group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Generate New Keys</span>
          </div>
        </button>
      </div>

      {/* Keys Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-700/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-700/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">No Activation Keys</h3>
            <p className="text-slate-400 mb-6">Generate your first activation keys to get started</p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Generate Keys
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-800/80 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Key</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">For Sale</th>
                  <th className="px-4 py-3 font-semibold">Used By</th>
                  <th className="px-4 py-3 font-semibold">Purchased By</th>
                  <th className="px-4 py-3 font-semibold">Sold By</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Used At</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {keys.map((key) => (
                  <tr key={key._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 align-top">
                      <code className="text-xs font-mono bg-slate-800/70 px-2 py-1 rounded-lg block break-all">{key.key}</code>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        key.isUsed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : key.isForSale
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-600/40 text-slate-200 border border-slate-600/60'
                      }`}>
                        {key.isUsed ? 'Used' : key.isForSale ? 'For Sale' : 'Generated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">₹{key.price}</td>
                    <td className="px-4 py-3 align-top">{key.isForSale ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 align-top">
                      {key.usedBy ? (
                        <div>
                          <p className="font-semibold text-slate-100">{key.usedBy.name}</p>
                          {key.usedBy.email && <p className="text-xs text-slate-400">{key.usedBy.email}</p>}
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {key.purchasedBy ? (
                        <div>
                          <p className="font-semibold text-slate-100">{key.purchasedBy.name}</p>
                          {key.purchasedBy.email && <p className="text-xs text-slate-400">{key.purchasedBy.email}</p>}
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {key.soldBy ? (
                        <div>
                          <p className="font-semibold text-slate-100">{key.soldBy.name}</p>
                          {key.soldBy.email && <p className="text-xs text-slate-400">{key.soldBy.email}</p>}
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">{new Date(key.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 align-top">
                      {key.usedAt ? new Date(key.usedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        {!key.isUsed && (
                          <button
                            onClick={() => toggleKeyForSale(key._id)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                              key.isForSale
                                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                                : 'bg-slate-700/50 text-slate-200 hover:bg-slate-600/50 border border-slate-600/50'
                            }`}
                          >
                            {key.isForSale ? 'Remove Sale' : 'Put for Sale'}
                          </button>
                        )}
                        <button className="px-3 py-2 bg-slate-700/50 text-slate-200 hover:bg-slate-600/50 rounded-xl text-xs font-medium transition-all duration-200 border border-slate-600/50">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Keys Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl max-w-lg w-full border border-slate-700/50 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-8 pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-100">Generate Keys</h3>
                  <p className="text-slate-400 text-sm">Create new activation keys for users</p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
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
                {/* Count Input */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Number of Keys</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h16" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="10"
                      value={generateCount}
                      onChange={(e) => setGenerateCount(parseInt(e.target.value) || 10)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Maximum 100 keys per batch</p>
                </div>

                {/* Price Input */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Price per Key (₹)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-400 font-semibold">₹</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="2000"
                      value={generatePrice}
                      onChange={(e) => setGeneratePrice(parseInt(e.target.value) || 2000)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Set to 0 for free keys</p>
                </div>

                {/* Marketplace Toggle */}
                <div className="bg-slate-700/30 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-slate-100 font-medium mb-1">Available for Sale</h4>
                      <p className="text-slate-400 text-sm">Users can purchase these keys on the marketplace</p>
                    </div>
                    <button
                      onClick={() => setGenerateForSale(!generateForSale)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        generateForSale ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          generateForSale ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {generateForSale && (
                    <div className="mt-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <p className="text-xs text-emerald-400">
                        ✓ Users can earn referral commissions when they sell these keys
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-6 py-4 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-slate-200 rounded-2xl font-semibold transition-all duration-200 border border-slate-600/50"
                >
                  Cancel
                </button>
                <button
                  onClick={generateKeys}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Generate Keys
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
