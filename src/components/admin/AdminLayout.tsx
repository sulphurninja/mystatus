'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Store,
  Package,
  Megaphone,
  Heart,
  Users,
  UserCog,
  Wallet,
  KeyRound,
  Key,
  Layers,
  BadgePercent,
  Banknote,
  TrendingUp,
  Percent,
  ClipboardList,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  type LucideProps,
} from 'lucide-react';
import {
  AdminPermission,
  ADMIN_NAV_PERMISSIONS,
  hasAdminPermission,
  normalizePermissions,
} from '@/lib/adminPermissions';
import './admin-theme.css';

type NavIcon = ComponentType<LucideProps>;

type NavItem = {
  name: string;
  href: string;
  icon: NavIcon;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { name: 'Vendors', href: '/admin/vendors', icon: Store },
      { name: 'Packages', href: '/admin/packages', icon: Package },
      { name: 'Advertisements', href: '/admin/advertisements', icon: Megaphone },
      { name: 'MyStatus Ads', href: '/admin/mystatus-ads', icon: Heart },
    ],
  },
  {
    label: 'People',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Sub Admins', href: '/admin/sub-admins', icon: UserCog },
      { name: 'Wallet', href: '/admin/users/wallet-management', icon: Wallet },
    ],
  },
  {
    label: 'Keys',
    items: [
      { name: 'Activation Keys', href: '/admin/activation-keys', icon: KeyRound },
      { name: 'Franchise Keys', href: '/admin/franchise-keys', icon: Key },
      { name: 'Product Keys', href: '/admin/product-keys', icon: BadgePercent },
      { name: 'Key Tiers', href: '/admin/key-tiers', icon: Layers },
      { name: 'Franchise Tiers', href: '/admin/franchise-tiers', icon: Layers },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Withdrawals', href: '/admin/withdrawals', icon: Banknote },
      { name: 'Franchise Payouts', href: '/admin/franchise-payouts', icon: TrendingUp },
      { name: 'Commission Rates', href: '/admin/commission-rates', icon: Percent },
    ],
  },
  {
    label: 'Ops',
    items: [
      { name: 'Property Leads', href: '/admin/property-leads', icon: ClipboardList },
      { name: 'Loan Requests', href: '/admin/loan-applications', icon: FileText },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/admin/users') {
    return (
      pathname === '/admin/users' ||
      (pathname.startsWith('/admin/users/') && !pathname.includes('wallet-management'))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center ${compact ? 'justify-center' : 'gap-3'}`}>
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-600/60 bg-white shadow-sm">
        <Image src="/mystatus.jpeg" alt="MyStatus" fill className="object-cover" sizes="36px" />
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className="admin-display truncate text-sm font-semibold tracking-tight">MyStatus</p>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--admin-faint)]">Admin</p>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [adminRole, setAdminRole] = useState<'admin' | 'sub-admin'>('admin');
  const [adminPermissions, setAdminPermissions] = useState<AdminPermission[]>([]);
  const [adminEmail, setAdminEmail] = useState('admin');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    setCollapsed(saved === '1');
  }, []);

  useEffect(() => {
    const cachedAdmin = localStorage.getItem('adminUser');
    if (cachedAdmin) {
      try {
        const parsed = JSON.parse(cachedAdmin);
        setAdminRole(parsed.role === 'sub-admin' ? 'sub-admin' : 'admin');
        setAdminPermissions(normalizePermissions(parsed.permissions));
        setAdminEmail(parsed.email || 'admin');
      } catch {}
    }

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    fetch('/api/admin/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.success) return;
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
        setAdminRole(data.admin.role === 'sub-admin' ? 'sub-admin' : 'admin');
        setAdminPermissions(normalizePermissions(data.admin.permissions));
        setAdminEmail(data.admin.email || 'admin');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('admin-sidebar-collapsed', next ? '1' : '0');
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const groups = useMemo(() => {
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (adminRole === 'admin') return true;
        const required = ADMIN_NAV_PERMISSIONS[item.href];
        if (!required) return false;
        if (required.length === 0) return false;
        return hasAdminPermission(adminPermissions, required);
      }),
    })).filter((group) => group.items.length > 0);
  }, [adminRole, adminPermissions]);

  const currentTitle =
    groups.flatMap((g) => g.items).find((item) => isActivePath(pathname, item.href))?.name ||
    'Admin';

  const sidebarInner = (mode: 'desktop' | 'mobile') => {
    const isCollapsed = mode === 'desktop' && collapsed;

    return (
      <div className="flex h-full flex-col">
        <div
          className={`flex h-16 items-center border-b border-slate-800 ${
            isCollapsed ? 'justify-center px-2' : 'justify-between gap-2 px-4'
          }`}
        >
          <BrandMark compact={isCollapsed} />
          {mode === 'mobile' ? (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-[var(--admin-muted)] hover:bg-white/5 hover:text-[var(--admin-text)]"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
          {groups.map((group) => (
            <div key={group.label}>
              {!isCollapsed ? (
                <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-faint)]">
                  {group.label}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={item.name}
                        className={`flex items-center rounded-xl text-sm transition-colors ${
                          isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-2.5 py-2'
                        } ${
                          active
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'text-[var(--admin-muted)] hover:bg-white/[0.04] hover:text-[var(--admin-text)]'
                        }`}
                      >
                        <Icon
                          className={`h-[18px] w-[18px] shrink-0 ${
                            active ? 'text-emerald-400' : 'text-[var(--admin-faint)]'
                          }`}
                          strokeWidth={1.9}
                        />
                        {!isCollapsed ? (
                          <span className="truncate font-medium">{item.name}</span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={`border-t border-slate-800 p-3 ${isCollapsed ? 'px-2' : ''}`}>
          {!isCollapsed ? (
            <p className="mb-2 truncate text-xs text-[var(--admin-faint)]" title={adminEmail}>
              {adminEmail}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className={`admin-btn admin-btn-secondary w-full ${isCollapsed ? '!px-0' : ''}`}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed ? 'Sign out' : null}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-shell">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(260px,85vw)] border-r border-[var(--admin-sidebar-border)] bg-[var(--admin-sidebar)] shadow-[8px_0_24px_rgba(0,0,0,0.35)] transition-transform lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarInner('mobile')}
      </aside>

      <div className="flex min-h-screen">
        <aside
          className="relative sticky top-0 z-20 hidden h-screen shrink-0 border-r border-[var(--admin-sidebar-border)] bg-[var(--admin-sidebar)] shadow-[8px_0_28px_rgba(0,0,0,0.4)] transition-[width] duration-200 lg:flex lg:flex-col"
          style={{
            width: collapsed ? 'var(--admin-sidebar-collapsed)' : 'var(--admin-sidebar-expanded)',
          }}
        >
          {sidebarInner('desktop')}

          {/* Collapse control: centered on the sidebar's right border */}
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="absolute top-1/2 right-0 z-30 flex h-8 w-8 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border-2 border-emerald-400/70 bg-slate-950 text-emerald-300 shadow-[0_0_0_4px_rgba(2,6,23,0.9),0_4px_14px_rgba(0,0,0,0.55)] transition-all hover:scale-105 hover:border-emerald-300 hover:bg-emerald-500 hover:text-slate-950"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" strokeWidth={2.5} /> : <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />}
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/90 px-4 backdrop-blur-md lg:px-6">
            {/* Wrapper ensures lg:hidden isn't overridden by .admin-btn { display: inline-flex } */}
            <div className="lg:hidden">
              <button
                type="button"
                className="admin-btn admin-btn-secondary !py-1.5"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-4 w-4" />
                Menu
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--admin-text)]">{currentTitle}</p>
              <p className="truncate text-[11px] text-[var(--admin-faint)]">
                {adminRole === 'sub-admin' ? 'Sub-admin' : 'Main admin'}
              </p>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 lg:px-6 lg:py-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
