import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-300',
  error: 'border-red-500/40 bg-red-950/80 text-red-300',
  info: 'border-forge-highlight/40 bg-forge-surface/90 text-forge-highlight',
  warning: 'border-amber-500/40 bg-amber-950/80 text-amber-300',
};

export function ToastRegion() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-8 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type ?? 'info'];
        const colorClass = COLORS[toast.type ?? 'info'];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 min-w-[280px] max-w-[400px] rounded-lg border px-4 py-3 shadow-lg pointer-events-auto backdrop-blur-sm animate-in slide-in-from-right-4 duration-200 ${colorClass}`}
          >
            <Icon size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs opacity-90 break-words">{toast.message}</p>
            </div>
            <button
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              onClick={() => removeToast(toast.id)}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
