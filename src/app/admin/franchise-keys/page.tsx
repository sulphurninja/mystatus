'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';

type FranchiseKeyItem = {
  _id: string;
  key: string;
  price: number;
  isUsed: boolean;
  isForSale: boolean;
  payoutPlan?: {
    id: string;
    isActive: boolean;
    lastPaidAt?: string;
    startDate?: string;
  } | null;
  usedBy?: { name: string; email: string } | null;
  purchasedBy?: { name: string; email: string } | null;
  createdAt?: string;
};

export default function FranchiseKeysPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keys, setKeys] = useState<FranchiseKeyItem[]>([]);
  const [count, setCount] = useState(10);
  const [price, setPrice] = useState(10000);
  const [isForSale, setIsForSale] = useState(true);

  useEffect(() => {
    checkAuth();
    loadKeys();
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

  const loadKeys = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/franchise-keys', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      const data = await res.json();
      if (data.success) {
        setKeys(data.keys || []);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to load franchise keys',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load franchise keys',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateKeys = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/franchise-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ count, price, isForSale })
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: data.message || 'Franchise keys generated'
        });
        await loadKeys();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to generate keys',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate keys',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePlan = async (planId: string) => {
    try {
      const res = await fetch(`/api/admin/franchise-plans/${planId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to toggle plan');
      }
      await loadKeys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle payout plan',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Franchise Keys
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">
          Generate and manage franchise keys for recurring payouts
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Count</label>
            <Input
              type="number"
              value={count}
              min={1}
              max={100}
              onChange={(e) => setCount(parseInt(e.target.value) || 0)}
              className="bg-slate-800/60 border-slate-700/50 text-slate-100"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Price (INR)</label>
            <Input
              type="number"
              value={price}
              min={0}
              onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
              className="bg-slate-800/60 border-slate-700/50 text-slate-100"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">For Sale</label>
            <select
              value={isForSale ? 'yes' : 'no'}
              onChange={(e) => setIsForSale(e.target.value === 'yes')}
              className="border-input h-9 w-full min-w-0 rounded-md border bg-slate-800/60 px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm text-slate-100"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
        <button
          onClick={generateKeys}
          disabled={saving}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Generate Keys
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 text-slate-300 font-semibold">Recent Keys</div>
        <div className="divide-y divide-slate-800">
          {keys.length === 0 ? (
            <div className="p-6 text-slate-500">No franchise keys found.</div>
          ) : (
            keys.map((item) => (
              <div key={item._id} className="px-6 py-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-semibold">{item.key}</span>
                  <span className="text-amber-300 font-semibold">INR {item.price}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {item.isUsed ? `Used by ${item.usedBy?.name || 'User'}` : 'Not used'}
                  {item.isForSale ? ' · For sale' : ' · Not for sale'}
                </div>
                {item.payoutPlan && (
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs font-semibold ${item.payoutPlan.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {item.payoutPlan.isActive ? 'Payout Active' : 'Payout Paused'}
                    </span>
                    <button
                      onClick={() => togglePlan(item.payoutPlan!.id)}
                      className="px-3 py-1 text-xs rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800/60"
                    >
                      {item.payoutPlan.isActive ? 'Pause' : 'Resume'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
