'use client';

import { useState, useEffect } from 'react';

interface Share {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  advertisement: {
    _id: string;
    title: string;
    image: string;
  };
  sharedAt: string;
  verificationDeadline: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  rewardAmount: number;
  proofImage?: string;
  rejectionReason?: string;
}

export default function VerificationsPage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShare, setSelectedShare] = useState<Share | null>(null);
  const [filter, setFilter] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  useEffect(() => {
    loadShares();
  }, [filter]);

  const loadShares = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/shares?status=${filter}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setShares(data.shares || []);
      } else {
        setShares([]);
      }
    } catch (error) {
      console.error('Error loading shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (shareId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/shares', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          shareId,
          action: 'approve'
        }),
      });

      if (response.ok) {
        // Update local state to reflect the change
      setShares(prev => prev.map(share =>
        share._id === shareId
          ? { ...share, status: 'verified' as const }
          : share
      ));
      setSelectedShare(null);
        alert('Share approved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to approve share'}`);
      }
    } catch (error) {
      console.error('Error verifying share:', error);
      alert('Failed to approve share. Please try again.');
    }
  };

  const handleReject = async () => {
    if (!selectedShare || !rejectionReason.trim()) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/shares', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          shareId: selectedShare._id,
          action: 'reject',
          rejectionReason: rejectionReason.trim()
        }),
      });

      if (response.ok) {
        // Update local state to reflect the change
      setShares(prev => prev.map(share =>
        share._id === selectedShare._id
          ? {
              ...share,
              status: 'rejected' as const,
              rejectionReason: rejectionReason.trim()
            }
          : share
      ));
      setSelectedShare(null);
      setRejectionReason('');
        setShowTransactionModal(false);
        alert('Share rejected successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to reject share'}`);
      }
    } catch (error) {
      console.error('Error rejecting share:', error);
      alert('Failed to reject share. Please try again.');
    }
  };

  const isExpired = (deadline: string) => {
    return new Date() > new Date(deadline);
  };

  const getStatusColor = (status: string, deadline?: string) => {
    if (status === 'verified') return 'bg-green-100 text-green-800';
    if (status === 'rejected') return 'bg-red-100 text-red-800';
    if (deadline && isExpired(deadline)) return 'bg-gray-100 text-gray-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (status: string, deadline?: string) => {
    if (status === 'verified') return 'Verified';
    if (status === 'rejected') return 'Rejected';
    if (deadline && isExpired(deadline)) return 'Expired';
    return 'Pending';
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Share Verifications
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">
          Review and verify advertisement shares to credit rewards
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">
                {shares.filter(s => s.status === 'pending' && !isExpired(s.verificationDeadline)).length}
              </p>
              <p className="text-slate-400 text-sm">Pending Review</p>
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
              <p className="text-2xl font-bold text-slate-100">{shares.filter(s => s.status === 'verified').length}</p>
              <p className="text-slate-400 text-sm">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{shares.filter(s => s.status === 'rejected').length}</p>
              <p className="text-slate-400 text-sm">Rejected</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-500/20 to-slate-600/20 backdrop-blur-xl rounded-2xl p-6 border border-slate-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{shares.filter(s => isExpired(s.verificationDeadline)).length}</p>
              <p className="text-slate-400 text-sm">Expired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'all', label: 'All Shares', count: shares.length, color: 'slate' },
            { key: 'pending', label: 'Pending Review', count: shares.filter(s => s.status === 'pending' && !isExpired(s.verificationDeadline)).length, color: 'amber' },
            { key: 'verified', label: 'Verified', count: shares.filter(s => s.status === 'verified').length, color: 'green' },
            { key: 'rejected', label: 'Rejected', count: shares.filter(s => s.status === 'rejected').length, color: 'red' },
            { key: 'expired', label: 'Expired', count: shares.filter(s => isExpired(s.verificationDeadline)).length, color: 'slate' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                filter === tab.key
                  ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white shadow-lg shadow-${tab.color}-500/25`
                  : `bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50`
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Shares List */}
      {loading ? (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/3"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-slate-700 rounded w-20"></div>
                  <div className="h-6 bg-slate-700 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : shares.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-100 mb-2">No Shares Found</h3>
          <p className="text-slate-400 mb-6">
            {filter === 'pending' ? 'No pending verifications at the moment' : `No ${filter} shares found`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
            {shares.map((share) => (
            <div key={share._id} className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/20">
                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                    {/* User Avatar */}
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                        {share.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Share Details */}
                    <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-100">{share.user.name}</h3>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        share.status === 'verified'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : share.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : share.status === 'pending' && !isExpired(share.verificationDeadline)
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                          {getStatusText(share.status, share.verificationDeadline)}
                      </div>
                      </div>

                    <p className="text-slate-300 text-sm mb-2">
                        Shared "{share.advertisement.title}"
                      </p>

                    <div className="flex items-center space-x-6 text-sm text-slate-400">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{new Date(share.sharedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-emerald-400 font-medium">₹{share.rewardAmount}</span>
                      </div>
                      {share.status === 'rejected' && share.rejectionReason && (
                        <div className="flex items-center space-x-1 text-red-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs">{share.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>

                  {/* Actions */}
                <div className="flex items-center space-x-3">
                  {share.status === 'pending' && !isExpired(share.verificationDeadline) ? (
                    <>
                      <button
                        onClick={() => handleVerify(share._id)}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedShare(share);
                          setShowTransactionModal(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg shadow-red-500/25 transition-all duration-300 hover:-translate-y-0.5"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <div className={`px-4 py-2 rounded-xl text-sm font-medium ${
                      share.status === 'verified'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : share.status === 'rejected'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                      {share.status === 'verified' ? 'Approved' : share.status === 'rejected' ? 'Rejected' : 'Expired'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && selectedShare && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl max-w-lg w-full border border-slate-700/50 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-8 pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-100">Reject Share</h3>
                  <p className="text-slate-400 text-sm">Provide a reason for rejection</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setSelectedShare(null);
                  setRejectionReason('');
                }}
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
                {/* Rejection Reason */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Rejection Reason</label>
                <textarea
                    placeholder="Explain why this share is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200 resize-none"
                />
                  <p className="text-xs text-slate-500 mt-1">This reason will be shown to the user</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="flex-1 px-6 py-4 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-slate-200 rounded-2xl font-semibold transition-all duration-200 border border-slate-600/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-2xl font-semibold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
