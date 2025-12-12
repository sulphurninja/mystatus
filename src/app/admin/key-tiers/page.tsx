'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RefreshCw, Plus, Trash2 } from 'lucide-react';

interface KeyTier {
  _id?: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  commissions: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
    level6: number;
  };
  isActive: boolean;
}

const emptyTier: KeyTier = {
  name: '',
  minPrice: 0,
  maxPrice: 0,
  commissions: {
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    level5: 0,
    level6: 0
  },
  isActive: true
};

export default function KeyTiersPage() {
  const [tiers, setTiers] = useState<KeyTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadTiers();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '/admin/login';
    }
  };

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadTiers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/key-tiers', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await response.json();

      if (data.success) {
        setTiers(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to load key tiers',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load key tiers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTiers = async () => {
    // Validate
    for (const tier of tiers) {
      if (!tier.name.trim()) {
        toast({
          title: 'Error',
          description: 'All tiers must have a name',
          variant: 'destructive',
        });
        return;
      }
      if (tier.minPrice > tier.maxPrice) {
        toast({
          title: 'Error',
          description: `Invalid price range for "${tier.name}"`,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/key-tiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(tiers),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Key tiers saved successfully',
        });
        loadTiers();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to save key tiers',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save key tiers',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const initializeTiers = async () => {
    try {
      setInitializing(true);
      const response = await fetch('/api/admin/key-tiers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (data.success) {
        await loadTiers();
        toast({
          title: 'Success',
          description: 'Default key tiers initialized',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to initialize tiers',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize tiers',
        variant: 'destructive',
      });
    } finally {
      setInitializing(false);
    }
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMinPrice = lastTier ? lastTier.maxPrice + 1 : 0;
    
    setTiers([...tiers, {
      ...emptyTier,
      name: `Tier ${tiers.length + 1}`,
      minPrice: newMinPrice,
      maxPrice: newMinPrice + 10000
    }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: string, value: any) => {
    setTiers(tiers.map((tier, i) => {
      if (i !== index) return tier;
      
      if (field.startsWith('commissions.')) {
        const level = field.split('.')[1];
        return {
          ...tier,
          commissions: {
            ...tier.commissions,
            [level]: Math.max(0, value)
          }
        };
      }
      
      return { ...tier, [field]: value };
    }));
  };

  const resetToDefaults = () => {
    setTiers([
      {
        name: 'Standard',
        minPrice: 0,
        maxPrice: 5000,
        commissions: { level1: 500, level2: 300, level3: 200, level4: 100, level5: 50, level6: 50 },
        isActive: true
      },
      {
        name: 'Premium',
        minPrice: 5001,
        maxPrice: 15000,
        commissions: { level1: 1500, level2: 900, level3: 600, level4: 300, level5: 150, level6: 150 },
        isActive: true
      },
      {
        name: 'VIP',
        minPrice: 15001,
        maxPrice: 50000,
        commissions: { level1: 5000, level2: 3000, level3: 2000, level4: 1000, level5: 500, level6: 500 },
        isActive: true
      }
    ]);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Key Tiers
            </h1>
          </div>
          <p className="text-slate-400 text-lg font-medium">
            Configure commission rates based on key price
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Key Tiers
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">
          Configure commission rates based on key price - Different key prices = Different commissions
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-end">
        {tiers.length === 0 && (
          <button
            onClick={initializeTiers}
            disabled={initializing}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {initializing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Initialize Default Tiers
          </button>
        )}
        <button
          onClick={addTier}
          className="px-5 py-3 rounded-2xl border border-slate-700/50 bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Tier
        </button>
        <button
          onClick={resetToDefaults}
          className="px-5 py-3 rounded-2xl border border-slate-700/50 bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 transition-all duration-200 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reset to Defaults
        </button>
        <button
          onClick={saveTiers}
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {/* Tiers */}
      {tiers.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
          <div className="text-slate-400 text-lg">No key tiers configured</div>
          <p className="text-slate-500 mt-2">Click "Initialize Default Tiers" or "Add Tier" to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {tiers.map((tier, index) => (
            <div key={index} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
              {/* Tier Header */}
              <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Input
                    value={tier.name}
                    onChange={(e) => updateTier(index, 'name', e.target.value)}
                    className="bg-slate-800/60 border-slate-700/50 text-slate-100 font-semibold text-lg w-40"
                    placeholder="Tier Name"
                  />
                  <Badge variant={tier.isActive ? 'default' : 'secondary'}>
                    {tier.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <button
                  onClick={() => removeTier(index)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              {/* Tier Content */}
              <div className="p-6 space-y-6">
                {/* Price Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Min Key Price (₹)</label>
                    <Input
                      type="number"
                      value={tier.minPrice}
                      onChange={(e) => updateTier(index, 'minPrice', parseInt(e.target.value) || 0)}
                      className="bg-slate-800/60 border-slate-700/50 text-slate-100"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Max Key Price (₹)</label>
                    <Input
                      type="number"
                      value={tier.maxPrice}
                      onChange={(e) => updateTier(index, 'maxPrice', parseInt(e.target.value) || 0)}
                      className="bg-slate-800/60 border-slate-700/50 text-slate-100"
                      min="0"
                    />
                  </div>
                </div>

                {/* Commission Rates */}
                <div>
                  <label className="text-sm text-slate-400 mb-3 block">Commission Rates (Flat ₹)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <div key={level} className="bg-slate-800/40 rounded-xl p-3">
                        <div className="text-xs text-slate-500 mb-1">Level {level}</div>
                        <Input
                          type="number"
                          value={tier.commissions[`level${level}` as keyof typeof tier.commissions]}
                          onChange={(e) => updateTier(index, `commissions.level${level}`, parseInt(e.target.value) || 0)}
                          className="bg-slate-700/50 border-slate-600/50 text-slate-100 text-center"
                          min="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Commission Display */}
                <div className="flex items-center justify-between bg-slate-800/40 rounded-xl p-4">
                  <span className="text-slate-400">Total Commission (All Levels)</span>
                  <span className="text-2xl font-bold text-amber-400">
                    ₹{Object.values(tier.commissions).reduce((sum, val) => sum + val, 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-100">How Key Tiers Work</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="text-amber-400 font-semibold mb-2">₹2,000 Key (Standard)</div>
            <div className="text-sm text-slate-400">
              Uses "Standard" tier rates<br/>
              e.g., Level 1: ₹500, Level 2: ₹300...
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="text-amber-400 font-semibold mb-2">₹10,000 Key (Premium)</div>
            <div className="text-sm text-slate-400">
              Uses "Premium" tier rates<br/>
              e.g., Level 1: ₹1,500, Level 2: ₹900...
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="text-amber-400 font-semibold mb-2">₹25,000 Key (VIP)</div>
            <div className="text-sm text-slate-400">
              Uses "VIP" tier rates<br/>
              e.g., Level 1: ₹5,000, Level 2: ₹3,000...
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="text-amber-400 font-semibold mb-2">💡 How it works</div>
          <div className="text-sm text-slate-300">
            When a user purchases or renews a key, the system looks up which tier that key price falls into and applies those commission rates to the referral chain. Higher priced keys = Higher commissions for the network!
          </div>
        </div>
      </div>
    </div>
  );
}

