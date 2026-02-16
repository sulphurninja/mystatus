'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/app/AppHeader';
import { ArrowUpRight, ArrowDownRight, Filter, Calendar } from 'lucide-react';

export default function TransactionHistoryPage() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'share_reward', label: 'Earnings' },
    { id: 'referral_commission', label: 'Commissions' },
    { id: 'withdrawal', label: 'Withdrawals' },
    { id: 'key_purchase', label: 'Purchases' },
  ];

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, selectedFilter]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/users/transactions?page=1&limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      let txData: any[] = [];
      
      if (result.success && result.data) {
        txData = result.data.transactions || result.data || [];
      }
      
      // Map API response to expected format
      const mappedTransactions = txData.map((tx: any) => ({
        _id: tx.id || tx._id,
        type: tx.type,
        amount: tx.amount || 0,
        reason: tx.reason,
        description: tx.description,
        balanceBefore: tx.balanceBefore,
        balanceAfter: tx.balanceAfter,
        reference: tx.reference,
        createdAt: tx.createdAt,
      }));
      
      setTransactions(mappedTransactions);
      setFilteredTransactions(mappedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = () => {
    if (selectedFilter === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter((t) => t.type === selectedFilter));
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'withdrawal' || type === 'key_purchase') {
      return <ArrowUpRight className="w-5 h-5 text-red-400" />;
    }
    return <ArrowDownRight className="w-5 h-5 text-emerald-400" />;
  };

  const getTransactionLabel = (tx: any) => {
    if (tx.reason) return tx.reason;
    if (tx.description) return tx.description;
    
    const labels: Record<string, string> = {
      share_reward: 'Share Reward',
      referral_commission: 'Referral Commission',
      withdrawal: 'Withdrawal',
      key_purchase: 'Key Purchase',
      credit: 'Credit',
      debit: 'Debit',
    };
    return labels[tx.type] || tx.type || 'Transaction';
  };
  
  const isCredit = (type: string) => {
    return type !== 'withdrawal' && type !== 'key_purchase' && type !== 'debit';
  };

  const groupTransactionsByDate = (txs: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    txs.forEach((tx) => {
      const date = new Date(tx.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(tx);
    });
    
    return grouped;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AppHeader title="Transaction History" showBack={true} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const groupedTransactions = groupTransactionsByDate(filteredTransactions);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <AppHeader title="Transactions" showBack={true} />

      <div className="max-w-md mx-auto px-4 pb-6">
        {/* Filter Tabs */}
        <div className="py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                  selectedFilter === filter.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions */}
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No transactions</h3>
            <p className="text-slate-500">
              {selectedFilter === 'all'
                ? 'Your transactions will appear here'
                : `No ${filters.find(f => f.id === selectedFilter)?.label.toLowerCase()} found`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, txs]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-400">{date}</h3>
                </div>
                
                <div className="space-y-2">
                  {txs.map((tx, index) => {
                    const txIsCredit = isCredit(tx.type);
                    
                    return (
                      <div
                        key={tx._id || `tx-${index}`}
                        className="glass-card rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                            txIsCredit ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
                          }`}>
                            {getTransactionIcon(tx.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex-1">
                                <p className="text-white font-medium text-sm">
                                  {getTransactionLabel(tx)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(tx.createdAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                              <p
                                className={`text-lg font-bold ${
                                  txIsCredit ? 'text-emerald-400' : 'text-red-400'
                                }`}
                              >
                                {txIsCredit ? '+' : '-'}₹{(tx.amount || 0).toFixed(2)}
                              </p>
                            </div>

                            {tx.reference?.title && (
                              <p className="text-xs text-slate-500 mt-1">
                                Ad: {tx.reference.title}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
