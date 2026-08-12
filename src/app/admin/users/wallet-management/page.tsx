'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import FilterBar from '@/components/admin/FilterBar';
import AdminModal from '@/components/admin/AdminModal';
import StatusPill from '@/components/admin/StatusPill';
import EmptyState from '@/components/admin/EmptyState';
import { useAdminPagination, paginateArray } from '@/hooks/useAdminPagination';

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  walletBalance: number;
  referralCode: string;
  isActive: boolean;
}

interface WalletTransaction {
  amount: number;
  reason: string;
  description: string;
}

export default function WalletManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionData, setTransactionData] = useState<WalletTransaction>({
    amount: 0,
    reason: 'admin_credit',
    description: '',
  });
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const pagination = useAdminPagination(20);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const ensureAuth = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return false;
    }
    return true;
  };

  const searchUsers = async () => {
    if (!searchTerm.trim() || !ensureAuth()) return;

    try {
      setLoading(true);
      setMessage('');
      setSearched(true);
      const response = await fetch(
        `/api/admin/users/search?q=${encodeURIComponent(searchTerm.trim())}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
        pagination.setPage(1);
        pagination.setFromResponse({
          total: (data.users || []).length,
          limit: pagination.limit,
          page: 1,
        });
      } else {
        setUsers([]);
        setMessage(data.message || 'Failed to search users');
      }
    } catch {
      setUsers([]);
      setMessage('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const pageSlice = useMemo(
    () => paginateArray(users, pagination.page, pagination.limit),
    [users, pagination.page, pagination.limit]
  );

  const openTransactionModal = (user: User) => {
    setSelectedUser(user);
    setTransactionData({
      amount: 0,
      reason: 'admin_credit',
      description: '',
    });
    setShowTransactionModal(true);
    setMessage('');
  };

  const processTransaction = async () => {
    if (!selectedUser || transactionData.amount <= 0) return;

    try {
      setProcessing(true);
      setMessage('');
      const response = await fetch(`/api/admin/users/${selectedUser._id}/wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          amount: Math.abs(transactionData.amount),
          reason: transactionData.reason,
          description: transactionData.description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((user) =>
            user._id === selectedUser._id
              ? {
                  ...user,
                  walletBalance:
                    data.data?.newBalance ?? user.walletBalance + Math.abs(transactionData.amount),
                }
              : user
          )
        );
        setShowTransactionModal(false);
        setSelectedUser(null);
        setMessage(data.message || 'Wallet credited');
      } else {
        setMessage(data.message || 'Failed to process transaction');
      }
    } catch {
      setMessage('Failed to process transaction');
    } finally {
      setProcessing(false);
    }
  };

  const columns: DataTableColumn<User>[] = [
      {
        key: 'user',
        header: 'User',
        render: (user) => (
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-xs text-[var(--admin-muted)]">{user.referralCode}</p>
          </div>
        ),
      },
      {
        key: 'contact',
        header: 'Contact',
        render: (user) => (
          <div>
            <p>{user.email || '—'}</p>
            {user.phone ? <p className="text-xs text-[var(--admin-muted)]">{user.phone}</p> : null}
          </div>
        ),
      },
      {
        key: 'balance',
        header: 'Balance',
        render: (user) => (
          <span className="tabular-nums text-emerald-300 font-semibold">₹{user.walletBalance}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (user) => (
          <StatusPill tone={user.isActive ? 'success' : 'danger'}>
            {user.isActive ? 'Active' : 'Inactive'}
          </StatusPill>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (user) => (
          <button
            type="button"
            className="admin-btn admin-btn-primary !py-1.5 !px-3"
            onClick={() => openTransactionModal(user)}
          >
            Credit wallet
          </button>
        ),
      },
    ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wallet}
        title="Wallet management"
        description="Search users and manually credit wallet balances"
      />

      <StatStrip
        items={[
          { label: 'Users found', value: users.length },
          {
            label: 'Total balance',
            value: `₹${users.reduce((sum, u) => sum + (u.walletBalance || 0), 0).toLocaleString()}`,
          },
          { label: 'Showing', value: pageSlice.items.length, hint: 'This page' },
        ]}
      />

      {message ? (
        <div className="admin-panel px-4 py-3 text-sm text-[var(--admin-text)]">{message}</div>
      ) : null}

      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, email, phone, or referral code…"
      >
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={searchUsers}
          disabled={loading || !searchTerm.trim()}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </FilterBar>

      {!searched && !loading ? (
        <EmptyState
          title="Search for a user"
          description="Enter a name, email, phone, or referral code to credit wallets"
        />
      ) : (
        <DataTable
          columns={columns}
          rows={pageSlice.items}
          rowKey={(u) => u._id}
          loading={loading}
          emptyTitle="No users found"
          emptyDescription="Try a different search term"
          footer={
            <Pagination
              page={pageSlice.page}
              totalPages={pageSlice.totalPages}
              total={pageSlice.total}
              limit={pagination.limit}
              onPageChange={pagination.setPage}
              onLimitChange={pagination.setLimit}
            />
          }
        />
      )}

      <AdminModal
        open={showTransactionModal && !!selectedUser}
        title="Credit wallet"
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedUser(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                setShowTransactionModal(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={processing || transactionData.amount <= 0}
              onClick={processTransaction}
            >
              {processing ? 'Processing…' : `Credit ₹${transactionData.amount || 0}`}
            </button>
          </>
        }
      >
        {selectedUser ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--admin-muted)]">
              {selectedUser.name} · current balance{' '}
              <span className="text-emerald-300 tabular-nums">₹{selectedUser.walletBalance}</span>
            </p>
            <div>
              <label className="admin-label" htmlFor="wallet-amount">
                Amount (₹)
              </label>
              <input
                id="wallet-amount"
                type="number"
                min={0}
                step="0.01"
                className="admin-input"
                value={transactionData.amount || ''}
                onChange={(e) =>
                  setTransactionData((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <label className="admin-label" htmlFor="wallet-reason">
                Reason
              </label>
              <select
                id="wallet-reason"
                className="admin-input"
                value={transactionData.reason}
                onChange={(e) =>
                  setTransactionData((prev) => ({ ...prev, reason: e.target.value }))
                }
              >
                <option value="admin_credit">Admin credit</option>
                <option value="bonus">Bonus</option>
                <option value="refund">Refund</option>
                <option value="compensation">Compensation</option>
                <option value="promotion">Promotion</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="admin-label" htmlFor="wallet-desc">
                Description
              </label>
              <textarea
                id="wallet-desc"
                rows={3}
                className="admin-input"
                placeholder="Optional description…"
                value={transactionData.description}
                onChange={(e) =>
                  setTransactionData((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}
