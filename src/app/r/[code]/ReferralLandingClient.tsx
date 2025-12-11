'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ReferralLandingClientProps {
  referralCode: string;
}

export default function ReferralLandingClient({ referralCode }: ReferralLandingClientProps) {
  const [copied, setCopied] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  // APK Download URL - Update this to your actual APK URL
  const APK_DOWNLOAD_URL = 'https://mystatusmlm.vercel.app/download/mystatus.apk';

  useEffect(() => {
    // Optionally fetch referrer info
    const fetchReferrerInfo = async () => {
      try {
        const response = await fetch(`/api/referrer/${referralCode}`);
        const data = await response.json();
        if (data.success && data.data?.name) {
          setReferrerName(data.data.name);
        }
      } catch (error) {
        // Silently fail - referrer name is optional
      }
    };
    fetchReferrerInfo();
  }, [referralCode]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    // Store referral code in localStorage for deep linking
    if (typeof window !== 'undefined') {
      localStorage.setItem('mystatus_referral_code', referralCode);
    }
    window.location.href = APK_DOWNLOAD_URL;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Main Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-center">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl overflow-hidden">
              <Image 
                src="/mystatus.jpeg" 
                alt="MyStatus Logo" 
                width={96} 
                height={96}
                className="object-cover"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">MyStatus</h1>
            <p className="text-emerald-100 text-sm">Earn Money by Sharing Ads</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Invitation Message */}
            <div className="text-center mb-8">
              <p className="text-slate-300 text-lg mb-2">
                {referrerName ? (
                  <>
                    <span className="text-emerald-400 font-semibold">{referrerName}</span> has invited you to join!
                  </>
                ) : (
                  <>You&apos;ve been invited to join MyStatus!</>
                )}
              </p>
              <p className="text-slate-400 text-sm">
                Download the app and start earning by sharing advertisements
              </p>
            </div>

            {/* Referral Code Box */}
            <div className="bg-slate-700/50 rounded-2xl p-6 mb-6 border border-slate-600/50">
              <p className="text-slate-400 text-sm text-center mb-3">Your Referral Code</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-2xl font-mono font-bold text-emerald-400 tracking-wider">
                  {referralCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="p-2 bg-slate-600/50 hover:bg-slate-500/50 rounded-lg transition-colors"
                >
                  {copied ? (
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-slate-500 text-xs text-center mt-3">
                Use this code when registering in the app
              </p>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.523 0H6.477a.954.954 0 00-.954.954v22.092c0 .527.427.954.954.954h11.046a.954.954 0 00.954-.954V.954A.954.954 0 0017.523 0zM12 22a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5-4H7V3h10v15z" />
              </svg>
              Download MyStatus App
            </button>

            {/* Alternative */}
            <div className="mt-4 text-center">
              <p className="text-slate-500 text-sm mb-2">Already have the app?</p>
              <p className="text-slate-400 text-xs">
                Open the app and enter referral code: <span className="text-emerald-400 font-mono">{referralCode}</span>
              </p>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-xs">Earn Money</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-xs">Share Ads</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-xs">Build Network</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-slate-500 text-sm">
            © 2025 MyStatus. All rights reserved.
          </p>
        </div>
      </div>

      {/* CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-30px) translateX(5px);
          }
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

