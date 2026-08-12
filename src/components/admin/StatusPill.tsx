'use client';

const tones = {
  neutral: 'bg-slate-800 text-slate-300 border-slate-700',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  danger: 'bg-red-500/15 text-red-300 border-red-500/30',
  info: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  accent: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
} as const;

export default function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase border rounded-md ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
