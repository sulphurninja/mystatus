'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export default function AppHeader({
  title,
  showBack = false,
  rightAction,
  transparent = false,
}: AppHeaderProps) {
  const router = useRouter();

  return (
    <header className={`sticky top-0 z-40 ${transparent ? '' : 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5'}`}>
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <h1 className="text-lg font-semibold text-white">{title}</h1>
          </div>

          {rightAction && (
            <div className="flex items-center gap-2">
              {rightAction}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
