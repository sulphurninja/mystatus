'use client';

import { useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import {
  ADMIN_PERMISSION_DESCRIPTIONS,
  ADMIN_PERMISSION_LABELS,
  ADMIN_PERMISSIONS,
  AdminPermission,
} from '@/lib/adminPermissions';
import PageHeader from '@/components/admin/PageHeader';
import StatStrip from '@/components/admin/StatStrip';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import AdminModal from '@/components/admin/AdminModal';
import StatusPill from '@/components/admin/StatusPill';
import { useAdminPagination } from '@/hooks/useAdminPagination';

interface SubAdmin {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  permissions: AdminPermission[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  profileImage: '',
  permissions: [] as AdminPermission[],
  isActive: true,
};

export default function SubAdminsPage() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SubAdmin | null>(null);
  const [form, setForm] = useState(emptyForm);
  const pagination = useAdminPagination(20);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadSubAdmins = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      const res = await fetch(`/api/admin/sub-admins?${params}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      const data = await res.json();
      if (data.success) {
        setSubAdmins(data.subAdmins || []);
        pagination.setFromResponse(data.pagination || {});
      } else {
        setSubAdmins([]);
        setMessage(data.message || 'Unable to load sub-admins');
      }
    } catch (error) {
      console.error('Load sub-admins error:', error);
      setMessage('Unable to load sub-admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  const togglePermission = (permission: AdminPermission) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((item) => item !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setMessage('');
    setShowForm(true);
  };

  const openEdit = (subAdmin: SubAdmin) => {
    setEditing(subAdmin);
    setForm({
      name: subAdmin.name,
      email: subAdmin.email,
      password: '',
      phone: subAdmin.phone || '',
      profileImage: subAdmin.profileImage || '',
      permissions: subAdmin.permissions || [],
      isActive: subAdmin.isActive,
    });
    setMessage('');
    setShowForm(true);
  };

  const saveSubAdmin = async () => {
    if (!form.name || !form.email || (!editing && !form.password)) {
      setMessage('Name, email, and password are required.');
      return;
    }

    if (form.permissions.length === 0) {
      setMessage('Select at least one restriction/permission.');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(
        editing ? `/api/admin/sub-admins/${editing._id}` : '/api/admin/sub-admins',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();

      if (!data.success) {
        setMessage(data.message || 'Failed to save sub-admin');
        return;
      }

      setMessage(data.message || 'Saved successfully');
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await loadSubAdmins();
    } catch (error) {
      console.error('Save sub-admin error:', error);
      setMessage('Failed to save sub-admin');
    } finally {
      setSaving(false);
    }
  };

  const deleteSubAdmin = async (subAdmin: SubAdmin) => {
    if (!confirm(`Delete sub-admin "${subAdmin.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/sub-admins/${subAdmin._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders() as Record<string, string>,
      });
      const data = await res.json();
      setMessage(data.message || (data.success ? 'Deleted' : 'Delete failed'));
      if (data.success) await loadSubAdmins();
    } catch (error) {
      console.error('Delete sub-admin error:', error);
      setMessage('Delete failed');
    }
  };

  const formatDate = (value?: string) =>
    value
      ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Never';

  const columns: DataTableColumn<SubAdmin>[] = [
      {
        key: 'profile',
        header: 'Profile',
        render: (subAdmin) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-sm font-bold text-emerald-300 overflow-hidden">
              {subAdmin.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={subAdmin.profileImage}
                  alt={subAdmin.name}
                  className="h-10 w-10 object-cover"
                />
              ) : (
                subAdmin.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="font-semibold">{subAdmin.name}</p>
              <p className="text-xs text-[var(--admin-muted)]">{subAdmin.email}</p>
              {subAdmin.phone ? (
                <p className="text-xs text-[var(--admin-faint)]">{subAdmin.phone}</p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        key: 'permissions',
        header: 'Permissions',
        render: (subAdmin) => (
          <div className="flex max-w-md flex-wrap gap-1.5">
            {subAdmin.permissions.map((permission) => (
              <StatusPill key={permission} tone="accent">
                {ADMIN_PERMISSION_LABELS[permission]}
              </StatusPill>
            ))}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (subAdmin) => (
          <StatusPill tone={subAdmin.isActive ? 'success' : 'danger'}>
            {subAdmin.isActive ? 'Active' : 'Inactive'}
          </StatusPill>
        ),
      },
      {
        key: 'lastLogin',
        header: 'Last login',
        render: (subAdmin) => (
          <span className="text-[var(--admin-muted)]">{formatDate(subAdmin.lastLoginAt)}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (subAdmin) => (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openEdit(subAdmin)}
              className="admin-btn admin-btn-secondary !py-1.5 !px-3"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => deleteSubAdmin(subAdmin)}
              className="admin-btn admin-btn-danger !py-1.5 !px-3"
            >
              Delete
            </button>
          </div>
        ),
      },
    ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserCog}
        title="Sub-admins"
        description="Create restricted staff users for vendor and advertisement workflows"
        actions={
          <button type="button" onClick={openCreate} className="admin-btn admin-btn-primary">
            Create sub-admin
          </button>
        }
      />

      {message ? (
        <div className="admin-panel px-4 py-3 text-sm">{message}</div>
      ) : null}

      <StatStrip
        items={[
          { label: 'Total', value: pagination.total },
          {
            label: 'Active (page)',
            value: subAdmins.filter((s) => s.isActive).length,
            hint: 'Current page',
          },
          { label: 'Permission types', value: ADMIN_PERMISSIONS.length },
          { label: 'On page', value: subAdmins.length },
        ]}
      />

      <DataTable
        columns={columns}
        rows={subAdmins}
        rowKey={(s) => s._id}
        loading={loading}
        emptyTitle="No sub-admin profiles yet"
        emptyDescription="Create the first restricted staff login"
        emptyAction={
          <button type="button" onClick={openCreate} className="admin-btn admin-btn-primary">
            Create sub-admin
          </button>
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
        open={showForm}
        title={editing ? 'Edit sub-admin' : 'Create sub-admin'}
        onClose={() => setShowForm(false)}
        wide
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={saving}
              onClick={saveSubAdmin}
            >
              {saving ? 'Saving…' : editing ? 'Update profile' : 'Create profile'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="admin-label">Full name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="admin-input"
                placeholder="Sub-admin name"
              />
            </div>
            <div>
              <label className="admin-label">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="admin-input"
                placeholder="staff@mystatus.com"
              />
            </div>
            <div>
              <label className="admin-label">
                Password {editing ? '(leave blank to keep)' : '*'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                className="admin-input"
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <label className="admin-label">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="admin-input"
                placeholder="Optional"
              />
            </div>
            <div className="md:col-span-2">
              <label className="admin-label">Profile image URL</label>
              <input
                type="url"
                value={form.profileImage}
                onChange={(e) => setForm((prev) => ({ ...prev, profileImage: e.target.value }))}
                className="admin-input"
                placeholder="https://example.com/profile.jpg"
              />
            </div>
          </div>

          <div>
            <h3 className="admin-display text-base font-semibold">Allowed forms</h3>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Checked items are allowed. Unchecked sections are hidden and blocked by the API.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {ADMIN_PERMISSIONS.map((permission) => (
                <label
                  key={permission}
                  className={`cursor-pointer rounded-[var(--admin-radius)] border p-4 transition ${
                    form.permissions.includes(permission)
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-[var(--admin-border)] bg-[var(--admin-bg)]/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-sm">{ADMIN_PERMISSION_LABELS[permission]}</p>
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">
                        {ADMIN_PERMISSION_DESCRIPTIONS[permission]}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {editing ? (
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Active login
            </label>
          ) : null}
        </div>
      </AdminModal>
    </div>
  );
}
