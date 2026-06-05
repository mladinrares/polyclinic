import { useState, useEffect } from 'react';
import { referralsApi } from '../api/referralsApi';
import type { ReferralDto } from '../api/referralsApi';
import { getErrorMessage } from '../utils/errorUtils';

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: '#EAF3DE', color: '#3B6D11', label: 'Activ' },
  used: { bg: '#E6F1FB', color: '#185FA5', label: 'Folosit' },
  expired: { bg: '#FCEBEB', color: '#A32D2D', label: 'Expirat' },
};

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    referralsApi.getMyReferrals()
      .then(r => setReferrals(r.data))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPdf = async (id: string, referralNumber: string) => {
    try {
      const response = await referralsApi.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `referral-${referralNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-tertiary)' }}>
      Se încarcă...
    </div>
  );

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
          Referral-urile mele
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
          Trimiteri medicale emise de doctori
        </p>
      </div>

      {error && (
        <div style={{ background: 'var(--color-background-danger)', color: 'var(--color-text-danger)', padding: '10px 16px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {referrals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <i className="ti ti-file-certificate" style={{ fontSize: '40px', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '12px' }} />
          <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)' }}>Nu ai referral-uri</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {referrals.map(referral => {
            const sc = statusConfig[referral.status] ?? statusConfig.expired;
            const isExpired = referral.status === 'expired';

            return (
              <div key={referral.id} style={{
                background: 'white',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '20px',
                opacity: isExpired ? 0.7 : 1,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {referral.serviceName}
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
                        {referral.specialtyName}
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        <i className="ti ti-user" style={{ fontSize: '12px', marginRight: '4px' }} />
                        {referral.referringDoctorName}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>
                      {referral.referralNumber}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                      {referral.validFrom} — {referral.validUntil}
                    </p>
                  </div>
                </div>

                {/* Motiv + note */}
                <div style={{
                  background: 'var(--color-background-secondary)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '10px 14px',
                  marginBottom: '12px',
                }}>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: referral.notes ? '4px' : '0' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Motiv: </span>
                    {referral.reason}
                  </p>
                  {referral.notes && (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Note: </span>
                      {referral.notes}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div style={{
                  borderTop: '0.5px solid var(--color-border-tertiary)',
                  paddingTop: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                    Emis la {formatDate(referral.createdAt)}
                  </p>
                  <button
                    onClick={() => handleDownloadPdf(referral.id, referral.referralNumber)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      fontSize: '13px', color: '#378ADD',
                      background: 'none', border: 'none', cursor: 'pointer',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <i className="ti ti-download" style={{ fontSize: '14px' }} />
                    Descarcă PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}