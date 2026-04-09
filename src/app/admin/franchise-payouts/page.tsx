'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Play } from 'lucide-react';

type PayoutRun = {
  _id: string;
  payoutDate: string;
  status: string;
  totalPaid: number;
  totalRecipients: number;
  createdAt: string;
};

type DailyPayout = {
  _id: string;
  payoutDate: string;
  amount: number;
  level: number;
  paidTo?: { name: string; email: string; referralCode?: string };
  referredUser?: { name: string; email: string; referralCode?: string };
  franchiseKey?: { key: string; price: number };
};

export default function FranchisePayoutsPage() {
  const { toast } = useToast();
  const [runs, setRuns] = useState<PayoutRun[]>([]);
  const [payouts, setPayouts] = useState<DailyPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    checkAuth();
    loadData();
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [runsRes, payoutsRes] = await Promise.all([
        fetch(`/api/admin/franchise-payouts?date=${date}`, {
          headers: { ...getAuthHeaders() }
        }),
        fetch(`/api/admin/franchise-payouts?date=${date}&payouts=true`, {
          headers: { ...getAuthHeaders() }
        })
      ]);

      const runsData = await runsRes.json();
      const payoutsData = await payoutsRes.json();

      setRuns(runsData.success ? runsData.data : []);
      setPayouts(payoutsData.success ? payoutsData.data : []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load payout data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const runPayouts = async () => {
    try {
      setRunning(true);
      const res = await fetch('/api/admin/franchise-payouts/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ date })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to run payouts');
      }
      toast({
        title: 'Success',
        description: 'Franchise payouts processed'
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to run payouts',
        variant: 'destructive'
      });
    } finally {
      setRunning(false);
    }
  };

  const totalPaid = payouts.reduce((sum, payout) => sum + (payout.amount || 0), 0);
  const totalRecipients = payouts.length;
  const completedRuns = runs.filter(run => run.status === 'completed').length;

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
            Franchise Payouts
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">
          Run daily recurring payouts and review payout history
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Payout Date</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-800/60 border-slate-700/50 text-slate-100"
          />
        </div>
        <div className="flex gap-3 md:ml-auto">
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-200 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={runPayouts}
            disabled={running}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold flex items-center gap-2 disabled:opacity-60"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Payouts
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-amber-400">INR {totalPaid}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Recipients</p>
          <p className="text-2xl font-bold text-slate-100">{totalRecipients}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Completed Runs</p>
          <p className="text-2xl font-bold text-slate-100">{completedRuns}</p>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 text-slate-300 font-semibold">Payout Runs</div>
        <div className="divide-y divide-slate-800">
          {runs.length === 0 ? (
            <div className="p-6 text-slate-500">No payout runs recorded.</div>
          ) : (
            runs.map((run) => (
              <div key={run._id} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="text-slate-200 font-semibold">{new Date(run.payoutDate).toISOString().slice(0, 10)}</div>
                  <div className="text-xs text-slate-500">Status: {run.status}</div>
                </div>
                <div className="text-sm text-slate-400">
                  Paid INR {run.totalPaid || 0} to {run.totalRecipients || 0} recipients
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 text-slate-300 font-semibold">Daily Payouts</div>
        <div className="divide-y divide-slate-800">
          {payouts.length === 0 ? (
            <div className="p-6 text-slate-500">No payouts found for this date.</div>
          ) : (
            payouts.map((payout) => (
              <div key={payout._id} className="px-6 py-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-semibold">
                    {payout.paidTo?.name || 'User'} · Level {payout.level}
                  </span>
                  <span className="text-amber-300 font-semibold">INR {payout.amount}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Referred user: {payout.referredUser?.name || 'N/A'} · Key: {payout.franchiseKey?.key || 'N/A'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
