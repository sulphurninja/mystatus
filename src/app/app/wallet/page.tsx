'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/app/AppHeader';
import CoinAmount from '@/components/app/CoinAmount';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Key,
  AlertCircle,
} from 'lucide-react';

export default function WalletPage() {
  const { user, token, refreshUserProfile } = useAuth();
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsKeyRenewal, setNeedsKeyRenewal] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, [token]);

  const fetchWalletData = async () => {
    try {
      let requests: any[] = [];
      let needsRenewal = false;
      
      try {
        const withdrawalRes = await fetch('/api/users/withdrawal', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const withdrawalResult = await withdrawalRes.json();
        if (withdrawalResult.success && withdrawalResult.data) {
          const data = withdrawalResult.data;
          // Handle both array and object responses
          if (Array.isArray(data)) {
            requests = data;
          } else if (Array.isArray(data.requests)) {
            requests = data.requests;
          } else if (Array.isArray(data.withdrawals)) {
            requests = data.withdrawals;
          }
        }
      } catch (e) {
        console.log('Withdrawal API not available');
      }
      
      try {
        const keyStatusRes = await fetch('/api/users/keys/renew', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const keyStatusResult = await keyStatusRes.json();
        if (keyStatusResult.success && keyStatusResult.data) {
          needsRenewal = keyStatusResult.data.needsRenewal || false;
        }
      } catch (e) {
        console.log('Key renewal API not available');
      }

      setWithdrawalRequests(requests);
      setNeedsKeyRenewal(needsRenewal);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setError('');
    const amount = parseFloat(withdrawalAmount);

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > (user?.balance || 0)) {
      setError('Insufficient balance');
      return;
    }

    if (needsKeyRenewal) {
      setError('Please renew your activation key to withdraw');
      return;
    }

    try {
      const response = await fetch('/api/users/withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Withdrawal failed');
      }

      await refreshUserProfile();
      await fetchWalletData();
      setShowWithdrawModal(false);
      setWithdrawalAmount('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AppHeader title="Wallet" showBack={true} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <AppHeader title="Wallet" showBack={true} />

      <div className="max-w-md mx-auto px-4 pb-6">
        {/* Balance Card */}
        <div className="py-6">
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 shadow-lg shadow-emerald-500/10">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-300 font-medium">Available Balance</span>
            </div>
            <CoinAmount amount={user?.balance || 0} size="xl" />

            {/* Withdrawal Info */}
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">Withdrawal Limit</span>
                <span className="text-slate-200 font-semibold">
                  ₹{user?.keyTier?.withdrawalLimit || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Withdrawn</span>
                <span className="text-slate-200 font-semibold">
                  ₹{user?.totalWithdrawn || 0}
                </span>
              </div>
            </div>

            {/* Key Renewal Warning */}
            {needsKeyRenewal && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-400 mb-1">Key Renewal Required</p>
                  <p className="text-xs text-amber-300/80">
                    You&apos;ve reached your withdrawal limit. Please renew your key to continue.
                  </p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={needsKeyRenewal || (user?.balance || 0) <= 0}
              className="w-full mt-4 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
            >
              {needsKeyRenewal ? 'Renew Key to Withdraw' : 'Withdraw Funds'}
            </button>
          </div>
        </div>

        {/* Withdrawal Requests */}
        <div>
          <h3 className="text-lg font-bold text-slate-100 mb-4">Withdrawal History</h3>
          
          <div className="space-y-3">
            {withdrawalRequests.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
                <ArrowUpRight className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No withdrawal requests yet</p>
              </div>
            ) : (
              withdrawalRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-slate-100">
                          ₹{request.amount.toFixed(2)}
                        </span>
                        {request.status === 'pending' && (
                          <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-semibold text-amber-400">
                            Pending
                          </span>
                        )}
                        {request.status === 'approved' && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400">
                            Approved
                          </span>
                        )}
                        {request.status === 'rejected' && (
                          <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-lg text-xs font-semibold text-red-400">
                            Rejected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(request.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div>
                      {request.status === 'pending' && (
                        <Clock className="w-5 h-5 text-amber-400" />
                      )}
                      {request.status === 'approved' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      )}
                      {request.status === 'rejected' && (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  </div>

                  {request.note && (
                    <p className="text-sm text-slate-400 mt-2 p-2 bg-slate-900/50 rounded-lg">
                      {request.note}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={() => setShowWithdrawModal(false)}
        >
          <div
            className="bg-slate-900 w-full max-w-md rounded-t-3xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6"></div>
            
            <h3 className="text-2xl font-bold text-slate-100 mb-2">Withdraw Funds</h3>
            <p className="text-slate-400 mb-6">
              Enter the amount you want to withdraw from your wallet
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all"
                max={user?.balance || 0}
                step="0.01"
              />
              <p className="text-xs text-slate-500 mt-2">
                Available: ₹{(user?.balance || 0).toFixed(2)}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setError('');
                  setWithdrawalAmount('');
                }}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
