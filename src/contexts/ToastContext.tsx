'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

type ToastType = 'default' | 'success' | 'destructive' | 'info';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ title, description, variant = 'default' }: { 
    title: string; 
    description?: string; 
    variant?: 'default' | 'destructive' | 'success' 
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type: variant as ToastType }]);

    // Auto remove after 4 seconds
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-start gap-3 w-full max-w-sm p-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300
              ${t.type === 'destructive' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                'bg-slate-900/90 border-white/10 text-white'}
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {t.type === 'destructive' ? <AlertCircle className="w-5 h-5" /> : 
               t.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
               <Info className="w-5 h-5 text-blue-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">{t.title}</p>
              {t.description && <p className="text-xs mt-1 opacity-80">{t.description}</p>}
            </div>
            <button onClick={() => removeToast(t.id)} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToastContext must be used within a ToastProvider');
  return context;
};
