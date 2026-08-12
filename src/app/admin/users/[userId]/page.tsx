'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import AdminModal from '@/components/admin/AdminModal';
import StatusPill from '@/components/admin/StatusPill';
import EmptyState from '@/components/admin/EmptyState';
import { useAdminPagination } from '@/hooks/useAdminPagination';

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  activationKey: string;
  walletBalance: number;
  referralLevel: number;
  referralCode: string;
  isActive: boolean;
  canShareAds: boolean;
  createdAt: string;
  lastLogin?: string;
  totalCommissionEarned: number;
}

interface ReferralInfo {
  totalReferrals: number;
  activeReferrals: number;
  referralLevel: number;
  totalCommissionEarned: number;
  directReferrals: Array<{
    id: string;
    name: string;
    referralCode: string;
    joinedAt: string;
    isActive: boolean;
  }>;
  commissionBreakdown: Array<{
    level: number;
    referralBonus: number;
    levelBonus: number;
    keyPurchaseBonus: number;
    totalEarned: number;
    totalCommissions: number;
  }>;
  stats: {
    totalReferrals: number;
    activeReferrals: number;
    pendingReferrals: number;
  };
}

interface AvailableKey {
  _id: string;
  key: string;
  price: number;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  reference?: {
    id: string;
    title: string;
    rewardAmount: number;
  } | null;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'transactions'>('overview');
  const [showAssignKeyModal, setShowAssignKeyModal] = useState(false);
  const [availableKeys, setAvailableKeys] = useState<AvailableKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [assigningKey, setAssigningKey] = useState(false);
  const [keysLoading, setKeysLoading] = useState(false);
  const txPagination = useAdminPagination(20);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    loadUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'transactions' && user) {
      loadTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?._id, txPagination.page, txPagination.limit]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setReferralInfo(data.referralInfo);
      } else {
        router.push('/admin/users');
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          userId: user._id,
          action: 'toggle-status',
        }),
      });

      if (response.ok) {
        setUser((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null));
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;

    try {
      setTransactionsLoading(true);
      const params = new URLSearchParams({
        page: String(txPagination.page),
        limit: String(txPagination.limit),
      });
      const response = await fetch(`/api/admin/users/${user._id}/transactions?${params}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        txPagination.setFromResponse({
          page: data.pagination?.page,
          limit: data.pagination?.limit,
          total: data.pagination?.total ?? data.total,
          totalPages: data.pagination?.pages ?? data.pagination?.totalPages,
        });
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const loadAvailableKeys = async () => {
    if (!user || user.activationKey) return;

    try {
      setKeysLoading(true);
      const response = await fetch('/api/admin/available-keys', {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Error loading available keys:', error);
    } finally {
      setKeysLoading(false);
    }
  };

  const handleOpenAssignKeyModal = () => {
    if (!user || user.activationKey) {
      alert('User already has an activation key');
      return;
    }
    setShowAssignKeyModal(true);
    loadAvailableKeys();
  };

  const handleAssignKey = async () => {
    if (!user || !selectedKeyId) {
      alert('Please select a key to assign');
      return;
    }

    try {
      setAssigningKey(true);
      const response = await fetch('/api/admin/assign-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          userId: user._id,
          keyId: selectedKeyId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Key assigned successfully!');
        setUser((prev) => (prev ? { ...prev, activationKey: data.data.key } : null));
        setShowAssignKeyModal(false);
        setSelectedKeyId('');
      } else {
        alert(data.message || 'Failed to assign key');
      }
    } catch (error) {
      console.error('Error assigning key:', error);
      alert('Error assigning key');
    } finally {
      setAssigningKey(false);
    }
  };

  const referralColumns: DataTableColumn<ReferralInfo['directReferrals'][0]>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (r) => <span className="font-medium">{r.name}</span>,
    },
    {
      key: 'code',
      header: 'Referral code',
      render: (r) => <code className="text-xs text-[var(--admin-muted)]">{r.referralCode}</code>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <StatusPill tone={r.isActive ? 'success' : 'danger'}>
          {r.isActive ? 'Active' : 'Inactive'}
        </StatusPill>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (r) => (
        <span className="text-[var(--admin-muted)]">
          {new Date(r.joinedAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const txColumns: DataTableColumn<Transaction>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (t) => (
        <StatusPill tone={t.type === 'credit' ? 'success' : 'danger'}>{t.type}</StatusPill>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (t) => (
        <div>
          <p className="font-medium">{t.reason}</p>
          <p className="text-xs text-[var(--admin-muted)]">{t.description}</p>
          {t.reference ? (
            <p className="text-xs text-emerald-300 mt-0.5">
              {t.reference.title} (₹{t.reference.rewardAmount})
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (t) => (
        <span
          className={`tabular-nums font-semibold ${
            t.type === 'credit' ? 'text-emerald-300' : 'text-red-300'
          }`}
        >
          {t.type === 'credit' ? '+' : '-'}₹{t.amount}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance after',
      render: (t) => <span className="tabular-nums">₹{t.balanceAfter}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (t) => (
        <span className="text-[var(--admin-muted)]">
          {new Date(t.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  if (loading) {
    return <div className="admin-panel p-8 text-sm text-[var(--admin-muted)]">Loading user…</div>;
  }

  if (!user) {
    return (
      <EmptyState
        title="User not found"
        description="This user may have been removed."
        action={
          <Link href="/admin/users" className="admin-btn admin-btn-primary">
            Back to users
          </Link>
        }
      />
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'network' as const, label: 'Network' },
    { id: 'transactions' as const, label: 'Transactions' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={User}
        title={user.name}
        description="User profile, network, and wallet activity"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/users" className="admin-btn admin-btn-ghost">
              Back
            </Link>
            <button
              type="button"
              onClick={toggleUserStatus}
              className={`admin-btn ${user.isActive ? 'admin-btn-danger' : 'admin-btn-primary'}`}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
            {!user.activationKey ? (
              <button type="button" onClick={handleOpenAssignKeyModal} className="admin-btn admin-btn-secondary">
                Assign key
              </button>
            ) : null}
          </div>
        }
      />

      <div className="admin-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill tone={user.isActive ? 'success' : 'danger'}>
            {user.isActive ? 'Active' : 'Inactive'}
          </StatusPill>
          <span className="text-sm text-[var(--admin-muted)]">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="admin-label">Email</p>
            <p>{user.email || '—'}</p>
          </div>
          <div>
            <p className="admin-label">Phone</p>
            <p>{user.phone || '—'}</p>
          </div>
          <div>
            <p className="admin-label">Activation key</p>
            <p className="font-mono text-xs">{user.activationKey || 'Not activated'}</p>
          </div>
          <div>
            <p className="admin-label">Wallet</p>
            <p className="tabular-nums text-emerald-300">₹{user.walletBalance}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--admin-border)]">
          <div>
            <p className="admin-label">Referral code</p>
            <code className="text-emerald-300">{user.referralCode}</code>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary !py-1.5"
            onClick={() => navigator.clipboard.writeText(user.referralCode)}
          >
            Copy
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'transactions') txPagination.setPage(1);
            }}
            className={`admin-btn ${
              activeTab === tab.id ? 'admin-btn-primary' : 'admin-btn-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <StatStrip
          items={[
            { label: 'Total referrals', value: referralInfo?.totalReferrals || 0 },
            { label: 'Active referrals', value: referralInfo?.activeReferrals || 0 },
            { label: 'Level', value: user.referralLevel },
            { label: 'Total earnings', value: `₹${user.totalCommissionEarned || 0}` },
          ]}
        />
      ) : null}

      {activeTab === 'network' ? (
        <div className="space-y-6">
          <div>
            <h3 className="admin-display text-lg font-semibold mb-3">Direct referrals</h3>
            <DataTable
              columns={referralColumns}
              rows={referralInfo?.directReferrals || []}
              rowKey={(r) => r.id}
              emptyTitle="No direct referrals"
              emptyDescription="This user has not referred anyone yet"
            />
          </div>

          <div className="admin-panel p-5 space-y-4">
            <h3 className="admin-display text-lg font-semibold">Commission breakdown</h3>
            {referralInfo?.commissionBreakdown?.length ? (
              <div className="space-y-3">
                {referralInfo.commissionBreakdown.map((level) => (
                  <div
                    key={level.level}
                    className="rounded-lg border border-[var(--admin-border)] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="font-semibold">
                        Level {level.level}
                        <span className="ml-2 text-xs font-normal text-[var(--admin-muted)]">
                          {level.level === 1 ? 'Direct' : `Level ${level.level} network`}
                        </span>
                      </p>
                      <p className="tabular-nums text-emerald-300 font-semibold">
                        ₹{level.totalEarned}
                        <span className="ml-2 text-xs text-[var(--admin-muted)] font-normal">
                          {level.totalCommissions} commissions
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-[var(--admin-muted)]">
                      {level.levelBonus > 0 ? <span>Level bonus: {level.levelBonus}%</span> : null}
                      {level.keyPurchaseBonus > 0 ? (
                        <span>Key purchase: {level.keyPurchaseBonus}%</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--admin-muted)]">No commission data available</p>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'transactions' ? (
        <DataTable
          columns={txColumns}
          rows={transactions}
          rowKey={(t) => t.id}
          loading={transactionsLoading}
          emptyTitle="No transactions"
          emptyDescription="This user has no wallet activity yet"
          footer={
            <Pagination
              page={txPagination.page}
              totalPages={txPagination.totalPages}
              total={txPagination.total}
              limit={txPagination.limit}
              onPageChange={txPagination.setPage}
              onLimitChange={txPagination.setLimit}
            />
          }
        />
      ) : null}

      <AdminModal
        open={showAssignKeyModal}
        title="Assign activation key"
        onClose={() => {
          setShowAssignKeyModal(false);
          setSelectedKeyId('');
        }}
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                setShowAssignKeyModal(false);
                setSelectedKeyId('');
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={!selectedKeyId || assigningKey || keysLoading}
              onClick={handleAssignKey}
            >
              {assigningKey ? 'Assigning…' : 'Assign key'}
            </button>
          </>
        }
      >
        {keysLoading ? (
          <p className="text-sm text-[var(--admin-muted)]">Loading available keys…</p>
        ) : availableKeys.length === 0 ? (
          <p className="text-sm text-[var(--admin-muted)]">
            No available keys found. Generate keys first.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="admin-label" htmlFor="assign-key">
                Select key
              </label>
              <select
                id="assign-key"
                className="admin-input"
                value={selectedKeyId}
                onChange={(e) => setSelectedKeyId(e.target.value)}
              >
                <option value="">Choose a key…</option>
                {availableKeys.map((key) => (
                  <option key={key._id} value={key._id}>
                    {key.key} — ₹{key.price}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-[var(--admin-muted)]">
              The user&apos;s referral chain will receive commissions as if they purchased this key.
            </p>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
