import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

const toastConfig = {
  success: { bg: '#EAF3DE', color: '#3B6D11', border: '#C0DD97', icon: 'ti-check' },
  error: { bg: '#FCEBEB', color: '#A32D2D', border: '#F09595', icon: 'ti-x' },
  info: { bg: '#E6F1FB', color: '#185FA5', border: '#B5D4F4', icon: 'ti-info-circle' },
  warning: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', icon: 'ti-alert-triangle' },
};

export function Toast({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const config = toastConfig[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 16px',
      background: config.bg,
      border: `0.5px solid ${config.border}`,
      borderRadius: 'var(--border-radius-md)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      minWidth: '280px', maxWidth: '380px',
      animation: 'slideIn 0.2s ease',
    }}>
      <i className={`ti ${config.icon}`} style={{ fontSize: '16px', color: config.color, flexShrink: 0 }} />
      <p style={{ fontSize: '13px', color: config.color, flex: 1, lineHeight: 1.4 }}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: config.color, opacity: 0.6, padding: '0', flexShrink: 0 }}
      >
        <i className="ti ti-x" style={{ fontSize: '14px' }} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '80px', right: '24px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      zIndex: 9998,
    }}>
      {toasts.map(t => <Toast key={t.id} toast={t} onRemove={onRemove} />)}
    </div>
  );
}