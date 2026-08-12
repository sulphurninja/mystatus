'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { useAdminPagination } from '@/hooks/useAdminPagination';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import FilterBar from '@/components/admin/FilterBar';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import AdminModal from '@/components/admin/AdminModal';
import StatusPill from '@/components/admin/StatusPill';

type LoanApplication = {
  _id: string;
  name: string;
  contactNumber: string;
  email: string;
  loanAmount: number | null;
  pan: string;
  aadhaar: string;
  referralCode?: string;
  panCardUrl?: string;
  aadhaarCardUrl?: string;
  bankStatementUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  createdAt: string;
  property?: { _id: string; title: string } | null;
};

function statusTone(status: LoanApplication['status']): 'warning' | 'success' | 'danger' {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  return 'warning';
}

export default function LoanApplicationsPage() {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'all'
  );
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const pagination = useAdminPagination(20);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/admin/loan-applications?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      if (response.ok && result?.success) {
        setApplications(result.data || []);
        pagination.setFromResponse(result.pagination || {});
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error loading loan applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, pagination.page, pagination.limit]);

  const formatLoanAmount = (value: number | null) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0
      ? `INR ${value}`
      : 'Not provided';

  const getDocumentViewUrl = (url: string) =>
    `/api/document-view?url=${encodeURIComponent(url)}`;

  const getDocumentCount = (application: LoanApplication) =>
    [application.panCardUrl, application.aadhaarCardUrl, application.bankStatementUrl].filter(
      Boolean
    ).length;

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setUpdatingId(id);
      const response = await fetch('/api/admin/loan-applications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ id, status }),
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
                reviewedAt: result.data?.reviewedAt,
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
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        alert(result?.message || 'Failed to delete loan request.');
        return;
      }

      setSelectedApplication((prev) => (prev?._id === id ? null : prev));
      await loadApplications();
    } catch (error) {
      console.error('Delete loan request error:', error);
      alert('Failed to delete loan request.');
    } finally {
      setDeletingId(null);
    }
  };

  const pendingOnPage = applications.filter((item) => item.status === 'pending').length;
  const approvedOnPage = applications.filter((item) => item.status === 'approved').length;
  const rejectedOnPage = applications.filter((item) => item.status === 'rejected').length;

  const columns: DataTableColumn<LoanApplication>[] = [
    {
      key: 'applicant',
      header: 'Applicant',
      render: (application) => (
        <button
          type="button"
          className="text-left disabled:opacity-60"
          disabled={application.status === 'rejected'}
          onClick={() => {
            if (application.status === 'rejected') return;
            setSelectedApplication(application);
          }}
        >
          <div className="font-medium">{application.name}</div>
          <div className="text-xs text-[var(--admin-muted)]">{application.email}</div>
        </button>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (application) => <span>{application.contactNumber}</span>,
    },
    {
      key: 'property',
      header: 'Property',
      render: (application) => <span>{application.property?.title || 'Unknown'}</span>,
    },
    {
      key: 'amount',
      header: 'Loan Amount',
      render: (application) => (
        <span className="tabular-nums">{formatLoanAmount(application.loanAmount)}</span>
      ),
    },
    {
      key: 'docs',
      header: 'Documents',
      render: (application) => {
        const count = getDocumentCount(application);
        return (
          <StatusPill tone={count === 3 ? 'success' : 'warning'}>{count}/3 files</StatusPill>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (application) => (
        <StatusPill tone={statusTone(application.status)}>{application.status}</StatusPill>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      render: (application) => (
        <span className="text-sm text-[var(--admin-muted)] tabular-nums">
          {new Date(application.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (application) => (
        <div className="flex flex-wrap justify-end gap-2">
          {application.status === 'pending' ? (
            <>
              <button
                type="button"
                disabled={updatingId === application._id || deletingId === application._id}
                onClick={() => updateStatus(application._id, 'approved')}
                className="admin-btn admin-btn-primary !py-1.5 !px-3"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={updatingId === application._id || deletingId === application._id}
                onClick={() => updateStatus(application._id, 'rejected')}
                className="admin-btn admin-btn-danger !py-1.5 !px-3"
              >
                Reject
              </button>
            </>
          ) : (
            <button
              type="button"
              className="admin-btn admin-btn-ghost !py-1.5 !px-3"
              disabled={application.status === 'rejected'}
              onClick={() => setSelectedApplication(application)}
            >
              View
            </button>
          )}
          <button
            type="button"
            disabled={deletingId === application._id || updatingId === application._id}
            onClick={() => deleteApplication(application._id)}
            className="admin-btn admin-btn-danger !py-1.5 !px-3"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        icon={FileText}
        title="Loan Requests"
        description="Review loan entries, documents, and approve or reject requests."
      />

      <StatStrip
        items={[
          { label: 'Total (filter)', value: pagination.total },
          { label: 'Pending (page)', value: pendingOnPage },
          { label: 'Approved (page)', value: approvedOnPage },
          { label: 'Rejected (page)', value: rejectedOnPage },
        ]}
      />

      <FilterBar
        search={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          pagination.setPage(1);
        }}
        searchPlaceholder="Search by name, phone, email, PAN, or referral code"
      >
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as typeof statusFilter);
            pagination.setPage(1);
          }}
          className="admin-select !w-auto min-w-[10rem]"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={applications}
        rowKey={(row) => row._id}
        loading={loading}
        emptyTitle="No loan requests"
        emptyDescription="Nothing matches the current filters."
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
        open={!!selectedApplication}
        title="Loan Request Details"
        wide
        onClose={() => setSelectedApplication(null)}
        footer={
          selectedApplication ? (
            <>
              {selectedApplication.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    disabled={
                      updatingId === selectedApplication._id ||
                      deletingId === selectedApplication._id
                    }
                    onClick={() => updateStatus(selectedApplication._id, 'approved')}
                    className="admin-btn admin-btn-primary"
                  >
                    Approve Request
                  </button>
                  <button
                    type="button"
                    disabled={
                      updatingId === selectedApplication._id ||
                      deletingId === selectedApplication._id
                    }
                    onClick={() => updateStatus(selectedApplication._id, 'rejected')}
                    className="admin-btn admin-btn-danger"
                  >
                    Reject Request
                  </button>
                </>
              ) : null}
              <button
                type="button"
                disabled={
                  deletingId === selectedApplication._id || updatingId === selectedApplication._id
                }
                onClick={() => deleteApplication(selectedApplication._id)}
                className="admin-btn admin-btn-danger"
              >
                Delete
              </button>
            </>
          ) : null
        }
      >
        {selectedApplication ? (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="admin-label">Applicant</p>
                <p className="font-medium">{selectedApplication.name}</p>
              </div>
              <div>
                <p className="admin-label">Loan Amount</p>
                <p className="font-medium">{formatLoanAmount(selectedApplication.loanAmount)}</p>
              </div>
              <div>
                <p className="admin-label">Contact Number</p>
                <p className="font-medium">{selectedApplication.contactNumber}</p>
              </div>
              <div>
                <p className="admin-label">Email</p>
                <p className="font-medium">{selectedApplication.email}</p>
              </div>
              <div>
                <p className="admin-label">PAN</p>
                <p className="font-medium">{selectedApplication.pan}</p>
              </div>
              <div>
                <p className="admin-label">Aadhaar</p>
                <p className="font-medium">{selectedApplication.aadhaar}</p>
              </div>
              <div>
                <p className="admin-label">Property</p>
                <p className="font-medium">{selectedApplication.property?.title || 'Unknown'}</p>
              </div>
              <div>
                <p className="admin-label">Status</p>
                <StatusPill tone={statusTone(selectedApplication.status)}>
                  {selectedApplication.status}
                </StatusPill>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {selectedApplication.panCardUrl ? (
                <a
                  href={getDocumentViewUrl(selectedApplication.panCardUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-panel px-4 py-3 text-emerald-300 underline"
                >
                  View PAN Card
                </a>
              ) : (
                <div className="admin-panel px-4 py-3 text-[var(--admin-muted)]">
                  PAN Card not available
                </div>
              )}
              {selectedApplication.aadhaarCardUrl ? (
                <a
                  href={getDocumentViewUrl(selectedApplication.aadhaarCardUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-panel px-4 py-3 text-emerald-300 underline"
                >
                  View Aadhaar Card
                </a>
              ) : (
                <div className="admin-panel px-4 py-3 text-[var(--admin-muted)]">
                  Aadhaar Card not available
                </div>
              )}
              {selectedApplication.bankStatementUrl ? (
                <a
                  href={getDocumentViewUrl(selectedApplication.bankStatementUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-panel px-4 py-3 text-emerald-300 underline"
                >
                  View Bank Statement
                </a>
              ) : (
                <div className="admin-panel px-4 py-3 text-[var(--admin-muted)]">
                  Bank Statement not available
                </div>
              )}
            </div>
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}
