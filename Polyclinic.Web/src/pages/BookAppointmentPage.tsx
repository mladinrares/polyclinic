import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doctorsApi } from '../api/doctorsApi';
import { appointmentsApi } from '../api/appointmentsApi';
import type { DoctorCalendarDay, DoctorDto, LocationDto, MedicalServiceDto } from '../types/doctor';
import type { TimeSlotDto } from '../types/appointment';
import { getErrorMessage } from '../utils/errorUtils';
import { referralsApi, type ReferralDto } from '../api/referralsApi';
import { usersApi } from '../api/usersApi';
import { useAuthStore } from '../store/authStore';
import {authApi} from '../api/authApi'
import { trackEvent } from '../utils/analytics';
import { useUIContext } from '../hooks/UIContext';

export default function BookAppointmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<DoctorDto | null>(null);
  const [services, setServices] = useState<MedicalServiceDto[]>([]);
  const [slots, setSlots] = useState<TimeSlotDto[]>([]);
  const [selectedService, setSelectedService] = useState<MedicalServiceDto | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {toast} = useUIContext();
  
  const [locationId, setLocationId] = useState('');
  const [searchParams] = useSearchParams();
  const [noSlotsAvailable, setNoSlotsAvailable] = useState(false);
  
  const [referralInfo, setReferralInfo] = useState<{ hasReferral: boolean; referral?: ReferralDto } | null>(null);
  const [externalReferralFile, setExternalReferralFile] = useState<File | null>(null);
  const [addedToWaitingList, setAddedToWaitingList] = useState(false);
  const [doctorHasSchedule, setDoctorHasSchedule] = useState(false);
  const [hasValidCNASCard, setHasValidCNASCard] = useState(false);
  const [hasMoreSlots, setHasMoreSlots] = useState(false);
  const { user } = useAuthStore();
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resentSuccess, setResentSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const isDisabled =
    !selectedSlot || !selectedService || submitting ||
    !selectedService?.isBookableOnline ||
    (selectedService?.requiresReferral && !referralInfo?.hasReferral && !externalReferralFile) ||
    !user?.emailVerified;
  const [showAllServices, setShowAllServices] = useState(false);
  const visibleServices = showAllServices ? services : services.slice(0, 10);
  const [calendarDays, setCalendarDays] = useState<DoctorCalendarDay[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  
  
  
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [availableLocationIds, setAvailableLocationIds] = useState<string[]>([]);

  const filteredLocations = availableLocationIds.length > 0
    ? locations.filter(l => availableLocationIds.includes(l.id))
    : locations;

 useEffect(() => {
  const fetchData = async () => {
    if (!id) return;
    try {
      const [doctorRes, servicesRes, locationsRes, cnasRes] = await Promise.all([
        doctorsApi.getDoctorById(id),
        doctorsApi.getAllDoctorServices(id),
        doctorsApi.getLocations(),
        usersApi.getValidInsuranceCard(),
      ]);
      setDoctor(doctorRes.data);
      setServices(servicesRes.data);
      setLocations(locationsRes.data);
      setHasValidCNASCard(!!cnasRes.data && cnasRes.data.isVerified === true);
      if (servicesRes.data.length > 0) setSelectedService(servicesRes.data[0]);
      if (locationsRes.data.length > 0) {
        const preselected = locationsRes.data.find(l => l.id === searchParams.get('locationId'));
        setLocationId(preselected ? preselected.id : locationsRes.data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [id]);

  useEffect(() => {
    if (!id || !locationId || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    // fetch toate sloturile pentru ziua selectata
    appointmentsApi.getAvailableSlots(id, locationId, selectedDate, selectedService?.id)
      .then(r => setSlots(r.data))
      .finally(() => setSlotsLoading(false));
  }, [id, selectedDate, locationId, selectedService]);

  useEffect(() => {
    if (!id || !locationId) return;
    setCalendarLoading(true);
    appointmentsApi.getDoctorCalendar(id, locationId, selectedService?.id)
      .then(r => setCalendarDays(r.data))
      .catch(() => setCalendarDays([]))
      .finally(() => setCalendarLoading(false));
  }, [id, locationId, selectedService?.id]);

  useEffect(() => {
    if (!id || !locationId || !selectedService) return;
    appointmentsApi.getFirstAvailableDate(id, locationId, selectedService.id, selectedDate)
      .then(r => setHasMoreSlots(!!r.data.date && r.data.date > selectedDate))
      .catch(() => setHasMoreSlots(false));
  }, [selectedDate, id, locationId, selectedService]);

  useEffect(() => {
    if (!id || !locationId || !selectedService) return;
    appointmentsApi.getFirstAvailableDate(id, locationId, selectedService.id)
      .then(r => {
        if (r.data.date) {
          setDoctorHasSchedule(true);
          setNoSlotsAvailable(false);
        } else {
          setDoctorHasSchedule(false);
          setNoSlotsAvailable(true);
        }
      })
      .catch(() => {
        setDoctorHasSchedule(false);
        setNoSlotsAvailable(true);
      });
  }, [id, locationId, selectedService]);

  useEffect(() => {
    if (!id || !selectedService) return;
    appointmentsApi.getLocationsByService(id, selectedService.id)
      .then(r => {
        setAvailableLocationIds(r.data);
        if (r.data.length > 0) {
          const newLocationId = r.data.includes(locationId) ? locationId : r.data[0];
          setLocationId('');
          setTimeout(() => setLocationId(newLocationId), 0);
        }
      })
      .catch(() => setAvailableLocationIds([]));
  }, [id, selectedService]);


  useEffect(() => {
    if (!selectedService?.requiresReferral) { setReferralInfo(null); return; }
    referralsApi.getValidReferral(selectedService.id)
      .then(r => setReferralInfo(r.data))
      .catch(() => setReferralInfo({ hasReferral: false }));
  }, [selectedService]);

  useEffect(() => {
    if (!selectedService?.isCNASCovered) return;
    usersApi.getValidInsuranceCard()
      .then(r => setHasValidCNASCard(!!r.data && r.data.isVerified === true))
      .catch(() => setHasValidCNASCard(false));
  }, [selectedService]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleAddToWaitingList = async () => {
    if (!id || !selectedService || !locationId) return;
    try {
      await appointmentsApi.addToWaitingList({
        doctorId: id,
        serviceId: selectedService.id,
        locationId,
        preferredDateFrom: selectedDate,
        preferredDateTo: noSlotsAvailable
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : selectedDate,
      });
      setAddedToWaitingList(true);
    } catch (err) {
      // setError(getErrorMessage(err, 'A apărut o eroare'));
      toast(getErrorMessage(err, 'A apărut o eroare'), 'error');
    }
  };
  const handleSubmit = async () => {
    if (!selectedSlot || !id || !selectedService) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await appointmentsApi.createAppointment({
        doctorId: id, serviceId: selectedService.id,
        locationId, timeSlotId: selectedSlot, reason, type: 'in_person',
      });
      if (externalReferralFile && response.data.id) {
        await appointmentsApi.uploadExternalReferral(response.data.id, externalReferralFile);
      }
      navigate('/dashboard');
      trackEvent('book_appointment', '/book', { doctorId: id ?? '', serviceId: selectedService.id });
    } catch {
      // setError(getErrorMessage(error, 'A apărut o eroare la programare'));
      toast(getErrorMessage(error, 'A apărut o eroare la programare'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const finalPrice = selectedService
    ? (selectedService.isCNASCovered && hasValidCNASCard
        ? Math.max(0, selectedService.price - (selectedService.cnasCoveredAmount ?? selectedService.price))
        : selectedService.price)
    : 0;

  

  const handleResendVerification = async () => {
    setResendingEmail(true);
    try {
      await authApi.resendVerification();
      setResentSuccess(true);
      setCountdown(30);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {
    } finally {
      setResendingEmail(false);
    }
  };

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

  

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{
        background: 'white',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '32px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: '#E6F1FB', color: '#185FA5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 500, flexShrink: 0, overflow: 'hidden',
          }}>
            {doctor.profilePictureUrl ? (
              <img src={`http://localhost:5289${doctor.profilePictureUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : `${doctor.firstName[0]}${doctor.lastName[0]}`}
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
              Programare nouă
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Dr. {doctor.firstName} {doctor.lastName} · {doctor.specialtyName}
            </p>
          </div>
        </div>

        {!user?.emailVerified && (
          <div style={{
            background: '#FFFBEB',
            border: '0.5px solid #FDE68A',
            borderRadius: 'var(--border-radius-md)',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="ti ti-mail" style={{ fontSize: '18px', color: '#92400E', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#92400E', marginBottom: '2px' }}>
                  Email neverificat
                </p>
                <p style={{ fontSize: '12px', color: '#92400E' }}>
                  Trebuie să îți verifici email-ul înainte de a face o programare.
                </p>
              </div>
            </div>
            {resentSuccess && countdown > 0 ? (
              <span style={{ fontSize: '12px', color: '#92400E', whiteSpace: 'nowrap' }}>
                Retrimite în {countdown}s
              </span>
            ) : resentSuccess && countdown === 0 ? (
              <button
                onClick={handleResendVerification}
                disabled={resendingEmail}
                style={{
                  fontSize: '12px', color: '#92400E',
                  background: 'white', border: '0.5px solid #FDE68A',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                Retrimite din nou
              </button>
            ) : (
              <button
                onClick={handleResendVerification}
                disabled={resendingEmail}
                style={{
                  fontSize: '12px', color: '#92400E',
                  background: 'white', border: '0.5px solid #FDE68A',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
                  opacity: resendingEmail ? 0.6 : 1,
                }}
              >
                {resendingEmail ? 'Se trimite...' : 'Retrimite email'}
              </button>
            )}
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--color-background-danger)', color: 'var(--color-text-danger)',
            padding: '12px 16px', borderRadius: 'var(--border-radius-md)',
            fontSize: '14px', marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* Servicii */}
        {services.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Serviciu
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {visibleServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  disabled={!service.isBookableOnline}
                  style={{
                    textAlign: 'left', padding: '12px 16px',
                    borderRadius: 'var(--border-radius-md)',
                    border: selectedService?.id === service.id
                      ? '1.5px solid #378ADD'
                      : '0.5px solid var(--color-border-tertiary)',
                    background: selectedService?.id === service.id
                      ? '#E6F1FB'
                      : !service.isBookableOnline ? 'var(--color-background-secondary)' : 'white',
                    opacity: !service.isBookableOnline ? 0.6 : 1,
                    cursor: !service.isBookableOnline ? 'not-allowed' : 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                        {service.name}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                        {service.durationMinutes} min
                        {!service.isBookableOnline && ' · Doar prin recepție'}
                        {service.requiresReferral && ' · Necesită trimitere'}
                      </p>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {service.price} lei
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {services.length > 10 && (
              <button
                onClick={() => setShowAllServices(!showAllServices)}
                style={{
                  width: '100%', marginTop: '8px', padding: '10px',
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
                <i className={`ti ${showAllServices ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: '14px' }} />
                {showAllServices ? 'Arată mai puțin' : `Arată toate (${services.length})`}
              </button>
            )}
          </div>
        )}

        {/* Referral */}
        {selectedService?.requiresReferral && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: '20px',
            background: referralInfo?.hasReferral ? 'var(--color-background-success)' : '#FFFBEB',
            border: `0.5px solid ${referralInfo?.hasReferral ? 'var(--color-border-success)' : '#FDE68A'}`,
          }}>
            {referralInfo?.hasReferral ? (
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-success)', marginBottom: '4px' }}>
                  <i className="ti ti-check" style={{ marginRight: '6px' }} />
                  Referral valid găsit
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {referralInfo.referral?.referralNumber} · {referralInfo.referral?.referringDoctorName}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                  Valabil până la {referralInfo.referral?.validUntil}
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#92400E', marginBottom: '6px' }}>
                  <i className="ti ti-alert-triangle" style={{ marginRight: '6px' }} />
                  Acest serviciu necesită trimitere medicală
                </p>
                <p style={{ fontSize: '12px', color: '#92400E', marginBottom: '10px' }}>
                  Nu ai un referral intern valid. Poți încărca unul extern.
                </p>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', padding: '6px 12px',
                  borderRadius: 'var(--border-radius-md)',
                  background: 'white', border: '0.5px solid #FDE68A',
                  cursor: 'pointer', color: '#92400E',
                }}>
                  <i className="ti ti-paperclip" style={{ fontSize: '14px' }} />
                  {externalReferralFile ? externalReferralFile.name : 'Încarcă referral extern (PDF)'}
                  <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => setExternalReferralFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            )}
          </div>
        )}

        {/* Locatie */}
        {filteredLocations.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Locație
            </label>
            <select
              value={locationId}
              onChange={(e) => { setLocationId(e.target.value); setSelectedSlot(null); }}
              disabled={filteredLocations.length === 1}
              style={{
                width: '100%', padding: '10px 12px',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '14px', color: 'var(--color-text-primary)',
                background: filteredLocations.length === 1 ? 'var(--color-background-secondary)' : 'white',
                cursor: filteredLocations.length === 1 ? 'default' : 'pointer',
              }}
            >
              {filteredLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name} — {loc.city}</option>
              ))}
            </select>
            
          </div>
        )}

        
        
        

        {/* Waiting list - nu exista sloturi in ziua asta dar exista in alte zile */}
        {!noSlotsAvailable && doctorHasSchedule && slots.length === 0 && !slotsLoading && !addedToWaitingList && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              background: 'var(--color-background-secondary)',
              padding: '12px 16px', borderRadius: 'var(--border-radius-md)',
              fontSize: '13px', color: 'var(--color-text-secondary)',
              marginBottom: '8px',
            }}>
              Nu există sloturi disponibile în această zi. Poți alege altă dată sau te poți înscrie pe lista de așteptare pentru {new Date(selectedDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })}.
            </div>
            <button onClick={handleAddToWaitingList} style={{
              width: '100%', padding: '10px',
              border: '0.5px solid var(--color-border-secondary)',
              borderRadius: 'var(--border-radius-md)',
              background: 'none', color: 'var(--color-text-secondary)', fontSize: '13px',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <i className="ti ti-clock" style={{ fontSize: '13px', marginRight: '6px' }} />
              Înscrie-te pe lista de așteptare pentru această zi
            </button>
          </div>
        )}


        {addedToWaitingList && (
          <div style={{
            background: 'var(--color-background-success)', color: 'var(--color-text-success)',
            padding: '12px 16px', borderRadius: 'var(--border-radius-md)',
            fontSize: '13px', marginBottom: '20px',
          }}>
            <i className="ti ti-check" style={{ marginRight: '6px' }} />
            Ești pe lista de așteptare. Vei primi o notificare când se eliberează un slot.
          </div>
        )}

        

        {/* Calendar */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Selectează data
          </label>

          {calendarLoading ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Se încarcă calendarul...</p>
          ) : calendarDays.length === 0 ? (
            <div style={{ background: 'var(--color-background-secondary)', padding: '16px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Acest doctor nu are program generat. Contactați recepția.
            </div>
          ) : (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { year, month } = currentMonth;
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDow = (firstDay.getDay() + 6) % 7; // Monday first
            const daysInMonth = lastDay.getDate();

            const calendarMap = new Map(calendarDays.map(d => [d.date.substring(0, 10), d]));

            const cells: (number | null)[] = [
              ...Array(startDow).fill(null),
              ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
            ];

            const canGoPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

            return (
              <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
                {/* Month navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>
                  <button
                    onClick={() => setCurrentMonth(prev => {
                      const d = new Date(prev.year, prev.month - 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })}
                    disabled={!canGoPrev}
                    style={{ width: '28px', height: '28px', borderRadius: 'var(--border-radius-md)', border: 'none', background: 'none', cursor: canGoPrev ? 'pointer' : 'not-allowed', opacity: canGoPrev ? 1 : 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}
                  >
                    <i className="ti ti-chevron-left" style={{ fontSize: '16px' }} />
                  </button>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {firstDay.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                  </p>
                  <button
                    onClick={() => setCurrentMonth(prev => {
                      const d = new Date(prev.year, prev.month + 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })}
                    style={{ width: '28px', height: '28px', borderRadius: 'var(--border-radius-md)', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}
                  >
                    <i className="ti ti-chevron-right" style={{ fontSize: '16px' }} />
                  </button>
                </div>

                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '8px 8px 0' }}>
                  {['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-tertiary)', padding: '4px 0', fontWeight: 500 }}>{d}</div>
                  ))}
                </div>

                {/* Days grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', padding: '4px 8px 8px' }}>
                  {cells.map((day, i) => {
                    if (!day) return <div key={i} />;

                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const calDay = calendarMap.get(dateStr);
                    const date = new Date(year, month, day);
                    const isPast = date < today;
                    const isSelected = selectedDate === dateStr;
                    const isToday = date.toDateString() === today.toDateString();

                    let bg = 'transparent';
                    let color = 'var(--color-text-tertiary)';
                    let cursor = 'default';
                    let border = 'none';

                    if (isSelected) {
                      bg = '#378ADD';
                      color = 'white';
                      cursor = 'pointer';
                    } else if (isPast || !calDay) {
                      bg = 'transparent';
                      color = 'var(--color-text-tertiary)';
                      cursor = 'default';
                    } else if (calDay.hasAvailable) {
                      bg = '#EAF3DE';
                      color = '#3B6D11';
                      cursor = 'pointer';
                    } else {
                      bg = '#FCEBEB';
                      color = '#A32D2D';
                      cursor = 'pointer';
                    }

                    if (isToday && !isSelected) border = '1.5px solid #378ADD';

                    return (
                      <button
                        key={i}
                        disabled={isPast || !calDay}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setSelectedSlot(null);
                          setAddedToWaitingList(false);
                          setShowSlotModal(true);
                        }}
                        style={{
                          aspectRatio: '1', borderRadius: 'var(--border-radius-md)',
                          border, background: bg, color,
                          cursor, fontSize: '13px', fontWeight: isSelected ? 500 : 400,
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          transition: 'opacity 0.15s',
                          opacity: isPast || !calDay ? 0.3 : 1,
                          padding: '2px',
                        }}
                        onMouseEnter={e => { if (!isPast && calDay && !isSelected) e.currentTarget.style.opacity = '0.75'; }}
                        onMouseLeave={e => { if (!isPast && calDay && !isSelected) e.currentTarget.style.opacity = '1'; }}
                      >
                        <span>{day}</span>
                        {calDay && (
                          <span style={{ fontSize: '9px', marginTop: '1px', opacity: 0.8 }}>
                            {calDay.availableSlots > 0 ? calDay.availableSlots : '●'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legenda */}
                <div style={{ display: 'flex', gap: '16px', padding: '8px 16px 12px', borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                  {[
                    { color: '#EAF3DE', textColor: '#3B6D11', label: 'Sloturi disponibile' },
                    { color: '#FCEBEB', textColor: '#A32D2D', label: 'Ocupat' },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: l.color }} />
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Sloturi */}
        {/* <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Oră
          </label>
          {slotsLoading ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Se încarcă...</p>
          ) : slots.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Nu există sloturi în această zi</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  style={{
                    padding: '8px', fontSize: '13px',
                    borderRadius: 'var(--border-radius-md)',
                    border: selectedSlot === slot.id ? '1.5px solid #378ADD' : '0.5px solid var(--color-border-tertiary)',
                    background: selectedSlot === slot.id ? '#378ADD' : 'white',
                    color: selectedSlot === slot.id ? 'white' : 'var(--color-text-primary)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {slot.startTime.substring(0, 5)}
                </button>
              ))}
            </div>
          )}
        </div> */}

        {/* Data selectata */}
          {selectedDate && !calendarLoading && (
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                <i className="ti ti-calendar" style={{ fontSize: '13px', marginRight: '6px' }} />
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <button
                onClick={() => setShowSlotModal(true)}
                style={{
                  fontSize: '12px', color: '#378ADD', background: 'none',
                  border: '0.5px solid var(--color-border-tertiary)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '5px 10px', cursor: 'pointer',
                }}
              >
                {selectedSlot ? 'Schimbă ora' : 'Selectează ora'}
              </button>
            </div>
          )}

        {/* Slot selectat */}
          {selectedSlot && (
            <div style={{ marginBottom: '20px', padding: '10px 14px', background: '#E6F1FB', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '13px', color: '#185FA5' }}>
                <i className="ti ti-clock" style={{ fontSize: '13px', marginRight: '6px' }} />
                {slots.find(s => s.id === selectedSlot)?.startTime.substring(0, 5)} — {slots.find(s => s.id === selectedSlot)?.endTime.substring(0, 5)}
              </p>
              <button onClick={() => setSelectedSlot(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#185FA5' }}>
                <i className="ti ti-x" style={{ fontSize: '14px' }} />
              </button>
            </div>
          )}

          {addedToWaitingList && (
            <div style={{ background: 'var(--color-background-success)', color: 'var(--color-text-success)', padding: '12px 16px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '20px' }}>
              <i className="ti ti-check" style={{ marginRight: '6px' }} />
              Ești pe lista de așteptare. Vei primi o notificare când se eliberează un slot.
            </div>
          )}

          {/* Modal sloturi */}
          {showSlotModal && selectedDate && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
              <div style={{ background: 'white', borderRadius: 'var(--border-radius-lg)', width: '100%', maxWidth: '400px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h2>
                  <button onClick={() => setShowSlotModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>
                    <i className="ti ti-x" style={{ fontSize: '18px' }} />
                  </button>
                </div>

                {slotsLoading ? (
                  <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '20px' }}>Se încarcă...</p>
                ) : (
                  <>
                    {slots.filter(s => s.isAvailable).length === 0 && (
                      <div style={{ background: '#FFFBEB', padding: '12px', borderRadius: 'var(--border-radius-md)', marginBottom: '16px', fontSize: '13px', color: '#92400E' }}>
                        <i className="ti ti-alert-triangle" style={{ marginRight: '6px' }} />
                        Nu există sloturi disponibile în această zi.
                        {!addedToWaitingList && (
                          <button
                            onClick={() => { handleAddToWaitingList(); setShowSlotModal(false); }}
                            style={{ display: 'block', marginTop: '8px', width: '100%', padding: '8px', border: '0.5px solid #FDE68A', borderRadius: 'var(--border-radius-md)', background: 'white', color: '#92400E', fontSize: '12px', cursor: 'pointer' }}
                          >
                            Înscrie-te pe lista de așteptare pentru această zi
                          </button>
                        )}
                      </div>
                    )}

                    {slots.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                        {slots.map(slot => (
                          <button
                            key={slot.id}
                            disabled={!slot.isAvailable}
                            onClick={() => {
                              setSelectedSlot(slot.id);
                              setShowSlotModal(false);
                            }}
                            style={{
                              padding: '10px 6px', fontSize: '12px',
                              borderRadius: 'var(--border-radius-md)',
                              border: selectedSlot === slot.id ? '1.5px solid #378ADD' : '0.5px solid var(--color-border-tertiary)',
                              background: selectedSlot === slot.id ? '#378ADD' : !slot.isAvailable ? 'var(--color-background-secondary)' : 'white',
                              color: selectedSlot === slot.id ? 'white' : !slot.isAvailable ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                              cursor: slot.isAvailable ? 'pointer' : 'not-allowed',
                              transition: 'all 0.15s',
                              textDecoration: !slot.isAvailable ? 'line-through' : 'none',
                            }}
                          >
                            {slot.startTime.substring(0, 5)}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

        {/* Motiv */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Motivul consultației (opțional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Descrieți pe scurt motivul vizitei..."
            style={{
              width: '100%', padding: '10px 12px',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '14px', color: 'var(--color-text-primary)',
              background: 'white', resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Sumar pret */}
        {selectedService && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'var(--color-background-secondary)',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: '20px',
          }}>
            <div>
              <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {selectedService.name}
              </p>
              {selectedService.isCNASCovered && hasValidCNASCard && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-success)' }}>CNAS aplicat</p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              {selectedService.isCNASCovered && hasValidCNASCard && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textDecoration: 'line-through' }}>
                  {selectedService.price} lei
                </p>
              )}
              <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {finalPrice === 0 ? 'Gratuit' : `${finalPrice} lei`}
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={
            isDisabled
          }
          style={{
            width: '100%', background: '#378ADD', color: 'white',
            border: 'none', padding: '12px',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '15px', fontWeight: 500,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.15s',
            opacity: isDisabled ? 0.5 : 1,
          }}
        >
          {submitting ? 'Se procesează...' : 'Confirmă programarea'}
        </button>
      </div>
    </div>
  );
}