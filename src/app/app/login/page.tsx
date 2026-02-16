'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Key, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [activationKey, setActivationKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activationKey.length < 6 || activationKey.length > 12) {
      setError('Activation key must be 6-12 characters');
      return;
    }

    setIsLoading(true);

    try {
      await login(activationKey);
      // Layout will automatically redirect when user state updates
      // No manual redirect needed
    } catch (err: any) {
      setError(err.message || 'Invalid activation key');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]" />
      
      <div className="relative flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-10">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl blur-xl opacity-50" />
            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              {/* <span className="text-2xl font-bold text-slate-950">MS</span> */}
              <img src="/mystatus.jpeg" alt="MyStatus" className="w-full h-full object-cover rounded-2xl" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400 text-sm">Enter your activation key to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Activation Key Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Activation Key
            </label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                placeholder="Enter your activation key"
                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all font-mono tracking-wider"
                maxLength={12}
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">6-12 characters</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>

          {/* Register Link */}
          <div className="text-center pt-2">
            <p className="text-slate-500 text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/app/register"
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Register
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Footer Note */}
      <div className="relative max-w-md mx-auto w-full px-6 pb-8">
        <p className="text-center text-xs text-slate-600">
          Need an activation key?{' '}
          <Link href="/app/marketplace" className="text-emerald-400 hover:text-emerald-300">
            Purchase one
          </Link>
        </p>
      </div>
    </div>
  );
}
