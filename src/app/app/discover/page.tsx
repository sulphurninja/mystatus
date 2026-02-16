'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/app/AppHeader';
import AdCard from '@/components/app/AdCard';
import CoinAmount from '@/components/app/CoinAmount';
import { Search, X } from 'lucide-react';
import Link from 'next/link';

export default function DiscoverPage() {
  const { token } = useAuth();
  const [ads, setAds] = useState<any[]>([]);
  const [filteredAds, setFilteredAds] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<any>(null);

  const filters = [
    { id: 'all', label: 'All Ads', icon: '🎯' },
    { id: 'instant', label: 'Instant', icon: '⚡' },
    { id: 'high-reward', label: 'High Reward', icon: '💰' },
    { id: 'new', label: 'New', icon: '✨' },
  ];

  useEffect(() => {
    fetchAds();
  }, [token]);

  useEffect(() => {
    filterAds();
  }, [ads, searchQuery, selectedFilter]);

  const fetchAds = async () => {
    try {
      const response = await fetch('/api/advertisements', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      const data = result.success && result.data ? result.data : [];
      
      // Map API response to expected format
      const mappedAds = data.map((ad: any) => ({
        _id: ad.id,
        title: ad.title,
        description: ad.description,
        imageUrl: ad.image,
        reward: ad.rewardAmount,
        verificationPeriod: ad.verificationPeriodHours === 0 ? 'instant' : `hour${ad.verificationPeriodHours}`,
        vendor: { name: ad.vendor?.businessName || ad.vendor?.name || 'Unknown' },
        views: 0,
        shares: ad.totalShares || 0,
        createdAt: ad.createdAt,
      }));
      
      setAds(mappedAds);
      setFilteredAds(mappedAds);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAds = () => {
    let filtered = [...ads];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (ad) =>
          ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ad.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ad.vendor?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'instant') {
        filtered = filtered.filter((ad) => ad.verificationPeriod === 'instant');
      } else if (selectedFilter === 'high-reward') {
        filtered = filtered.filter((ad) => ad.reward >= 10);
      } else if (selectedFilter === 'new') {
        // Sort by newest (assuming createdAt exists)
        filtered = filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    }

    setFilteredAds(filtered);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AppHeader title="Discover" showBack={false} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <AppHeader title="Discover" showBack={false} />

      <div className="max-w-md mx-auto px-4 pb-6">
        {/* Search Bar */}
        <div className="py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search advertisements..."
              className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                selectedFilter === filter.id
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-slate-400 border border-white/5 hover:border-white/10'
              }`}
            >
              <span className="text-xs">{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-slate-400 text-sm">
            {filteredAds.length} {filteredAds.length === 1 ? 'ad' : 'ads'} found
          </p>
        </div>

        {/* Ads Grid */}
        <div className="space-y-4">
          {filteredAds.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No ads found</h3>
              <p className="text-slate-500">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Check back later for new ads'}
              </p>
            </div>
          ) : (
            filteredAds.map((ad) => (
              <AdCard key={ad._id} ad={ad} onClick={() => setSelectedAd(ad)} />
            ))
          )}
        </div>
      </div>

      {/* Ad Details Modal */}
      {selectedAd && (
        <div
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[60] flex items-end justify-center"
          onClick={() => setSelectedAd(null)}
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
            <div className="flex-1 overflow-y-auto">
              {/* Image */}
              {selectedAd.imageUrl && (
                <div className="h-52 bg-slate-950">
                  <img
                    src={selectedAd.imageUrl}
                    alt={selectedAd.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex-1 pr-4">
                    {selectedAd.title}
                  </h3>
                  <CoinAmount amount={selectedAd.reward} size="md" />
                </div>
                
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">{selectedAd.description}</p>

                <div className="glass-card rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">Reward</span>
                    <CoinAmount amount={selectedAd.reward} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">Verification</span>
                    <span className="text-white text-sm font-medium">
                      {selectedAd.verificationPeriod === 'instant'
                        ? 'Instant'
                        : `${selectedAd.verificationPeriod?.replace('hour', '')}h`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">By</span>
                    <span className="text-white text-sm font-medium">{selectedAd.vendor?.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Actions */}
            <div className="flex-shrink-0 p-6 pt-0 pb-8 bg-slate-900">
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedAd(null)}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all"
                >
                  Close
                </button>
                <Link
                  href={`/app/share/${selectedAd._id}`}
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold rounded-xl text-center"
                >
                  Share & Earn
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
