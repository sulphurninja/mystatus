'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  activationKey: string;
  walletBalance: number;
  referralLevel: number;
  referralCode: string;
  isActive: boolean;
  canShareAds: boolean;
  createdAt: string;
  lastLogin?: string;
  totalCommissionEarned: number;
}

interface ReferralInfo {
  totalReferrals: number;
  activeReferrals: number;
  referralLevel: number;
  totalCommissionEarned: number;
  directReferrals: Array<{
    id: string;
    name: string;
    referralCode: string;
    joinedAt: string;
    isActive: boolean;
  }>;
  commissionBreakdown: Array<{
    level: number;
    referralBonus: number;
    levelBonus: number;
    keyPurchaseBonus: number;
    totalEarned: number;
    totalCommissions: number;
  }>;
  stats: {
    totalReferrals: number;
    activeReferrals: number;
    pendingReferrals: number;
  };
}

interface AvailableKey {
  _id: string;
  key: string;
  price: number;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  reference?: {
    id: string;
    title: string;
    rewardAmount: number;
  } | null;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'transactions'>('overview');
  const [showAssignKeyModal, setShowAssignKeyModal] = useState(false);
  const [availableKeys, setAvailableKeys] = useState<AvailableKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [assigningKey, setAssigningKey] = useState(false);
  const [keysLoading, setKeysLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setReferralInfo(data.referralInfo);
      } else {
        router.push('/admin/users');
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          userId: user._id,
          action: 'toggle-status'
        }),
      });

      if (response.ok) {
        setUser(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };


  const loadTransactions = async () => {
    if (!user) return;

    try {
      setTransactionsLoading(true);
      const response = await fetch(`/api/admin/users/${user._id}/transactions?limit=50`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleTabChange = (tab: 'overview' | 'network' | 'transactions') => {
    setActiveTab(tab);
    if (tab === 'transactions' && transactions.length === 0) {
      loadTransactions();
    }
  };

  const loadAvailableKeys = async () => {
    if (!user || user.activationKey) return;

    try {
      setKeysLoading(true);
      const response = await fetch('/api/admin/available-keys', {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Error loading available keys:', error);
    } finally {
      setKeysLoading(false);
    }
  };

  const handleOpenAssignKeyModal = () => {
    if (!user || user.activationKey) {
      alert('User already has an activation key');
      return;
    }
    setShowAssignKeyModal(true);
    loadAvailableKeys();
  };

  const handleAssignKey = async () => {
    if (!user || !selectedKeyId) {
      alert('Please select a key to assign');
      return;
    }

    try {
      setAssigningKey(true);
      const response = await fetch('/api/admin/assign-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          userId: user._id,
          keyId: selectedKeyId
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Key assigned successfully!');
        setUser(prev => prev ? { ...prev, activationKey: data.data.key } : null);
        setShowAssignKeyModal(false);
        setSelectedKeyId('');
      } else {
        alert(data.message || 'Failed to assign key');
      }
    } catch (error) {
      console.error('Error assigning key:', error);
      alert('Error assigning key');
    } finally {
      setAssigningKey(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-slate-700 rounded-2xl"></div>
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-slate-700 rounded-lg w-3/4"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-100 mb-4">User Not Found</h2>
          <Link
            href="/admin/users"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5"
          >
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/users"
            className="w-10 h-10 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            User Details
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium ml-16">
          Detailed information and network analytics for {user.name}
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-100">{user.name}</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  user.isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {user.email && (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-slate-300">{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-slate-300">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8v6m0 0v2a2 2 0 002 2h4a2 2 0 002-2v-2m0-6V7m0 6v6m0-6h6m-6 0H8" />
                  </svg>
                  <span className="text-slate-300">Key: {user.activationKey || 'Not Activated'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className="text-slate-300">Balance: ₹{user.walletBalance}</span>
                </div>
              </div>
            </div>

            {/* Referral Code */}
            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-slate-100 font-semibold mb-1">Referral Code</h4>
                  <code className="text-emerald-400 font-mono text-lg">{user.referralCode}</code>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(user.referralCode)}
                  className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl text-sm font-medium transition-all duration-200 border border-emerald-500/30"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={toggleUserStatus}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                user.isActive
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
              }`}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
            {!user.activationKey && (
              <button
                onClick={handleOpenAssignKeyModal}
                className="px-4 py-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-xl text-sm font-medium transition-all duration-200 border border-purple-500/30"
              >
                Assign Key
              </button>
            )}
            <button className="px-4 py-2 bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 rounded-xl text-sm font-medium transition-all duration-200 border border-slate-600/50">
              Edit User
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-2 border border-slate-700/50">
        <div className="flex space-x-2">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'network', label: 'Network', icon: '👥' },
            { id: 'transactions', label: 'Transactions', icon: '💳' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{referralInfo?.totalReferrals || 0}</p>
                <p className="text-slate-400 text-sm">Total Referrals</p>
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
                <p className="text-2xl font-bold text-slate-100">{referralInfo?.activeReferrals || 0}</p>
                <p className="text-slate-400 text-sm">Active Referrals</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">Level {user.referralLevel}</p>
                <p className="text-slate-400 text-sm">Current Level</p>
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
                <p className="text-2xl font-bold text-slate-100">₹{user.totalCommissionEarned}</p>
                <p className="text-slate-400 text-sm">Total Earnings</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="space-y-6">
          {/* Direct Referrals */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Direct Referrals</h3>
            {referralInfo?.directReferrals.length ? (
              <div className="space-y-3">
                {referralInfo.directReferrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                        <span className="text-lg font-bold text-white">
                          {referral.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-slate-100 font-semibold">{referral.name}</p>
                        <p className="text-slate-400 text-sm">Code: {referral.referralCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        referral.isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {referral.isActive ? 'Active' : 'Inactive'}
                      </div>
                      <p className="text-slate-400 text-xs mt-1">
                        Joined {new Date(referral.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-slate-400">No direct referrals yet</p>
              </div>
            )}
          </div>

          {/* Commission Breakdown */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Commission Breakdown</h3>
            {referralInfo?.commissionBreakdown.length ? (
              <div className="space-y-4">
                {referralInfo.commissionBreakdown.map((level) => (
                  <div key={level.level} className="bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          level.level <= user.referralLevel
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-600 text-slate-400'
                        }`}>
                          {level.level}
                        </div>
                        <div>
                          <p className="text-slate-100 font-semibold">Level {level.level}</p>
                          <p className="text-slate-400 text-sm">
                            {level.level === 1 ? 'Direct Referrals' : `Level ${level.level} Network`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">₹{level.totalEarned}</p>
                        <p className="text-slate-400 text-sm">{level.totalCommissions} commissions</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {level.referralBonus > 0 && (
                        <div className="bg-slate-600/40 rounded-lg p-3">
                          <p className="text-slate-400">Referral Bonus</p>
                          <p className="text-slate-100 font-semibold">₹{level.referralBonus}</p>
                        </div>
                      )}
                      {level.levelBonus > 0 && (
                        <div className="bg-slate-600/40 rounded-lg p-3">
                          <p className="text-slate-400">Level Bonus</p>
                          <p className="text-slate-100 font-semibold">{level.levelBonus}%</p>
                        </div>
                      )}
                      {level.keyPurchaseBonus > 0 && (
                        <div className="bg-slate-600/40 rounded-lg p-3">
                          <p className="text-slate-400">Key Purchase</p>
                          <p className="text-slate-100 font-semibold">{level.keyPurchaseBonus}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <p className="text-slate-400">No commission data available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold text-slate-100 mb-6">Transaction History</h3>

            {transactionsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-700/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h4 className="text-lg font-semibold text-slate-100 mb-2">No Transactions</h4>
                <p className="text-slate-400">This user hasn't made any transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="bg-slate-700/30 rounded-xl p-4 hover:bg-slate-700/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          transaction.type === 'credit'
                            ? 'bg-green-500/20'
                            : 'bg-red-500/20'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-slate-100 font-semibold">{transaction.reason}</p>
                          <p className="text-slate-400 text-sm">{transaction.description}</p>
                          {transaction.reference && (
                            <p className="text-emerald-400 text-xs mt-1">
                              {transaction.reference.title} (₹{transaction.reference.rewardAmount})
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-slate-500 text-xs">
                          Balance: ₹{transaction.balanceAfter}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Key Modal */}
      {showAssignKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700/50">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Assign Activation Key</h3>

            {keysLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-700/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : availableKeys.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">No available keys found</p>
                <p className="text-slate-500 text-sm">You need to create or have available keys first</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Select Key</label>
                  <select
                    value={selectedKeyId}
                    onChange={(e) => setSelectedKeyId(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose a key --</option>
                    {availableKeys.map((key) => (
                      <option key={key._id} value={key._id}>
                        {key.key} - ₹{key.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-700/20 rounded-xl p-3 border border-slate-700/50">
                  <p className="text-slate-400 text-xs">
                    <strong>Note:</strong> The user's referral chain will receive commissions as if they purchased this key themselves.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowAssignKeyModal(false);
                      setSelectedKeyId('');
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 rounded-xl font-medium transition-all duration-200 border border-slate-600/50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignKey}
                    disabled={!selectedKeyId || assigningKey}
                    className="flex-1 px-4 py-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-200 border border-purple-500/30"
                  >
                    {assigningKey ? 'Assigning...' : 'Assign Key'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
