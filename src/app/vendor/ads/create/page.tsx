'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateAdPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rewardAmount: '',
    verificationPeriodHours: '8',
  });
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adsRemaining, setAdsRemaining] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/vendor/profile', { headers: { ...getAuthHeaders() } });
      if (res.ok) {
        const data = await res.json();
        setAdsRemaining(data.vendor?.adsRemaining || 0);
      } else if (res.status === 401) {
        router.push('/vendor/login');
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setUploading(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: fd,
      });

      const data = await res.json();
      if (data.success) {
        setImageUrl(data.data.url);
      } else {
        setError(data.message || 'Upload failed');
        setImagePreview('');
      }
    } catch {
      setError('Image upload failed');
      setImagePreview('');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.description || !imageUrl || !formData.rewardAmount) {
      setError('All fields are required');
      return;
    }

    if (adsRemaining <= 0) {
      setError('No ads remaining. Contact admin for a new package.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/vendor/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          image: imageUrl,
          rewardAmount: Number(formData.rewardAmount),
          verificationPeriodHours: Number(formData.verificationPeriodHours),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Ad created successfully!');
        setAdsRemaining(data.adsRemaining ?? adsRemaining - 1);
        setTimeout(() => router.push('/vendor/ads'), 1500);
      } else {
        setError(data.message || 'Failed to create ad');
      }
    } catch {
      setError('Failed to create ad');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-violet-400 to-purple-500 rounded-full"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Create Advertisement
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">
          {adsRemaining} ad{adsRemaining !== 1 ? 's' : ''} remaining in your package
        </p>
      </div>

      {adsRemaining <= 0 ? (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-8 text-center">
          <svg className="w-16 h-16 text-amber-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-2xl font-bold text-amber-300 mb-2">No Ads Remaining</h3>
          <p className="text-slate-400">Contact the admin to get a new package assigned to your account.</p>
        </div>
      ) : (
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 space-y-6">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-1 h-4 bg-violet-400 rounded-full"></div>
                <h2 className="text-lg font-semibold text-slate-100">Ad Details</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Enter ad title"
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  maxLength={500}
                  rows={3}
                  placeholder="Describe your advertisement"
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Ad Image</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-slate-600/50 rounded-2xl p-6 text-center cursor-pointer hover:border-violet-500/50 transition-all duration-200"
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-xl object-contain" />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8">
                      <svg className="w-12 h-12 text-slate-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-slate-400 text-sm">Click to upload image</p>
                      <p className="text-slate-500 text-xs mt-1">JPG, PNG, WebP (max 50MB)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reward Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="5"
                    value={formData.rewardAmount}
                    onChange={(e) => setFormData(p => ({ ...p, rewardAmount: e.target.value }))}
                    className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Verification Period (hrs)</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    placeholder="8"
                    value={formData.verificationPeriodHours}
                    onChange={(e) => setFormData(p => ({ ...p, verificationPeriodHours: e.target.value }))}
                    className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.push('/vendor/ads')}
                className="flex-1 px-6 py-4 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-slate-200 rounded-2xl font-semibold transition-all duration-200 border border-slate-600/50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading || !imageUrl}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Creating...' : 'Create Advertisement'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
