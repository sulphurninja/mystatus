'use client';

import { useEffect, useMemo, useState } from 'react';

interface Lead {
  _id: string;
  name: string;
  contactNumber: string;
  email?: string;
  address?: string;
  requiresLoan?: boolean;
  referralCode?: string;
  property?: { _id: string; title: string } | null;
  createdAt: string;
  loan?: {
    pan: string;
    aadhaar: string;
    panCardUrl: string;
    aadhaarCardUrl: string;
    bankStatementUrl: string;
    createdAt: string;
  } | null;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function PropertyLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const origin = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.origin;
  }, []);

  useEffect(() => {
    loadLeads();
  }, [searchTerm]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/property-leads?search=${encodeURIComponent(searchTerm)}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      } else {
        setLeads([]);
      }
    } catch (error) {
      console.error('Error loading property leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (lead: Lead) => {
    if (!lead.property || !origin) return;
    const slug = slugify(lead.property.title) || lead.property._id;
    const link = lead.referralCode
      ? `${origin}/property/${encodeURIComponent(slug)}?ref=${encodeURIComponent(lead.referralCode)}`
      : `${origin}/property/${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(lead._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const getShareLink = (lead: Lead) => {
    if (!lead.property || !origin) return '';
    const slug = slugify(lead.property.title) || lead.property._id;
    return lead.referralCode
      ? `${origin}/property/${encodeURIComponent(slug)}?ref=${encodeURIComponent(lead.referralCode)}`
      : `${origin}/property/${encodeURIComponent(slug)}`;
  };

  const handleDelete = async (leadId: string) => {
    const confirmed = window.confirm('Delete this lead? This cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingId(leadId);
      const response = await fetch(`/api/admin/property-leads?id=${encodeURIComponent(leadId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        alert(result?.message || 'Failed to delete lead.');
        return;
      }
      setLeads((prev) => prev.filter((lead) => lead._id !== leadId));
    } catch (error) {
      console.error('Delete lead error:', error);
      alert('Failed to delete lead.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Property Leads
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">
          Registered users captured from referral links
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, contact, or referral code"
            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <div className="px-4 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300">
          Total Leads: <span className="text-white font-semibold">{leads.length}</span>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-700/50 rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 text-slate-300 font-semibold">
          Lead Records
        </div>
        {loading ? (
          <div className="p-8 text-slate-400">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-slate-400">No leads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 uppercase text-xs border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Address</th>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">Referral Code</th>
                  <th className="px-6 py-3">Loan</th>
                  <th className="px-6 py-3">Submitted</th>
                  <th className="px-6 py-3">Share Link</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="border-b border-slate-800/60 text-slate-200 hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-6 py-4 font-medium">{lead.name}</td>
                    <td className="px-6 py-4">{lead.contactNumber}</td>
                    <td className="px-6 py-4">{lead.email || '-'}</td>
                    <td className="px-6 py-4 max-w-[240px] truncate" title={lead.address || ''}>
                      {lead.address || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {lead.property?.title || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      {lead.referralCode || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {lead.requiresLoan ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(lead.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {lead.property ? (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(lead)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition"
                          onMouseDown={(event) => event.stopPropagation()}
                        >
                          {copiedId === lead._id ? 'Copied' : 'Copy Link'}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(lead._id)}
                        disabled={deletingId === lead._id}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-60"
                        title="Delete lead"
                        onMouseDown={(event) => event.stopPropagation()}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setSelectedLead(null)}
          ></div>
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">Lead Details</h3>
                <p className="text-sm text-slate-400">Full information for this registration.</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Name</p>
                <p className="text-slate-100 font-semibold">{selectedLead.name}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Contact</p>
                <p className="text-slate-100 font-semibold">{selectedLead.contactNumber}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Email</p>
                <p className="text-slate-100 font-semibold">{selectedLead.email || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Referral Code</p>
                <p className="text-slate-100 font-semibold">{selectedLead.referralCode || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Loan Required</p>
                <p className="text-slate-100 font-semibold">{selectedLead.requiresLoan ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Address</p>
              <p className="text-slate-100">{selectedLead.address || '-'}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Property</p>
                <p className="text-slate-100 font-semibold">{selectedLead.property?.title || 'Unknown'}</p>
                <p className="text-xs text-slate-500 mt-1">{selectedLead.property?._id || ''}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Submitted</p>
                <p className="text-slate-100 font-semibold">{new Date(selectedLead.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">Loan Documents</p>
              {selectedLead.loan ? (
                <div className="grid gap-3 md:grid-cols-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">PAN</p>
                    <p className="text-slate-100 font-semibold">{selectedLead.loan.pan}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Aadhaar</p>
                    <p className="text-slate-100 font-semibold">{selectedLead.loan.aadhaar}</p>
                  </div>
                  <div>
                    <a
                      href={selectedLead.loan.panCardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 hover:text-emerald-200 underline"
                    >
                      View PAN Card
                    </a>
                  </div>
                  <div>
                    <a
                      href={selectedLead.loan.aadhaarCardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 hover:text-emerald-200 underline"
                    >
                      View Aadhaar Card
                    </a>
                  </div>
                  <div>
                    <a
                      href={selectedLead.loan.bankStatementUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 hover:text-emerald-200 underline"
                    >
                      View Bank Statement
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Loan Submitted</p>
                    <p className="text-slate-100 font-semibold">{new Date(selectedLead.loan.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No loan application found.</p>
              )}
            </div>

            {getShareLink(selectedLead) && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-xs uppercase tracking-widest text-emerald-300/80 mb-2">Share Link</p>
                <div className="flex items-center gap-2">
                  <input
                    value={getShareLink(selectedLead)}
                    readOnly
                    onFocus={(event) => event.currentTarget.select()}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedLead)}
                    className="rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition"
                  >
                    {copiedId === selectedLead._id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
