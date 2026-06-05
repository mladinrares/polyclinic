import { useState, useEffect } from 'react';
import { appointmentsApi } from '../api/appointmentsApi';
import type { WaitingListEntryDto } from '../types/appointment';
import { getErrorMessage } from '../utils/errorUtils';

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  waiting: { bg: '#FFFBEB', color: '#92400E', label: 'În așteptare' },
  notified: { bg: '#E6F1FB', color: '#185FA5', label: 'Notificat' },
  expired: { bg: 'var(--color-background-secondary)', color: 'var(--color-text-tertiary)', label: 'Expirat' },
};

export default function WaitingListPage() {
  const [entries, setEntries] = useState<WaitingListEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    appointmentsApi.getMyWaitingList()
      .then(r => setEntries(r.data))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (id: string) => {
    if (!confirm('Ești sigur că vrei să te retragi din lista de așteptare?')) return;
    try {
      await appointmentsApi.removeFromWaitingList(id);
      setEntries(entries.filter(e => e.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-tertiary)' }}>
      Se încarcă...
    </div>
  );

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
          Lista de așteptare
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
          Vei fi notificat când se eliberează un slot
        </p>
      </div>

      {error && (
        <div style={{ background: 'var(--color-background-danger)', color: 'var(--color-text-danger)', padding: '10px 16px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <i className="ti ti-clock" style={{ fontSize: '40px', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '12px' }} />
          <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)' }}>Nu ești pe nicio listă de așteptare</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {entries.map(entry => {
            const sc = statusConfig[entry.status] ?? statusConfig.expired;
            const isNotified = entry.status === 'notified';
            const isExpired = entry.status === 'expired';

            return (
              <div key={entry.id} style={{
                background: 'white',
                border: `0.5px solid ${isNotified ? '#B5D4F4' : 'var(--color-border-tertiary)'}`,
                borderRadius: 'var(--border-radius-lg)',
                padding: '20px',
                opacity: isExpired ? 0.7 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {entry.doctorName}
                      </p>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                        background: sc.bg, color: sc.color, fontWeight: 500,
                      }}>
                        {sc.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '13px', color: '#378ADD' }}>
                        <i className="ti ti-stethoscope" style={{ fontSize: '12px', marginRight: '4px' }} />
                        {entry.serviceName}
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        <i className="ti ti-map-pin" style={{ fontSize: '12px', marginRight: '4px' }} />
                        {entry.locationName}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', flexShrink: 0, marginLeft: '16px' }}>
                    Înscris {formatDate(entry.createdAt)}
                  </p>
                </div>

                {/* Banner notificat */}
                {isNotified && entry.notifiedAt && (
                  <div style={{
                    background: '#E6F1FB',
                    border: '0.5px solid #B5D4F4',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '10px 14px',
                    marginBottom: '12px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                    <i className="ti ti-bell" style={{ fontSize: '16px', color: '#185FA5', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#185FA5' }}>
                        Slot disponibil!
                      </p>
                      <p style={{ fontSize: '12px', color: '#185FA5', opacity: 0.8 }}>
                        Notificat la {formatDateTime(entry.notifiedAt)} — programează-te rapid înainte să expire!
                      </p>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div style={{
                  borderTop: '0.5px solid var(--color-border-tertiary)',
                  paddingTop: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                    <span>
                      <i className="ti ti-calendar" style={{ fontSize: '12px', marginRight: '4px' }} />
                      {formatDate(entry.preferredDateFrom)} — {formatDate(entry.preferredDateTo)}
                    </span>
                  </div>
                  {!isNotified && !isExpired && (
                    <button
                      onClick={() => handleRemove(entry.id)}
                      style={{
                        background: 'none', border: 'none',
                        fontSize: '13px', color: 'var(--color-text-danger)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      Retrage-te
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}