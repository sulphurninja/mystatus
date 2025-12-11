'use client';

import { useState, useEffect } from 'react';

interface WithdrawalRequest {
  id: string;
  user: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    referralCode: string;
    walletBalance: number;
  };
  amount: number;
  activationKey: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
  paymentDetails?: {
    upiId?: string;
    bankAccount?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
}

export default function WithdrawalsPage() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);

  useEffect(() => {
    fetchWithdrawalRequests();
  }, [filter]);

  const fetchWithdrawalRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/withdrawals?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data.requests);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const processRequest = async (requestId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      setProcessingId(requestId);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/withdrawals/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      const data = await response.json();
      
      if (data.success) {
        fetchWithdrawalRequests();
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedRequest(null);
      } else {
        alert(data.message || 'Failed to process request');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      alert('Failed to process request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    if (selectedRequest) {
      processRequest(selectedRequest.id, 'reject', rejectionReason);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Withdrawal Requests</h1>
          <p className="text-slate-400">Manage user withdrawal requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Approved</p>
                <p className="text-3xl font-bold text-emerald-400">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Rejected</p>
                <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['pending', 'approved', 'rejected', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === status
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Requests Table */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-400">No withdrawal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left p-4 text-slate-400 font-medium">User</th>
                    <th className="text-left p-4 text-slate-400 font-medium">Amount</th>
                    <th className="text-left p-4 text-slate-400 font-medium">Activation Key</th>
                    <th className="text-left p-4 text-slate-400 font-medium">Payment Details</th>
                    <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                    <th className="text-left p-4 text-slate-400 font-medium">Requested</th>
                    <th className="text-left p-4 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{request.user?.name || 'Unknown'}</p>
                          <p className="text-slate-400 text-sm">{request.user?.phone || request.user?.email || '-'}</p>
                          <p className="text-emerald-400 text-xs">Code: {request.user?.referralCode}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-white font-bold text-lg">₹{request.amount}</span>
                        <p className="text-slate-400 text-xs">Balance: ₹{request.user?.walletBalance}</p>
                      </td>
                      <td className="p-4">
                        <code className="bg-slate-700/50 px-2 py-1 rounded text-emerald-400 text-sm">
                          {request.activationKey}
                        </code>
                      </td>
                      <td className="p-4">
                        {request.paymentDetails?.upiId ? (
                          <span className="text-slate-300 text-sm">{request.paymentDetails.upiId}</span>
                        ) : (
                          <span className="text-slate-500 text-sm">Not provided</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        {request.rejectionReason && (
                          <p className="text-red-400 text-xs mt-1">{request.rejectionReason}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-slate-400 text-sm">
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => processRequest(request.id, 'approve')}
                              disabled={processingId === request.id}
                              className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {processingId === request.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(request)}
                              disabled={processingId === request.id}
                              className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {request.status !== 'pending' && (
                          <span className="text-slate-500 text-sm">
                            {request.processedAt && new Date(request.processedAt).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Reject Withdrawal Request</h3>
            <p className="text-slate-400 mb-4">
              Rejecting withdrawal request of <span className="text-emerald-400 font-bold">₹{selectedRequest?.amount}</span> from <span className="text-white">{selectedRequest?.user?.name}</span>
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedRequest(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={processingId !== null}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {processingId ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

