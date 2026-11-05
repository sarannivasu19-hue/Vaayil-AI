import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextType {
  toast: (opts: { type: ToastType; message: string; duration?: number }) => void;
}

/* ------------------------------------------------------------------ */
/* Context                                                              */
/* ------------------------------------------------------------------ */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

/* ------------------------------------------------------------------ */
/* Config                                                               */
/* ------------------------------------------------------------------ */
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 shrink-0" />,
  error:   <XCircle      className="w-4 h-4 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 shrink-0" />,
  info:    <Info          className="w-4 h-4 shrink-0" />,
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-[#101626] border-[#42D6A4]/40 text-[#42D6A4]',
  error:   'bg-[#101626] border-[#FF647C]/40 text-[#FF647C]',
  warning: 'bg-[#101626] border-[#FFBF69]/40 text-[#FFBF69]',
  info:    'bg-[#101626] border-[#32D8E8]/40 text-[#32D8E8]',
};

/* ------------------------------------------------------------------ */
/* Single Toast                                                         */
/* ------------------------------------------------------------------ */
const ToastCard: React.FC<{ item: ToastItem; onDismiss: (id: string) => void }> = ({
  item,
  onDismiss,
}) => {
  React.useEffect(() => {
    const t = setTimeout(() => onDismiss(item.id), item.duration);
    return () => clearTimeout(t);
  }, [item.id, item.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      onClick={() => onDismiss(item.id)}
      role="alert"
      aria-live="polite"
      className={clsx(
        'flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer',
        'shadow-lg shadow-black/40 backdrop-blur-sm min-w-[260px] max-w-[360px]',
        'select-none',
        STYLES[item.type],
      )}
    >
      <span className="mt-0.5">{ICONS[item.type]}</span>
      <span className="flex-1 text-sm font-medium text-[#E8EDF9] leading-snug">
        {item.message}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(item.id); }}
        className="mt-0.5 text-[#9AA7BE] hover:text-[#E8EDF9] transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Provider                                                             */
/* ------------------------------------------------------------------ */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(
    ({ type, message, duration = 4000 }: { type: ToastType; message: string; duration?: number }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => {
        const next = [...prev, { id, type, message, duration }];
        return next.length > 4 ? next.slice(next.length - 4) : next;
      });
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 items-end sm:items-end max-sm:bottom-20 max-sm:right-3 max-sm:left-3 max-sm:items-center"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <ToastCard key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

