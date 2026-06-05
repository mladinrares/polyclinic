import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorsApi } from '../api/doctorsApi';
import { reviewsApi } from '../api/reviewsApi';
import type { DoctorDto } from '../types/doctor';
import type { ReviewDto } from '../api/reviewsApi';
import { trackEvent } from '../utils/analytics';

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} onClick={() => onChange?.(star)} style={{
          fontSize: '16px',
          color: star <= rating ? '#EF9F27' : 'var(--color-border-secondary)',
          cursor: onChange ? 'pointer' : 'default',
          background: 'none', border: 'none', padding: '0',
          transition: 'color 0.15s',
        }}>★</button>
      ))}
    </div>
  );
}

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorDto | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [doctorRes, reviewsRes] = await Promise.all([
          doctorsApi.getDoctorById(id),
          reviewsApi.getDoctorReviews(id),
        ]);
        setDoctor(doctorRes.data);
        setReviews(reviewsRes.data);
        trackEvent('view_doctor', `/doctors/${id}`, { doctorId: id });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-tertiary)' }}>
      Se încarcă...
    </div>
  );
  if (!doctor) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-tertiary)' }}>
      Doctor negăsit
    </div>
  );

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;
  const isExpanded = visibleCount > 5;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>

      {/* Header card */}
      <div style={{
        background: 'white',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        overflow: 'hidden',
        marginBottom: '16px',
      }}>
        {/* Top section */}
        <div style={{ padding: '32px', paddingBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '20px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: '#E6F1FB', color: '#185FA5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', fontWeight: 500, flexShrink: 0, overflow: 'hidden',
            }}>
              {doctor.profilePictureUrl ? (
                <img src={`http://localhost:5289${doctor.profilePictureUrl}`}
                  alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : `${doctor.firstName[0]}${doctor.lastName[0]}`}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Dr. {doctor.firstName} {doctor.lastName}
              </h1>
              <p style={{ fontSize: '14px', color: '#378ADD', marginBottom: '12px' }}>
                {doctor.specialtyName}
              </p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {avgRating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="ti ti-star" style={{ fontSize: '15px', color: '#EF9F27' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{avgRating}</span>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>({reviews.length} recenzii)</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i className="ti ti-briefcase" style={{ fontSize: '15px', color: 'var(--color-text-tertiary)' }} />
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{doctor.experienceYears} ani experiență</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>de la {doctor.consultationFee} lei</span>
                </div>
              </div>
            </div>
          </div>

          {doctor.bio && (
            <p style={{
              fontSize: '14px', color: 'var(--color-text-secondary)',
              lineHeight: 1.7, marginBottom: '0',
            }}>
              {doctor.bio}
            </p>
          )}
        </div>

        {/* CTA */}
        <div style={{ padding: '16px 32px', borderTop: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>
          <button
            onClick={() => navigate(`/doctors/${doctor.id}/book`)}
            style={{
              width: '100%', background: '#378ADD', color: 'white',
              border: 'none', padding: '12px',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '15px', fontWeight: 500, cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Programează-te
          </button>
        </div>
      </div>

      {/* Recenzii */}
      <div style={{
        background: 'white',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            Recenzii
          </h2>
          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '32px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{avgRating}</span>
              <div>
                <StarRating rating={Math.round(Number(avgRating))} />
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '3px' }}>
                  {reviews.length} recenzii
                </p>
              </div>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-tertiary)' }}>
            <i className="ti ti-message" style={{ fontSize: '28px', marginBottom: '8px', display: 'block' }} />
            <p style={{ fontSize: '14px' }}>Nu există recenzii încă</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {visibleReviews.map((review, i) => (
                <div key={review.id} style={{
                  padding: '16px 0',
                  borderBottom: i < visibleReviews.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: 'var(--color-background-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)',
                        flexShrink: 0,
                      }}>
                        {review.patientName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {review.patientName}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                      {new Date(review.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <StarRating rating={review.rating} />
                  {review.comment && (
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: 1.6 }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Load more / collapse */}
            {(hasMore || isExpanded) && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                {hasMore && (
                  <button
                    onClick={() => setVisibleCount(prev => prev + 5)}
                    style={{
                      flex: 1, padding: '10px',
                      border: '0.5px solid var(--color-border-tertiary)',
                      borderRadius: 'var(--border-radius-md)',
                      background: 'none', fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <i className="ti ti-chevron-down" style={{ fontSize: '14px' }} />
                    Mai multe recenzii ({reviews.length - visibleCount} rămase)
                  </button>
                )}
                {isExpanded && (
                  <button
                    onClick={() => setVisibleCount(5)}
                    style={{
                      flex: hasMore ? '0 0 auto' : 1,
                      padding: '10px 16px',
                      border: '0.5px solid var(--color-border-tertiary)',
                      borderRadius: 'var(--border-radius-md)',
                      background: 'none', fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <i className="ti ti-chevron-up" style={{ fontSize: '14px' }} />
                    Restrânge
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}