'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/app/AppHeader';
import CoinAmount from '@/components/app/CoinAmount';
import AdCard from '@/components/app/AdCard';
import AdMedia from '@/components/app/AdMedia';
import {
  Wallet,
  TrendingUp,
  Share2,
  Users,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle2,
  FileText,
  Share,
  Share2Icon,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, token } = useAuth();
  const [ads, setAds] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalShares: 0,
    pendingShares: 0,
    referrals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<any>(null);

  useEffect(() => {
    fetchHomeData();
  }, [token]);

  const fetchHomeData = async () => {
    try {
      // Fetch featured ads
      const adsRes = await fetch('/api/advertisements', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const adsResult = await adsRes.json();
      const adsData = adsResult.success && adsResult.data ? adsResult.data : [];
      
      // Map API response to expected format
      const mappedAds = adsData.slice(0, 5).map((ad: any) => ({
        _id: ad.id,
        title: ad.title,
        description: ad.description,
        imageUrl: ad.image,
        mediaType: ad.mediaType === 'video' ? 'video' : 'image',
        reward: ad.rewardAmount,
        verificationPeriod: ad.verificationPeriodHours === 0 ? 'instant' : `hour${ad.verificationPeriodHours}`,
        vendor: { name: ad.vendor?.businessName || ad.vendor?.name || 'Unknown' },
        views: 0,
        shares: ad.totalShares || 0,
      }));
      setAds(mappedAds);

      // Fetch user stats (from shares, referrals, etc.)
      const sharesRes = await fetch('/api/shares', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sharesResult = await sharesRes.json();
      const sharesData = sharesResult.success && sharesResult.data ? sharesResult.data : [];
      
      let referralsCount = 0;
      try {
        const referralRes = await fetch('/api/users/referral', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const referralResult = await referralRes.json();
        if (referralResult.success && referralResult.data) {
          referralsCount = referralResult.data.directReferrals?.length || 0;
        }
      } catch (e) {
        console.log('Referral API not available');
      }

      setStats({
        totalEarnings: user?.balance || 0,
        totalShares: sharesData.length || 0,
        pendingShares: sharesData.filter((s: any) => s.status === 'pending').length || 0,
        referrals: referralsCount,
      });
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AppHeader title="Home" showBack={false} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Custom Home Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                {/* <span className="text-lg font-bold text-slate-950">MS</span> */}
                <img src="/mystatus.jpeg" alt="MyStatus" className="w-full h-full object-cover rounded-2xl" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">MyStatus</h1>
                <p className="text-xs text-slate-400">Earn • Share • Grow</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link
                href="/app/my-shares"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <Share2Icon className="w-5 h-5 text-slate-300" />
              </Link>
              <a
                href="https://wa.me/919356404762"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
              >
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pb-6">
        {/* Welcome Section */}
        <div className="py-6">
          <p className="text-slate-400 text-sm mb-1">Welcome back,</p>
          <h2 className="text-2xl font-bold text-white">
            {user?.name?.split(' ')[0]} 👋
          </h2>
        </div>

        {/* Balance Card - Modern Glass Style */}
        <div className="relative overflow-hidden glass-card rounded-3xl p-6 mb-6">
          {/* Background Gradient Orbs */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-slate-400 text-sm font-medium">Available Balance</span>
              </div>
              <Link
                href="/app/wallet"
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
              >
                View Details →
              </Link>
            </div>
            
            <CoinAmount amount={user?.balance || 0} size="xl" />
            
            <div className="mt-6 flex gap-2">
              <Link
                href="/app/wallet"
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-semibold rounded-xl transition-all text-center text-sm"
              >
                Withdraw
              </Link>
              <Link
                href="/app/marketplace"
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all text-center text-sm"
              >
                Buy Keys
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid - Modern Style */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/app/earnings"
            className="glass-card rounded-2xl p-4 group"
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-fit mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-slate-500 text-xs mb-1">Total Shares</p>
            <p className="text-2xl font-bold text-white">{stats.totalShares}</p>
          </Link>

          <Link
            href="/app/my-shares"
            className="glass-card rounded-2xl p-4 group"
          >
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 w-fit mb-3">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-slate-500 text-xs mb-1">Pending</p>
            <p className="text-2xl font-bold text-white">{stats.pendingShares}</p>
          </Link>

          <Link
            href="/app/referral"
            className="glass-card rounded-2xl p-4 group"
          >
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 w-fit mb-3">
              <Users className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-slate-500 text-xs mb-1">Referrals</p>
            <p className="text-2xl font-bold text-white">{stats.referrals}</p>
          </Link>

          <Link
            href="/app/earnings"
            className="glass-card rounded-2xl p-4 group"
          >
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 w-fit mb-3">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-slate-500 text-xs mb-1">Earnings</p>
            <CoinAmount amount={user?.balance || 0} size="lg" showIcon={false} />
          </Link>
        </div>

        {/* Featured Ads Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Featured Ads</h3>
            <Link
              href="/app/discover"
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors text-xs font-medium"
            >
              View All
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {ads.length === 0 ? (
              <div className="glass-card rounded-2xl text-center py-12">
                <Share2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No featured ads available</p>
              </div>
            ) : (
              ads.map((ad, index) => (
                <AdCard key={ad._id || `ad-${index}`} ad={ad} onClick={() => setSelectedAd(ad)} />
              ))
            )}
          </div>
        </div>

        {/* 8-Day Challenge Banner */}
        <Link
          href="/app/mystatus-challenge"
          className="relative block overflow-hidden glass-card rounded-2xl p-5 group"
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-pink-500/10 group-hover:from-violet-500/15 group-hover:to-pink-500/15 transition-all" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-500/20 border border-violet-500/30">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-0.5">8-Day Challenge</h4>
                <p className="text-slate-400 text-xs">Complete daily tasks & earn rewards</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Ad Details Modal */}
      {selectedAd && (
        <div
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[60] flex items-end justify-center"
          onClick={() => setSelectedAd(null)}
        >
          <div
            className="bg-slate-900 w-full max-w-md rounded-t-3xl animate-slide-up border-t border-white/10 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="flex-shrink-0 pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto"></div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Image */}
              {selectedAd.imageUrl && (
                <div className="h-52 bg-slate-950">
                  <AdMedia
                    src={selectedAd.imageUrl}
                    alt={selectedAd.title}
                    mediaType={selectedAd.mediaType}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex-1 pr-4">{selectedAd.title}</h3>
                  <CoinAmount amount={selectedAd.reward} size="md" />
                </div>
                
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">{selectedAd.description}</p>
                
                {/* Ad Info */}
                <div className="glass-card rounded-xl p-4 mb-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">Reward</span>
                    <CoinAmount amount={selectedAd.reward} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">Verification</span>
                    <span className="text-white text-sm font-medium">
                      {selectedAd.verificationPeriod === 'instant' ? 'Instant' : selectedAd.verificationPeriod?.replace('hour', '') + 'h'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">By</span>
                    <span className="text-white text-sm font-medium">{selectedAd.vendor?.name}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fixed Bottom Actions */}
            <div className="flex-shrink-0 p-6 pt-0 pb-8 bg-slate-900">
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedAd(null)}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all"
                >
                  Close
                </button>
                <Link
                  href={`/app/share/${selectedAd._id}`}
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold rounded-xl text-center"
                >
                  Share & Earn
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
