'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/app/AppHeader';
import {
  Share2,
  Copy,
  CheckCircle2,
  MessageCircle,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  QrCode,
} from 'lucide-react';

export default function ShareAppPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const referralLink = `https://mystatusads.com/r/${user?.referralCode}`;
  const referralText = `Join MyStatus and start earning by sharing advertisements!\n\nUse my referral code: ${user?.referralCode}\n${referralLink}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const encodedText = encodeURIComponent(referralText);
    const encodedLink = encodeURIComponent(referralLink);

    const urls = {
      whatsapp: `https://wa.me/?text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
      email: `mailto:?subject=Join MyStatus&body=${encodedText}`,
    };

    const url = urls[platform as keyof typeof urls];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'Join MyStatus',
          text: referralText,
        })
        .catch((err) => console.log('Error sharing:', err));
    } else {
      handleCopy();
    }
  };

  const shareButtons = [
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'from-green-500 to-green-600' },
    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'from-blue-500 to-blue-600' },
    { id: 'twitter', label: 'Twitter', icon: Twitter, color: 'from-sky-500 to-sky-600' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-blue-700' },
    { id: 'email', label: 'Email', icon: Mail, color: 'from-slate-600 to-slate-700' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <AppHeader title="Share App" showBack={true} />

      <div className="max-w-md mx-auto px-4 pb-6">
        {/* Header */}
        <div className="py-6 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
            <Share2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Share MyStatus</h1>
          <p className="text-slate-400">
            Invite friends and earn multi-level commissions on their earnings!
          </p>
        </div>

        {/* Referral Code Card */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6">
            <p className="text-sm text-slate-300 mb-2 text-center">Your Referral Code</p>
            <div className="text-4xl font-bold text-purple-400 mb-6 text-center tracking-wider">
              {user?.referralCode}
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
              <p className="text-xs text-slate-400 mb-2">Referral Link</p>
              <p className="text-sm text-slate-300 break-all">{referralLink}</p>
            </div>

            <button
              onClick={handleCopy}
              className="w-full py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Share Button */}
        <button
          onClick={handleNativeShare}
          className="w-full mb-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/50 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          Share Now
        </button>

        {/* Share via Platforms */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
            Share via
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {shareButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  onClick={() => handleShare(btn.id)}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 transition-all active:scale-[0.98]"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${btn.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-slate-200 font-medium text-center">{btn.label}</p>
                </button>
              );
            })}

            <button
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 transition-all active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <p className="text-slate-200 font-medium text-center">QR Code</p>
            </button>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <h4 className="text-lg font-bold text-slate-100 mb-4">Why Share?</h4>
          <div className="space-y-3 text-sm text-slate-400">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p>Earn multi-level referral commissions on all earnings</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p>Build a passive income stream with your network</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p>Help others discover a new way to earn money</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
