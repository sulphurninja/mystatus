'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import '@/components/admin/admin-theme.css';

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.data.admin));

        const permissions = data.data.admin.permissions || [];
        if (data.data.admin.role === 'sub-admin') {
          if (permissions.includes('vendors.create') || permissions.includes('vendors.approve')) {
            router.push('/admin/vendors');
          } else if (
            permissions.includes('advertisements.create') ||
            permissions.includes('advertisements.approve')
          ) {
            router.push('/admin/advertisements');
          } else {
            router.push('/admin/login');
          }
        } else {
          router.push('/admin/dashboard');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-700/50 bg-white shadow-lg">
            <Image src="/mystatus.jpeg" alt="MyStatus" width={44} height={44} className="object-cover" />
          </div>
          <h1 className="admin-display text-3xl font-semibold tracking-tight">Admin console</h1>
          <p className="mt-2 text-sm text-[var(--admin-muted)]">Sign in to manage MyStatus.</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-panel space-y-4 p-6">
          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <div>
            <label className="admin-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              className="admin-input"
              placeholder="admin@mystatus.com"
            />
          </div>

          <div>
            <label className="admin-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
              className="admin-input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={isLoading} className="admin-btn admin-btn-primary mt-2 w-full">
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
