'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import FilterBar from '@/components/admin/FilterBar';
import StatusPill from '@/components/admin/StatusPill';
import { useAdminPagination } from '@/hooks/useAdminPagination';

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  activationKey: string;
  walletBalance: number;
  isActive: boolean;
  canShareAds: boolean;
  referralLevel?: number;
  totalCommissionEarned?: number;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const pagination = useAdminPagination(20);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim();
      setSearchTerm((prev) => {
        if (prev !== next) pagination.setPage(1);
        return next;
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        search: searchTerm,
      });
      const response = await fetch(`/api/admin/users?${params}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        pagination.setFromResponse({
          page: data.page ?? data.pagination?.page,
          limit: data.limit ?? data.pagination?.limit,
          total: data.total ?? data.pagination?.total,
          totalPages: data.totalPages ?? data.pagination?.totalPages ?? data.pagination?.pages,
        });
      } else {
        setUsers([]);
        pagination.setFromResponse({ total: 0, totalPages: 1 });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((user) => (user._id === userId ? { ...user, isActive: !user.isActive } : user))
    );
  };

  const exportToCSV = () => {
    if (!users.length) return;
    const csvData = users.map((user) => ({
      'User ID': user._id,
      Name: user.name,
      Email: user.email || '',
      Phone: user.phone || '',
      'Activation Key': user.activationKey,
      'Wallet Balance': user.walletBalance,
      Status: user.isActive ? 'Active' : 'Inactive',
      'Joined Date': new Date(user.createdAt).toLocaleDateString(),
      'Referral Level': user.referralLevel || 1,
      'Total Commission Earned': user.totalCommissionEarned || 0,
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row) =>
        Object.values(row)
          .map((value) => (typeof value === 'string' && value.includes(',') ? `"${value}"` : value))
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: DataTableColumn<User>[] = [
      {
        key: 'user',
        header: 'User',
        render: (user) => (
          <Link href={`/admin/users/${user._id}`} className="hover:text-[var(--admin-accent)]">
            <p className="font-semibold">{user.name}</p>
            <p className="text-xs text-[var(--admin-muted)]">ID: {user._id.slice(-8)}</p>
          </Link>
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
        key: 'key',
        header: 'Activation key',
        render: (user) => (
          <code className="text-xs font-mono text-[var(--admin-muted)]">
            {user.activationKey || 'Not activated'}
          </code>
        ),
      },
      {
        key: 'balance',
        header: 'Balance',
        render: (user) => (
          <span className="tabular-nums text-emerald-300">₹{user.walletBalance}</span>
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
        key: 'joined',
        header: 'Joined',
        render: (user) => (
          <span className="text-[var(--admin-muted)]">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (user) => (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => toggleUserStatus(user._id)}
              className={`admin-btn !py-1.5 !px-3 ${
                user.isActive ? 'admin-btn-danger' : 'admin-btn-primary'
              }`}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <Link href={`/admin/users/${user._id}`} className="admin-btn admin-btn-secondary !py-1.5 !px-3">
              View
            </Link>
          </div>
        ),
      },
    ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Users"
        description="Manage registered platform users"
        actions={
          <button type="button" onClick={exportToCSV} className="admin-btn admin-btn-secondary" disabled={!users.length}>
            Export CSV
          </button>
        }
      />

      <StatStrip
        items={[
          { label: 'Total users', value: pagination.total },
          {
            label: 'Active (page)',
            value: users.filter((u) => u.isActive).length,
            hint: 'Current page',
          },
          {
            label: 'Activated (page)',
            value: users.filter((u) => u.activationKey).length,
            hint: 'Current page',
          },
          {
            label: 'Balance (page)',
            value: `₹${users.reduce((sum, u) => sum + (u.walletBalance || 0), 0).toLocaleString()}`,
            hint: 'Current page',
          },
        ]}
      />

      <FilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by name, email, or activation key…"
      />

      <DataTable
        columns={columns}
        rows={users}
        rowKey={(u) => u._id}
        loading={loading}
        emptyTitle="No users found"
        emptyDescription={searchTerm ? 'Try a different search' : 'No users registered yet'}
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
    </div>
  );
}
