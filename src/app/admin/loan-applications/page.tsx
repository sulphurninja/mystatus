'use client';

import { useEffect, useMemo, useState } from 'react';

type LoanApplication = {
  _id: string;
  name: string;
  contactNumber: string;
  email: string;
  loanAmount: number | null;
  pan: string;
  aadhaar: string;
  referralCode?: string;
  panCardUrl: string;
  aadhaarCardUrl: string;
  bankStatementUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  createdAt: string;
  property?: { _id: string; title: string } | null;
};

const statusStyles: Record<LoanApplication['status'], string> = {
  pending: 'bg-amber-500/15 border-amber-500/30 text-amber-200',
  approved: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200',
  rejected: 'bg-rose-500/15 border-rose-500/30 text-rose-200'
};

export default function LoanApplicationsPage() {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/admin/loan-applications?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      setApplications(response.ok && result?.success ? (result.data || []) : []);
    } catch (error) {
      console.error('Error loading loan applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [searchTerm, statusFilter]);

  const summary = useMemo(() => ({
    total: applications.length,
    pending: applications.filter((item) => item.status === 'pending').length,
    approved: applications.filter((item) => item.status === 'approved').length,
    rejected: applications.filter((item) => item.status === 'rejected').length
  }), [applications]);

  const formatLoanAmount = (value: number | null) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0
      ? `INR ${value}`
      : 'Not provided';

  const getDocumentViewUrl = (url: string) =>
    `/api/document-view?url=${encodeURIComponent(url)}`;

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setUpdatingId(id);
      const response = await fetch('/api/admin/loan-applications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ id, status })
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        alert(result?.message || 'Failed to update loan request.');
        return;
      }

      setApplications((prev) =>
        prev.map((item) =>
          item._id === id
            ? {
                ...item,
                status,
                reviewedAt: result.data?.reviewedAt
              }
            : item
        )
      );

      setSelectedApplication((prev) =>
        prev && prev._id === id
          ? { ...prev, status, reviewedAt: result.data?.reviewedAt }
          : prev
      );
    } catch (error) {
      console.error('Update loan request error:', error);
      alert('Failed to update loan request.');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteApplication = async (id: string) => {
    const confirmed = window.confirm('Delete this loan request? This cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/admin/loan-applications?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        alert(result?.message || 'Failed to delete loan request.');
        return;
      }

      setApplications((prev) => prev.filter((item) => item._id !== id));
      setSelectedApplication((prev) => (prev?._id === id ? null : prev));
    } catch (error) {
      console.error('Delete loan request error:', error);
      alert('Failed to delete loan request.');
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
            Loan Requests
          </h1>
        </div>
        <p className="text-slate-400 text-lg font-medium">
          Review loan entries, documents, and approve or reject requests.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Total Requests</p>
          <p className="text-2xl font-bold text-slate-100">{summary.total}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-300">{summary.pending}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Approved</p>
          <p className="text-2xl font-bold text-emerald-300">{summary.approved}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-rose-300">{summary.rejected}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by name, phone, email, PAN, or referral code"
          className="w-full lg:flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="w-full lg:w-56 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-slate-900/40 border border-slate-700/50 rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 text-slate-300 font-semibold">
          Loan Request Records
        </div>
        {loading ? (
          <div className="p-8 text-slate-400">Loading loan requests...</div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-slate-400">No loan requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 uppercase text-xs border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-3">Applicant</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">Loan Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Submitted</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr
                    key={application._id}
                    className={`border-b border-slate-800/60 text-slate-200 transition ${
                      application.status === 'rejected'
                        ? 'opacity-70 cursor-not-allowed'
                        : 'hover:bg-slate-800/40 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (application.status === 'rejected') return;
                      setSelectedApplication(application);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium">{application.name}</div>
                      <div className="text-xs text-slate-500">{application.email}</div>
                    </td>
                    <td className="px-6 py-4">{application.contactNumber}</td>
                    <td className="px-6 py-4">{application.property?.title || 'Unknown'}</td>
                    <td className="px-6 py-4">{formatLoanAmount(application.loanAmount)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusStyles[application.status]}`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(application.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2" onMouseDown={(event) => event.stopPropagation()}>
                        {application.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              disabled={updatingId === application._id || deletingId === application._id}
                              onClick={() => updateStatus(application._id, 'approved')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/25 transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === application._id || deletingId === application._id}
                              onClick={() => updateStatus(application._id, 'rejected')}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 hover:bg-rose-500/25 transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">No actions</span>
                        )}
                        <button
                          type="button"
                          disabled={deletingId === application._id || updatingId === application._id}
                          onClick={() => deleteApplication(application._id)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
                          title="Delete lead"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedApplication && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setSelectedApplication(null)}
          ></div>
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">Loan Request Details</h3>
                <p className="text-sm text-slate-400">Review applicant information and uploaded documents.</p>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                X
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Applicant</p>
                <p className="text-slate-100 font-semibold">{selectedApplication.name}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Loan Amount</p>
                <p className="text-slate-100 font-semibold">{formatLoanAmount(selectedApplication.loanAmount)}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Contact Number</p>
                <p className="text-slate-100 font-semibold">{selectedApplication.contactNumber}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Email</p>
                <p className="text-slate-100 font-semibold">{selectedApplication.email}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">PAN</p>
                <p className="text-slate-100 font-semibold">{selectedApplication.pan}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Aadhaar</p>
                <p className="text-slate-100 font-semibold">{selectedApplication.aadhaar}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Property</p>
                <p className="text-slate-100 font-semibold">{selectedApplication.property?.title || 'Unknown'}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Status</p>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusStyles[selectedApplication.status]}`}>
                  {selectedApplication.status}
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <a href={getDocumentViewUrl(selectedApplication.panCardUrl)} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 text-emerald-300 hover:text-emerald-200 underline">
                View PAN Card
              </a>
              <a href={getDocumentViewUrl(selectedApplication.aadhaarCardUrl)} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 text-emerald-300 hover:text-emerald-200 underline">
                View Aadhaar Card
              </a>
              <a href={getDocumentViewUrl(selectedApplication.bankStatementUrl)} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 text-emerald-300 hover:text-emerald-200 underline">
                View Bank Statement
              </a>
            </div>

            {selectedApplication.status === 'pending' && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={updatingId === selectedApplication._id || deletingId === selectedApplication._id}
                  onClick={() => updateStatus(selectedApplication._id, 'approved')}
                  className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/25 transition disabled:opacity-50"
                >
                  Approve Request
                </button>
                <button
                  type="button"
                  disabled={updatingId === selectedApplication._id || deletingId === selectedApplication._id}
                  onClick={() => updateStatus(selectedApplication._id, 'rejected')}
                  className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 hover:bg-rose-500/25 transition disabled:opacity-50"
                >
                  Reject Request
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={deletingId === selectedApplication._id || updatingId === selectedApplication._id}
                onClick={() => deleteApplication(selectedApplication._id)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
                title="Delete lead"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
