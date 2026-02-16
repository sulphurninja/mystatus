'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/app/AppHeader';
import CoinAmount from '@/components/app/CoinAmount';
import {
  TrendingUp,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Award,
} from 'lucide-react';
import Link from 'next/link';

export default function EarningsPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalEarnings: 0,
    thisMonth: 0,
    thisWeek: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEarningsData();
  }, [token]);

  const fetchEarningsData = async () => {
    try {
      // Fetch shares data
      const sharesRes = await fetch('/api/shares', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sharesResult = await sharesRes.json();
      const shares = sharesResult.success && sharesResult.data ? sharesResult.data : [];

      // Calculate stats
      const now = new Date();
      const thisMonth = shares.filter((s: any) => {
        const shareDate = new Date(s.sharedAt || s.createdAt);
        return (
          shareDate.getMonth() === now.getMonth() &&
          shareDate.getFullYear() === now.getFullYear()
        );
      });

      const thisWeek = shares.filter((s: any) => {
        const shareDate = new Date(s.sharedAt || s.createdAt);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return shareDate >= weekAgo;
      });

      setStats({
        totalEarnings: user?.balance || 0,
        thisMonth: thisMonth.reduce((acc: number, s: any) => acc + (s.rewardAmount || 0), 0),
        thisWeek: thisWeek.reduce((acc: number, s: any) => acc + (s.rewardAmount || 0), 0),
        verified: shares.filter((s: any) => s.status === 'verified').length,
        pending: shares.filter((s: any) => s.status === 'pending').length,
        rejected: shares.filter((s: any) => s.status === 'rejected').length,
      });

      // Fetch recent transactions
      try {
        const txRes = await fetch('/api/users/transactions?page=1&limit=10', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const txResult = await txRes.json();
        const txData = txResult.success && txResult.data ? txResult.data : [];
        setRecentTransactions(txData.transactions || txData || []);
      } catch (e) {
        console.log('Transactions API not available');
      }
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AppHeader title="Earnings" showBack={false} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <AppHeader title="Earnings" showBack={false} />

      <div className="max-w-md mx-auto px-4 pb-6">
        {/* Total Earnings Card */}
        <div className="py-6">
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 shadow-lg shadow-emerald-500/10">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-300 font-medium">Total Earnings</span>
            </div>
            <CoinAmount amount={stats.totalEarnings} size="xl" />
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <Link
                href="/app/transaction-history"
                className="flex items-center justify-between text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span className="text-sm font-semibold">View All Transactions</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Period Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
            <Calendar className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-slate-400 text-sm mb-1">This Month</p>
            <CoinAmount amount={stats.thisMonth} size="lg" showIcon={false} />
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
            <TrendingUp className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-slate-400 text-sm mb-1">This Week</p>
            <CoinAmount amount={stats.thisWeek} size="lg" showIcon={false} />
          </div>
        </div>

        {/* Share Status Stats */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-100 mb-3">Share Status</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="text-2xl font-bold text-slate-100 mb-1">{stats.verified}</p>
              <p className="text-xs text-slate-400">Verified</p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <Clock className="w-5 h-5 text-amber-400 mb-2" />
              <p className="text-2xl font-bold text-slate-100 mb-1">{stats.pending}</p>
              <p className="text-xs text-slate-400">Pending</p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <XCircle className="w-5 h-5 text-red-400 mb-2" />
              <p className="text-2xl font-bold text-slate-100 mb-1">{stats.rejected}</p>
              <p className="text-xs text-slate-400">Rejected</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-100">Recent Activity</h3>
            <Link
              href="/app/transaction-history"
              className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-semibold"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No transactions yet</p>
              </div>
            ) : (
              recentTransactions.map((tx, index) => {
                const isCredit = tx.type !== 'withdrawal' && tx.type !== 'key_purchase' && tx.type !== 'debit';
                const getTransactionLabel = () => {
                  if (tx.reason) return tx.reason;
                  if (tx.description) return tx.description;
                  switch (tx.type) {
                    case 'share_reward': return 'Share Reward';
                    case 'referral_commission': return 'Referral Commission';
                    case 'withdrawal': return 'Withdrawal';
                    case 'key_purchase': return 'Key Purchase';
                    case 'credit': return 'Credit';
                    case 'debit': return 'Debit';
                    default: return tx.type || 'Transaction';
                  }
                };
                
                return (
                  <div
                    key={tx._id || tx.id || `tx-${index}`}
                    className="glass-card rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white font-medium mb-1 text-sm">
                          {getTransactionLabel()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(tx.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div
                        className={`font-bold text-lg ${
                          isCredit ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isCredit ? '+' : '-'}₹{(tx.amount || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            href="/app/my-shares"
            className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors text-center"
          >
            My Shares
          </Link>
          <Link
            href="/app/wallet"
            className="py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl text-center"
          >
            Withdraw
          </Link>
        </div>
      </div>
    </div>
  );
}
