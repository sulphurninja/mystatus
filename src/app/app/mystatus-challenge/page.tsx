'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/app/AppHeader';
import CoinAmount from '@/components/app/CoinAmount';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Lock,
  Award,
  Share2,
  Clock,
} from 'lucide-react';

export default function MyStatusChallengePage() {
  const { token } = useAuth();
  const [myStatusAds, setMyStatusAds] = useState<any[]>([]);
  const [userShares, setUserShares] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChallengeData();
  }, [token]);

  const fetchChallengeData = async () => {
    try {
      let adsData: any[] = [];
      let sharesData: any[] = [];
      
      try {
        const adsRes = await fetch('/api/mystatus-ads', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const adsResult = await adsRes.json();
        if (adsResult.success && adsResult.data) {
          adsData = adsResult.data;
        }
      } catch (e) {
        console.log('MyStatus ads API not available');
      }
      
      try {
        const sharesRes = await fetch('/api/mystatus-shares', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sharesResult = await sharesRes.json();
        if (sharesResult.success && sharesResult.data) {
          sharesData = sharesResult.data;
        }
      } catch (e) {
        console.log('MyStatus shares API not available');
      }

      // Map API response to expected format
      const mappedAds = adsData.map((ad: any) => ({
        _id: ad.id || ad._id,
        dayNumber: ad.dayNumber,
        title: ad.title,
        imageUrl: ad.image,
        reward: ad.rewardAmount,
      }));
      
      setMyStatusAds(mappedAds);
      setUserShares(sharesData);
    } catch (error) {
      console.error('Error fetching challenge data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDayStatus = (dayNumber: number) => {
    const share = userShares.find((s) => s.advertisement?.dayNumber === dayNumber);
    if (!share) return 'locked';
    if (share.status === 'verified') return 'completed';
    if (share.status === 'pending') return 'pending';
    return 'locked';
  };

  const completedDays = userShares.filter((s) => s.status === 'verified').length;
  const progress = (completedDays / 8) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AppHeader title="8-Day Challenge" showBack={true} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <AppHeader title="Challenge" showBack={true} />

      <div className="max-w-md mx-auto px-4 pb-6">
        {/* Header */}
        <div className="py-6">
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 shadow-lg shadow-purple-500/10">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-slate-100">Complete the Challenge</h2>
            </div>
            
            <p className="text-slate-400 mb-6">
              Share motivational MyStatus posts for 8 consecutive days and earn extra rewards!
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300 font-medium">Progress</span>
                <span className="text-sm text-purple-400 font-bold">
                  {completedDays}/8 Days
                </span>
              </div>
              <div className="h-3 bg-slate-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-600 transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Reward */}
            <div className="flex items-center justify-between bg-slate-900/50 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-slate-300">Completion Bonus</span>
              </div>
              <CoinAmount amount={100} size="md" />
            </div>
          </div>
        </div>

        {/* Challenge Days */}
        <div>
          <h3 className="text-lg font-bold text-slate-100 mb-4">Challenge Days</h3>
          
          <div className="space-y-3">
            {myStatusAds.map((ad) => {
              const status = getDayStatus(ad.dayNumber);
              const share = userShares.find((s) => s.advertisement?._id === ad._id);

              return (
                <div
                  key={ad._id}
                  className={`bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-4 ${
                    status === 'completed'
                      ? 'border-emerald-500/30'
                      : status === 'pending'
                      ? 'border-amber-500/30'
                      : 'border-slate-700/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Day Number */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        status === 'completed'
                          ? 'bg-emerald-500/20 border border-emerald-500/30'
                          : status === 'pending'
                          ? 'bg-amber-500/20 border border-amber-500/30'
                          : 'bg-slate-900/50 border border-slate-700/50'
                      }`}
                    >
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                      ) : status === 'pending' ? (
                        <Clock className="w-7 h-7 text-amber-400" />
                      ) : (
                        <Lock className="w-7 h-7 text-slate-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-slate-100 font-semibold mb-1">
                            Day {ad.dayNumber}
                          </h4>
                          <p className="text-sm text-slate-400 line-clamp-2">{ad.title}</p>
                        </div>
                        {status === 'completed' && (
                          <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400 whitespace-nowrap ml-2">
                            Completed
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-semibold text-amber-400 whitespace-nowrap ml-2">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Image Preview */}
                      {ad.imageUrl && (
                        <div className="mb-3 rounded-xl overflow-hidden bg-slate-900/50">
                          <img
                            src={ad.imageUrl}
                            alt={ad.title}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      )}

                      {/* Action */}
                      {status === 'locked' ? (
                        <p className="text-xs text-slate-500">
                          Complete previous days to unlock
                        </p>
                      ) : status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <p className="text-xs text-amber-400">
                            Verification pending...
                          </p>
                        </div>
                      ) : status === 'completed' ? (
                        <div className="flex items-center justify-between bg-slate-900/50 rounded-xl p-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-emerald-400">Verified</span>
                          </div>
                          <CoinAmount amount={ad.reward || 0} size="sm" />
                        </div>
                      ) : (
                        <button
                          disabled={status === 'locked'}
                          className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-lg hover:shadow-purple-500/50 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                        >
                          <Share2 className="w-4 h-4" />
                          Share Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion Banner */}
        {completedDays === 8 && (
          <div className="mt-6 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-6 text-center">
            <Award className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-100 mb-2">
              Challenge Completed! 🎉
            </h3>
            <p className="text-slate-400 mb-4">
              Congratulations! You've completed the 8-Day Challenge.
            </p>
            <CoinAmount amount={100} size="xl" className="justify-center mb-4" />
            <p className="text-sm text-emerald-400">Bonus credited to your wallet</p>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <h4 className="text-lg font-bold text-slate-100 mb-3">How It Works</h4>
          <div className="space-y-3 text-sm text-slate-400">
            <div className="flex gap-3">
              <Calendar className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <p>Share one MyStatus post each day for 8 consecutive days</p>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p>Each verified share earns you the reward amount</p>
            </div>
            <div className="flex gap-3">
              <Award className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p>Complete all 8 days to earn a ₹100 bonus</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
