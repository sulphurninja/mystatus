'use client';

import { useState } from 'react';
import CoinAmount from './CoinAmount';
import AdMedia from './AdMedia';
import { Clock, Share2, Zap, Percent } from 'lucide-react';

interface Advertisement {
  _id: string;
  title: string;
  description: string;
  vendor: {
    name: string;
  };
  imageUrl?: string;
  mediaType?: 'image' | 'video';
  reward: number;
  verificationPeriod: 'instant' | 'hour1' | 'hour2' | 'hour3' | 'hour4' | 'hour5' | 'hour6' | 'hour12' | 'hour24';
  views?: number;
  shares?: number;
  commissionEnabled?: boolean;
  commissionNote?: string;
}

interface AdCardProps {
  ad: Advertisement;
  onClick?: () => void;
}

export default function AdCard({ ad, onClick }: AdCardProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    if (isClicked || !onClick) return;
    setIsClicked(true);
    onClick();
    setTimeout(() => setIsClicked(false), 3000);
  };
  const getVerificationTime = (period: string) => {
    if (period === 'instant') return 'Instant';
    const hours = period.replace('hour', '');
    return `${hours}h`;
  };

  const isInstant = ad.verificationPeriod === 'instant';

  return (
    <div
      onClick={handleClick}
      className={`group glass-card rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-300 ${isClicked ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Image */}
      {ad.imageUrl && (
        <div className="relative h-44 bg-slate-900/50 overflow-hidden">
          <AdMedia
            src={ad.imageUrl}
            alt={ad.title}
            mediaType={ad.mediaType}
            controls={false}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          
          {/* Reward Badge */}
          <div className="absolute top-3 right-3">
            <div className="px-3 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-1.5">
              <CoinAmount amount={ad.reward} size="sm" showIcon={true} />
            </div>
          </div>
          
          {/* Verification Badge */}
          <div className="absolute bottom-3 left-3">
            <div className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-medium ${
              isInstant 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-slate-900/80 text-slate-300 border border-white/10'
            }`}>
              {isInstant ? <Zap className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {getVerificationTime(ad.verificationPeriod)}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-semibold line-clamp-1 mb-1.5 group-hover:text-emerald-400 transition-colors">
          {ad.title}
        </h3>

        <p className="text-slate-400 text-sm line-clamp-2 mb-3 leading-relaxed">
          {ad.description}
        </p>

        {ad.commissionEnabled && ad.commissionNote && (
          <div className="flex items-start gap-2 mb-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Percent className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-amber-200/90">{ad.commissionNote}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <p className="text-xs text-slate-500">
            by <span className="text-slate-400">{ad.vendor.name}</span>
          </p>
          
          {ad.shares !== undefined && ad.shares > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Share2 className="w-3 h-3" />
              {ad.shares}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
