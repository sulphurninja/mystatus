'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useAdminPagination } from '@/hooks/useAdminPagination';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import FilterBar from '@/components/admin/FilterBar';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import AdminModal from '@/components/admin/AdminModal';
import StatusPill from '@/components/admin/StatusPill';

interface Lead {
  _id: string;
  name: string;
  contactNumber: string;
  email?: string;
  address?: string;
  requiresLoan?: boolean;
  loanAmount?: number | null;
  referralCode?: string;
  property?: { _id: string; title: string } | null;
  createdAt: string;
  loan?: {
    loanAmount: number | null;
    pan: string;
    aadhaar: string;
    panCardUrl: string;
    aadhaarCardUrl: string;
    bankStatementUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    reviewedAt?: string;
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
  const pagination = useAdminPagination(20);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const formatLoanAmount = (value?: number | null) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0 ? `INR ${value}` : 'Not provided';

  const getDocumentViewUrl = (url: string) =>
    `/api/document-view?url=${encodeURIComponent(url)}`;

  const origin = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.origin;
  }, []);

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, pagination.page, pagination.limit]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      const response = await fetch(`/api/admin/property-leads?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
        pagination.setFromResponse(data.pagination || {});
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
      if (selectedLead?._id === leadId) setSelectedLead(null);
      await loadLeads();
    } catch (error) {
      console.error('Delete lead error:', error);
      alert('Failed to delete lead.');
    } finally {
      setDeletingId(null);
    }
  };

  const loanOnPage = leads.filter((l) => l.requiresLoan).length;

  const columns: DataTableColumn<Lead>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (lead) => (
        <button
          type="button"
          className="text-left font-medium hover:text-emerald-300"
          onClick={() => setSelectedLead(lead)}
        >
          {lead.name}
        </button>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (lead) => <span>{lead.contactNumber}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (lead) => (
        <span className="text-[var(--admin-muted)]">{lead.email || '—'}</span>
      ),
    },
    {
      key: 'property',
      header: 'Property',
      render: (lead) => <span>{lead.property?.title || 'Unknown'}</span>,
    },
    {
      key: 'referral',
      header: 'Referral',
      render: (lead) => (
        <code className="text-xs text-[var(--admin-muted)]">{lead.referralCode || '—'}</code>
      ),
    },
    {
      key: 'loan',
      header: 'Loan',
      render: (lead) => (
        <StatusPill tone={lead.requiresLoan ? 'accent' : 'neutral'}>
          {lead.requiresLoan ? 'Yes' : 'No'}
        </StatusPill>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      render: (lead) => (
        <span className="text-sm text-[var(--admin-muted)] tabular-nums">
          {new Date(lead.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (lead) => (
        <div className="flex flex-wrap gap-2">
          {lead.property ? (
            <button
              type="button"
              onClick={() => copyToClipboard(lead)}
              className="admin-btn admin-btn-secondary !py-1.5 !px-3"
            >
              {copiedId === lead._id ? 'Copied' : 'Copy Link'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setSelectedLead(lead)}
            className="admin-btn admin-btn-ghost !py-1.5 !px-3"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => handleDelete(lead._id)}
            disabled={deletingId === lead._id}
            className="admin-btn admin-btn-danger !py-1.5 !px-3"
          >
            {deletingId === lead._id ? '…' : 'Delete'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        icon={ClipboardList}
        title="Property Leads"
        description="Registered users captured from referral links."
      />

      <StatStrip
        items={[
          { label: 'Total Leads', value: pagination.total },
          { label: 'On this page', value: leads.length },
          { label: 'Loan interest (page)', value: loanOnPage },
          { label: 'Page', value: `${pagination.page}/${pagination.totalPages}` },
        ]}
      />

      <FilterBar
        search={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          pagination.setPage(1);
        }}
        searchPlaceholder="Search by name, contact, or referral code"
      />

      <DataTable
        columns={columns}
        rows={leads}
        rowKey={(row) => row._id}
        loading={loading}
        emptyTitle="No leads found"
        emptyDescription={
          searchTerm ? 'Try adjusting your search terms.' : 'No property leads registered yet.'
        }
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
        open={!!selectedLead}
        title="Lead Details"
        wide
        onClose={() => setSelectedLead(null)}
        footer={
          selectedLead ? (
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              disabled={deletingId === selectedLead._id}
              onClick={() => handleDelete(selectedLead._id)}
            >
              Delete lead
            </button>
          ) : null
        }
      >
        {selectedLead ? (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="admin-label">Name</p>
                <p className="font-medium">{selectedLead.name}</p>
              </div>
              <div>
                <p className="admin-label">Contact</p>
                <p className="font-medium">{selectedLead.contactNumber}</p>
              </div>
              <div>
                <p className="admin-label">Email</p>
                <p className="font-medium">{selectedLead.email || '—'}</p>
              </div>
              <div>
                <p className="admin-label">Referral Code</p>
                <p className="font-medium">{selectedLead.referralCode || '—'}</p>
              </div>
              <div>
                <p className="admin-label">Loan Required</p>
                <p className="font-medium">{selectedLead.requiresLoan ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="admin-label">Requested Loan Amount</p>
                <p className="font-medium">
                  {formatLoanAmount(selectedLead.loan?.loanAmount ?? selectedLead.loanAmount)}
                </p>
              </div>
            </div>

            <div>
              <p className="admin-label">Address</p>
              <p>{selectedLead.address || '—'}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="admin-label">Property</p>
                <p className="font-medium">{selectedLead.property?.title || 'Unknown'}</p>
              </div>
              <div>
                <p className="admin-label">Submitted</p>
                <p className="font-medium">{new Date(selectedLead.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--admin-border)] p-4 space-y-3">
              <p className="admin-label !mb-0">Loan Documents</p>
              {selectedLead.loan ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-[var(--admin-faint)]">Loan Amount</p>
                    <p className="font-medium">{formatLoanAmount(selectedLead.loan.loanAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--admin-faint)]">Status</p>
                    <StatusPill
                      tone={
                        selectedLead.loan.status === 'approved'
                          ? 'success'
                          : selectedLead.loan.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {selectedLead.loan.status}
                    </StatusPill>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--admin-faint)]">PAN</p>
                    <p className="font-medium">{selectedLead.loan.pan}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--admin-faint)]">Aadhaar</p>
                    <p className="font-medium">{selectedLead.loan.aadhaar}</p>
                  </div>
                  {selectedLead.loan.panCardUrl ? (
                    <a
                      href={getDocumentViewUrl(selectedLead.loan.panCardUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 underline"
                    >
                      View PAN Card
                    </a>
                  ) : null}
                  {selectedLead.loan.aadhaarCardUrl ? (
                    <a
                      href={getDocumentViewUrl(selectedLead.loan.aadhaarCardUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 underline"
                    >
                      View Aadhaar Card
                    </a>
                  ) : null}
                  {selectedLead.loan.bankStatementUrl ? (
                    <a
                      href={getDocumentViewUrl(selectedLead.loan.bankStatementUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 underline"
                    >
                      View Bank Statement
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="text-[var(--admin-muted)]">No loan application found.</p>
              )}
            </div>

            {getShareLink(selectedLead) ? (
              <div>
                <p className="admin-label">Share Link</p>
                <div className="flex gap-2">
                  <input
                    value={getShareLink(selectedLead)}
                    readOnly
                    onFocus={(event) => event.currentTarget.select()}
                    className="admin-input text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedLead)}
                    className="admin-btn admin-btn-secondary shrink-0"
                  >
                    {copiedId === selectedLead._id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}
