import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsApi } from '../api/appointmentsApi';
import { useAuthStore } from '../store/authStore';
import type { AppointmentDto } from '../types/appointment';
import type { PagedResult } from '../types/doctor';
import { reviewsApi } from '../api/reviewsApi';
import { useUIContext } from '../hooks/UIContext';

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange?.(star)}
          style={{
            fontSize: '18px',
            color: star <= rating ? '#EF9F27' : 'var(--color-border-secondary)',
            cursor: onChange ? 'pointer' : 'default',
            background: 'none', border: 'none', padding: '0',
            transition: 'color 0.15s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  confirmed: { bg: 'var(--color-background-success)', color: 'var(--color-text-success)', label: 'Confirmată' },
  pending: { bg: '#FFFBEB', color: '#92400E', label: 'În așteptare' },
  cancelled: { bg: 'var(--color-background-danger)', color: 'var(--color-text-danger)', label: 'Anulată' },
  completed: { bg: 'var(--color-background-info)', color: 'var(--color-text-info)', label: 'Finalizată' },
  pending_referral_verification: { bg: '#FFF7ED', color: '#C2410C', label: 'Referral în așteptare' },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<PagedResult<AppointmentDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reviewingAppointment, setReviewingAppointment] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc'>('date-desc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const {confirm} = useUIContext();

  const allItems = data?.items ?? [];

  const filtered = allItems
    .filter(a => !statusFilter || a.status === statusFilter)
    .sort((a, b) => {
      const dateA = `${a.slotDate} ${a.startTime}`;
      const dateB = `${b.slotDate} ${b.startTime}`;
      return sortBy === 'date-asc'
        ? dateA.localeCompare(dateB)
        : dateB.localeCompare(dateA);
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentsApi.getMyAppointments();
      setData(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (id: string) => {
    const ok = await confirm({ title: 'Ștergi programarea?', message: 'Ești sigur că vrei să anulezi această programare?', confirmLabel: 'Șterge', variant: 'danger' });
    if (!ok) return;
    
    setCancelling(id);
    try {
      await appointmentsApi.cancelAppointment(id, 'Anulat de pacient');
      await fetchAppointments();
    } finally {
      setCancelling(null);
    }
  };

  const handleSubmitReview = async (appointmentId: string) => {
    setSubmittingReview(true);
    try {
      await reviewsApi.createReview({ appointmentId, rating, comment });
      setReviewingAppointment(null);
      setComment(''); setRating(5);
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatTime = (t: string) => t.substring(0, 5);

  

  return (
  <div style={{ maxWidth: '720px', margin: '0 auto' }}>
    <div style={{ marginBottom: '32px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
        Bună, {user?.firstName}!
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
        {allItems.filter(a => a.status === 'confirmed').length > 0
          ? `Ai ${allItems.filter(a => a.status === 'confirmed').length} programare viitoare`
          : 'Nu ai programări viitoare'}
      </p>
    </div>

    {loading ? (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-tertiary)' }}>
        Se încarcă...
      </div>
    ) : allItems.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <i className="ti ti-calendar-off" style={{ fontSize: '40px', color: 'var(--color-text-tertiary)', marginBottom: '12px', display: 'block' }} />
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Nu ai nicio programare</p>
        <Link to="/doctors" style={{
          fontSize: '14px', color: '#378ADD', textDecoration: 'none',
          padding: '8px 16px', border: '0.5px solid #378ADD',
          borderRadius: 'var(--border-radius-md)',
        }}>
          Găsește un doctor
        </Link>
      </div>
    ) : (
      <>
        {/* Filtre */}
        <div style={{
          background: 'white',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
        }}>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              padding: '7px 12px',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '13px', color: 'var(--color-text-primary)',
              background: 'var(--color-background-secondary)',
              cursor: 'pointer',
            }}
          >
            <option value="">Toate statusurile</option>
            <option value="confirmed">Confirmate</option>
            <option value="completed">Finalizate</option>
            <option value="cancelled">Anulate</option>
            <option value="pending_referral_verification">Referral în așteptare</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as 'date-asc' | 'date-desc'); setPage(1); }}
            style={{
              padding: '7px 12px',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '13px', color: 'var(--color-text-primary)',
              background: 'var(--color-background-secondary)',
              cursor: 'pointer',
            }}
          >
            <option value="date-desc">Cele mai recente</option>
            <option value="date-asc">Cele mai vechi</option>
          </select>

          <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginLeft: 'auto' }}>
            {filtered.length} programări
          </span>

          {statusFilter && (
            <button
              onClick={() => { setStatusFilter(''); setPage(1); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: 'var(--color-text-secondary)',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              <i className="ti ti-x" style={{ fontSize: '14px' }} />
              Resetează
            </button>
          )}
        </div>

        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-tertiary)' }}>
            Nu există programări cu statusul selectat
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paged.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onCancel={handleCancel}
                cancelling={cancelling}
                reviewingAppointment={reviewingAppointment}
                setReviewingAppointment={setReviewingAppointment}
                rating={rating}
                setRating={setRating}
                comment={comment}
                setComment={setComment}
                submittingReview={submittingReview}
                onSubmitReview={handleSubmitReview}
                formatDate={formatDate}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', fontSize: '13px',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-md)',
                background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer',
                color: page === 1 ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              <i className="ti ti-chevron-left" style={{ fontSize: '14px' }} />
              Anterior
            </button>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', fontSize: '13px',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-md)',
                background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                color: page === totalPages ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                opacity: page === totalPages ? 0.5 : 1,
              }}
            >
              Următor
              <i className="ti ti-chevron-right" style={{ fontSize: '14px' }} />
            </button>
          </div>
        )}
      </>
    )}
  </div>
);
}

