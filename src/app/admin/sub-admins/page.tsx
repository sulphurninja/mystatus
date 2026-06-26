'use client';

import { useEffect, useState } from 'react';
import {
  ADMIN_PERMISSION_DESCRIPTIONS,
  ADMIN_PERMISSION_LABELS,
  ADMIN_PERMISSIONS,
  AdminPermission,
} from '@/lib/adminPermissions';

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

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadSubAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/sub-admins', {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      const data = await res.json();
      setSubAdmins(data.success ? data.subAdmins || [] : []);
      if (!data.success) setMessage(data.message || 'Unable to load sub-admins');
    } catch (error) {
      console.error('Load sub-admins error:', error);
      setMessage('Unable to load sub-admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubAdmins();
  }, []);

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
    value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never';

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Sub-Admin Profiles
            </h1>
          </div>
          <p className="text-slate-400 text-lg font-medium">
            Create restricted staff users for vendor registration, advertisement adding, and approval work.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg shadow-emerald-500/25 transition-all"
        >
          Create Sub-Admin
        </button>
      </div>

      {message && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 px-5 py-4 text-slate-200">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {ADMIN_PERMISSIONS.map((permission) => (
          <div key={permission} className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
            <p className="text-sm text-slate-400">Permission</p>
            <p className="mt-1 text-lg font-bold text-slate-100">{ADMIN_PERMISSION_LABELS[permission]}</p>
            <p className="mt-2 text-sm text-slate-400">{ADMIN_PERMISSION_DESCRIPTIONS[permission]}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-10 text-center text-slate-300">
          Loading sub-admins...
        </div>
      ) : subAdmins.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-10 text-center">
          <h3 className="text-2xl font-bold text-slate-100">No sub-admin profiles yet</h3>
          <p className="mt-2 text-slate-400">Create the first restricted staff login for the client workflow.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-900/70 text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">Profile</th>
                  <th className="px-6 py-4 font-semibold">Permissions</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Last Login</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {subAdmins.map((subAdmin) => (
                  <tr key={subAdmin._id} className="hover:bg-slate-800/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white">
                          {subAdmin.profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={subAdmin.profileImage} alt={subAdmin.name} className="h-11 w-11 rounded-xl object-cover" />
                          ) : (
                            subAdmin.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{subAdmin.name}</p>
                          <p className="text-xs text-slate-400">{subAdmin.email}</p>
                          {subAdmin.phone && <p className="text-xs text-slate-500">{subAdmin.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex max-w-xl flex-wrap gap-2">
                        {subAdmin.permissions.map((permission) => (
                          <span key={permission} className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                            {ADMIN_PERMISSION_LABELS[permission]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        subAdmin.isActive
                          ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                          : 'border border-red-500/30 bg-red-500/15 text-red-300'
                      }`}>
                        {subAdmin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{formatDate(subAdmin.lastLoginAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openEdit(subAdmin)}
                          className="rounded-lg border border-blue-500/30 bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/25"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSubAdmin(subAdmin)}
                          className="rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/25"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">
                  {editing ? 'Edit Sub-Admin Profile' : 'Create Sub-Admin Profile'}
                </h2>
                <p className="mt-1 text-slate-400">Give access only to the forms this staff member should use.</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl bg-slate-700/60 px-3 py-2 text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Full Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="Sub-admin name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="staff@mystatus.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password {editing ? '(leave blank to keep same)' : '*'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="Optional phone number"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-300">Profile Image URL</label>
                <input
                  type="url"
                  value={form.profileImage}
                  onChange={(e) => setForm((prev) => ({ ...prev, profileImage: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="https://example.com/profile.jpg"
                />
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-bold text-slate-100">Restrictions / Allowed Forms</h3>
              <p className="mt-1 text-sm text-slate-400">
                Checked items are allowed. Unchecked sections are hidden and blocked by API permissions.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {ADMIN_PERMISSIONS.map((permission) => (
                  <label
                    key={permission}
                    className={`cursor-pointer rounded-2xl border p-5 transition ${
                      form.permissions.includes(permission)
                        ? 'border-emerald-500/50 bg-emerald-500/15'
                        : 'border-slate-700/60 bg-slate-900/40 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="mt-1 h-4 w-4 rounded border-slate-600 text-emerald-500"
                      />
                      <div>
                        <p className="font-semibold text-slate-100">{ADMIN_PERMISSION_LABELS[permission]}</p>
                        <p className="mt-1 text-sm text-slate-400">{ADMIN_PERMISSION_DESCRIPTIONS[permission]}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {editing && (
              <label className="mt-6 flex items-center gap-3 text-slate-200">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-600 text-emerald-500"
                />
                Active login
              </label>
            )}

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-700/60 pt-6 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 font-semibold text-slate-200 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={saveSubAdmin}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editing ? 'Update Profile' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
