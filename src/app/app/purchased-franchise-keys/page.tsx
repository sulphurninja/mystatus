'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/app/AppHeader';
import { Sparkles, CheckCircle2, Clock, XCircle, Package } from 'lucide-react';

export default function PurchasedFranchiseKeysPage() {
  const { token } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPurchasedKeys();
  }, [token]);

  const fetchPurchasedKeys = async () => {
    try {
      const response = await fetch('/api/marketplace/franchise/purchased', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      let keysData: any[] = [];

      if (result.success && result.data) {
        keysData = result.data;
      }

      setKeys(keysData);
    } catch (error) {
      console.error('Error fetching purchased franchise keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'purchased':
        return <Clock className="w-5 h-5 text-amber-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
      purchased: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    };
    return badges[status as keyof typeof badges] || 'bg-slate-500/20 border-slate-500/30 text-slate-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AppHeader title="Franchise Keys" showBack={true} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <AppHeader title="Franchise Keys" showBack={true} />

      <div className="max-w-md mx-auto px-4 pb-6">
        <div className="py-6">
          <p className="text-slate-400">
            View all franchise keys you've purchased and their payout status
          </p>
        </div>

        <div className="space-y-3">
          {keys.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No franchise keys</h3>
              <p className="text-slate-500">
                Purchase franchise keys from the marketplace to get started
              </p>
            </div>
          ) : (
            keys.map((key) => (
              <div
                key={key.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-900/50 rounded-xl flex items-center justify-center">
                    {getStatusIcon(key.status)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-slate-100 font-mono">
                          {key.key}
                        </h3>
                        <p className="text-sm text-slate-400">Daily payouts up to 30 levels</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 border rounded-lg text-xs font-semibold whitespace-nowrap ${getStatusBadge(
                          key.status
                        )}`}
                      >
                        {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                      </span>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Purchase Price</span>
                        <span className="text-amber-400 font-semibold">₹{key.price}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Purchased On</span>
                        <span className="text-slate-300">
                          {key.purchasedAt
                            ? new Date(key.purchasedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </span>
                      </div>
                      {key.plan && (
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700/50">
                          <span className="text-slate-400">Payout Status</span>
                          <span className={`font-semibold ${key.plan.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {key.plan.isActive ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