function AppointmentCard({
  appointment, onCancel, cancelling,
  reviewingAppointment, setReviewingAppointment,
  rating, setRating, comment, setComment,
  submittingReview, onSubmitReview,
  formatDate, formatTime,
}: {
  appointment: AppointmentDto;
  onCancel: (id: string) => void;
  cancelling: string | null;
  reviewingAppointment: string | null;
  setReviewingAppointment: (id: string | null) => void;
  rating: number;
  setRating: (r: number) => void;
  comment: string;
  setComment: (c: string) => void;
  submittingReview: boolean;
  onSubmitReview: (id: string) => void;
  formatDate: (d: string) => string;
  formatTime: (t: string) => string;
}) {
  const statusStyle = statusStyles[appointment.status] ?? { bg: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', label: appointment.status };

  return (
    <div style={{
      background: 'white',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
            {appointment.doctorName}
          </p>
          <p style={{ fontSize: '13px', color: '#378ADD', marginBottom: '4px' }}>{appointment.specialtyName}</p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{appointment.serviceName}</p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{appointment.locationName}</p>
        </div>
        <span style={{
          fontSize: '12px', padding: '4px 10px', borderRadius: '99px',
          background: statusStyle.bg, color: statusStyle.color,
          fontWeight: 500, whiteSpace: 'nowrap',
        }}>
          {statusStyle.label}
        </span>
      </div>

      <div style={{
        borderTop: '0.5px solid var(--color-border-tertiary)',
        paddingTop: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          <i className="ti ti-calendar" style={{ fontSize: '14px' }} />
          {formatDate(appointment.slotDate.toString())}
          <span>·</span>
          <i className="ti ti-clock" style={{ fontSize: '14px' }} />
          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {appointment.pricePaid} lei
          </span>
          {appointment.status === 'confirmed' && (
            <button
              onClick={() => onCancel(appointment.id)}
              disabled={cancelling === appointment.id}
              style={{
                fontSize: '13px', color: 'var(--color-text-danger)',
                background: 'none', border: 'none', cursor: 'pointer',
                opacity: cancelling === appointment.id ? 0.5 : 1,
              }}
            >
              {cancelling === appointment.id ? 'Se anulează...' : 'Anulează'}
            </button>
          )}
          {appointment.status === 'completed' && !appointment.hasReview && (
            <button
              onClick={() => setReviewingAppointment(
                reviewingAppointment === appointment.id ? null : appointment.id
              )}
              style={{
                fontSize: '13px', color: '#378ADD',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              Lasă recenzie
            </button>
          )}
          {appointment.status === 'completed' && appointment.hasReview && (
            <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="ti ti-check" style={{ fontSize: '13px' }} />
              Recenzie trimisă
            </span>
          )}
        </div>
      </div>

      {reviewingAppointment === appointment.id && (
        <div style={{
          marginTop: '12px', paddingTop: '12px',
          borderTop: '0.5px solid var(--color-border-tertiary)',
        }}>
          <StarRating rating={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Scrie o recenzie..."
            rows={2}
            style={{
              width: '100%', marginTop: '8px',
              padding: '8px 12px',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '13px', color: 'var(--color-text-primary)',
              background: 'white', resize: 'vertical', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={() => onSubmitReview(appointment.id)}
              disabled={submittingReview}
              style={{
                background: '#378ADD', color: 'white',
                border: 'none', padding: '6px 14px',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '13px', cursor: 'pointer',
                opacity: submittingReview ? 0.5 : 1,
              }}
            >
              {submittingReview ? 'Se trimite...' : 'Trimite'}
            </button>
            <button
              onClick={() => setReviewingAppointment(null)}
              style={{
                background: 'none', border: 'none',
                fontSize: '13px', color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              Anulează
            </button>
          </div>
        </div>
      )}
    </div>
  );
}