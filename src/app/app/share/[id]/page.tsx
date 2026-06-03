'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/app/AppHeader';
import CoinAmount from '@/components/app/CoinAmount';
import {
  Upload,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  Percent,
} from 'lucide-react';

interface Ad {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  reward: number;
  verificationPeriod: string;
  vendor?: { name: string };
  commissionEnabled?: boolean;
  commissionNote?: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function ShareAdPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { token, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [ad, setAd] = useState<Ad | null>(null);
  const [share, setShare] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    fetchAdAndCreateShare();
  }, [resolvedParams.id, token]);

  useEffect(() => {
    if (!ad || typeof window === 'undefined') return;
    const baseUrl = window.location.origin;
    const slug = slugify(ad.title) || ad._id;
    const referral = user?.referralCode ? `?ref=${encodeURIComponent(user.referralCode)}` : '';
    setShareUrl(`${baseUrl}/property/${encodeURIComponent(slug)}${referral}`);
  }, [ad, user?.referralCode]);

  const fetchAdAndCreateShare = async () => {
    try {
      // Fetch ad details
      const adRes = await fetch(`/api/advertisements/${resolvedParams.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const adResult = await adRes.json();
      
      if (adResult.success && adResult.data) {
        const adData = adResult.data;
        setAd({
          _id: adData.id || adData._id,
          title: adData.title,
          description: adData.description,
          imageUrl: adData.image || adData.imageUrl,
          reward: adData.rewardAmount || adData.reward,
          verificationPeriod: adData.verificationPeriodHours ? `${adData.verificationPeriodHours}h` : (adData.verificationPeriod || 'instant'),
          vendor: adData.vendor,
          commissionEnabled: !!adData.commissionEnabled,
          commissionNote: adData.commissionNote || '',
        });
      } else {
        // Ad not found
        toast({ title: 'Error', description: adResult.message || 'Advertisement not found', variant: 'destructive' });
        router.push('/app/discover');
        return;
      }

      // Try to create share record (will return existing pending share if one exists)
      const shareRes = await fetch('/api/shares', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ advertisementId: resolvedParams.id }),
      });

      const shareResult = await shareRes.json();
      
      if (shareResult.success && shareResult.data) {
        // API returns existing pending share or newly created share
        setShare(shareResult.data);
        
        // Show informative toast if continuing an existing share
        if (shareResult.message && shareResult.message.includes('Continuing')) {
          toast({ title: 'Notice', description: shareResult.message });
        }
      } else {
        // Show user-friendly error and redirect back
        const errorMessage = shareResult.message || 'Failed to create share';
        toast({ title: 'Wait!', description: errorMessage, variant: 'destructive' });
        
        // If ad not found, redirect to discover page instead of going back
        if (errorMessage.includes('not found') || errorMessage.includes('removed')) {
          router.push('/app/discover');
        } else {
          router.back();
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to load ad details. Please try again.', variant: 'destructive' });
      router.push('/app/discover');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'File size must be less than 50MB', variant: 'destructive' });
      return;
    }

    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setFileType(type);
    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    try {
      // 1. Get signature from backend
      const timestamp = Math.round(Date.now() / 1000);
      const folder = 'mystatus-proofs';

      const signRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          params_to_sign: { timestamp, folder },
        }),
      });

      const signResult = await signRes.json();
      if (!signResult.success || !signResult.data) {
        throw new Error(signResult.message || 'Failed to get upload signature');
      }

      const { signature, api_key, cloud_name } = signResult.data;

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', api_key);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/${fileType}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to Cloudinary');
      }

      const uploadResult = await uploadRes.json();
      return uploadResult.secure_url;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleShareToWhatsApp = async () => {
    try {
      if (!shareUrl || !ad?._id) {
        toast({ title: 'Error', description: 'Share link is not ready yet. Please try again.', variant: 'destructive' });
        return;
      }
      const baseUrl = window.location.origin;
      const adLink = `${baseUrl}/app/share/${encodeURIComponent(ad._id)}`;
      const registerLink = shareUrl;
      const messageLines = [
        `Check out ${ad.title}`,
        `Ad Link -> ${adLink}`,
        `Register Link -> ${registerLink}`,
      ];
      const message = messageLines.join('\n');
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Share error:', error);
      toast({ title: 'Error', description: 'Could not open WhatsApp. Please try again.', variant: 'destructive' });
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      const tempInput = document.createElement('textarea');
      tempInput.value = shareUrl;
      tempInput.setAttribute('readonly', 'true');
      tempInput.style.position = 'absolute';
      tempInput.style.left = '-9999px';
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({ title: 'Missing Proof', description: 'Please select a proof image or video', variant: 'destructive' });
      return;
    }

    if (!share?.id) {
      toast({ title: 'Error', description: 'Share record not found', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Upload file to Cloudinary
      setUploadProgress(0.3);
      const cloudinaryUrl = await uploadToCloudinary(selectedFile);
      
      setUploadProgress(0.7);

      // Submit verification
      const verifyRes = await fetch(`/api/shares/${share.id}/verify`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proofImage: cloudinaryUrl }),
      });

      const verifyResult = await verifyRes.json();

      setUploadProgress(1);

      if (verifyResult.success) {
        toast({ 
          title: 'Success!', 
          description: 'Verification proof submitted successfully! 🎉 Your proof has been uploaded and submitted for review.', 
          variant: 'success' 
        });
        router.push('/app/my-shares');
      } else {
        toast({ title: 'Error', description: verifyResult.message || 'Failed to submit verification', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({ title: 'Upload Failed', description: error.message || 'Failed to upload proof. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-5 h-5 text-amber-400" />,
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10 border-amber-500/20',
          label: 'PENDING',
        };
      case 'verified':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10 border-emerald-500/20',
          label: 'VERIFIED',
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-5 h-5 text-red-400" />,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10 border-red-500/20',
          label: 'REJECTED',
        };
      default:
        return {
          icon: <Clock className="w-5 h-5 text-slate-400" />,
          color: 'text-slate-400',
          bgColor: 'bg-slate-500/10 border-slate-500/20',
          label: status.toUpperCase(),
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <AppHeader title="Share & Earn" showBack={true} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!ad || !share) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <AppHeader title="Share & Earn" showBack={true} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-slate-300">Ad not found</p>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(share.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24">
      <AppHeader title="Share & Earn" showBack={true} />

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Status Badge */}
        <div className={`glass-card rounded-xl p-3 mb-4 border ${statusInfo.bgColor}`}>
          <div className="flex items-center gap-3">
            {statusInfo.icon}
            <div className="flex-1">
              <p className={`text-sm font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
              <p className="text-xs text-slate-500">
                Shared {new Date(share.sharedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Ad Info Card */}
        <div className="glass-card rounded-2xl overflow-hidden mb-6">
          {ad.imageUrl && (
            <div className="h-48 bg-slate-950">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="text-lg font-bold text-white mb-2">{ad.title}</h3>
            {ad.commissionEnabled && ad.commissionNote && (
              <div className="flex items-start gap-2 mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Percent className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-amber-200/90">{ad.commissionNote}</span>
              </div>
            )}
            {shareUrl && (
              <div className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80 mb-2">Share Link</p>
                <div className="flex items-center gap-2">
                  <input
                    value={shareUrl}
                    readOnly
                    onFocus={(event) => event.currentTarget.select()}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition"
                  >
                    {isCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">Tap the link to select and share.</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Reward</span>
              <CoinAmount amount={ad.reward} size="md" />
            </div>
          </div>
        </div>

        {/* Share to WhatsApp - Only show if no proof submitted */}
        {!share?.proofImage && (
          <div className="mb-6">
            <button
              onClick={handleShareToWhatsApp}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Share Link to WhatsApp
            </button>
            <p className="text-xs text-slate-400 text-center mt-3">
              Share the link on WhatsApp, then upload proof below
            </p>
          </div>
        )}

        {/* Already Submitted Proof Display */}
        {share?.proofImage ? (
          <div className="glass-card rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h4 className="text-white font-semibold">Proof Submitted</h4>
            </div>
            <div className="mb-4">
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/20">
                {share.proofImage.includes('video') || share.proofImage.match(/\.(mp4|mov|webm)$/i) ? (
                  <video
                    src={share.proofImage}
                    controls
                    className="w-full h-64"
                  />
                ) : (
                  <img
                    src={share.proofImage}
                    alt="Submitted Proof"
                    className="w-full h-auto"
                  />
                )}
              </div>
            </div>
            <p className="text-sm text-slate-400 text-center">
              Your proof has been submitted and is under review. You'll be notified once it's verified.
            </p>
          </div>
        ) : (
          <>
            {/* Instructions */}
            <div className="glass-card rounded-2xl p-5 mb-6">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-400" />
                Upload Proof
              </h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p className="flex gap-2">
                  <span className="text-emerald-400 font-bold">1.</span>
                  Copy the share link and post it on WhatsApp
                </p>
                <p className="flex gap-2">
                  <span className="text-emerald-400 font-bold">2.</span>
                  Take a screenshot of the shared link as proof
                </p>
                <p className="flex gap-2">
                  <span className="text-emerald-400 font-bold">3.</span>
                  Upload the proof below and submit for verification
                </p>
              </div>
            </div>
          </>
        )}

        {/* File Upload - Only show if no proof submitted */}
        {!share?.proofImage && (
          <div className="glass-card rounded-2xl p-5 mb-6">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isSubmitting}
            />

          {!previewUrl ? (
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center py-12 cursor-pointer border-2 border-dashed border-slate-700 rounded-xl hover:border-emerald-500/50 transition-all"
            >
              <Upload className="w-12 h-12 text-slate-500 mb-3" />
              <p className="text-white font-medium mb-1">Upload Proof</p>
              <p className="text-sm text-slate-500">Image or Video (Max 50MB)</p>
            </label>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950">
                {fileType === 'image' ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-contain"
                  />
                ) : (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full h-64"
                  />
                )}
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl('');
                    URL.revokeObjectURL(previewUrl);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-lg"
                  disabled={isSubmitting}
                >
                  <XCircle className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* File Info */}
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                {fileType === 'image' ? (
                  <ImageIcon className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Video className="w-5 h-5 text-emerald-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{selectedFile?.name}</p>
                  <p className="text-xs text-slate-500">
                    {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Upload Progress */}
        {isSubmitting && uploadProgress > 0 && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white font-medium">Uploading...</span>
              <span className="text-sm text-emerald-400 font-bold">
                {Math.round(uploadProgress * 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                style={{ width: `${uploadProgress * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button - Only show if no proof submitted */}
        {!share?.proofImage && (
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Submit for Verification
              </>
            )}
          </button>
        )}

        {/* Deadline Info */}
        {share.verificationDeadline && (
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              Submit before{' '}
              <span className="text-amber-400 font-medium">
                {new Date(share.verificationDeadline).toLocaleString()}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
