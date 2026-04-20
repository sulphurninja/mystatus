'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface Ad {
  id: string;
  title: string;
  image: string;
  rewardAmount: number;
  commissionEnabled?: boolean;
  commissionNote?: string;
}

const rupeeSymbol = '\u20B9';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function PropertySharePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const referralCode = (searchParams.get('ref') || '').trim();

  const slugParam = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const decodedSlug = useMemo(() => (slugParam ? decodeURIComponent(slugParam) : ''), [slugParam]);

  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [requiresLoan, setRequiresLoan] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [panCard, setPanCard] = useState<File | null>(null);
  const [aadhaarCard, setAadhaarCard] = useState<File | null>(null);
  const [bankStatement, setBankStatement] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchAd = async () => {
      if (!decodedSlug) return;
      setLoading(true);
      setLoadError('');
      try {
        const response = await fetch('/api/advertisements', { cache: 'no-store' });
        const result = await response.json();

        if (!result?.success || !Array.isArray(result.data)) {
          setLoadError(result?.message || 'Failed to load property');
          setLoading(false);
          return;
        }

        const matched = result.data.find((item: any) => {
          const id = String(item.id || '');
          const title = String(item.title || '');
          return id === decodedSlug || slugify(title) === decodedSlug;
        });

        if (!matched) {
          setLoadError('Property not found');
          setLoading(false);
          return;
        }

        setAd({
          id: String(matched.id),
          title: String(matched.title),
          image: String(matched.image || ''),
          rewardAmount: Number(matched.rewardAmount || 0),
          commissionEnabled: !!matched.commissionEnabled,
          commissionNote: String(matched.commissionNote || '')
        });
      } catch (error) {
        console.error('Property load error:', error);
        setLoadError('Failed to load property');
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [decodedSlug]);

  const handleShareToWhatsApp = () => {
    if (!ad || !decodedSlug) return;
    const origin = window.location.origin;
    const shareUrl = referralCode
      ? `${origin}/property/${encodeURIComponent(decodedSlug)}?ref=${encodeURIComponent(referralCode)}`
      : `${origin}/property/${encodeURIComponent(decodedSlug)}`;
    const message = `Check out ${ad.title}\n${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleLeadSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ad) return;

    setFormError('');
    setSuccessMessage('');

    if (!name.trim() || !contactNumber.trim() || !email.trim() || !address.trim()) {
      setFormError('Please enter your name, contact number, email, and address.');
      return;
    }

    if (requiresLoan) {
      if (!loanAmount.trim() || Number(loanAmount) <= 0) {
        setFormError('Please enter the required loan amount.');
        return;
      }
      if (!pan.trim() || !aadhaar.trim()) {
        setFormError('Please enter PAN and Aadhaar for the loan application.');
        return;
      }
      if (!panCard || !aadhaarCard || !bankStatement) {
        setFormError('Please upload PAN card, Aadhaar card, and bank statement.');
        return;
      }
    }

    setIsSubmitting(true);
    let leadSaved = false;
    try {
      const response = await fetch('/api/property-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          contactNumber: contactNumber.trim(),
          email: email.trim(),
          address: address.trim(),
          requiresLoan,
          loanAmount: requiresLoan ? Number(loanAmount) : undefined,
          propertyId: ad.id,
          referralCode: referralCode || undefined
        })
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        setFormError(result?.message || 'Failed to submit details. Please try again.');
        return;
      }

      leadSaved = true;

      if (requiresLoan) {
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('contactNumber', contactNumber.trim());
        formData.append('email', email.trim());
        formData.append('loanAmount', loanAmount.trim());
        formData.append('pan', pan.trim().toUpperCase());
        formData.append('aadhaar', aadhaar.trim());
        formData.append('propertyId', ad.id);
        if (referralCode) {
          formData.append('referralCode', referralCode);
        }
        formData.append('panCard', panCard);
        formData.append('aadhaarCard', aadhaarCard);
        formData.append('bankStatement', bankStatement);

        const loanRes = await fetch('/api/loan-applications', {
          method: 'POST',
          body: formData
        });
        const loanResult = await loanRes.json();
        if (!loanRes.ok || !loanResult?.success) {
          setFormError(loanResult?.message ? `Lead saved, but loan application failed: ${loanResult.message}` : 'Lead saved, but loan application failed.');
          return;
        }
      }

      setSuccessMessage(requiresLoan
        ? 'Thanks! Your details and loan application were submitted successfully.'
        : 'Thanks! Your details were submitted successfully.');
      setName('');
      setContactNumber('');
      setEmail('');
      setAddress('');
      setRequiresLoan(false);
      setLoanAmount('');
      setPan('');
      setAadhaar('');
      setPanCard(null);
      setAadhaarCard(null);
      setBankStatement(null);
    } catch (error) {
      console.error('Lead submit error:', error);
      setFormError(leadSaved
        ? 'Lead saved, but loan application failed. Please try again.'
        : 'Failed to submit details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (loadError || !ad) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold">Property Unavailable</h1>
          <p className="text-slate-400">{loadError || 'The requested property could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/70">Property Referral</p>
          <h1 className="text-3xl md:text-4xl font-black text-white">{ad.title}</h1>
          <p className="text-slate-400">
            Share the property link or submit your details to get started.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800/70 bg-slate-900/40 overflow-hidden">
            <div className="aspect-[16/9] bg-slate-900">
              {ad.image ? (
                <img
                  src={ad.image}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  No image available
                </div>
              )}
            </div>
            <div className="p-6 space-y-4">
              {ad.commissionEnabled && ad.commissionNote ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
                  <p className="text-sm font-semibold uppercase tracking-wider">Commission</p>
                  <p className="text-base text-amber-100/90">{ad.commissionNote}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 text-slate-300">
                  <p className="text-sm font-semibold uppercase tracking-wider">Commission</p>
                  <p className="text-base text-slate-400">Commission details will be shared after registration.</p>
                </div>
              )}
              <div className="relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent p-4">
                <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl" />
                <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-teal-400/10 blur-2xl" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Reward</p>
                    <p className="text-3xl font-bold text-emerald-100">{rupeeSymbol}{ad.rewardAmount}</p>
                    <p className="text-xs text-emerald-100/70 mt-1">Paid after successful verification</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-emerald-100 text-sm font-semibold">
                    Instant Bonus
                  </div>
                </div>
              </div>
              {referralCode && (
                <p className="text-xs text-slate-500">Referral code applied: {referralCode}</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800/70 bg-slate-900/40 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Register Your Interest</h2>
            <p className="text-slate-400 mb-6">Enter your details and our team will contact you shortly.</p>

            <form className="space-y-4" onSubmit={handleLeadSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Contact Number</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(event) => setContactNumber(event.target.value)}
                  placeholder="Phone number"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Address</label>
                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Full address"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[96px]"
                />
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4">
                <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl" />
                <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-teal-400/10 blur-2xl" />
                <label className="relative flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-emerald-200 uppercase tracking-[0.15em]">Required Loan</p>
                    <p className="text-xs text-emerald-100/80 mt-1">
                      Tick to add KYC details and submit loan request together.
                    </p>
                  </div>
                  <span className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={requiresLoan}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setRequiresLoan(checked);
                        if (!checked) {
                          setPan('');
                          setAadhaar('');
                          setLoanAmount('');
                          setPanCard(null);
                          setAadhaarCard(null);
                          setBankStatement(null);
                        }
                      }}
                      className="h-5 w-5 rounded-md border-emerald-300 bg-slate-900/60 text-emerald-400 focus:ring-2 focus:ring-emerald-300"
                    />
                  </span>
                </label>
              </div>

              {requiresLoan && (
                <div className="space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-sm font-semibold text-emerald-200">Loan KYC Details</p>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Loan Amount</label>
                    <input
                      type="number"
                      min="1"
                      value={loanAmount}
                      onChange={(event) => setLoanAmount(event.target.value)}
                      placeholder="Enter required loan amount"
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">PAN</label>
                      <input
                        type="text"
                        value={pan}
                        onChange={(event) => setPan(event.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Aadhaar</label>
                      <input
                        type="text"
                        value={aadhaar}
                        onChange={(event) => setAadhaar(event.target.value)}
                        placeholder="12-digit Aadhaar number"
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">PAN Card Upload</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(event) => setPanCard(event.target.files?.[0] || null)}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-200 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Aadhaar Card Upload</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(event) => setAadhaarCard(event.target.files?.[0] || null)}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-200 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Bank Statement (PDF, minimum 3 months)</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(event) => setBankStatement(event.target.files?.[0] || null)}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-200 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                    />
                  </div>
                </div>
              )}

              {formError && (
                <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-200 text-sm">
                  {formError}
                </div>
              )}
              {successMessage && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-100 text-sm">
                  {successMessage}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
