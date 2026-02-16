'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/app/AppHeader';
import CoinAmount from '@/components/app/CoinAmount';
import {
  Users,
  Copy,
  Share2,
  TrendingUp,
  Award,
  ChevronDown,
  CheckCircle2,
  GitBranch,
  Wallet,
  Key,
  UserCheck,
  UserX,
  Info,
} from 'lucide-react';
import Link from 'next/link';

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  referralLevel: number;
  totalCommissionEarned: number;
  referredBy: { name: string; referralCode: string } | null;
  directReferrals: Array<{
    id: string;
    name: string;
    referralCode: string;
    joinedAt: string;
    isActive: boolean;
  }>;
  stats: {
    totalReferrals: number;
    activeReferrals: number;
    pendingReferrals: number;
  };
  commissionBreakdown: Array<{
    level: number;
    referralBonus: number;
    levelBonus: number;
    keyPurchaseBonus: number;
    totalEarned: number;
    totalCommissions: number;
  }>;
}

export default function ReferralPage() {
  const { user, token } = useAuth();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showCommissionInfo, setShowCommissionInfo] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, [token]);

  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/users/referral', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success && result.data) {
        setReferralData(result.data);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    const code = referralData?.referralCode || user?.referralCode || '';
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const code = referralData?.referralCode || user?.referralCode || '';
    const referralLink = `https://mystatusads.com/r/${code}`;
    const text = `🎉 Join MyStatus and start unlocking exclusive rewards by sharing branded content!\n\n📱 Download the app using my referral link:\n${referralLink}\n\n🎁 Use my referral code: ${code}\n\n#MyStatus #UnlockRewards`;
    
    if (navigator.share) {
      navigator.share({ title: 'Join MyStatus', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Referral message copied to clipboard!');
    }
  };

  const getLevelColor = (level: number) => {
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
    return colors[level - 1] || colors[0];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <AppHeader title="Network" showBack={true} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const stats = referralData?.stats || { totalReferrals: 0, activeReferrals: 0, pendingReferrals: 0 };
  const commissionBreakdown = referralData?.commissionBreakdown || [];
  const directReferrals = referralData?.directReferrals || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <AppHeader title="Network" showBack={true} />

      <div className="max-w-md mx-auto px-4 pb-24">
        {/* Total Earnings Card */}
        <div className="py-6">
          <div className="relative glass-card rounded-2xl p-5 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-violet-500/20 border border-violet-500/30">
                  <Wallet className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Total Commission Earned</p>
                  <CoinAmount amount={referralData?.totalCommissionEarned || 0} size="lg" />
                </div>
              </div>
              <Link href="/app/earnings" className="text-xs text-violet-400 font-medium">
                Details →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <button onClick={handleShare} className="glass-card rounded-xl p-3 flex flex-col items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Share2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] text-slate-400">Share</span>
          </button>
          <button onClick={handleCopyCode} className="glass-card rounded-xl p-3 flex flex-col items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Copy className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-[10px] text-slate-400">Copy</span>
          </button>
          <Link href="/app/earnings" className="glass-card rounded-xl p-3 flex flex-col items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-[10px] text-slate-400">Earnings</span>
          </Link>
          <Link href="/app/purchased-keys" className="glass-card rounded-xl p-3 flex flex-col items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Key className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-[10px] text-slate-400">Keys</span>
          </Link>
        </div>

        {/* Referral Code Card */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Users className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Referral Code</p>
              <p className="text-slate-500 text-xs">Share & earn commissions</p>
            </div>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
            <p className="text-2xl font-bold text-center tracking-wider text-violet-400">
              {referralData?.referralCode || user?.referralCode}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleCopyCode}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Network Stats */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Network Overview</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit mb-3">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
              <p className="text-xs text-slate-500">Total Referrals</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 w-fit mb-3">
                <UserCheck className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.activeReferrals}</p>
              <p className="text-xs text-slate-500">Active Members</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 w-fit mb-3">
                <GitBranch className="w-4 h-4 text-violet-400" />
              </div>
              <p className="text-2xl font-bold text-white">Level {referralData?.referralLevel || 1}</p>
              <p className="text-xs text-slate-500">Your Level</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 w-fit mb-3">
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {commissionBreakdown.filter(c => c.totalEarned > 0).length}
              </p>
              <p className="text-xs text-slate-500">Active Levels</p>
            </div>
          </div>
        </div>

        {/* Commission Breakdown */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-400">Commission Breakdown</h3>
            <button 
              onClick={() => setShowCommissionInfo(true)}
              className="p-1.5 rounded-lg hover:bg-white/5"
            >
              <Info className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          
          <div className="glass-card rounded-2xl overflow-hidden">
            {commissionBreakdown.map((level, index) => {
              const isActive = level.level <= (referralData?.referralLevel || 1);
              return (
                <div 
                  key={level.level}
                  className={`p-4 ${index !== commissionBreakdown.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${isActive ? getLevelColor(level.level) : 'bg-slate-700'}`}>
                        {level.level}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">Level {level.level}</p>
                        <p className="text-xs text-slate-500">
                          {level.level === 1 ? 'Direct Referrals' : `Level ${level.level} Network`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <div>
                        <CoinAmount amount={level.totalEarned} size="sm" />
                        <p className="text-[10px] text-slate-500">Earned</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{level.totalCommissions}</p>
                        <p className="text-[10px] text-slate-500">Commissions</p>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 space-y-0.5">
                      {level.referralBonus > 0 && <p>Referral: ₹{level.referralBonus}</p>}
                      {level.levelBonus > 0 && <p>Level: {level.levelBonus}%</p>}
                      {level.keyPurchaseBonus > 0 && <p>Key: {level.keyPurchaseBonus}%</p>}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Total Earnings */}
            <div className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-t border-violet-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-violet-400" />
                  <span className="text-sm text-slate-300">Total Earnings</span>
                </div>
                <CoinAmount amount={referralData?.totalCommissionEarned || 0} size="lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Direct Referrals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-400">Direct Referrals</h3>
            <span className="text-xs text-slate-500">({directReferrals.length})</span>
          </div>
          
          {directReferrals.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-1">No referrals yet</p>
              <p className="text-slate-500 text-xs">Share your code to start earning!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {directReferrals.slice(0, 10).map((ref) => (
                <div key={ref.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-950">
                        {ref.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{ref.name}</p>
                      <p className="text-xs text-slate-500">Code: {ref.referralCode}</p>
                      <p className="text-xs text-slate-600">
                        Joined {new Date(ref.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      ref.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {ref.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="mt-6 glass-card rounded-2xl p-5">
          <h4 className="text-white font-medium mb-4">How It Works</h4>
          <div className="space-y-3 text-sm text-slate-400">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">1</div>
              <p>Share your referral code with friends and family</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">2</div>
              <p>They sign up using your code and become active</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">3</div>
              <p>Earn multi-level commissions up to 6 levels deep</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Info Modal */}
      {showCommissionInfo && (
        <div 
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[60] flex items-end justify-center"
          onClick={() => setShowCommissionInfo(false)}
        >
          <div 
            className="bg-slate-900 w-full max-w-md rounded-t-3xl p-6 animate-slide-up border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-white mb-4">Commission Structure</h3>
            <div className="space-y-3 mb-6">
              <p className="text-slate-400 text-sm">
                Earn commissions from your referral network up to 6 levels deep:
              </p>
              <div className="glass-card rounded-xl p-4 space-y-2 text-sm">
                <p className="text-slate-300"><span className="text-emerald-400 font-bold">Level 1:</span> Direct referral bonus + % of their earnings</p>
                <p className="text-slate-300"><span className="text-blue-400 font-bold">Level 2-6:</span> Percentage of earnings from each level</p>
              </div>
              <p className="text-slate-500 text-xs">
                Commission rates vary based on your level and activity. More referrals = higher level = better rates!
              </p>
            </div>
            <button
              onClick={() => setShowCommissionInfo(false)}
              className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
