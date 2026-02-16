'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/app/AppHeader';
import CoinAmount from '@/components/app/CoinAmount';
import Link from 'next/link';
import {
  Share2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Filter,
  Eye,
} from 'lucide-react';

export default function MySharesPage() {
  const { token } = useAuth();
  const [shares, setShares] = useState<any[]>([]);
  const [filteredShares, setFilteredShares] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShare, setSelectedShare] = useState<any>(null);

  const filters = [
    { id: 'all', label: 'All', count: 0 },
    { id: 'pending', label: 'Pending', count: 0, color: 'text-amber-400' },
    { id: 'verified', label: 'Verified', count: 0, color: 'text-emerald-400' },
    { id: 'rejected', label: 'Rejected', count: 0, color: 'text-red-400' },
  ];

  useEffect(() => {
    fetchShares();
  }, [token]);

  useEffect(() => {
    filterShares();
  }, [shares, selectedFilter]);

  const fetchShares = async () => {
    try {
      const response = await fetch('/api/shares', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      const data = result.success && result.data ? result.data : [];
      
      // Map API response to expected format
      const mappedShares = data.map((s: any) => ({
        _id: s._id || s.id,
        status: s.status,
        createdAt: s.createdAt || s.sharedAt,
        reward: s.reward || s.rewardAmount,
        proofUrl: s.proofUrl || s.proofImage,
        rejectionReason: s.rejectionReason,
        verifiedAt: s.verifiedAt,
        advertisement: s.advertisement ? {
          _id: s.advertisement._id || s.advertisement.id,
          id: s.advertisement._id || s.advertisement.id,
          title: s.advertisement.title,
          description: s.advertisement.description || '',
          imageUrl: s.advertisement.image,
        } : null,
      }));
      
      setShares(mappedShares);
      setFilteredShares(mappedShares);

      // Update filter counts
      filters[0].count = mappedShares.length;
      filters[1].count = mappedShares.filter((s: any) => s.status === 'pending').length;
      filters[2].count = mappedShares.filter((s: any) => s.status === 'verified').length;
      filters[3].count = mappedShares.filter((s: any) => s.status === 'rejected').length;
    } catch (error) {
      console.error('Error fetching shares:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterShares = () => {
    if (selectedFilter === 'all') {
      setFilteredShares(shares);
    } else {
      setFilteredShares(shares.filter((s) => s.status === selectedFilter));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      verified: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
      pending: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
      rejected: 'bg-red-500/20 border-red-500/30 text-red-400',
      expired: 'bg-slate-500/20 border-slate-500/30 text-slate-400',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AppHeader title="My Shares" showBack={true} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <AppHeader title="My Shares" showBack={true} />

      <div className="max-w-md mx-auto px-4 pb-6">
        {/* Filter Tabs */}
        <div className="py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                  selectedFilter === filter.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                {filter.label}
                <span
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                    selectedFilter === filter.id
                      ? 'bg-white/20'
                      : 'bg-slate-700/50'
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Shares List */}
        <div className="space-y-3">
          {filteredShares.length === 0 ? (
            <div className="text-center py-16">
              <Share2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No shares found</h3>
              <p className="text-slate-500">
                {selectedFilter === 'all'
                  ? 'Start sharing ads to earn rewards!'
                  : `No ${selectedFilter} shares`}
              </p>
            </div>
          ) : (
            filteredShares.map((share) => (
              <div
                key={share._id}
                onClick={() => setSelectedShare(share)}
                className="glass-card rounded-2xl p-4 hover:border-emerald-500/30 transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 pt-1">{getStatusIcon(share.status)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold line-clamp-1 mb-2">
                          {share.advertisement?.title || 'Advertisement'}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-1 border rounded-lg text-xs font-semibold whitespace-nowrap ${getStatusBadge(
                              share.status
                            )}`}
                          >
                            {share.status.charAt(0).toUpperCase() + share.status.slice(1)}
                          </span>
                          {share.status === 'pending' && !share.proofUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-medium">
                              <AlertCircle className="w-3 h-3" />
                              Proof needed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                      {share.advertisement?.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        {new Date(share.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <CoinAmount
                        amount={share.reward || 0}
                        size="sm"
                        className={share.status === 'verified' ? '' : 'opacity-50'}
                      />
                    </div>

                    {share.rejectionReason && (
                      <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-xs text-red-400">{share.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Share Details Modal */}
      {selectedShare && (
        <div
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[60] flex items-end justify-center"
          onClick={() => setSelectedShare(null)}
        >
          <div
            className="bg-slate-900 w-full max-w-md rounded-t-3xl animate-slide-up border-t border-white/10 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="flex-shrink-0 pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto"></div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6">
              <div className="flex items-center gap-3 mb-4">
                {getStatusIcon(selectedShare.status)}
                <span
                  className={`px-3 py-1.5 border rounded-xl text-sm font-semibold ${getStatusBadge(
                    selectedShare.status
                  )}`}
                >
                  {selectedShare.status.charAt(0).toUpperCase() + selectedShare.status.slice(1)}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {selectedShare.advertisement?.title}
              </h3>
              
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">{selectedShare.advertisement?.description}</p>

              {/* No Proof Alert */}
              {selectedShare.status === 'pending' && !selectedShare.proofUrl && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-400 mb-1">Proof Required</p>
                    <p className="text-xs text-amber-300">
                      Upload proof of sharing to WhatsApp status to get your reward verified.
                    </p>
                  </div>
                </div>
              )}

              {/* Proof Image/Video */}
              {selectedShare.proofUrl && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-300 mb-2">Submitted Proof</p>
                  <div className="bg-slate-950 rounded-2xl overflow-hidden">
                    <img
                      src={selectedShare.proofUrl}
                      alt="Proof"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="glass-card rounded-xl p-4 space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm">Reward</span>
                  <CoinAmount amount={selectedShare.reward || 0} size="md" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm">Shared On</span>
                  <span className="text-white font-medium text-sm">
                    {new Date(selectedShare.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {selectedShare.verifiedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">Verified On</span>
                    <span className="text-emerald-400 font-medium text-sm">
                      {new Date(selectedShare.verifiedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {selectedShare.rejectionReason && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6">
                  <p className="text-sm font-semibold text-red-400 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-300">{selectedShare.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Fixed Bottom Button */}
            <div className="flex-shrink-0 p-6 pt-0 pb-8 bg-slate-900">
              {selectedShare.status === 'pending' && !selectedShare.proofUrl ? (
                <div className="space-y-3">
                  <Link
                    href={`/app/share/${selectedShare.advertisement?.id || selectedShare.advertisement?._id}`}
                    className="block w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold rounded-xl text-center"
                  >
                    Upload Proof
                  </Link>
                  <button
                    onClick={() => setSelectedShare(null)}
                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedShare(null)}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
