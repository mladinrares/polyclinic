import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorsApi } from '../api/doctorsApi';
import type { SpecialtyDto } from '../types/doctor';

const specialtyIcons: Record<string, { icon: string; bg: string; color: string }> = {
  'Cardiologie': { icon: 'ti-heart-rate-monitor', bg: '#E6F1FB', color: '#185FA5' },
  'Dermatologie': { icon: 'ti-ripple', bg: '#E1F5EE', color: '#0F6E56' },
  'Neurologie': { icon: 'ti-brain', bg: '#EEEDFE', color: '#534AB7' },
  'Pediatrie': { icon: 'ti-baby-carriage', bg: '#FBEAF0', color: '#993556' },
  'Ortopedie': { icon: 'ti-bone', bg: '#FAECE7', color: '#993C1D' },
  'Oftalmologie': { icon: 'ti-eye', bg: '#FAEEDA', color: '#854F0B' },
  'Ginecologie': { icon: 'ti-gender-female', bg: '#FBEAF0', color: '#993556' },
  'Psihiatrie': { icon: 'ti-brain', bg: '#EEEDFE', color: '#534AB7' },
};

const defaultIcon = { icon: 'ti-stethoscope', bg: '#E6F1FB', color: '#185FA5' };

export default function SpecialtiesPage() {
  const [specialties, setSpecialties] = useState<SpecialtyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    doctorsApi.getSpecialties()
      .then(r => setSpecialties(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = specialties.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-tertiary)' }}>
      Se încarcă...
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
          Specialități
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
          {specialties.length} specialități disponibile
        </p>
      </div>

      <div style={{
        background: 'white',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <i className="ti ti-search" style={{ fontSize: '18px', color: 'var(--color-text-tertiary)' }} />
        <input
          type="text"
          placeholder="Caută specialitate..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: '15px', color: 'var(--color-text-primary)',
            background: 'transparent',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-tertiary)', fontSize: '16px',
              display: 'flex', alignItems: 'center',
            }}
          >
            <i className="ti ti-x" style={{ fontSize: '16px' }} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-tertiary)' }}>
          <i className="ti ti-search" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }} />
          <p style={{ fontSize: '15px' }}>Nu am găsit nicio specialitate</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '12px',
        }}>
          {filtered.map((specialty) => {
            const style = specialtyIcons[specialty.name] ?? defaultIcon;
            return (
              <button
                key={specialty.id}
                onClick={() => navigate(`/doctors?specialtyId=${specialty.id}`)}
                style={{
                  background: 'white',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '20px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                  display: 'flex', flexDirection: 'column', gap: '12px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border-secondary)';
                  e.currentTarget.style.background = 'var(--color-background-secondary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border-tertiary)';
                  e.currentTarget.style.background = 'white';
                }}
              >
                <div style={{
                  width: '44px', height: '44px',
                  borderRadius: 'var(--border-radius-md)',
                  background: style.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`ti ${style.icon}`} style={{ fontSize: '22px', color: style.color }} />
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    {specialty.name}
                  </p>
                  {specialty.description && (
                    <p style={{
                      fontSize: '13px', color: 'var(--color-text-secondary)',
                      lineHeight: 1.5, marginBottom: '6px',
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {specialty.description}
                    </p>
                  )}
                  <p style={{ fontSize: '13px', color: '#378ADD' }}>
                    {specialty.doctorCount} {specialty.doctorCount === 1 ? 'doctor' : 'doctori'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}