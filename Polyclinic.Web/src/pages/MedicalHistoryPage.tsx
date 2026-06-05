import { useState, useEffect } from 'react';
import { medicalRecordsApi } from '../api/medicalRecordsApi';
import type { MedicalRecordDto } from '../types/medical';
import { getErrorMessage } from '../utils/errorUtils';

const invStatusConfig: Record<string, { bg: string; color: string; label: string }> = {
  requested: { bg: '#FFFBEB', color: '#92400E', label: 'În așteptare' },
  completed: { bg: '#EAF3DE', color: '#3B6D11', label: 'Finalizat' },
  result_uploaded: { bg: '#E6F1FB', color: '#185FA5', label: 'Rezultat încărcat' },
};

export default function MedicalHistoryPage() {
  const [records, setRecords] = useState<MedicalRecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const response = await medicalRecordsApi.getMyHistory();
      setRecords(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleUploadInvestigationResult = async (investigationId: string, file: File) => {
    try {
      await medicalRecordsApi.uploadInvestigationResult(investigationId, file);
      setSuccess('Rezultatul a fost încărcat cu succes');
      fetchHistory();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDownloadPdf = async (appointmentId: string, diagnosis: string) => {
    try {
      const response = await medicalRecordsApi.downloadPdf(appointmentId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fisa-medicala-${diagnosis}.pdf`);
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
          Istoric medical
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
          Toate consultațiile și fișele tale medicale
        </p>
      </div>

      {error && (
        <div style={{ background: 'var(--color-background-danger)', color: 'var(--color-text-danger)', padding: '10px 16px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'var(--color-background-success)', color: 'var(--color-text-success)', padding: '10px 16px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '16px' }}>
          {success}
        </div>
      )}

      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <i className="ti ti-file-medical" style={{ fontSize: '40px', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '12px' }} />
          <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)' }}>Nu ai fișe medicale încă</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {records.map(record => {
            const isExpanded = expandedId === record.id;
            return (
              <div key={record.id} style={{
                background: 'white',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-lg)',
                overflow: 'hidden',
              }}>
                {/* Header - clickable */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '20px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                        {record.diagnosis}
                      </p>
                      <p style={{ fontSize: '13px', color: '#378ADD' }}>
                        <i className="ti ti-user" style={{ fontSize: '12px', marginRight: '4px' }} />
                        {record.doctorName}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {formatDate(record.recordDate)}
                      </p>
                      <i className={`ti ${isExpanded ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }} />
                    </div>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ padding: '0 20px 20px', borderTop: '0.5px solid var(--color-border-tertiary)' }}>

                    {/* Sectiuni medicale */}
                    {[
                      { label: 'Anamneză', value: record.anamnesis },
                      { label: 'Examen obiectiv', value: record.examinationNotes },
                      { label: 'Plan tratament', value: record.treatmentPlan },
                      { label: 'Recomandări', value: record.recommendations },
                    ].filter(s => s.value).map(s => (
                      <div key={s.label} style={{ marginTop: '16px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                          {s.label}
                        </p>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                          {s.value}
                        </p>
                      </div>
                    ))}

                    {/* Rețete */}
                    {record.prescriptions.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                          Rețete
                        </p>
                        {record.prescriptions.map(prescription => (
                          <div key={prescription.id} style={{
                            background: '#E6F1FB',
                            borderRadius: 'var(--border-radius-md)',
                            padding: '12px 16px', marginBottom: '8px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 500, color: '#185FA5' }}>
                                {prescription.prescriptionNumber}
                              </span>
                              <span style={{ fontSize: '12px', color: '#185FA5' }}>
                                Valabil până la {prescription.validUntil}
                              </span>
                            </div>
                            {prescription.items.map((item, i) => (
                              <p key={i} style={{ fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 500 }}>{item.medicationName}</span>
                                {' '}— {item.dosage} — {item.frequency} — {item.duration}
                              </p>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Investigații */}
                    {record.investigations.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                          Investigații
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {record.investigations.map(inv => {
                            const isc = invStatusConfig[inv.status] ?? invStatusConfig.requested;
                            return (
                              <div key={inv.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 14px',
                                border: '0.5px solid var(--color-border-tertiary)',
                                borderRadius: 'var(--border-radius-md)',
                                background: 'white',
                              }}>
                                <div>
                                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                                    {inv.name}
                                  </p>
                                  {inv.notes && (
                                    <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{inv.notes}</p>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                                  <span style={{
                                    fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                                    background: isc.bg, color: isc.color, fontWeight: 500,
                                  }}>
                                    {isc.label}
                                  </span>
                                  {inv.status === 'requested' && (
                                    <label style={{ fontSize: '13px', color: '#378ADD', cursor: 'pointer' }}>
                                      <i className="ti ti-upload" style={{ fontSize: '13px', marginRight: '4px' }} />
                                      Încarcă
                                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                                        onChange={e => {
                                          const file = e.target.files?.[0];
                                          if (file) handleUploadInvestigationResult(inv.id, file);
                                        }} />
                                    </label>
                                  )}
                                  {inv.resultUrl && (
                                    <a href={`http://localhost:5289${inv.resultUrl}`} target="_blank" rel="noopener noreferrer"
                                      style={{ fontSize: '13px', color: '#378ADD', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <i className="ti ti-eye" style={{ fontSize: '13px' }} />
                                      Vezi
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleDownloadPdf(record.appointmentId, record.diagnosis)}
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}