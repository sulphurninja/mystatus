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
    // Production-ready defaults based on business requirements
    const defaultRates: CommissionRate[] = [
      { level: 1, referralBonus: 500, levelBonus: 5, keyPurchaseBonus: 5, isActive: true },
      { level: 2, referralBonus: 0, levelBonus: 4, keyPurchaseBonus: 4, isActive: true },
      { level: 3, referralBonus: 0, levelBonus: 3, keyPurchaseBonus: 3, isActive: true },
      { level: 4, referralBonus: 0, levelBonus: 2, keyPurchaseBonus: 2, isActive: true },
      { level: 5, referralBonus: 0, levelBonus: 1, keyPurchaseBonus: 1, isActive: true },
      { level: 6, referralBonus: 0, levelBonus: 0.5, keyPurchaseBonus: 0.5, isActive: true },
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
          title="Reset to production-ready defaults: ₹500 direct bonus, 5%-0.5% cascading rates"
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
            Configure referral bonuses and percentage rates for your 6-level MLM network.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-800/70 text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Level</th>
                <th className="px-4 py-3 font-semibold">Direct Referral Bonus (₹)</th>
                <th className="px-4 py-3 font-semibold">Level Bonus (%)</th>
                <th className="px-4 py-3 font-semibold">Key Purchase Bonus (%)</th>
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
                      placeholder={rate.level === 1 ? "500" : "0"}
                      min="0"
                      max="5000"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      value={rate.levelBonus}
                      onChange={(e) => updateRate(rate.level, 'levelBonus', parseFloat(e.target.value) || 0)}
                      className="bg-slate-800/60 border-slate-700/50 text-slate-100"
                      placeholder={rate.level === 1 ? "5" : rate.level === 2 ? "4" : rate.level === 3 ? "3" : rate.level === 4 ? "2" : rate.level === 5 ? "1" : "0.5"}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      value={rate.keyPurchaseBonus}
                      onChange={(e) => updateRate(rate.level, 'keyPurchaseBonus', parseFloat(e.target.value) || 0)}
                      className="bg-slate-800/60 border-slate-700/50 text-slate-100"
                      placeholder={rate.level === 1 ? "5" : rate.level === 2 ? "4" : rate.level === 3 ? "3" : rate.level === 4 ? "2" : rate.level === 5 ? "1" : "0.5"}
                      min="0"
                      max="100"
                      step="0.1"
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
          <h4 className="font-semibold text-emerald-400 mb-2">Example: When someone joins with your referral</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-emerald-400 font-bold">Level 1 (You)</div>
              <div className="text-slate-300">₹500 fixed bonus</div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-emerald-400 font-bold">Level 2 (Your referrer)</div>
              <div className="text-slate-300">4% of ₹500 = ₹20</div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-emerald-400 font-bold">Level 3+</div>
              <div className="text-slate-300">3% to 0.5% of ₹500</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-100">Direct Referral Bonus</h4>
            <p className="text-sm text-slate-400 mt-1">Fixed ₹500 earned when someone joins with your referral code.</p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-100">Level Bonus</h4>
            <p className="text-sm text-slate-400 mt-1">Percentage of the referral bonus earned from deeper network levels.</p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-100">Key Purchase Bonus</h4>
            <p className="text-sm text-slate-400 mt-1">Percentage commission when anyone in your network buys activation keys.</p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-100">Network Depth</h4>
            <p className="text-sm text-slate-400 mt-1">Earn commissions up to 6 levels deep in your referral network.</p>
          </div>
        </div>

        {/* Current Configuration Info */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <h4 className="font-semibold text-slate-100 mb-3">Current Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Direct Bonus:</span>
                <span className="text-emerald-400 font-bold">₹{rates.find(r => r.level === 1)?.referralBonus || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Network:</span>
                <span className="text-emerald-400 font-bold">{rates.filter(r => r.isActive).length} Levels</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Level Range:</span>
                <span className="text-emerald-400 font-bold">{Math.min(...rates.filter(r => r.isActive && r.level > 1).map(r => r.levelBonus))}% - {Math.max(...rates.filter(r => r.isActive && r.level > 1).map(r => r.levelBonus))}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Key Bonus:</span>
                <span className="text-emerald-400 font-bold">Up to {Math.max(...rates.map(r => r.keyPurchaseBonus))}%</span>
              </div>
            </div>
          </div>

          {/* Sample Earnings Calculator */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <h5 className="font-semibold text-slate-100 mb-2">Sample Earnings (per ₹500 referral)</h5>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              {rates.filter(r => r.isActive).map((rate) => (
                <div key={rate.level} className="bg-slate-700/50 rounded-lg p-2 text-center">
                  <div className="text-slate-400">Level {rate.level}</div>
                  <div className="text-emerald-400 font-bold">
                    {rate.level === 1
                      ? `₹${rate.referralBonus}`
                      : `₹${((rate.referralBonus * rate.levelBonus) / 100).toFixed(0)}`
                    }
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
