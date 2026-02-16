'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, TrendingUp, Users, Wallet, Share2 } from 'lucide-react';

const slides = [
  {
    icon: TrendingUp,
    title: 'Earn While You Share',
    description: 'Share advertisements with your network and earn money for every verified share.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Users,
    title: 'Build Your Network',
    description: 'Invite friends and earn multi-level referral commissions on their earnings.',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    icon: Wallet,
    title: 'Easy Withdrawals',
    description: 'Track your earnings in real-time and withdraw directly to your account.',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    icon: Share2,
    title: 'Get Started Today',
    description: 'Join thousands of users already earning with MyStatus. Start your journey now!',
    gradient: 'from-blue-500 to-violet-600',
  },
];

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  
  // If user somehow ends up here while authenticated, redirect to home
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      router.replace('/app/home');
    }
  }, [router]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push('/app/login');
    }
  };

  const handleSkip = () => {
    router.push('/app/login');
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
      
      {/* Skip Button */}
      <div className="relative max-w-md mx-auto w-full px-6 pt-6">
        <button
          onClick={handleSkip}
          className="ml-auto block text-slate-500 hover:text-slate-300 transition-colors text-sm font-medium"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
        {/* Icon */}
        <div className="relative mb-8 animate-fade-in">
          <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} rounded-3xl blur-2xl opacity-40`} />
          <div className={`relative w-28 h-28 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center`}>
            <Icon className="w-12 h-12 text-white" strokeWidth={2} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-white mb-3 animate-fade-in">
          {slide.title}
        </h1>

        {/* Description */}
        <p className="text-center text-slate-400 leading-relaxed animate-fade-in max-w-xs">
          {slide.description}
        </p>
      </div>

      {/* Bottom Section */}
      <div className="relative max-w-md mx-auto w-full px-6 pb-10">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-gradient-to-r from-emerald-400 to-cyan-400'
                  : 'w-1.5 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 active:scale-[0.98]"
        >
          {currentSlide < slides.length - 1 ? 'Continue' : "Get Started"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
