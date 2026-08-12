'use client';

import { useState, useEffect } from 'react';
import { Banknote } from 'lucide-react';
import { calculateWithdrawalCharges } from '@/lib/withdrawalCharges';
import { useAdminPagination } from '@/hooks/useAdminPagination';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import FilterBar from '@/components/admin/FilterBar';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import AdminModal from '@/components/admin/AdminModal';
import StatusPill from '@/components/admin/StatusPill';

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
  tdsRate?: number;
  adminRate?: number;
  tdsAmount?: number;
  adminCharge?: number;
  totalDeduction?: number;
  netAmount?: number;
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

function statusTone(status: string): 'warning' | 'success' | 'danger' | 'neutral' {
  if (status === 'pending') return 'warning';
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  return 'neutral';
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
  const pagination = useAdminPagination(20);

  useEffect(() => {
    fetchWithdrawalRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, pagination.page, pagination.limit]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchWithdrawalRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: filter,
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      const response = await fetch(`/api/admin/withdrawals?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        setRequests(data.data.requests || []);
        setStats(data.data.stats || { pending: 0, approved: 0, rejected: 0 });
        pagination.setFromResponse(data.data.pagination || {});
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const processRequest = async (requestId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      setProcessingId(requestId);
      const response = await fetch(`/api/admin/withdrawals/${requestId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
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

  const selectedNetAmount = selectedRequest
    ? (selectedRequest.netAmount ?? calculateWithdrawalCharges(selectedRequest.amount).netAmount)
    : 0;

  const columns: DataTableColumn<WithdrawalRequest>[] = [
    {
      key: 'user',
      header: 'User',
      render: (request) => (
        <div>
          <p className="font-medium">{request.user?.name || 'Unknown'}</p>
          <p className="text-xs text-[var(--admin-muted)]">
            {request.user?.phone || request.user?.email || '-'}
          </p>
          <p className="text-xs text-emerald-400">Code: {request.user?.referralCode}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Payable Amount',
      render: (request) => {
        const computed = calculateWithdrawalCharges(request.amount);
        const netAmount = request.netAmount ?? computed.netAmount;
        const totalDeduction = request.totalDeduction ?? computed.totalDeduction;
        const tdsRate = request.tdsRate ?? computed.tdsRate;
        const adminRate = request.adminRate ?? computed.adminRate;
        return (
          <div>
            <p className="font-semibold tabular-nums">₹{netAmount.toFixed(2)}</p>
            <p className="text-xs text-[var(--admin-muted)]">
              Deduction: ₹{totalDeduction.toFixed(2)} ({Math.round(tdsRate * 100)}% +{' '}
              {Math.round(adminRate * 100)}%)
            </p>
            <p className="text-xs text-[var(--admin-muted)]">
              Balance: ₹{request.user?.walletBalance}
            </p>
          </div>
        );
      },
    },
    {
      key: 'key',
      header: 'Activation Key',
      render: (request) => (
        <code className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel-elevated)] px-2 py-1 text-xs text-emerald-300">
          {request.activationKey}
        </code>
      ),
    },
    {
      key: 'payment',
      header: 'Payment Details',
      render: (request) =>
        request.paymentDetails?.upiId ? (
          <span className="text-sm">{request.paymentDetails.upiId}</span>
        ) : (
          <span className="text-sm text-[var(--admin-faint)]">Not provided</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (request) => (
        <div>
          <StatusPill tone={statusTone(request.status)}>{request.status}</StatusPill>
          {request.rejectionReason ? (
            <p className="mt-1 text-xs text-red-300">{request.rejectionReason}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'requested',
      header: 'Requested',
      render: (request) => (
        <span className="text-sm text-[var(--admin-muted)] tabular-nums">
          {new Date(request.requestedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (request) =>
        request.status === 'pending' ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => processRequest(request.id, 'approve')}
              disabled={processingId === request.id}
              className="admin-btn admin-btn-primary !py-1.5 !px-3"
            >
              {processingId === request.id ? '…' : 'Approve'}
            </button>
            <button
              type="button"
              onClick={() => handleReject(request)}
              disabled={processingId === request.id}
              className="admin-btn admin-btn-danger !py-1.5 !px-3"
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="text-sm text-[var(--admin-faint)]">
            {request.processedAt ? new Date(request.processedAt).toLocaleDateString() : '—'}
          </span>
        ),
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        icon={Banknote}
        title="Withdrawal Requests"
        description="Review and process user withdrawal requests."
      />

      <StatStrip
        items={[
          { label: 'Pending', value: stats.pending },
          { label: 'Approved', value: stats.approved },
          { label: 'Rejected', value: stats.rejected },
          { label: 'Showing', value: pagination.total },
        ]}
      />

      <FilterBar>
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setFilter(status);
              pagination.setPage(1);
            }}
            className={`admin-btn ${
              filter === status ? 'admin-btn-primary' : 'admin-btn-secondary'
            } !py-1.5 !px-3 capitalize`}
          >
            {status}
          </button>
        ))}
      </FilterBar>

      <DataTable
        columns={columns}
        rows={requests}
        rowKey={(row) => row.id}
        loading={loading}
        emptyTitle="No withdrawal requests"
        emptyDescription="Nothing matches this status filter."
        footer={
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={pagination.setPage}
            onLimitChange={pagination.setLimit}
          />
        }
      />

      <AdminModal
        open={showRejectModal}
        title="Reject Withdrawal Request"
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
          setSelectedRequest(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
                setSelectedRequest(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              disabled={processingId !== null}
              onClick={confirmReject}
            >
              {processingId ? 'Processing…' : 'Reject'}
            </button>
          </>
        }
      >
        <p className="mb-4 text-sm text-[var(--admin-muted)]">
          Rejecting withdrawal of{' '}
          <span className="font-semibold text-emerald-300">₹{selectedNetAmount.toFixed(2)}</span>{' '}
          from <span className="text-[var(--admin-text)]">{selectedRequest?.user?.name}</span>
        </p>
        <label className="admin-label" htmlFor="rejectionReason">
          Rejection reason
        </label>
        <textarea
          id="rejectionReason"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Enter rejection reason…"
          className="admin-input min-h-[96px] resize-none"
          rows={3}
        />
      </AdminModal>
    </div>
  );
}
