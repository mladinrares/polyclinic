import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doctorsApi } from '../api/doctorsApi';
import { adminApi } from '../api/adminApi';
import { reviewsApi, type ReviewDto } from '../api/reviewsApi';
import type { DoctorDto, SpecialtyDto, MedicalServiceDto } from '../types/doctor';


const specialtyIcons: Record<string, { icon: string; bg: string; color: string }> = {
  'Cardiologie': { icon: 'ti-heart-rate-monitor', bg: '#E6F1FB', color: '#185FA5' },
  'Dermatologie': { icon: 'ti-ripple', bg: '#E1F5EE', color: '#0F6E56' },
  'Neurologie': { icon: 'ti-brain', bg: '#EEEDFE', color: '#534AB7' },
  'Pediatrie': { icon: 'ti-baby-carriage', bg: '#FBEAF0', color: '#993556' },
  'Ortopedie': { icon: 'ti-bone', bg: '#FAECE7', color: '#993C1D' },
  'Oftalmologie': { icon: 'ti-eye', bg: '#FAEEDA', color: '#854F0B' },
};

const defaultSpecialtyStyle = { icon: 'ti-stethoscope', bg: '#E6F1FB', color: '#185FA5' };

const avatarColors = [
  { bg: '#E6F1FB', color: '#185FA5' },
  { bg: '#E1F5EE', color: '#0F6E56' },
  { bg: '#FAECE7', color: '#993C1D' },
  { bg: '#FBEAF0', color: '#993556' },
  { bg: '#EEEDFE', color: '#534AB7' },
  { bg: '#FAEEDA', color: '#854F0B' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyDto[]>([]);
  const [cnasServices, setCnasServices] = useState<MedicalServiceDto[]>([]);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [search, setSearch] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [publicStats, setPublicStats] = useState({ totalAppointments: 0, totalDoctors: 0 });
  const [avgRating, setAvgRating] = useState<number>(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [doctorsRes, specialtiesRes, servicesRes, reviewsRes, publicStateRes, avgRatingRes] = await Promise.all([
          doctorsApi.getDoctors({ page: 1, pageSize: 8 }),
          doctorsApi.getSpecialties(),
          doctorsApi.getCNASServices(),
          reviewsApi.getTopReviews(3),
          doctorsApi.getPublicStats(),
          reviewsApi.getAverageRating(),
        ]);
        setDoctors(doctorsRes.data.items);
        setSpecialties(specialtiesRes.data.slice(0, 6));
        setCnasServices(servicesRes.data.slice(0, 3));
        setReviews(reviewsRes.data);
        setPublicStats(publicStateRes.data);
        setAvgRating(avgRatingRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAll();
  }, []);

  const carouselItems = [...doctors, null];
  const maxIndex = Math.max(0, carouselItems.length - 4);

  const nextSlide = useCallback(() => {
    setCarouselIndex(prev => prev >= maxIndex ? 0 : prev + 1);
  }, [maxIndex]);

  const prevSlide = () => {
    setCarouselIndex(prev => prev <= 0 ? maxIndex : prev - 1);
  };

  const startAuto = useCallback(() => {
    autoRef.current = setInterval(nextSlide, 3500);
  }, [nextSlide]);

  const stopAuto = () => {
    if (autoRef.current) clearInterval(autoRef.current);
  };

  useEffect(() => {
    startAuto();
    return () => stopAuto();
  }, [startAuto]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/doctors?searchName=${search}`);
  };

  const formatDate = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'azi';
    if (days === 1) return 'ieri';
    if (days < 7) return `acum ${days} zile`;
    if (days < 30) return `acum ${Math.floor(days / 7)} săptămâni`;
    return `acum ${Math.floor(days / 30)} luni`;
  };

  return (
    <div>
      {/* Hero */}
      <section style={{
        padding: '48px 16px',
        background: 'var(--color-background-primary)',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        overflow: 'hidden',
      }}>
         <div style={{ maxWidth: '1120px', margin: '0 auto' }} className="hero-grid">
          <div>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 500, lineHeight: 1.2, marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              Sănătatea ta,<br />la un click distanță
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
              Programări online rapide la cei mai buni specialiști. Fișă medicală digitală, rețete și trimiteri — totul într-un singur loc.
            </p>
            <div className="hero-buttons">
              <Link to="/doctors" style={btnPrimaryStyle}>Programează-te acum</Link>
              <Link to="/specialties" style={btnOutlineStyle}>Explorează specialitățile</Link>
            </div>
            <div className="hero-stats">
              {[
                { value: `${Math.floor(doctors.length / 10) * 10 > 9 ? Math.floor(doctors.length / 10) * 10 : doctors.length}+`, label: 'Specialiști' },
                { value: `${specialties.length}`, label: 'Specialități' },
                { value: avgRating, label: 'Rating mediu' },
                { value: `${Math.floor(publicStats.totalAppointments / 10) * 10}+`, label: 'Programări' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{stat.value}</p>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'var(--color-background-secondary)',
            borderRadius: 'var(--border-radius-lg)',
            border: '0.5px solid var(--color-border-tertiary)',
            padding: '24px',
          }}>
            <form onSubmit={handleSearch}>
              <div style={{
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '16px',
                marginBottom: '16px',
              }}>
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>Caută doctor</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ex: Maria Ionescu..."
                    style={{
                      flex: 1, minWidth: 0,
                      background: 'var(--color-background-secondary)',
                      border: '0.5px solid var(--color-border-tertiary)',
                      borderRadius: 'var(--border-radius-md)',
                      padding: '8px 12px', fontSize: '14px',
                      color: 'var(--color-text-primary)',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button type="submit" style={btnPrimaryStyle}>Caută</button>
                </div>
              </div>
            </form>
            <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>Căutări populare</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {specialties.slice(0, 5).map((s) => (
                <span key={s.id} onClick={() => navigate(`/doctors?specialtyId=${s.id}`)} style={{
                  fontSize: '12px', padding: '4px 10px', borderRadius: '99px',
                  background: 'var(--color-background-primary)',
                  color: 'var(--color-text-secondary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  cursor: 'pointer',
                }}>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Carusel doctori */}
      <section style={{ padding: '64px 24px', background: 'var(--color-background-primary)' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <h2 style={sectionTitleStyle}>Medicii noștri</h2>
              <p style={sectionSubStyle}>Specialiști cu experiență, dedicați sănătății tale</p>
            </div>
            <Link to="/doctors" style={linkAllStyle}>
              Toți medicii <i className="ti ti-arrow-right" style={{ fontSize: '14px' }} />
            </Link>
          </div>

          <div
            style={{ position: 'relative', padding: '0 24px' }}
            onMouseEnter={stopAuto}
            onMouseLeave={startAuto}
          >
            <button onClick={prevSlide} aria-label="Anterior" style={{ ...carouselBtnStyle, left: '-18px' }}>
              <i className="ti ti-chevron-left" style={{ fontSize: '16px' }} />
            </button>

            <div style={{ overflow: 'hidden' }}>
              <div
                ref={trackRef}
                style={{
                  display: 'flex',
                  gap: '16px',
                  transition: 'transform 0.4s ease',
                  transform: `translateX(-${carouselIndex * (220 + 16)}px)`,
                }}
              >
                {doctors.map((doctor, i) => (
                  <div key={doctor.id} style={{
                    minWidth: '220px', flexShrink: 0,
                    background: 'var(--color-background-primary)',
                    border: '0.5px solid var(--color-border-tertiary)',
                    borderRadius: 'var(--border-radius-lg)',
                    padding: '20px',
                  }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '50%',
                      background: avatarColors[i % avatarColors.length].bg,
                      color: avatarColors[i % avatarColors.length].color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', fontWeight: 500, marginBottom: '12px',
                      overflow: 'hidden',
                    }}>
                      {doctor.profilePictureUrl ? (
                        <img
                          src={`http://localhost:5289${doctor.profilePictureUrl}`}
                          alt={doctor.firstName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        `${doctor.firstName[0]}${doctor.lastName[0]}`
                      )}
                    </div>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                      Dr. {doctor.firstName} {doctor.lastName}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                      {doctor.specialtyName}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                      <i className="ti ti-star" style={{ fontSize: '13px', color: '#EF9F27' }} />
                      {doctor.averageRating > 0 ? `${doctor.averageRating} (${doctor.reviewCount})` : 'Fără recenzii'}
                    </div>
                    <Link
                      to={`/doctors/${doctor.id}/book`}
                      style={{ ...btnPrimaryStyle, fontSize: '13px', padding: '7px 14px', display: 'block', textAlign: 'center' }}
                    >
                      Programează-te
                    </Link>
                  </div>
                ))}

                <div style={{
                  minWidth: '220px', flexShrink: 0,
                  background: 'var(--color-background-secondary)',
                  border: '0.5px dashed var(--color-border-secondary)',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '20px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', gap: '12px', minHeight: '200px',
                  cursor: 'pointer',
                }}
                  onClick={() => navigate('/doctors')}
                >
                  <i className="ti ti-users" style={{ fontSize: '32px', color: 'var(--color-text-tertiary)' }} />
                  <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Toți medicii</p>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Explorează toți specialiștii disponibili</p>
                  <Link to="/doctors" style={{ ...btnOutlineStyle, fontSize: '13px', padding: '7px 14px' }}>
                    Vezi toți <i className="ti ti-arrow-right" style={{ fontSize: '13px' }} />
                  </Link>
                </div>
              </div>
            </div>

            <button onClick={nextSlide} aria-label="Următor" style={{ ...carouselBtnStyle, right: '-18px' }}>
              <i className="ti ti-chevron-right" style={{ fontSize: '16px' }} />
            </button>
          </div>
        </div>
      </section>

      {/* Specialități */}
      <section style={{ padding: '64px 24px', background: 'var(--color-background-secondary)' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <h2 style={sectionTitleStyle}>Specialități medicale</h2>
              <p style={sectionSubStyle}>Găsește specialistul potrivit pentru tine</p>
            </div>
            <Link to="/specialties" style={linkAllStyle}>
              Toate specialitățile <i className="ti ti-arrow-right" style={{ fontSize: '14px' }} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {specialties.map((s) => {
              const style = specialtyIcons[s.name] ?? defaultSpecialtyStyle;
              return (
                <Link key={s.id} to={`/doctors?specialtyId=${s.id}`} style={{
                  background: 'var(--color-background-primary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '20px 16px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', textAlign: 'center', gap: '10px',
                  textDecoration: 'none', transition: 'border-color 0.15s, background 0.15s',
                }}>
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: 'var(--border-radius-md)',
                    background: style.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`ti ${style.icon}`} style={{ fontSize: '22px', color: style.color }} />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{s.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{s.doctorCount} doctori</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CNAS */}
      {cnasServices.length > 0 && (
        <section style={{ padding: '64px 24px', background: 'var(--color-background-primary)' }}>
          <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={sectionTitleStyle}>Servicii decontate CNAS</h2>
              <p style={sectionSubStyle}>Beneficiezi de reduceri semnificative cu cardul de sănătate</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {cnasServices.map((service) => (
                <div key={service.id} style={{
                  background: 'var(--color-background-primary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '20px',
                }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '11px', padding: '3px 8px', borderRadius: '99px',
                    background: '#EAF3DE', color: '#3B6D11',
                    fontWeight: 500, marginBottom: '12px',
                  }}>
                    <i className="ti ti-shield-check" style={{ fontSize: '12px' }} />
                    Decontat CNAS
                  </span>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {service.name}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    {service.specialtyName}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', textDecoration: 'line-through' }}>
                      {service.price} lei
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 500, color: '#3B6D11' }}>
                      {service.cnasCoveredAmount && service.cnasCoveredAmount >= service.price
                        ? 'Gratuit'
                        : `${service.price - (service.cnasCoveredAmount ?? 0)} lei`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cum funcționează */}
      <section style={{ padding: '64px 24px', background: 'var(--color-background-secondary)' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={sectionTitleStyle}>Cum funcționează</h2>
            <p style={sectionSubStyle}>Trei pași simpli pentru o programare</p>
          </div>
          <div className="steps-grid">
            {[
              { num: '1', title: 'Alege doctorul', desc: 'Caută după specialitate, locație sau nume. Citește recenzii și alege specialistul potrivit.' },
              { num: '2', title: 'Selectează ora', desc: 'Alege data și ora care ți se potrivesc. Prima oră liberă e selectată automat.' },
              { num: '3', title: 'Prezintă-te', desc: 'Primești confirmare instant. La consultație, doctorul are acces la fișa ta medicală digitală.' },
            ].map((step) => (
              <div key={step.num} style={{ textAlign: 'center', padding: '24px', background: 'var(--color-background-primary)', borderRadius: 'var(--border-radius-lg)', border: '0.5px solid var(--color-border-tertiary)' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: '#E6F1FB', color: '#185FA5',
                  fontSize: '16px', fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recenzii */}
      {reviews.length > 0 && (
        <section style={{ padding: '64px 24px', background: 'var(--color-background-primary)' }}>
          <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={sectionTitleStyle}>Ce spun pacienții</h2>
              <p style={sectionSubStyle}>Experiențe reale de la pacienții noștri</p>
            </div>
            <div className="reviews-grid">
              {reviews.map((review) => (
                <div key={review.id} style={{
                  background: 'var(--color-background-primary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '20px',
                }}>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '10px', color: '#EF9F27' }}>
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <i key={i} className="ti ti-star" style={{ fontSize: '14px' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                    {review.comment}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'var(--color-background-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)',
                      flexShrink: 0,
                    }}>
                      {review.patientName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {review.patientName}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                        {review.doctorName} • {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{
        background: 'var(--color-background-primary)',
        borderTop: '0.5px solid var(--color-border-tertiary)',
        padding: '64px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
            Gata să te programezi?
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '28px' }}>
            Alătură-te celor peste 500 de pacienți care folosesc platforma noastră lunar.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/doctors" style={{ ...btnPrimaryStyle, fontSize: '15px', padding: '12px 28px' }}>
              Programează-te acum
            </Link>
            <Link to="/register" style={{ ...btnOutlineStyle, fontSize: '15px', padding: '12px 28px' }}>
              Creează cont gratuit
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const btnPrimaryStyle: React.CSSProperties = {
  background: '#378ADD', color: '#fff', border: 'none',
  padding: '10px 20px', borderRadius: 'var(--border-radius-md)',
  fontSize: '14px', fontWeight: 500, cursor: 'pointer',
  textDecoration: 'none', display: 'inline-block', transition: 'opacity 0.15s',
};

const btnOutlineStyle: React.CSSProperties = {
  background: 'none', color: 'var(--color-text-primary)',
  border: '0.5px solid var(--color-border-secondary)',
  padding: '10px 20px', borderRadius: 'var(--border-radius-md)',
  fontSize: '14px', cursor: 'pointer',
  textDecoration: 'none', display: 'inline-block', transition: 'background 0.15s',
};

const carouselBtnStyle: React.CSSProperties = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  width: '36px', height: '36px', borderRadius: '50%',
  background: 'var(--color-background-primary)',
  border: '0.5px solid var(--color-border-tertiary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', zIndex: 2, color: 'var(--color-text-secondary)',
  transition: 'background 0.15s',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '22px', fontWeight: 500, color: 'var(--color-text-primary)',
};

const sectionSubStyle: React.CSSProperties = {
  fontSize: '15px', color: 'var(--color-text-secondary)', marginTop: '6px',
};

const linkAllStyle: React.CSSProperties = {
  fontSize: '14px', color: '#378ADD', textDecoration: 'none',
  display: 'flex', alignItems: 'center', gap: '4px',
};