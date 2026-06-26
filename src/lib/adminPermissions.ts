export const ADMIN_PERMISSIONS = [
  'vendors.create',
  'vendors.approve',
  'advertisements.create',
  'advertisements.approve',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  'vendors.create': 'Vendor registration',
  'vendors.approve': 'Vendor approval',
  'advertisements.create': 'Advertisement adding',
  'advertisements.approve': 'Advertisement approval',
};

export const ADMIN_PERMISSION_DESCRIPTIONS: Record<AdminPermission, string> = {
  'vendors.create': 'Can create vendor profiles from the admin panel.',
  'vendors.approve': 'Can approve or reject pending vendor registrations.',
  'advertisements.create': 'Can add and edit advertisements for vendors.',
  'advertisements.approve': 'Can activate or deactivate advertisements.',
};

export const ADMIN_NAV_PERMISSIONS: Record<string, AdminPermission[]> = {
  '/admin/vendors': ['vendors.create', 'vendors.approve'],
  '/admin/advertisements': ['advertisements.create', 'advertisements.approve'],
  '/admin/sub-admins': [],
};

export function normalizePermissions(value: unknown): AdminPermission[] {
  if (!Array.isArray(value)) return [];
  return value.filter((permission): permission is AdminPermission =>
    ADMIN_PERMISSIONS.includes(permission as AdminPermission)
  );
}

export function hasAdminPermission(
  grantedPermissions: AdminPermission[] | undefined,
  requiredPermissions: AdminPermission | AdminPermission[]
) {
  const required = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  return required.some((permission) => grantedPermissions?.includes(permission));
}
