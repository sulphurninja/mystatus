'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/app/AppHeader';
import { ShoppingBag, Key, Crown, CheckCircle2, Loader2 } from 'lucide-react';

export default function MarketplacePage() {
  const { token, refreshUserProfile } = useAuth();
  const [keyTiers, setKeyTiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingKey, setPurchasingKey] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<any>(null);

  useEffect(() => {
    fetchKeyTiers();
  }, [token]);

  const fetchKeyTiers = async () => {
    try {
      const response = await fetch('/api/marketplace', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      let keys: any[] = [];
      
      if (result.success && result.data) {
        keys = result.data;
      }
      
      // Group keys by price/tier - show one card per tier
      const tierMap = new Map<string, any>();
      
      keys.forEach((key: any) => {
        const tierKey = `${key.price}-${key.name}`;
        if (!tierMap.has(tierKey)) {
          tierMap.set(tierKey, {
            _id: tierKey, // Use tier key as ID for grouping
            name: key.name,
            description: key.description || '',
            price: key.price,
            validity: key.validityDays || 30,
            features: key.features || [],
            availableKeys: [], // Store all available key IDs for this tier
          });
        }
        // Add this key ID to the tier's available keys
        tierMap.get(tierKey)!.availableKeys.push(key.id || key._id);
      });
      
      // Convert map to array and sort by price
      const groupedTiers = Array.from(tierMap.values()).sort((a, b) => a.price - b.price);
      
      setKeyTiers(groupedTiers);
    } catch (error) {
      console.error('Error fetching key tiers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (tier: any) => {
    setPurchasingKey(tier._id);

    try {
      // Pick the first available key from this tier
      const keyId = tier.availableKeys?.[0];
      if (!keyId) {
        throw new Error('No keys available for this tier');
      }

      const response = await fetch('/api/marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keyId }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Purchase failed');
      }

      await refreshUserProfile();
      setSelectedTier(null);
      // Refresh tiers to update available count
      await fetchKeyTiers();
      alert('Key purchased successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to purchase key');
    } finally {
      setPurchasingKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AppHeader title="Marketplace" showBack={true} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <AppHeader title="Marketplace" showBack={true} />

      <div className="max-w-md mx-auto px-4 pb-6">
        {/* Header */}
        <div className="py-6">
          <div className="flex items-center gap-3 mb-3">
            <ShoppingBag className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold text-slate-100">Purchase Activation Keys</h1>
          </div>
          <p className="text-slate-400">
            Required for withdrawals. Earn multi-level commissions up to 6 levels. Higher limits with more referrals.
          </p>
        </div>

        {/* Key Tiers */}
        <div className="space-y-4">
          {keyTiers.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
              <Key className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No keys available</p>
            </div>
          ) : (
            keyTiers.map((tier, index) => {
              const isPopular = index === 1; // Make the second tier "popular"
              return (
                <div
                  key={tier._id}
                  className={`relative bg-slate-800/50 backdrop-blur-sm border rounded-3xl p-6 transition-all hover:border-emerald-500/50 ${
                    isPopular
                      ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-700/50'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        POPULAR
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-100 mb-1">{tier.name}</h3>
                      <p className="text-sm text-slate-400">{tier.description}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Key className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {tier.features?.map((feature: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price & Purchase */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Price</p>
                      <p className="text-2xl font-bold text-emerald-400">₹{tier.price || 0}</p>
                      {tier.availableKeys?.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          {tier.availableKeys.length} available
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedTier(tier)}
                      disabled={!tier.availableKeys || tier.availableKeys.length === 0}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/50 text-white font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Purchase
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      {selectedTier && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={() => setSelectedTier(null)}
        >
          <div
            className="bg-slate-900 w-full max-w-md rounded-t-3xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6"></div>
            
            <h3 className="text-2xl font-bold text-slate-100 mb-2">Confirm Purchase</h3>
            <p className="text-slate-400 mb-6">
              You are about to purchase the <span className="text-emerald-400 font-semibold">{selectedTier.name}</span> key
            </p>

            <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Key Tier</span>
                <span className="text-slate-100 font-semibold">{selectedTier.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Validity</span>
                <span className="text-slate-100 font-semibold">{selectedTier.validity || 30} days</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                <span className="text-slate-300 font-medium">Total</span>
                <span className="text-2xl font-bold text-emerald-400">₹{selectedTier.price || 0}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTier(null)}
                disabled={purchasingKey !== null}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePurchase(selectedTier)}
                disabled={purchasingKey !== null}
                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {purchasingKey ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Purchase'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
