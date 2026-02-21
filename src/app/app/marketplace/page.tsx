'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/app/AppHeader';
import { ShoppingBag, Key, Crown, CheckCircle2, Loader2, Store, Search, Plus, Users } from 'lucide-react';

export default function MarketplacePage() {
  const { token, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [keyTiers, setKeyTiers] = useState<any[]>([]);
  const [vendorPackages, setVendorPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [purchasingKey, setPurchasingKey] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [selectedVendorPackage, setSelectedVendorPackage] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'keys' | 'vendors'>('keys');

  // vendor purchase flow state
  const [vendorSearch, setVendorSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [vendorForm, setVendorForm] = useState({ name: '', email: '', businessName: '', phone: '' });
  const [purchasingVendorPkg, setPurchasingVendorPkg] = useState(false);

  useEffect(() => {
    fetchKeyTiers();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'vendors') {
      fetchVendorPackages();
    }
  }, [activeTab, token]);

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

  const fetchVendorPackages = async () => {
    try {
      setVendorLoading(true);
      const res = await fetch('/api/vendor/packages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVendorPackages(data.data || []);
      } else {
        setVendorPackages([]);
      }
    } catch (e) {
      console.error('Error fetching vendor packages', e);
      setVendorPackages([]);
    } finally {
      setVendorLoading(false);
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
      router.push('/app/profile');
    } catch (error: any) {
      alert(error.message || 'Failed to purchase key');
    } finally {
      setPurchasingKey(null);
    }
  };

  const runVendorSearch = async () => {
    if (!vendorSearch || vendorSearch.length < 2) return;
    try {
      setSearching(true);
      const res = await fetch(`/api/vendor/search?query=${encodeURIComponent(vendorSearch)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data || []);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.error('Vendor search error', e);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleVendorPackagePurchase = async () => {
    if (!selectedVendorPackage) return;
    if (!createMode && !selectedVendorId) {
      alert('Select a vendor or add a new one');
      return;
    }
    if (createMode && (!vendorForm.name || !vendorForm.email || !vendorForm.businessName)) {
      alert('Fill required fields for new vendor');
      return;
    }

    setPurchasingVendorPkg(true);
    try {
      const payload: any = { packageId: selectedVendorPackage.id };
      if (createMode) {
        payload.vendorForm = vendorForm;
      } else {
        payload.vendorId = selectedVendorId;
      }

      const res = await fetch('/api/vendor/package/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Purchase failed');
      }

      await refreshUserProfile();
      alert('Vendor package recorded. Pending admin approval.');
      setSelectedVendorPackage(null);
      setSelectedVendorId(null);
      setVendorForm({ name: '', email: '', businessName: '', phone: '' });
      setSearchResults([]);
      setVendorSearch('');
      router.push('/app/profile');
    } catch (e: any) {
      alert(e.message || 'Failed to purchase vendor package');
    } finally {
      setPurchasingVendorPkg(false);
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
        {/* Tabs */}
        <div className="flex bg-slate-800/50 border border-slate-700/60 rounded-2xl p-1 mt-4 mb-6">
          <button
            onClick={() => setActiveTab('keys')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'keys'
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                : 'text-slate-300'
            }`}
          >
            Activation Keys
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'vendors'
                ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40'
                : 'text-slate-300'
            }`}
          >
            Vendor Packages
          </button>
        </div>

        {activeTab === 'keys' && (
          <>
            {/* Header */}
            <div className="py-4">
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
          </>
        )}

        {activeTab === 'vendors' && (
          <>
            <div className="py-4">
              <div className="flex items-center gap-3 mb-3">
                <Store className="w-8 h-8 text-violet-400" />
                <h1 className="text-2xl font-bold text-slate-100">Vendor Packages</h1>
              </div>
              <p className="text-slate-400">
                Buy a vendor package and assign it to an existing or new vendor. Admin approval required before activation.
              </p>
            </div>

            <div className="space-y-4">
              {vendorLoading ? (
                <div className="text-center py-16 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
                  <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-3" />
                  <p className="text-slate-400">Loading packages...</p>
                </div>
              ) : vendorPackages.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
                  <Store className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No vendor packages available</p>
                </div>
              ) : (
                vendorPackages.map((pkg, idx) => (
                  <div
                    key={pkg.id}
                    className={`relative bg-slate-800/50 backdrop-blur-sm border rounded-3xl p-6 transition-all hover:border-violet-500/50 ${
                      idx === 0 ? 'border-violet-500/30 shadow-lg shadow-violet-500/10' : 'border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-slate-100 mb-1">{pkg.name}</h3>
                        <p className="text-sm text-slate-400">{pkg.description}</p>
                      </div>
                      <div className="w-12 h-12 bg-violet-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-violet-300" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-300 mb-4">
                      <span>Ad slots included</span>
                      <span className="font-semibold text-violet-300">{pkg.adLimit}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Price</p>
                        <p className="text-2xl font-bold text-violet-300">₹{pkg.price || 0}</p>
                      </div>
                      <button
                        onClick={() => setSelectedVendorPackage(pkg)}
                        className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-lg hover:shadow-violet-500/40 text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
                      >
                        Assign & Purchase
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
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

      {/* Vendor Package Modal */}
      {selectedVendorPackage && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={() => setSelectedVendorPackage(null)}
        >
          <div
            className="bg-slate-900 w-full max-w-md rounded-t-3xl p-6 pb-32 animate-slide-up space-y-4 max-h-[82vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-2"></div>
            <h3 className="text-2xl font-bold text-slate-100">Assign Vendor Package</h3>
            <p className="text-slate-400">
              Package: <span className="text-violet-300 font-semibold">{selectedVendorPackage.name}</span> · ₹{selectedVendorPackage.price} · {selectedVendorPackage.adLimit} ad slots
            </p>

            {/* Toggle existing vs new vendor */}
            <div className="grid grid-cols-2 gap-2 bg-slate-800/60 p-1 rounded-2xl border border-slate-700/60">
              <button
                onClick={() => setCreateMode(false)}
                className={`py-2 rounded-xl text-sm font-semibold ${!createMode ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40' : 'text-slate-300'}`}
              >
                Existing Vendor
              </button>
              <button
                onClick={() => setCreateMode(true)}
                className={`py-2 rounded-xl text-sm font-semibold ${createMode ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40' : 'text-slate-300'}`}
              >
                New Vendor
              </button>
            </div>

            {!createMode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-slate-800/60 border border-slate-700/50 rounded-xl px-3">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                      placeholder="Search by name, email or phone"
                      className="flex-1 bg-transparent px-2 py-2 text-slate-100 outline-none"
                    />
                  </div>
                  <button
                    onClick={runVendorSearch}
                    className="px-3 py-2 bg-slate-800 rounded-xl text-sm text-slate-200 border border-slate-700 hover:border-slate-600"
                  >
                    Search
                  </button>
                </div>
                <div className="max-h-44 overflow-auto space-y-2">
                  {searching && (
                    <div className="text-slate-400 text-sm">Searching...</div>
                  )}
                  {!searching && searchResults.length === 0 && (
                    <div className="text-slate-500 text-sm">No vendors yet.</div>
                  )}
                  {searchResults.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVendorId(v.id)}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        selectedVendorId === v.id
                          ? 'border-violet-500/50 bg-violet-500/10'
                          : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-100 font-semibold">{v.name}</p>
                          <p className="text-slate-400 text-xs">{v.businessName}</p>
                          <p className="text-slate-500 text-xs">{v.email}{v.phone ? ` · ${v.phone}` : ''}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          v.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-200'
                            : 'bg-amber-500/20 text-amber-200'
                        }`}>
                          {v.status || 'pending'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 text-xs">Full Name *</label>
                  <input
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-100 outline-none"
                    placeholder="Vendor name"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs">Email *</label>
                  <input
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-100 outline-none"
                    placeholder="vendor@example.com"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs">Business Name *</label>
                  <input
                    value={vendorForm.businessName}
                    onChange={(e) => setVendorForm(f => ({ ...f, businessName: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-100 outline-none"
                    placeholder="Business name"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs">Phone</label>
                  <input
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-100 outline-none"
                    placeholder="Optional"
                  />
                </div>
                <p className="text-xs text-amber-300">New vendors will be pending until admin approval.</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedVendorPackage(null)}
                disabled={purchasingVendorPkg}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVendorPackagePurchase}
                disabled={purchasingVendorPkg}
                className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {purchasingVendorPkg ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
