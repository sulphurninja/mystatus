'use client';

import type { ComponentType } from 'react';
import {
  Users,
  Store,
  Megaphone,
  Share2,
  Wallet,
  KeyRound,
  Package,
  TrendingUp,
  Banknote,
  ClipboardList,
  FileText,
  BadgeCheck,
  Activity,
  Layers,
  Heart,
  Percent,
  UserCog,
  BarChart3,
  CircleDollarSign,
  type LucideProps,
} from 'lucide-react';

export type StatItem = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ComponentType<LucideProps>;
};

function resolveIcon(label: string, icon?: ComponentType<LucideProps>): ComponentType<LucideProps> {
  if (icon) return icon;
  const key = label.toLowerCase();
  if (key.includes('user') && key.includes('admin')) return UserCog;
  if (key.includes('user')) return Users;
  if (key.includes('vendor')) return Store;
  if (key.includes('advert') || key.includes(' ad')) return Megaphone;
  if (key.includes('mystatus')) return Heart;
  if (key.includes('share')) return Share2;
  if (key.includes('wallet') || key.includes('balance')) return Wallet;
  if (key.includes('revenue') || key.includes('earning') || key.includes('paid')) return CircleDollarSign;
  if (key.includes('withdraw') || key.includes('payout')) return Banknote;
  if (key.includes('key') || key.includes('activation') || key.includes('franchise')) return KeyRound;
  if (key.includes('package')) return Package;
  if (key.includes('tier')) return Layers;
  if (key.includes('lead') || key.includes('propert')) return ClipboardList;
  if (key.includes('loan')) return FileText;
  if (key.includes('pending') || key.includes('verif')) return BadgeCheck;
  if (key.includes('active') || key.includes('growth')) return Activity;
  if (key.includes('commission') || key.includes('rate') || key.includes('%')) return Percent;
  if (key.includes('analytic') || key.includes('total')) return BarChart3;
  if (key.includes('trend') || key.includes('run')) return TrendingUp;
  return Activity;
}

export default function StatStrip({ items }: { items: StatItem[] }) {
  if (!items.length) return null;

  return (
    <div className="admin-panel mb-6 grid grid-cols-2 overflow-hidden md:grid-cols-4">
      {items.map((item, index) => {
        const Icon = resolveIcon(item.label, item.icon);
        return (
          <div
            key={`${item.label}-${index}`}
            className={`px-4 py-4 ${
              index % 2 === 1 ? 'border-l border-[var(--admin-border)]' : ''
            } ${
              index >= 2 ? 'border-t border-[var(--admin-border)] md:border-t-0' : ''
            } ${index >= 1 ? 'md:border-l md:border-[var(--admin-border)]' : ''}`}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--admin-faint)]">
                {item.label}
              </p>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
            </div>
            <p className="admin-display text-2xl font-semibold tabular-nums text-[var(--admin-text)]">
              {item.value}
            </p>
            {item.hint ? (
              <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{item.hint}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
