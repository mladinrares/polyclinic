export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

export function ConfirmModal({
  options,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isDanger = options.variant === 'danger';

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px',
    }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: 'white',
        borderRadius: 'var(--border-radius-lg)',
        padding: '24px',
        width: '100%', maxWidth: '380px',
        animation: 'fadeIn 0.15s ease',
      }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: isDanger ? '#FCEBEB' : '#E6F1FB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '12px',
          }}>
            <i className={`ti ${isDanger ? 'ti-alert-triangle' : 'ti-question-mark'}`}
              style={{ fontSize: '20px', color: isDanger ? '#A32D2D' : '#185FA5' }} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            {options.title}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            {options.message}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px', fontSize: '13px',
              background: 'none', border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              cursor: 'pointer', color: 'var(--color-text-secondary)',
            }}
          >
            {options.cancelLabel ?? 'Anulează'}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px', fontSize: '13px',
              background: isDanger ? '#A32D2D' : '#378ADD',
              color: 'white', border: 'none',
              borderRadius: 'var(--border-radius-md)',
              cursor: 'pointer',
            }}
          >
            {options.confirmLabel ?? 'Confirmă'}
          </button>
        </div>
      </div>
    </div>
  );
}