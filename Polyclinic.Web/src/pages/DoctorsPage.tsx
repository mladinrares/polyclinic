import { useState, useEffect } from 'react';
import { doctorsApi } from '../api/doctorsApi';
import type { DoctorDto, LocationDto, PagedResult, SpecialtyDto } from '../types/doctor';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getPreference, savePreference } from '../utils/cookieConsent';
import { trackEvent } from '../utils/analytics';

const avatarColors = [
  { bg: '#E6F1FB', color: '#185FA5' },
  { bg: '#E1F5EE', color: '#0F6E56' },
  { bg: '#FAECE7', color: '#993C1D' },
  { bg: '#FBEAF0', color: '#993556' },
  { bg: '#EEEDFE', color: '#534AB7' },
  { bg: '#FAEEDA', color: '#854F0B' },
];

function DoctorCard({ doctor, index }: { doctor: DoctorDto; index: number }) {
  const ac = avatarColors[index % avatarColors.length];
  return (
    <Link to={`/doctors/${doctor.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '24px',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        height: '100%',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#378ADD';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(55,138,221,0.08)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--color-border-tertiary)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: ac.bg, color: ac.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 500, flexShrink: 0, overflow: 'hidden',
          }}>
            {doctor.profilePictureUrl ? (
              <img src={`http://localhost:5289${doctor.profilePictureUrl}`}
                alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : `${doctor.firstName[0]}${doctor.lastName[0]}`}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
              Dr. {doctor.firstName} {doctor.lastName}
            </p>
            <p style={{ fontSize: '13px', color: '#378ADD', marginBottom: '8px' }}>
              {doctor.specialtyName}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '11px', padding: '3px 8px', borderRadius: '99px',
                background: doctor.isAvailable ? '#EAF3DE' : '#FCEBEB',
                color: doctor.isAvailable ? '#3B6D11' : '#A32D2D',
                fontWeight: 500,
              }}>
                {doctor.isAvailable ? 'Disponibil' : 'Indisponibil'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                · {doctor.experienceYears} ani exp.
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {doctor.bio && (
          <p style={{
            fontSize: '13px', color: 'var(--color-text-secondary)',
            lineHeight: 1.6, margin: 0,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          }}>
            {doctor.bio}
          </p>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '16px',
          borderTop: '0.5px solid var(--color-border-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <i className="ti ti-star" style={{ fontSize: '14px', color: '#EF9F27' }} />
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {doctor.averageRating > 0 ? doctor.averageRating : '—'}
            </span>
            {doctor.reviewCount > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                ({doctor.reviewCount} recenzii)
              </span>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>
              consultație de la
            </p>
            <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {doctor.consultationFee} lei
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DoctorsPage() {
  const [data, setData] = useState<PagedResult<DoctorDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('searchName') ?? '');
  const [locationId, setLocationId] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [specialties, setSpecialties] = useState<SpecialtyDto[]>([]);
  // const [specialtyFilter, setSpecialtyFilter] = useState(searchParams.get('specialtyId') ?? '');
  const [specialtyFilter, setSpecialtyFilter] = useState(
    searchParams.get('specialtyId') ?? getPreference('doctorsSpecialtyFilter') ?? ''
  );
  
  
  const cities = [...new Set(locations.map(l => l.city))];
  const filteredLocations = selectedCity ? locations.filter(l => l.city === selectedCity) : locations;
  const hasFilters = !!(search || locationId || maxFee || specialtyFilter);
  
  

  useEffect(() => {
    const fetchInit = async () => {
      const [locRes, specRes] = await Promise.all([
        doctorsApi.getLocations(),
        doctorsApi.getSpecialties(),
      ]);
      setLocations(locRes.data);
      setSpecialties(specRes.data);
    };
    fetchInit();
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const response = await doctorsApi.getDoctors({
          searchName: search || undefined,
          specialtyId: specialtyFilter || undefined,
          locationId: locationId || undefined,
          maxFee: maxFee ? Number(maxFee) : undefined,
          page,
          pageSize: 12,
        });
        setData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(debounce);
  }, [search, page, specialtyFilter, locationId, maxFee]);

  const resetFilters = () => {
    setSearch(''); setLocationId(''); setMaxFee('');
    setSpecialtyFilter(''); setSelectedCity(''); setPage(1);
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
          Doctori
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
          {data ? `${data.totalCount} specialiști disponibili` : 'Găsește doctorul potrivit pentru tine'}
        </p>
      </div>

      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <i className="ti ti-search" style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            fontSize: '16px', color: 'var(--color-text-tertiary)',
          }} />
          <input
            type="text"
            placeholder="Caută după nume..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              trackEvent('search', '/doctors', { query: e.target.value });
              setPage(1);
            }}
            style={{
              width: '100%', paddingLeft: '36px', paddingRight: '12px',
              paddingTop: '8px', paddingBottom: '8px',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '14px', color: 'var(--color-text-primary)',
              background: 'var(--color-background-secondary)',
            }}
          />
        </div>

        <select
          value={specialtyFilter}
          onChange={(e) => {
            setSpecialtyFilter(e.target.value);
            savePreference('doctorsSpecialtyFilter', e.target.value);
            setPage(1);
            const specialty = specialties.find(s => s.id === e.target.value);
            if (specialty) trackEvent('filter_specialty', '/doctors', { specialtyName: specialty.name });
          }}
          style={selectStyle}
        >
          <option value="">Toate specialitățile</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={selectedCity}
          onChange={(e) => { setSelectedCity(e.target.value); setLocationId(''); setPage(1); }}
          style={selectStyle}
        >
          <option value="">Toate orașele</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <select
          value={locationId}
          onChange={(e) => {
            setLocationId(e.target.value);
            setPage(1);
            if (e.target.value) {
              const loc = locations.find(l => l.id === e.target.value);
              if (loc) setSelectedCity(loc.city);
            }
          }}
          style={selectStyle}
        >
          <option value="">Toate clinicile</option>
          {filteredLocations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Preț maxim (lei)"
          value={maxFee}
          onChange={(e) => { setMaxFee(e.target.value); setPage(1); }}
          style={{ ...selectStyle, width: '160px' }}
        />

        {hasFilters && (
          <button
            onClick={resetFilters}
            style={{
              fontSize: '13px', color: 'var(--color-text-secondary)',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '8px',
            }}
          >
            <i className="ti ti-x" style={{ fontSize: '14px' }} />
            Resetează
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-tertiary)' }}>
          Se încarcă...
        </div>
      ) : data?.items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-tertiary)' }}>
          <i className="ti ti-search" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }} />
          <p style={{ fontSize: '15px' }}>Nu am găsit niciun doctor</p>
          {hasFilters && (
            <button onClick={resetFilters} style={{
              marginTop: '12px', fontSize: '14px', color: '#378ADD',
              background: 'none', border: 'none', cursor: 'pointer',
            }}>
              Șterge filtrele
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}>
            {data?.items.map((doctor, i) => (
              <DoctorCard key={doctor.id} doctor={doctor} index={i} />
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={!data.hasPreviousPage}
                style={paginationBtnStyle(!data.hasPreviousPage)}
              >
                <i className="ti ti-chevron-left" style={{ fontSize: '16px' }} />
                Anterior
              </button>
              <span style={{
                padding: '8px 16px', fontSize: '14px',
                color: 'var(--color-text-secondary)',
              }}>
                {page} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!data.hasNextPage}
                style={paginationBtnStyle(!data.hasNextPage)}
              >
                Următor
                <i className="ti ti-chevron-right" style={{ fontSize: '16px' }} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-md)',
  fontSize: '14px',
  color: 'var(--color-text-primary)',
  background: 'var(--color-background-secondary)',
  cursor: 'pointer',
};

const paginationBtnStyle = (disabled: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '8px 16px', fontSize: '14px',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-md)',
  background: 'var(--color-background-primary)',
  color: disabled ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
  transition: 'background 0.15s',
});