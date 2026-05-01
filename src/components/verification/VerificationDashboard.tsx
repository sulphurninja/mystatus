'use client';

import { useEffect, useState } from 'react';

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
  status: 'pending' | 'verified' | 'rejected';
  rewardAmount: number;
  proofImage?: string;
  rejectionReason?: string;
}

type VerificationDashboardProps = {
  tokenStorageKey?: string;
  apiBasePath?: string;
};

export default function VerificationDashboard({
  tokenStorageKey = 'verificationToken',
  apiBasePath = '/api/admin/shares'
}: VerificationDashboardProps) {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedShare, setSelectedShare] = useState<Share | null>(null);
  const [filter, setFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  useEffect(() => {
    loadShares();
  }, [filter]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem(tokenStorageKey);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadShares = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await fetch(`${apiBasePath}?status=${filter}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setShares(data.shares || []);
      } else {
        const errorData = await response.json().catch(() => null);
        setErrorMessage(errorData?.message || 'Failed to load shares.');
        setShares([]);
      }
    } catch (error) {
      console.error('Error loading shares:', error);
      setErrorMessage('Unable to load shares. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (shareId: string) => {
    try {
      const response = await fetch(apiBasePath, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          shareId,
          action: 'approve'
        }),
      });

      if (response.ok) {
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
      const response = await fetch(apiBasePath, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          shareId: selectedShare._id,
          action: 'reject',
          rejectionReason: rejectionReason.trim()
        }),
      });

      if (response.ok) {
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

  const getStatusText = (status: string) => {
    if (status === 'verified') return 'Verified';
    if (status === 'rejected') return 'Rejected';
    return 'Pending';
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredShares = normalizedSearch
    ? shares.filter((share) =>
      [
        share._id,
        share.user?.name,
        share.advertisement?.title,
      ].some((value) => value?.toLowerCase().includes(normalizedSearch))
    )
    : shares;

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 lg:p-8 space-y-8 text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Share Verifications
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Review and approve user proof submissions for rewards
          </p>
        </div>

        <div className="w-full md:w-auto space-y-3">
          <div className="flex bg-slate-800/40 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/50 overflow-x-auto">
            {[
              { key: 'pending', label: 'Pending' },
              { key: 'verified', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
              { key: 'all', label: 'All' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${filter === tab.key
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user, ad title, or share ID"
              className="w-full md:w-[360px] h-11 rounded-xl bg-slate-800/40 border border-slate-700/50 pl-11 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pending Review', count: shares.filter(s => s.status === 'pending').length, color: 'from-amber-500 to-orange-600', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Total Approved', count: shares.filter(s => s.status === 'verified').length, color: 'from-emerald-500 to-teal-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Total Rejections', count: shares.filter(s => s.status === 'rejected').length, color: 'from-rose-500 to-pink-600', icon: 'M6 18L18 6M6 6l12 12' },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden bg-slate-800/30 backdrop-blur-sm rounded-3xl p-6 border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-500">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`}></div>
            <div className="flex items-center space-x-5">
              <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stat.count}</p>
                <p className="text-slate-400 font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[280px] bg-slate-800/20 backdrop-blur-sm rounded-3xl border border-slate-700/50 animate-pulse"></div>
          ))}
        </div>
      ) : errorMessage ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-800/20 backdrop-blur-sm rounded-[3rem] border border-rose-500/20">
          <div className="w-24 h-24 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white">Unable to load submissions</h3>
          <p className="text-slate-400 mt-2 text-center max-w-sm">{errorMessage}</p>
        </div>
      ) : filteredShares.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-800/20 backdrop-blur-sm rounded-[3rem] border border-slate-700/50">
          <div className="w-24 h-24 bg-slate-700/30 rounded-3xl flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white">No submissions found</h3>
          <p className="text-slate-400 mt-2 text-center max-w-sm">
            {searchQuery.trim()
              ? `No results found for "${searchQuery.trim()}".`
              : `No shares are currently available in the ${filter} status filter.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredShares.map((share) => (
            <div key={share._id} className="group bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] border border-slate-700/50 hover:border-indigo-500/40 transition-all duration-300 overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-64 h-64 md:h-auto relative bg-black/40 overflow-hidden">
                {(() => {
                  const isDisplayableUrl = (url?: string) => url && (url.startsWith('http://') || url.startsWith('https://'));
                  const isVideoUrl = (url?: string) => url && (url.match(/\.(mp4|mov|m4v|webm)/) || url.includes('video/upload'));
                  const displayProofImage = isDisplayableUrl(share.proofImage) ? share.proofImage : null;
                  const displayAdImage = isDisplayableUrl(share.advertisement?.image) ? share.advertisement.image : null;
                  const imageToShow = displayProofImage || displayAdImage;

                  if (displayProofImage && isVideoUrl(displayProofImage)) {
                    return (
                      <video
                        src={displayProofImage}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        muted
                        onMouseOver={(e) => e.currentTarget.play()}
                        onMouseOut={(e) => e.currentTarget.pause()}
                      />
                    );
                  }

                  if (imageToShow) {
                    return (
                      <>
                        <img
                          src={imageToShow}
                          alt={displayProofImage ? 'Proof' : 'Advertisement'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        {!displayProofImage && displayAdImage && (
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-slate-300 font-medium">
                            Ad Image
                          </div>
                        )}
                        {share.proofImage && !displayProofImage && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                            <svg className="w-12 h-12 text-orange-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-orange-400 font-bold text-sm text-center px-4">Proof Upload Failed</span>
                            <span className="text-orange-300/70 text-xs mt-1 text-center px-4">User needs to resubmit from app</span>
                          </div>
                        )}
                      </>
                    );
                  }

                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-semibold uppercase tracking-widest">No Image</span>
                    </div>
                  );
                })()}
                <div className="absolute top-4 left-4">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${share.status === 'verified'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : share.status === 'rejected'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                    {getStatusText(share.status)}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg">
                      {share.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {share.user?.name || 'Anonymous User'}
                      </h3>
                      <p className="text-sm text-slate-400 font-medium">
                        Shared on {new Date(share.sharedAt).toLocaleDateString()} at {new Date(share.sharedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-700/30">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Advertisement</p>
                    <p className="text-slate-200 font-medium line-clamp-1">{share.advertisement?.title}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-indigo-400">Reward: {share.rewardAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 mt-auto">
                  {share.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleVerify(share._id)}
                        className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1 active:scale-95"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedShare(share);
                          setShowTransactionModal(true);
                        }}
                        className="flex-1 h-12 bg-slate-700/50 hover:bg-slate-700 text-white rounded-2xl font-bold border border-slate-600/50 transition-all duration-300 hover:-translate-y-1 active:scale-95"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <div className={`w-full h-12 flex items-center justify-center rounded-2xl font-bold text-sm uppercase tracking-widest border ${share.status === 'verified'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                      {share.status === 'verified' ? 'Already Approved' : 'Already Rejected'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showTransactionModal && selectedShare && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            onClick={() => {
              setShowTransactionModal(false);
              setSelectedShare(null);
            }}
          ></div>
          <div className="relative w-full max-w-xl bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl p-10 space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-white">Rejection Policy</h3>
                <p className="text-slate-400">Please provide a constructive reason for rejection.</p>
              </div>
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason"
              className="w-full min-h-[140px] rounded-2xl bg-slate-800/60 border border-slate-700/50 p-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setSelectedShare(null);
                  setRejectionReason('');
                }}
                className="flex-1 h-12 rounded-2xl border border-slate-700 text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 h-12 rounded-2xl bg-rose-600 text-white font-bold"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
