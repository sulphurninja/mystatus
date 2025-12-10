'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RefreshCw } from 'lucide-react';

interface CommissionRate {
  level: number;
  referralBonus: number;
  levelBonus: number;
  keyPurchaseBonus: number;
  isActive: boolean;
}

export default function CommissionRatesPage() {
  const [rates, setRates] = useState<CommissionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadRates();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '/admin/login';
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

  const loadRates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/commission-rates', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await response.json();

      if (data.success) {
        setRates(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to load commission rates',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load commission rates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRate = (level: number, field: keyof CommissionRate, value: number | boolean) => {
    // Add reasonable validation limits
    if (typeof value === 'number') {
      if (field === 'referralBonus' && value < 0) value = 0;
      if (field === 'referralBonus' && value > 5000) value = 5000; // Max ₹5000 for referral bonus
      if ((field === 'levelBonus' || field === 'keyPurchaseBonus') && value < 0) value = 0;
      if ((field === 'levelBonus' || field === 'keyPurchaseBonus') && value > 100) value = 100; // Max 100%
    }

    setRates(prev => prev.map(rate =>
      rate.level === level ? { ...rate, [field]: value } : rate
    ));
  };

  const saveRates = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/commission-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(rates),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Commission rates updated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to update commission rates',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update commission rates',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const initializeRates = async () => {
    try {
      setInitializing(true);
      const response = await fetch('/api/admin/commission-rates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (data.success) {
        await loadRates(); // Reload the rates
        toast({
          title: 'Success',
          description: 'Commission rates initialized successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to initialize commission rates',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize commission rates',
        variant: 'destructive',
      });
    } finally {
      setInitializing(false);
    }
  };

  const resetToDefault = () => {
    // Production-ready defaults - simplified flat commission system
    const defaultRates: CommissionRate[] = [
      { level: 1, referralBonus: 500, levelBonus: 0, keyPurchaseBonus: 0, isActive: true },
      { level: 2, referralBonus: 300, levelBonus: 0, keyPurchaseBonus: 0, isActive: true },
      { level: 3, referralBonus: 200, levelBonus: 0, keyPurchaseBonus: 0, isActive: true },
      { level: 4, referralBonus: 100, levelBonus: 0, keyPurchaseBonus: 0, isActive: true },
      { level: 5, referralBonus: 50, levelBonus: 0, keyPurchaseBonus: 0, isActive: true },
      { level: 6, referralBonus: 50, levelBonus: 0, keyPurchaseBonus: 0, isActive: true },
    ];
    setRates(defaultRates);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Commission Rates
            </h1>
          </div>
          <p className="text-slate-400 text-lg font-medium">
            Manage MLM commission rates for every network level
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Commission Rates
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">
          Manage MLM commission rates for every network level
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-end">
        {rates.length === 0 && (
          <button
            onClick={initializeRates}
            disabled={initializing}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {initializing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Initialize Rates
          </button>
        )}
        <button
          onClick={resetToDefault}
          className="px-5 py-3 rounded-2xl border border-slate-700/50 bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 transition-all duration-200 flex items-center gap-2"
          title="Reset to production-ready defaults: ₹500, ₹300, ₹200, ₹100, ₹50, ₹50 flat commissions"
        >
          <RefreshCw className="h-4 w-4" />
          Reset to Production Defaults
        </button>
        <button
          onClick={saveRates}
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {/* Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-700/50">
          <h2 className="text-xl font-semibold text-slate-100">MLM Commission Structure</h2>
          <p className="text-slate-400 text-sm mt-1">
            Configure flat commission amounts for your 6-level MLM network.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-800/70 text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Level</th>
                <th className="px-4 py-3 font-semibold">Commission Amount (₹)</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {rates.map((rate) => (
                <tr key={rate.level} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">Level {rate.level}</td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      value={rate.referralBonus}
                      onChange={(e) => updateRate(rate.level, 'referralBonus', parseFloat(e.target.value) || 0)}
                      className="bg-slate-800/60 border-slate-700/50 text-slate-100"
                      placeholder={rate.level === 1 ? "500" : rate.level === 2 ? "300" : rate.level === 3 ? "200" : rate.level === 4 ? "100" : rate.level === 5 ? "50" : "50"}
                      min="0"
                      max="5000"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={rate.isActive ? 'default' : 'secondary'}>
                      {rate.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-slate-100">How Commissions Work</h3>

        {/* Commission Examples */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4">
          <h4 className="font-semibold text-emerald-400 mb-2">Example: When someone joins in your network</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-emerald-400 font-bold">Level 1 (Direct)</div>
              <div className="text-slate-300">₹500 fixed commission</div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-emerald-400 font-bold">Level 2</div>
              <div className="text-slate-300">₹300 fixed commission</div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-emerald-400 font-bold">Level 3-6</div>
              <div className="text-slate-300">₹200 to ₹50 fixed</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-100">Fixed Commission Amounts</h4>
            <p className="text-sm text-slate-400 mt-1">Each level earns a fixed amount when someone joins anywhere in their network.</p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-100">Simplified Structure</h4>
            <p className="text-sm text-slate-400 mt-1">No more confusing percentages - just flat amounts you can easily understand.</p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-100">Network Depth</h4>
            <p className="text-sm text-slate-400 mt-1">Earn commissions up to 6 levels deep in your referral network.</p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-100">Easy to Predict</h4>
            <p className="text-sm text-slate-400 mt-1">Know exactly how much you'll earn at each level in your network.</p>
          </div>
        </div>

        {/* Current Configuration Info */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <h4 className="font-semibold text-slate-100 mb-3">Current Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Commission:</span>
                <span className="text-emerald-400 font-bold">₹{rates.filter(r => r.isActive).reduce((sum, r) => sum + r.referralBonus, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Network:</span>
                <span className="text-emerald-400 font-bold">{rates.filter(r => r.isActive).length} Levels</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Commission Range:</span>
                <span className="text-emerald-400 font-bold">₹{Math.min(...rates.filter(r => r.isActive).map(r => r.referralBonus))} - ₹{Math.max(...rates.filter(r => r.isActive).map(r => r.referralBonus))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Average Level:</span>
                <span className="text-emerald-400 font-bold">₹{Math.round(rates.filter(r => r.isActive).reduce((sum, r) => sum + r.referralBonus, 0) / rates.filter(r => r.isActive).length)}</span>
              </div>
            </div>
          </div>

          {/* Sample Earnings Calculator */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <h5 className="font-semibold text-slate-100 mb-2">Commission Amounts per Level</h5>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              {rates.filter(r => r.isActive).map((rate) => (
                <div key={rate.level} className="bg-slate-700/50 rounded-lg p-2 text-center">
                  <div className="text-slate-400">Level {rate.level}</div>
                  <div className="text-emerald-400 font-bold">
                    ₹{rate.referralBonus}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
