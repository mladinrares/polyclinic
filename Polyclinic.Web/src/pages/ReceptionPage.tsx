import { useState, useEffect } from 'react';
import { receptionApi } from '../api/receptionApi';
import type { DoctorAppointmentDto } from '../types/medical';
import { getErrorMessage } from '../utils/errorUtils';
import type { DoctorDto, LocationDto, MedicalServiceDto, PagedResult, SpecialtyDto } from '../types/doctor';
import type { TimeSlotDto } from '../types/appointment';
import { doctorsApi } from '../api/doctorsApi';
import { appointmentsApi } from '../api/appointmentsApi';
import type { PatientInsuranceDto } from '../types/insuranceCard';
import { usersApi } from '../api/usersApi';
import { walkInApi, type CreateWalkInPatientDto, type WalkInPatientDto } from '../api/walkInApi';
import type { CreatePatientDto, PatientDto } from '../types/patients';
import { useUIContext } from '../hooks/UIContext';

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'insurance', label: 'Asigurare' },
];

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmată',
  completed: 'Finalizată',
  cancelled: 'Anulată',
  pending: 'În așteptare',
  pending_referral_verification: 'Referral în așteptare',
};

const statusColors: Record<string, { bg: string; color: string }> = {
  confirmed: { bg: '#E6F1FB', color: '#185FA5' },
  completed: { bg: '#EAF3DE', color: '#3B6D11' },
  cancelled: { bg: '#FCEBEB', color: '#A32D2D' },
  pending: { bg: '#FFFBEB', color: '#92400E' },
  pending_referral_verification: { bg: '#FFF7ED', color: '#C2410C' },
};

export default function ReceptionPage() {
  const [data, setData] = useState<PagedResult<DoctorAppointmentDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyDto[]>([]);
  const [services, setServices] = useState<MedicalServiceDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [slots, setSlots] = useState<TimeSlotDto[]>([]);
  const [bookingForm, setBookingForm] = useState({
    patientEmail: '', doctorId: '', serviceId: '',
    locationId: '', timeSlotId: '', reason: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [searchName, setSearchName] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [availableDoctorIds, setAvailableDoctorIds] = useState<string[]>([]);
  const [availableSpecialtyIds, setAvailableSpecialtyIds] = useState<string[]>([]);
  const [availableLocationIds, setAvailableLocationIds] = useState<string[]>([]);
  const [bookingSpecialtyFilter, setBookingSpecialtyFilter] = useState('');
  const [activeView, setActiveView] = useState<'appointments' | 'referrals' | 'insurance' | 'walkin' | 'patients'>('appointments');
  const [pendingReferrals, setPendingReferrals] = useState<PagedResult<DoctorAppointmentDto> | null>(null);
  const [referralPage, setReferralPage] = useState(1);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [insuranceCards, setInsuranceCards] = useState<PagedResult<PatientInsuranceDto> | null>(null);
  const [insurancePage, setInsurancePage] = useState(1);
  const [insuranceSearch, setInsuranceSearch] = useState('');
  const [loadingInsurance, setLoadingInsurance] = useState(false);
  const [findingNextBooking, setFindingNextBooking] = useState(false);
  const [hasMoreSlotsBooking, setHasMoreSlotsBooking] = useState(true);
  const [walkInPatients, setWalkInPatients] = useState<{ items: WalkInPatientDto[]; totalCount: number; totalPages: number } | null>(null);
  const [walkInSearch, setWalkInSearch] = useState('');
  const [walkInPage, setWalkInPage] = useState(1);
  const [loadingWalkIn, setLoadingWalkIn] = useState(false);
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [editingWalkIn, setEditingWalkIn] = useState<WalkInPatientDto | null>(null);
  const [walkInForm, setWalkInForm] = useState<CreateWalkInPatientDto>({
    firstName: '', lastName: '', cnp: '', phone: '',
    email: '', age: undefined, address: '', city: '',
  });
  const [bookingPatientType, setBookingPatientType] = useState<'account' | 'walkin'>('account');
  const [selectedWalkIn, setSelectedWalkIn] = useState<WalkInPatientDto | null>(null);
  const [cnpSearch, setCnpSearch] = useState('');
  const [cnpSearchResult, setCnpSearchResult] = useState<WalkInPatientDto | null | 'not_found'>(null);
  const [patients, setPatients] = useState<{ items: PatientDto[]; totalCount: number; totalPages: number } | null>(null);
  const [patientsSearch, setPatientsSearch] = useState('');
  const [patientsPage, setPatientsPage] = useState(1);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [showInactivePatients, setShowInactivePatients] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientDto | null>(null);
  const [patientForm, setPatientForm] = useState<CreatePatientDto>({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', county: '',
  });
  const [showInactiveWalkIn, setShowInactiveWalkIn] = useState(false);
  const [resendCooldowns, setResendCooldowns] = useState<Record<string, number>>({});
  const [patientFormErrors, setPatientFormErrors] = useState<Record<string, string>>({});
  const [walkInFormErrors, setWalkInFormErrors] = useState<Record<string, string>>({});
  const filteredBookingDoctors = bookingForm.locationId
    ? doctors.filter(d => d.locationIds?.includes(bookingForm.locationId) && (!bookingSpecialtyFilter || d.specialtyId === bookingSpecialtyFilter))
    : doctors.filter(d => !bookingSpecialtyFilter || d.specialtyId === bookingSpecialtyFilter);

  const filteredBookingLocations = availableLocationIds.length > 0
    ? locations.filter(l => availableLocationIds.includes(l.id))
    : bookingForm.doctorId
      ? locations.filter(l => doctors.find(d => d.id === bookingForm.doctorId)?.locationIds?.includes(l.id))
      : locations;

  const [patientSearchResult, setPatientSearchResult] = useState<{
    firstName: string; lastName: string; email: string; emailVerified: boolean;
  } | null | 'not_found'>(null);
  const [searchingPatient, setSearchingPatient] = useState(false);

  const {toast, confirm} = useUIContext();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await receptionApi.getTodayAppointments({
        date: selectedDate, locationId: locationFilter || undefined,
        searchName: searchName || undefined, fromTime: fromTime || undefined,
        toTime: toTime || undefined, status: statusFilter || undefined,
        doctorId: doctorFilter || undefined, specialtyId: specialtyFilter || undefined,
        page, pageSize: 20,
      });
      setData(response.data);
    } catch (err) { toast(getErrorMessage(err), 'error');}
    finally { setLoading(false); }
  };

  const fetchPendingReferrals = async () => {
    setLoadingReferrals(true);
    try {
      const response = await receptionApi.getPendingReferrals(referralPage);
      setPendingReferrals(response.data);
    } catch (err) { toast(getErrorMessage(err), 'error'); }
    finally { setLoadingReferrals(false); }
  };

  const fetchInsuranceCards = async () => {
    setLoadingInsurance(true);
    try {
      const response = await usersApi.getPatientsWithCards(insuranceSearch || undefined, insurancePage);
      setInsuranceCards(response.data);
    } catch (err) { toast(getErrorMessage(err), 'error'); }
    finally { setLoadingInsurance(false); }
  };

  const handleNextAvailableBooking = async () => {
    if (!bookingForm.doctorId || !bookingForm.locationId || !bookingForm.serviceId) return;
    setFindingNextBooking(true);
    try {
      const response = await appointmentsApi.getFirstAvailableDate(
        bookingForm.doctorId,
        bookingForm.locationId,
        bookingForm.serviceId,
        bookingForm.date
      );
      if (response.data.date) {
        setBookingForm(prev => ({ ...prev, date: response.data.date!, timeSlotId: '' }));
      }
    } finally {
      setFindingNextBooking(false);
    }
  };

  const handleSearchPatient = async () => {
    if (!bookingForm.patientEmail.trim()) return;
    setSearchingPatient(true);
    try {
      const response = await receptionApi.getPatientByEmail(bookingForm.patientEmail);
      setPatientSearchResult(response.data);
    } catch {
      setPatientSearchResult('not_found');
    } finally {
      setSearchingPatient(false);
    }
  };

  const handleMigrateWalkIn = async (patient: WalkInPatientDto) => {
    if (!patient.email) {
      toast('Pacientul nu are email înregistrat. Adaugă email-ul înainte de migrare.');
      return;
    }
    const ok = await confirm({ title: 'Migrare pacient', message: `Ești sigur că vrei să migrezi pacientul ${patient.firstName} ${patient.lastName} la cont normal?`, confirmLabel: 'Confirmă', variant: 'primary' });
    if (!ok) return;
    
    try {
      const response = await walkInApi.migrate(patient.id);
      
      toast(response.data.message, 'success');
      
      fetchWalkInPatients();
    } catch (err) {
      
      toast(getErrorMessage(err), 'error');
    }
  };

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await receptionApi.getPatients(patientsSearch || undefined, patientsPage, 20, showInactivePatients);
      setPatients(response.data);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleCreatePatient = async () => {
    if (!validatePatientForm()) return;
    try {
      await receptionApi.createPatient(patientForm);
      toast('Pacient creat — email de confirmare trimis', 'success');
      setShowPatientForm(false);
      setPatientFormErrors({});
      setPatientForm({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', county: '', cnp: '' });
      fetchPatients();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };
  
  const handleUpdatePatient = async () => {
    if (!editingPatient || !validatePatientForm()) return;
    try {
      await receptionApi.updatePatient(editingPatient.id, {
        firstName: patientForm.firstName,
        lastName: patientForm.lastName,
        phone: patientForm.phone,
        address: patientForm.address,
        city: patientForm.city,
        county: patientForm.county,
      });
      
      toast('Pacient actualizat', 'success');

      setEditingPatient(null);
      setPatientFormErrors({});
      fetchPatients();
    } catch (err) {
      
      toast(getErrorMessage(err), 'error');
    }
  };

  const handleDeactivatePatient = async (id: string) => {
    const ok = await confirm({ title: 'Dezactivare pacient', message: `Ești sigur că să dezactivezi pacientul?`, confirmLabel: 'Dezactivează', variant: 'danger' });
    if (!ok) return;
    
    try {
      await receptionApi.deactivatePatient(id);
      
      toast('Pacient dezactivat', 'success');
      fetchPatients();
    } catch (err) {
      toast(getErrorMessage(err), 'error');

    }
  };

  const handleReactivatePatient = async (id: string) => {
    try {
      await receptionApi.reactivatePatient(id);
      
      toast('Pacient reactivat', 'success');

      fetchPatients();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const handleDeactivateWalkIn = async (id: string) => {
    
    const ok = await confirm({ title: 'Dezactivare pacient', message: `Ești sigur că să dezactivezi pacientul?`, confirmLabel: 'Dezactivează', variant: 'danger' });
    if (!ok) return;
    try {
      await walkInApi.deactivate(id);
      
      toast('Pacient dezactivat', 'success');
      fetchWalkInPatients();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const handleReactivateWalkIn = async (id: string) => {
    try {
      await walkInApi.reactivate(id);
      
      toast('Pacient reactivat', 'success');

      fetchWalkInPatients();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const handleResendVerification = async (patientId: string) => {
    try {
      await receptionApi.resendVerification(patientId);
      
      toast('Email de verificare retrimis', 'success');

      setResendCooldowns(prev => ({ ...prev, [patientId]: 30 }));
      const interval = setInterval(() => {
        setResendCooldowns(prev => {
          const val = (prev[patientId] ?? 0) - 1;
          if (val <= 0) {
            clearInterval(interval);
            const { [patientId]: _, ...rest } = prev;
            return rest;
          }
          return { ...prev, [patientId]: val };
        });
      }, 1000);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };
  const validatePatientForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!patientForm.firstName.trim()) errors.firstName = 'Prenumele este obligatoriu';
    if (!patientForm.lastName.trim()) errors.lastName = 'Numele este obligatoriu';
    if (!editingPatient) {
      if (!patientForm.email.trim()) errors.email = 'Email-ul este obligatoriu';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientForm.email)) errors.email = 'Email invalid';
      if (patientForm.cnp && !/^\d{13}$/.test(patientForm.cnp)) errors.cnp = 'CNP-ul trebuie să aibă 13 cifre';
    }
    if (patientForm.phone && !/^(\+4|0)[0-9]{9}$/.test(patientForm.phone.replace(/\s/g, ''))) 
      errors.phone = 'Număr de telefon invalid';
    setPatientFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateWalkInForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!walkInForm.firstName.trim()) errors.firstName = 'Prenumele este obligatoriu';
    if (!walkInForm.lastName.trim()) errors.lastName = 'Numele este obligatoriu';
    if (!walkInForm.cnp.trim()) errors.cnp = 'CNP-ul este obligatoriu';
    else if (!/^\d{13}$/.test(walkInForm.cnp)) errors.cnp = 'CNP-ul trebuie să aibă 13 cifre';
    if (!walkInForm.phone.trim()) errors.phone = 'Telefonul este obligatoriu';
    else if (!/^(\+4|0)[0-9]{9}$/.test(walkInForm.phone.replace(/\s/g, ''))) errors.phone = 'Număr de telefon invalid';
    if (walkInForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(walkInForm.email)) errors.email = 'Email invalid';
    if (walkInForm.age && (walkInForm.age < 0 || walkInForm.age > 120)) errors.age = 'Vârstă invalidă';
    setWalkInFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  

  useEffect(() => { fetchAppointments(); }, [selectedDate, locationFilter, searchName, fromTime, toTime, page, statusFilter, doctorFilter, specialtyFilter]);
  useEffect(() => { if (activeView === 'referrals') fetchPendingReferrals(); }, [activeView, referralPage]);
  useEffect(() => { if (activeView === 'insurance') fetchInsuranceCards(); }, [activeView, insurancePage, insuranceSearch]);

  useEffect(() => {
    Promise.all([doctorsApi.getDoctors(), doctorsApi.getLocations(), doctorsApi.getSpecialties()])
      .then(([dr, lr, sr]) => { setDoctors(dr.data.items); setLocations(lr.data); setSpecialties(sr.data); });
  }, []);

  useEffect(() => {
    if (!bookingForm.doctorId) return;
    const doctor = doctors.find(d => d.id === bookingForm.doctorId);
    if (doctor?.specialtyId) {
      setBookingSpecialtyFilter(doctor.specialtyId);
    }
    const fetch = async () => {
      const response = bookingForm.locationId
        ? await doctorsApi.getDoctorServicesByLocation(bookingForm.doctorId, bookingForm.locationId)
        : await doctorsApi.getAllDoctorServices(bookingForm.doctorId);
      setServices(response.data);
      if (doctor?.locationIds?.length === 1)
        setBookingForm(prev => ({ ...prev, locationId: doctor.locationIds![0], timeSlotId: '' }));
    };
    fetch();
  }, [bookingForm.doctorId, bookingForm.locationId, doctors]);

  useEffect(() => {
    setBookingForm(prev => ({ ...prev, doctorId: '', serviceId: '', locationId: '', timeSlotId: '' }));
    setAvailableLocationIds([]); setServices([]);
  }, [bookingSpecialtyFilter]);

  useEffect(() => {
    setAvailableLocationIds([]); setServices([]);
    setBookingForm(prev => ({ ...prev, serviceId: '', locationId: '', timeSlotId: '' }));
  }, [bookingForm.doctorId]);

  useEffect(() => {
    setAvailableLocationIds([]);
    setBookingForm(prev => ({ ...prev, locationId: '', timeSlotId: '' }));
  }, [bookingForm.serviceId]);

  useEffect(() => {
    if (!bookingForm.doctorId || !bookingForm.locationId || !bookingForm.date) return;
    appointmentsApi.getAvailableSlots(bookingForm.doctorId, bookingForm.locationId, bookingForm.date, bookingForm.serviceId || undefined)
      .then(r => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const filtered = r.data.filter(slot => {
          if (bookingForm.date > todayStr) return true;
          if (bookingForm.date < todayStr) return false;
          const [hours, minutes] = slot.startTime.split(':').map(Number);
          const slotTime = new Date();
          slotTime.setHours(hours, minutes, 0, 0);
          return slotTime > now;
        });

        setSlots(filtered);
      });
  }, [bookingForm.doctorId, bookingForm.locationId, bookingForm.date, bookingForm.serviceId]);

  useEffect(() => {
    if (!bookingForm.doctorId || !bookingForm.serviceId) return;
    appointmentsApi.getAvailableLocations(bookingForm.doctorId, bookingForm.serviceId).then(r => {
      setAvailableLocationIds(r.data);
      if (r.data.length > 0 && !r.data.includes(bookingForm.locationId))
        setBookingForm(prev => ({ ...prev, locationId: r.data[0], timeSlotId: '' }));
    }).catch(() => setAvailableLocationIds([]));
  }, [bookingForm.doctorId, bookingForm.serviceId]);

  useEffect(() => {
    if (!bookingForm.doctorId || !bookingForm.locationId || !bookingForm.serviceId) return;
    appointmentsApi.getFirstAvailableDate(bookingForm.doctorId, bookingForm.locationId, bookingForm.serviceId)
      .then(r => { if (r.data.date) setBookingForm(prev => ({ ...prev, date: r.data.date!, timeSlotId: '' })); });
  }, [bookingForm.doctorId, bookingForm.locationId, bookingForm.serviceId]);

  useEffect(() => {
    receptionApi.getAvailableDoctorsForDate(selectedDate).then(r => {
      setAvailableDoctorIds(r.data.doctorIds);
      setAvailableSpecialtyIds(r.data.specialtyIds);
    });
  }, [selectedDate]);

  useEffect(() => {
    if (!bookingForm.doctorId || !bookingForm.locationId || !bookingForm.serviceId) return;
    appointmentsApi.getFirstAvailableDate(
      bookingForm.doctorId, bookingForm.locationId, bookingForm.serviceId, bookingForm.date
    ).then(r => setHasMoreSlotsBooking(!!r.data.date && r.data.date > bookingForm.date))
    .catch(() => setHasMoreSlotsBooking(false));
  }, [bookingForm.date, bookingForm.doctorId, bookingForm.locationId, bookingForm.serviceId]);

  useEffect(() => {
    if (activeView === 'walkin') fetchWalkInPatients();
  }, [activeView, walkInPage, walkInSearch]);

  useEffect(() => {
    if (activeView === 'patients') fetchPatients();
  }, [activeView, patientsPage, patientsSearch, showInactivePatients]);

  useEffect(() => {
    if (activeView === 'walkin') fetchWalkInPatients();
  }, [activeView, walkInPage, walkInSearch, showInactiveWalkIn]);

  const handleCheckIn = async (id: string) => {
    setProcessingId(id);
    try { await receptionApi.checkIn(id); toast('Check-in confirmat', 'success');fetchAppointments(); }
    catch (err) { toast(getErrorMessage(err), 'error'); }
    finally { setProcessingId(null); }
  };

  const handlePayment = async () => {
    if (!paymentModal) return;
    setProcessingId(paymentModal);
    try { await receptionApi.processPayment(paymentModal, paymentMethod); toast('Plată procesată', 'success'); setPaymentModal(null); fetchAppointments(); }
    catch (err) { toast(getErrorMessage(err), 'error'); }
    finally { setProcessingId(null); }
  };

  const handleApproveReferral = async (id: string) => {
    try { await appointmentsApi.approveExternalReferral(id); toast('Referral aprobat', 'success'); fetchAppointments(); fetchPendingReferrals(); }
    catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  const handleRejectReferral = async (id: string) => {
    const reason = prompt('Motivul respingerii:');
    if (!reason) return;
    try { await appointmentsApi.rejectExternalReferral(id, reason); toast('ReferralRespins', 'success'); fetchAppointments(); fetchPendingReferrals(); }
    catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  const handleCancelAppointment = async (id: string) => {
    const reason = prompt('Motivul anulării:');
    if (!reason) return;
    setProcessingId(id);
    try { await appointmentsApi.cancelAppointment(id, reason); toast('Programare anulată', 'success'); fetchAppointments(); }
    catch (err) { toast(getErrorMessage(err), 'error'); }
    finally { setProcessingId(null); }
  };

  const handleCreateAppointment = async () => {
  try {
    const dto = bookingPatientType === 'account'
      ? { ...bookingForm }
      : {
          ...bookingForm,
          patientEmail: undefined,
          walkInCNP: selectedWalkIn?.cnp,
        };
    await receptionApi.createAppointmentForPatient(dto);
    
    toast('Programare creată cu succes', 'success');
    setShowBookingForm(false);
    setBookingForm({ patientEmail: '', doctorId: '', serviceId: '', locationId: '', timeSlotId: '', reason: '', date: new Date().toISOString().split('T')[0] });
    setSelectedWalkIn(null);
    setCnpSearch('');
    setCnpSearchResult(null);
    setBookingPatientType('account');
    fetchAppointments();
  } catch (err) {
    toast(getErrorMessage(err), 'error');
  }
};

const fetchWalkInPatients = async () => {
  setLoadingWalkIn(true);
  try {
    const response = await walkInApi.getAll(walkInSearch || undefined, walkInPage, 20, showInactiveWalkIn);
    setWalkInPatients(response.data);
  } catch (err) {
    toast(getErrorMessage(err), 'error');
  } finally {
    setLoadingWalkIn(false);
  }
};

const handleSearchCNP = async () => {
  if (!cnpSearch.trim()) return;
  try {
    const response = await walkInApi.getByCNP(cnpSearch);
    setCnpSearchResult(response.data);
    setSelectedWalkIn(response.data);
  } catch {
    setCnpSearchResult('not_found');
    setSelectedWalkIn(null);
  }
};

  const handleCreateWalkIn = async () => {
    if (!validateWalkInForm()) return;
    try {
      const response = await walkInApi.create(walkInForm);
      
      toast('Pacient creat cu succes', 'success');
      setShowWalkInForm(false);
      setWalkInFormErrors({});
      setWalkInForm({ firstName: '', lastName: '', cnp: '', phone: '', email: '', age: undefined, address: '', city: '' });
      fetchWalkInPatients();
      setSelectedWalkIn(response.data);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const handleUpdateWalkIn = async () => {
    if (!editingWalkIn || !validateWalkInForm()) return;
    try {
      await walkInApi.update(editingWalkIn.id, walkInForm);
      
      toast('Pacient actualizat', 'success');
      setEditingWalkIn(null);
      setWalkInFormErrors({});
      fetchWalkInPatients();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const handleValidateCard = async (cardId: string) => {
    try { await usersApi.validateInsuranceCard(cardId); toast('Card validat', 'success'); fetchInsuranceCards(); }
    catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  const handleInvalidateCard = async (cardId: string) => {
    const ok = await confirm({ title: 'Invalidare card CNAS', message: `Ești sigur că vrei să invalidezi acest card CNAS?`, confirmLabel: 'Invalidează', variant: 'danger' });
    if (!ok) return;
    try { await usersApi.invalidateInsuranceCard(cardId); toast('Card validat', 'success'); fetchInsuranceCards(); }
    catch (err) {  }
  };

  const formatTime = (t: string) => t.substring(0, 5);

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px', border: '0.5px solid var(--color-border-tertiary)',
    borderRadius: 'var(--border-radius-md)', fontSize: '13px',
    color: 'var(--color-text-primary)', background: 'var(--color-background-secondary)', cursor: 'pointer',
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    fontSize: '13px', color: 'white', background: color,
    border: 'none', padding: '7px 14px', borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer', transition: 'opacity 0.15s',
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Recepție</h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Gestionează sosirile, plățile și referral-urile</p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          scrollbarWidth: 'none' as any,
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}>
          {[
            { key: 'appointments', label: 'Programări', count: 0 },
            { key: 'referrals', label: 'Referral-uri', count: pendingReferrals?.totalCount ?? 0 },
            { key: 'insurance', label: 'Carduri CNAS', count: insuranceCards?.items.filter(c => !c.isVerified).length ?? 0 },
            { key: 'patients', label: 'Pacienți', count: 0 },
            { key: 'walkin', label: 'Pacienți Walk-in', count: 0 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as 'appointments' | 'referrals' | 'insurance' | 'walkin' | 'patients')}
              style={{
                padding: '8px 16px', fontSize: '14px', fontWeight: 500,
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeView === tab.key ? '2px solid #378ADD' : '2px solid transparent',
                color: activeView === tab.key ? '#378ADD' : 'var(--color-text-secondary)',
                transition: 'color 0.15s',
                display: 'flex', alignItems: 'center', gap: '6px',
                whiteSpace: 'nowrap', flexShrink: 0,
                paddingBottom: '9px',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{ background: '#F97316', color: 'white', fontSize: '11px', borderRadius: '99px', padding: '1px 6px' }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

      </div>

      {/* Mesaje */}
      {error && (
        <div style={{ background: 'var(--color-background-danger)', color: 'var(--color-text-danger)', padding: '10px 16px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '12px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'var(--color-background-success)', color: 'var(--color-text-success)', padding: '10px 16px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '12px' }}>
          {success}
        </div>
      )}

      {/* TAB: Programări */}
      {activeView === 'appointments' && (
        <>
          {/* Formular programare */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowBookingForm(!showBookingForm)} style={{ ...btnStyle('#378ADD'), padding: '8px 16px' }}>
              + Programare nouă
            </button>
          </div>

          {showBookingForm && (
            <div style={{ background: 'white', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '24px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Programare nouă</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Tip pacient', content: (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setBookingPatientType('account'); setSelectedWalkIn(null); setPatientSearchResult(null); }}
                        style={{ flex: 1, padding: '8px', fontSize: '13px', border: bookingPatientType === 'account' ? '1.5px solid #378ADD' : '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', background: bookingPatientType === 'account' ? '#E6F1FB' : 'white', color: bookingPatientType === 'account' ? '#185FA5' : 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        Cu cont
                      </button>
                      <button onClick={() => { setBookingPatientType('walkin'); setBookingForm(prev => ({ ...prev, patientEmail: '' })); setPatientSearchResult(null); }}
                        style={{ flex: 1, padding: '8px', fontSize: '13px', border: bookingPatientType === 'walkin' ? '1.5px solid #378ADD' : '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', background: bookingPatientType === 'walkin' ? '#E6F1FB' : 'white', color: bookingPatientType === 'walkin' ? '#185FA5' : 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        Walk-in
                      </button>
                    </div>
                  )},
                  { label: bookingPatientType === 'account' ? 'Email pacient' : 'Caută după CNP', content: (
                    bookingPatientType === 'account' ? (
                      <div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="email" value={bookingForm.patientEmail}
                            onChange={e => { setBookingForm({ ...bookingForm, patientEmail: e.target.value }); setPatientSearchResult(null); }}
                            placeholder="pacient@email.com" style={{ ...selectStyle, flex: 1 }}
                            onKeyDown={e => { if (e.key === 'Enter') handleSearchPatient(); }} />
                          <button onClick={handleSearchPatient} disabled={searchingPatient || !bookingForm.patientEmail.trim()}
                            style={{ ...btnStyle('#378ADD'), opacity: (!bookingForm.patientEmail.trim() || searchingPatient) ? 0.5 : 1 }}>
                            {searchingPatient ? '...' : 'Caută'}
                          </button>
                        </div>
                        {patientSearchResult === 'not_found' && (
                          <p style={{ fontSize: '12px', color: 'var(--color-text-danger)', marginTop: '6px' }}>
                            <i className="ti ti-x" style={{ fontSize: '12px' }} /> Pacientul nu a fost găsit
                          </p>
                        )}
                        {patientSearchResult && patientSearchResult !== 'not_found' && (
                          <div style={{ marginTop: '6px', padding: '8px 12px', background: patientSearchResult.emailVerified ? '#EAF3DE' : '#FFFBEB', borderRadius: 'var(--border-radius-md)', fontSize: '12px', color: patientSearchResult.emailVerified ? '#3B6D11' : '#92400E' }}>
                            <i className={`ti ${patientSearchResult.emailVerified ? 'ti-check' : 'ti-alert-triangle'}`} style={{ marginRight: '4px' }} />
                            {patientSearchResult.firstName} {patientSearchResult.lastName}
                            {!patientSearchResult.emailVerified && ' — email neverificat, programarea se poate face totuși'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="text" value={cnpSearch} onChange={e => setCnpSearch(e.target.value)}
                            placeholder="Introdu CNP..." style={{ ...selectStyle, flex: 1 }} />
                          <button onClick={handleSearchCNP} style={{ ...btnStyle('#378ADD'), padding: '8px 12px' }}>Caută</button>
                        </div>
                        {cnpSearchResult === 'not_found' && (
                          <div style={{ marginTop: '8px' }}>
                            <p style={{ fontSize: '12px', color: 'var(--color-text-danger)', marginBottom: '6px' }}>
                              Pacientul nu există. Creează-l:
                            </p>
                            <button onClick={() => { setShowWalkInForm(true); setWalkInForm(prev => ({ ...prev, cnp: cnpSearch })); }}
                              style={{ ...btnStyle('#378ADD'), fontSize: '12px', padding: '6px 12px' }}>
                              + Pacient nou
                            </button>
                          </div>
                        )}
                        {cnpSearchResult && cnpSearchResult !== 'not_found' && (
                          <div style={{ marginTop: '8px', padding: '8px 12px', background: '#EAF3DE', borderRadius: 'var(--border-radius-md)', fontSize: '12px', color: '#3B6D11' }}>
                            <i className="ti ti-check" style={{ marginRight: '4px' }} />
                            {cnpSearchResult.firstName} {cnpSearchResult.lastName} · {cnpSearchResult.phone}
                          </div>
                        )}
                      </div>
                    )
                  )},
                  { label: 'Specialitate', content: (
                    <select value={bookingSpecialtyFilter} onChange={e => setBookingSpecialtyFilter(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                      <option value="">Toate specialitățile</option>
                      {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )},
                  { label: 'Doctor', content: (
                    <select value={bookingForm.doctorId} onChange={e => setBookingForm({ ...bookingForm, doctorId: e.target.value, serviceId: '', timeSlotId: '' })} style={{ ...selectStyle, width: '100%' }}>
                      <option value="">Selectează...</option>
                      {filteredBookingDoctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} — {d.specialtyName}</option>)}
                    </select>
                  )},
                  { label: 'Serviciu', content: (
                    <select value={bookingForm.serviceId} onChange={e => setBookingForm({ ...bookingForm, serviceId: e.target.value })} disabled={!bookingForm.doctorId} style={{ ...selectStyle, width: '100%' }}>
                      <option value="">Selectează...</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name} — {s.price} lei</option>)}
                    </select>
                  )},
                  { label: 'Locație', content: (
                    <select value={bookingForm.locationId} onChange={e => setBookingForm({ ...bookingForm, locationId: e.target.value, timeSlotId: '' })} disabled={filteredBookingLocations.length === 1} style={{ ...selectStyle, width: '100%' }}>
                      <option value="">Selectează...</option>
                      {filteredBookingLocations.map(l => <option key={l.id} value={l.id}>{l.name} — {l.city}</option>)}
                    </select>
                  )},
                  { label: 'Data', content: (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="date" value={bookingForm.date} min={new Date().toISOString().split('T')[0]}
                        onChange={e => setBookingForm({ ...bookingForm, date: e.target.value, timeSlotId: '' })}
                        style={{ ...selectStyle, flex: 1 }} />
                      {bookingForm.doctorId && bookingForm.locationId && bookingForm.serviceId && hasMoreSlotsBooking && (
                        <button onClick={handleNextAvailableBooking} disabled={findingNextBooking}
                          style={{ padding: '8px 10px', fontSize: '12px', color: '#378ADD', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', background: 'white', cursor: 'pointer', opacity: findingNextBooking ? 0.6 : 1, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          <i className="ti ti-calendar-forward" style={{ fontSize: '13px' }} />
                          {findingNextBooking ? '...' : 'Următoarea'}
                        </button>
                      )}
                    </div>
                  )},
                  { label: 'Oră', content: (
                    <select value={bookingForm.timeSlotId} onChange={e => setBookingForm({ ...bookingForm, timeSlotId: e.target.value })} disabled={!bookingForm.doctorId || !bookingForm.locationId} style={{ ...selectStyle, width: '100%' }}>
                      <option value="">Selectează...</option>
                      {slots.map(s => <option key={s.id} value={s.id}>{s.startTime.substring(0, 5)} - {s.endTime.substring(0, 5)}</option>)}
                    </select>
                  )},
                ].map(({ label, content }) => (
                  <div key={label}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>{label}</label>
                    {content}
                  </div>
                ))}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Motiv (opțional)</label>
                  <input type="text" value={bookingForm.reason} onChange={e => setBookingForm({ ...bookingForm, reason: e.target.value })}
                    placeholder="Motivul vizitei..." style={{ ...selectStyle, width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={handleCreateAppointment}
                  disabled={!bookingForm.doctorId || !bookingForm.serviceId || !bookingForm.locationId || !bookingForm.timeSlotId || (bookingPatientType === 'account' ? !bookingForm.patientEmail : !selectedWalkIn)}
                  style={{ ...btnStyle('#378ADD'), opacity: (!bookingForm.doctorId || !bookingForm.serviceId || !bookingForm.locationId || !bookingForm.timeSlotId || (bookingPatientType === 'account' ? !bookingForm.patientEmail : !selectedWalkIn)) ? 0.5 : 1 }}>
                  Creează programare
                </button>
                <button onClick={() => setShowBookingForm(false)} style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  Anulează
                </button>
              </div>
            </div>
          )}

          {/* Filtre */}
          <div style={{ background: 'white', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setPage(1); }} style={selectStyle} />
            <select value={locationFilter} onChange={e => { setLocationFilter(e.target.value); setPage(1); }} style={selectStyle}>
              <option value="">Toate locațiile</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select value={specialtyFilter} onChange={e => { setSpecialtyFilter(e.target.value); setDoctorFilter(''); setPage(1); }} style={selectStyle}>
              <option value="">Toate specialitățile</option>
              {specialties.sort((a, b) => {
                const aA = availableSpecialtyIds.includes(a.id), bA = availableSpecialtyIds.includes(b.id);
                return aA === bA ? a.name.localeCompare(b.name) : aA ? -1 : 1;
              }).map(s => (
                <option key={s.id} value={s.id} disabled={!availableSpecialtyIds.includes(s.id)}>
                  {s.name}{!availableSpecialtyIds.includes(s.id) ? ' (indisponibil)' : ''}
                </option>
              ))}
            </select>
            <select value={doctorFilter} onChange={e => { setDoctorFilter(e.target.value); setPage(1); }} style={selectStyle}>
              <option value="">Toți doctorii</option>
              {doctors.filter(d => !specialtyFilter || d.specialtyId === specialtyFilter)
                .sort((a, b) => {
                  const aA = availableDoctorIds.includes(a.id), bA = availableDoctorIds.includes(b.id);
                  return aA === bA ? `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`) : aA ? -1 : 1;
                }).map(d => (
                  <option key={d.id} value={d.id} disabled={!availableDoctorIds.includes(d.id)}>
                    Dr. {d.firstName} {d.lastName}{!availableDoctorIds.includes(d.id) ? ' (indisponibil)' : ''}
                  </option>
                ))}
            </select>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
              <option value="">Toate statusurile</option>
              <option value="confirmed">Confirmate</option>
              <option value="pending_referral_verification">Referral în așteptare</option>
              <option value="completed">Finalizate</option>
              <option value="cancelled">Anulate</option>
            </select>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--color-text-tertiary)' }} />
              <input type="text" placeholder="Caută pacient..." value={searchName}
                onChange={e => { setSearchName(e.target.value); setPage(1); }}
                style={{ ...selectStyle, paddingLeft: '30px' }} />
            </div>
            <input type="time" value={fromTime} onChange={e => { setFromTime(e.target.value); setPage(1); }} style={selectStyle} />
            <input type="time" value={toTime} onChange={e => { setToTime(e.target.value); setPage(1); }} style={selectStyle} />
            {(locationFilter || searchName || fromTime || toTime || statusFilter || doctorFilter || specialtyFilter) && (
              <button onClick={() => { setLocationFilter(''); setSearchName(''); setFromTime(''); setToTime(''); setStatusFilter(''); setDoctorFilter(''); setSpecialtyFilter(''); setPage(1); }}
                style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="ti ti-x" style={{ fontSize: '13px' }} /> Resetează
              </button>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Total programări', value: data?.totalCount ?? 0, color: 'var(--color-text-primary)' },
              { label: 'Check-in făcut', value: data?.items.filter(a => a.checkedInAt).length ?? 0, color: '#16a34a' },
              { label: 'Plăți procesate', value: data?.items.filter(a => a.paymentStatus === 'paid').length ?? 0, color: '#185FA5' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'white', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{stat.label}</p>
                <p style={{ fontSize: '24px', fontWeight: 500, color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Lista programări */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-tertiary)' }}>Se încarcă...</div>
          ) : data?.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-tertiary)' }}>Nu există programări</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data?.items.map(appointment => {
                const sc = statusColors[appointment.status] ?? { bg: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' };
                return (
                  <div key={appointment.id} style={{ background: 'white', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{appointment.patientName}</p>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: sc.bg, color: sc.color, fontWeight: 500 }}>
                            {statusLabels[appointment.status] ?? appointment.status}
                          </span>
                          {appointment.isWalkIn && (
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#FAEEDA', color: '#854F0B', fontWeight: 500 }}>Walk-in</span>
                          )}
                          {appointment.checkedInAt && (
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#EEEDFE', color: '#534AB7', fontWeight: 500 }}>✓ Check-in</span>
                          )}
                          {appointment.paymentStatus === 'paid' && (
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#EAF3DE', color: '#3B6D11', fontWeight: 500 }}>✓ Plătit</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          {appointment.patientEmail && appointment.patientEmail !== '-' && (
                            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                              <i className="ti ti-mail" style={{ fontSize: '12px', marginRight: '4px' }} />
                              {appointment.patientEmail}
                            </p>
                          )}
                          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            <i className="ti ti-stethoscope" style={{ fontSize: '12px', marginRight: '4px' }} />
                            {appointment.serviceName}
                          </p>
                          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            <i className="ti ti-map-pin" style={{ fontSize: '12px', marginRight: '4px' }} />
                            {appointment.locationName}
                          </p>
                          {appointment.doctorName && (
                            <p style={{ fontSize: '13px', color: '#378ADD' }}>
                              <i className="ti ti-user" style={{ fontSize: '12px', marginRight: '4px' }} />
                              {appointment.doctorName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{appointment.pricePaid} lei</p>
                      </div>
                    </div>

                    <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {appointment.status === 'confirmed' && !appointment.checkedInAt && (
                        <button onClick={() => handleCheckIn(appointment.id)} disabled={processingId === appointment.id}
                          title="Check-in"
                          style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#EEEDFE', color: '#534AB7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: processingId === appointment.id ? 0.5 : 1 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = processingId === appointment.id ? '0.5' : '1'}
                        >
                          <i className="ti ti-login" style={{ fontSize: '15px' }} />
                        </button>
                      )}
                      {appointment.status === 'completed' && appointment.paymentStatus !== 'paid' && (
                        <button onClick={() => setPaymentModal(appointment.id)}
                          title="Procesează plata"
                          style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#EAF3DE', color: '#3B6D11', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <i className="ti ti-cash" style={{ fontSize: '15px' }} />
                        </button>
                      )}
                      {appointment.status === 'pending_referral_verification' && (
                        <>
                          {appointment.externalReferralUrl && (
                            <a href={`http://localhost:5289${appointment.externalReferralUrl}`} target="_blank" rel="noopener noreferrer"
                              title="Previzualizează referral"
                              style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#E6F1FB', color: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                              <i className="ti ti-eye" style={{ fontSize: '15px' }} />
                            </a>
                          )}
                          <button onClick={() => handleApproveReferral(appointment.id)}
                            title="Aprobă referral"
                            style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#EAF3DE', color: '#3B6D11', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >
                            <i className="ti ti-check" style={{ fontSize: '15px' }} />
                          </button>
                          <button onClick={() => handleRejectReferral(appointment.id)}
                            title="Respinge referral"
                            style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#FCEBEB', color: '#A32D2D', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >
                            <i className="ti ti-x" style={{ fontSize: '15px' }} />
                          </button>
                        </>
                      )}
                      {(appointment.status === 'confirmed' || appointment.status === 'pending_referral_verification') && (
                        <button onClick={() => handleCancelAppointment(appointment.id)} disabled={processingId === appointment.id}
                          title="Anulează"
                          style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#FCEBEB', color: '#A32D2D', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: processingId === appointment.id ? 0.5 : 1 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = processingId === appointment.id ? '0.5' : '1'}
                        >
                          <i className="ti ti-ban" style={{ fontSize: '15px' }} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => setPage(page - 1)} disabled={!data.hasPreviousPage}
                style={{ padding: '8px 16px', fontSize: '13px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', background: 'white', cursor: data.hasPreviousPage ? 'pointer' : 'not-allowed', opacity: data.hasPreviousPage ? 1 : 0.5 }}>
                Anterior
              </button>
              <span style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{page} / {data.totalPages}</span>
              <button onClick={() => setPage(page + 1)} disabled={!data.hasNextPage}
                style={{ padding: '8px 16px', fontSize: '13px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', background: 'white', cursor: data.hasNextPage ? 'pointer' : 'not-allowed', opacity: data.hasNextPage ? 1 : 0.5 }}>
                Următor
              </button>
            </div>
          )}
        </>
      )}

      {/* TAB: Referral-uri */}
      {activeView === 'referrals' && (
        <div>
          {loadingReferrals ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-tertiary)' }}>Se încarcă...</div>
          ) : pendingReferrals?.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-tertiary)' }}>Nu există referral-uri de verificat</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pendingReferrals?.items.map(appointment => (
                  <div key={appointment.id} style={{
                    background: 'white',
                    border: '0.5px solid #FED7AA',
                    borderRadius: 'var(--border-radius-lg)',
                    padding: '16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            {appointment.patientName}
                          </p>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#FFF7ED', color: '#C2410C', fontWeight: 500 }}>
                            Referral în așteptare
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          {appointment.patientEmail && (
                            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                              <i className="ti ti-mail" style={{ fontSize: '12px', marginRight: '4px' }} />
                              {appointment.patientEmail}
                            </p>
                          )}
                          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            <i className="ti ti-stethoscope" style={{ fontSize: '12px', marginRight: '4px' }} />
                            {appointment.serviceName}
                          </p>
                          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            <i className="ti ti-map-pin" style={{ fontSize: '12px', marginRight: '4px' }} />
                            {appointment.locationName}
                          </p>
                          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            <i className="ti ti-calendar" style={{ fontSize: '12px', marginRight: '4px' }} />
                            {appointment.slotDate.toString()} · {formatTime(appointment.startTime)}
                          </p>
                        </div>
                      </div>

                      {/* Butoane */}
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0, marginLeft: '16px' }}>
                        {appointment.externalReferralUrl && (
                          <a
                            href={`http://localhost:5289${appointment.externalReferralUrl}`}
                            target="_blank" rel="noopener noreferrer"
                            title="Previzualizează referral"
                            style={{
                              width: '30px', height: '30px',
                              borderRadius: 'var(--border-radius-md)',
                              background: '#E6F1FB', color: '#185FA5',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              textDecoration: 'none',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >
                            <i className="ti ti-eye" style={{ fontSize: '15px' }} />
                          </a>
                        )}
                        <button
                          onClick={() => handleApproveReferral(appointment.id)}
                          title="Aprobă"
                          style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#EAF3DE', color: '#3B6D11', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <i className="ti ti-check" style={{ fontSize: '15px' }} />
                        </button>
                        <button
                          onClick={() => handleRejectReferral(appointment.id)}
                          title="Respinge"
                          style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#FCEBEB', color: '#A32D2D', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <i className="ti ti-x" style={{ fontSize: '15px' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pendingReferrals && pendingReferrals.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                  <button onClick={() => setReferralPage(referralPage - 1)} disabled={!pendingReferrals.hasPreviousPage}
                    style={{ padding: '8px 16px', fontSize: '13px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', background: 'white', cursor: 'pointer', opacity: pendingReferrals.hasPreviousPage ? 1 : 0.5 }}>
                    Anterior
                  </button>
                  <span style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {referralPage} / {pendingReferrals.totalPages}
                  </span>
                  <button onClick={() => setReferralPage(referralPage + 1)} disabled={!pendingReferrals.hasNextPage}
                    style={{ padding: '8px 16px', fontSize: '13px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', background: 'white', cursor: 'pointer', opacity: pendingReferrals.hasNextPage ? 1 : 0.5 }}>
                    Următor
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB: Carduri CNAS */}
      {activeView === 'insurance' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--color-text-tertiary)' }} />
              <input type="text" placeholder="Caută după numele pacientului..." value={insuranceSearch}
                onChange={e => { setInsuranceSearch(e.target.value); setInsurancePage(1); }}
                style={{ ...selectStyle, paddingLeft: '32px', width: '280px' }} />
            </div>
          </div>

          {loadingInsurance ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-tertiary)' }}>Se încarcă...</div>
          ) : insuranceCards?.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-tertiary)' }}>Nu există carduri</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {insuranceCards?.items.map(card => (
                  <div key={card.cardId} style={{
                    background: 'white',
                    border: `0.5px solid ${!card.isVerified ? '#FED7AA' : 'var(--color-border-tertiary)'}`,
                    borderRadius: 'var(--border-radius-lg)',
                    padding: '16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{card.patientName}</p>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: card.isVerified ? '#EAF3DE' : '#FFF7ED', color: card.isVerified ? '#3B6D11' : '#C2410C', fontWeight: 500 }}>
                            {card.isVerified ? 'Verificat' : 'Neverificat'}
                          </span>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: card.isValid ? '#E6F1FB' : '#FCEBEB', color: card.isValid ? '#185FA5' : '#A32D2D', fontWeight: 500 }}>
                            {card.isValid ? 'Valid' : 'Expirat'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            <i className="ti ti-mail" style={{ fontSize: '12px', marginRight: '4px' }} />
                            {card.patientEmail}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            Titular: {card.firstName} {card.lastName}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            Cod asigurat: {card.insuredCode}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            Nr. document: {card.documentNumber}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            Expiră: {card.expiryDate}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0, marginLeft: '16px' }}>
                        {!card.isVerified && card.isValid && (
                          <button
                            onClick={() => handleValidateCard(card.cardId)}
                            title="Validează"
                            style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#EAF3DE', color: '#3B6D11', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >
                            <i className="ti ti-check" style={{ fontSize: '15px' }} />
                          </button>
                        )}
                        {card.isVerified && (
                          <button
                            onClick={() => handleInvalidateCard(card.cardId)}
                            title="Invalidează"
                            style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#FCEBEB', color: '#A32D2D', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >
                            <i className="ti ti-ban" style={{ fontSize: '15px' }} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {insuranceCards && insuranceCards.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                  <button onClick={() => setInsurancePage(insurancePage - 1)} disabled={!insuranceCards.hasPreviousPage}
                    style={{ padding: '8px 16px', fontSize: '13px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', background: 'white', cursor: 'pointer', opacity: insuranceCards.hasPreviousPage ? 1 : 0.5 }}>
                    Anterior
                  </button>
                  <span style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{insurancePage} / {insuranceCards.totalPages}</span>
                  <button onClick={() => setInsurancePage(insurancePage + 1)} disabled={!insuranceCards.hasNextPage}
                    style={{ padding: '8px 16px', fontSize: '13px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', background: 'white', cursor: 'pointer', opacity: insuranceCards.hasNextPage ? 1 : 0.5 }}>
                    Următor
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeView === 'patients' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
              {patients?.totalCount ?? 0} pacienți
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={showInactivePatients} onChange={e => { setShowInactivePatients(e.target.checked); setPatientsPage(1); }} />
                Arată inactivi
              </label>
              <button onClick={() => { setShowPatientForm(true); setEditingPatient(null); setPatientFormErrors({}); setPatientForm({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', county: '', cnp: '' }); }} style={btnStyle('#378ADD')}>
                + Pacient nou
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--color-text-tertiary)' }} />
              <input type="text" placeholder="Caută după nume, email, telefon..." value={patientsSearch}
                onChange={e => { setPatientsSearch(e.target.value); setPatientsPage(1); }}
                style={{ ...selectStyle, paddingLeft: '32px', width: '300px' }} />
            </div>
          </div>

          {showPatientForm && (
            <div style={{ background: 'white', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '20px', marginBottom: '16px' }}>
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                {editingPatient ? 'Editează pacient' : 'Pacient nou'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                { key: 'firstName', label: 'Prenume', type: 'text' },
                { key: 'lastName', label: 'Nume', type: 'text' },
                { key: 'email', label: 'Email', type: 'email', disabled: !!editingPatient },
                { key: 'cnp', label: 'CNP (opțional)', type: 'text', disabled: !!editingPatient },
                { key: 'phone', label: 'Telefon (opțional)', type: 'tel' },
                { key: 'address', label: 'Adresă (opțional)', type: 'text' },
                { key: 'city', label: 'Oraș (opțional)', type: 'text' },
                { key: 'county', label: 'Județ (opțional)', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '5px' }}>{f.label}</label>
                  <input type={f.type}
                    value={String(patientForm[f.key as keyof CreatePatientDto] ?? '')}
                    onChange={e => {
                      setPatientForm({ ...patientForm, [f.key]: e.target.value });
                      if (patientFormErrors[f.key]) setPatientFormErrors({ ...patientFormErrors, [f.key]: '' });
                    }}
                    disabled={f.disabled}
                    style={{
                      ...selectStyle, width: '100%',
                      opacity: f.disabled ? 0.6 : 1,
                      borderColor: patientFormErrors[f.key] ? '#E24B4A' : 'var(--color-border-tertiary)',
                    }} />
                  {patientFormErrors[f.key] && (
                    <p style={{ fontSize: '11px', color: '#E24B4A', marginTop: '3px' }}>{patientFormErrors[f.key]}</p>
                  )}
                </div>
              ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={editingPatient ? handleUpdatePatient : handleCreatePatient}
                  disabled={!patientForm.firstName || !patientForm.lastName || (!editingPatient && !patientForm.email)}
                  style={{ ...btnStyle('#378ADD'), opacity: (!patientForm.firstName || !patientForm.lastName || (!editingPatient && !patientForm.email)) ? 0.5 : 1 }}
                >
                  {editingPatient ? 'Salvează' : 'Creează'}
                </button>
                <button onClick={() => { setShowPatientForm(false); setEditingPatient(null); }} style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  Anulează
                </button>
              </div>
            </div>
          )}

          {loadingPatients ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-tertiary)' }}>Se încarcă...</div>
          ) : patients?.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-tertiary)' }}>Nu există pacienți</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {patients?.items.map(patient => (
                  <div key={patient.id} style={{
                    background: 'white',
                    border: `0.5px solid ${!patient.isActive ? '#F09595' : 'var(--color-border-tertiary)'}`,
                    borderRadius: 'var(--border-radius-lg)',
                    padding: '16px',
                    opacity: !patient.isActive ? 0.7 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Info pacient */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            {patient.firstName} {patient.lastName}
                          </p>
                          {!patient.isActive && (
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#FCEBEB', color: '#A32D2D', fontWeight: 500 }}>Inactiv</span>
                          )}
                          {patient.emailVerified
                            ? <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#EAF3DE', color: '#3B6D11', fontWeight: 500 }}>Email verificat</span>
                            : <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#FFFBEB', color: '#92400E', fontWeight: 500 }}>Email neverificat</span>
                          }
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            <i className="ti ti-mail" style={{ fontSize: '12px', marginRight: '4px' }} />
                            {patient.email}
                          </p>
                          {patient.phone && (
                            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                              <i className="ti ti-phone" style={{ fontSize: '12px', marginRight: '4px' }} />
                              {patient.phone}
                            </p>
                          )}
                          {patient.cnp && (
                            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                              <i className="ti ti-id" style={{ fontSize: '12px', marginRight: '4px' }} />
                              CNP: {patient.cnp}
                            </p>
                          )}
                          {patient.city && (
                            <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                              <i className="ti ti-map-pin" style={{ fontSize: '12px', marginRight: '4px' }} />
                              {patient.city}{patient.county ? `, ${patient.county}` : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Butoane */}
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0, marginLeft: '16px' }}>
                      {/* Retrimite verificare — doar daca email neverificat si activ */}
                        {patient.isActive && !patient.emailVerified && (
                          <button
                            onClick={() => handleResendVerification(patient.id)}
                            disabled={!!resendCooldowns[patient.id]}
                            title={resendCooldowns[patient.id] ? `Retrimite în ${resendCooldowns[patient.id]}s` : 'Retrimite email verificare'}
                            style={{
                              width: '30px', height: '30px',
                              borderRadius: 'var(--border-radius-md)',
                              background: resendCooldowns[patient.id] ? 'var(--color-background-secondary)' : '#FFFBEB',
                              color: resendCooldowns[patient.id] ? 'var(--color-text-tertiary)' : '#92400E',
                              border: 'none', cursor: resendCooldowns[patient.id] ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: resendCooldowns[patient.id] ? 0.6 : 1,
                              position: 'relative',
                            }}
                            onMouseEnter={e => { if (!resendCooldowns[patient.id]) e.currentTarget.style.opacity = '0.75'; }}
                            onMouseLeave={e => { if (!resendCooldowns[patient.id]) e.currentTarget.style.opacity = '1'; }}
                          >
                            <i className="ti ti-mail-forward" style={{ fontSize: '15px' }} />
                          </button>
                        )}

                        {/* Programare pacient */}
                        {patient.isActive && (
                          <button
                            onClick={() => {
                              setBookingPatientType('account');
                              setBookingForm(prev => ({ ...prev, patientEmail: patient.email }));
                              setPatientSearchResult({
                                firstName: patient.firstName,
                                lastName: patient.lastName,
                                email: patient.email,
                                emailVerified: patient.emailVerified,
                              });
                              setShowBookingForm(true);
                              setActiveView('appointments');
                            }}
                            title="Programează"
                            style={{
                              width: '30px', height: '30px',
                              borderRadius: 'var(--border-radius-md)',
                              background: '#E6F1FB', color: '#185FA5',
                              border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >
                            <i className="ti ti-calendar-plus" style={{ fontSize: '15px' }} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingPatient(patient);
                            setShowPatientForm(true);
                            setPatientForm({
                              firstName: patient.firstName,
                              lastName: patient.lastName,
                              email: patient.email,
                              phone: patient.phone ?? '',
                              address: patient.address ?? '',
                              city: patient.city ?? '',
                              county: patient.county ?? '',
                              cnp: patient.cnp ?? '',
                            });
                          }}
                          title="Editează"
                          style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#FAEEDA', color: '#854F0B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <i className="ti ti-pencil" style={{ fontSize: '15px' }} />
                        </button>
                        {patient.isActive ? (
                          <button
                            onClick={() => handleDeactivatePatient(patient.id)}
                            title="Dezactivează"
                            style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#FCEBEB', color: '#A32D2D', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >
                            <i className="ti ti-ban" style={{ fontSize: '15px' }} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivatePatient(patient.id)}
                            title="Reactivează"
                            style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#EAF3DE', color: '#3B6D11', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >
                            <i className="ti ti-check" style={{ fontSize: '15px' }} />
                          </button>
                        )}
                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {patients && patients.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                  <button onClick={() => setPatientsPage(patientsPage - 1)} disabled={patientsPage === 1}
                    style={{ padding: '8px 16px', fontSize: '13px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', background: 'white', cursor: 'pointer', opacity: patientsPage === 1 ? 0.5 : 1 }}>
                    Anterior
                  </button>
                  <span style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {patientsPage} / {patients.totalPages}
                  </span>
                  <button onClick={() => setPatientsPage(patientsPage + 1)} disabled={patientsPage === patients.totalPages}
                    style={{ padding: '8px 16px', fontSize: '13px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', background: 'white', cursor: 'pointer', opacity: patientsPage === patients.totalPages ? 0.5 : 1 }}>
                    Următor
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeView === 'walkin' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
              {walkInPatients?.totalCount ?? 0} pacienți walk-in
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={showInactiveWalkIn} onChange={e => { setShowInactiveWalkIn(e.target.checked); setWalkInPage(1); }} />
                Arată inactivi
              </label>
              <button onClick={() => { setShowWalkInForm(true); setEditingWalkIn(null); setWalkInFormErrors({}); setWalkInForm({ firstName: '', lastName: '', cnp: '', phone: '', email: '', age: undefined, address: '', city: '' }); }} style={btnStyle('#378ADD')}>
                + Pacient nou
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--color-text-tertiary)' }} />
              <input type="text" placeholder="Caută după nume, CNP, telefon..." value={walkInSearch}
                onChange={e => { setWalkInSearch(e.target.value); setWalkInPage(1); }}
                style={{ ...selectStyle, paddingLeft: '32px', width: '300px' }} />
            </div>
          </div>

          {showWalkInForm && (
            <div style={{ background: 'white', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '20px', marginBottom: '16px' }}>
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                {editingWalkIn ? 'Editează pacient' : 'Pacient nou'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                { key: 'firstName', label: 'Prenume', type: 'text' },
                { key: 'lastName', label: 'Nume', type: 'text' },
                { key: 'cnp', label: 'CNP', type: 'text' },
                { key: 'phone', label: 'Telefon', type: 'tel' },
                { key: 'email', label: 'Email (opțional)', type: 'email' },
                { key: 'age', label: 'Vârstă (opțional)', type: 'number' },
                { key: 'address', label: 'Adresă (opțional)', type: 'text' },
                { key: 'city', label: 'Oraș (opțional)', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '5px' }}>{f.label}</label>
                  <input type={f.type}
                    value={String(walkInForm[f.key as keyof CreateWalkInPatientDto] ?? '')}
                    onChange={e => {
                      setWalkInForm({ ...walkInForm, [f.key]: f.type === 'number' ? Number(e.target.value) || undefined : e.target.value });
                      if (walkInFormErrors[f.key]) setWalkInFormErrors({ ...walkInFormErrors, [f.key]: '' });
                    }}
                    style={{
                      ...selectStyle, width: '100%',
                      borderColor: walkInFormErrors[f.key] ? '#E24B4A' : 'var(--color-border-tertiary)',
                    }} />
                  {walkInFormErrors[f.key] && (
                    <p style={{ fontSize: '11px', color: '#E24B4A', marginTop: '3px' }}>{walkInFormErrors[f.key]}</p>
                  )}
                </div>
              ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={editingWalkIn ? handleUpdateWalkIn : handleCreateWalkIn}
                  disabled={!walkInForm.firstName || !walkInForm.lastName || !walkInForm.cnp || !walkInForm.phone}
                  style={{ ...btnStyle('#378ADD'), opacity: (!walkInForm.firstName || !walkInForm.lastName || !walkInForm.cnp || !walkInForm.phone) ? 0.5 : 1 }}
                >
                  {editingWalkIn ? 'Salvează' : 'Creează'}
                </button>
                <button onClick={() => { setShowWalkInForm(false); setEditingWalkIn(null); }} style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  Anulează
                </button>
              </div>
            </div>
          )}

          {loadingWalkIn ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-tertiary)' }}>Se încarcă...</div>
          ) : walkInPatients?.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-tertiary)' }}>Nu există pacienți walk-in</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {walkInPatients?.items.map(patient => (
                  <div key={patient.id} style={{
                    background: 'white',
                    border: `0.5px solid ${!patient.isActive ? '#F09595' : 'var(--color-border-tertiary)'}`,
                    borderRadius: 'var(--border-radius-lg)',
                    padding: '16px',
                    opacity: !patient.isActive ? 0.7 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Info pacient */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            {patient.firstName} {patient.lastName}
                          </p>
                          {!patient.isActive && (
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#FCEBEB', color: '#A32D2D', fontWeight: 500 }}>
                              Inactiv
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            <i className="ti ti-id" style={{ fontSize: '12px', marginRight: '4px' }} />
                            CNP: {patient.cnp}
                          </p>
                          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            <i className="ti ti-phone" style={{ fontSize: '12px', marginRight: '4px' }} />
                            {patient.phone}
                          </p>
                          {patient.email && (
                            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                              <i className="ti ti-mail" style={{ fontSize: '12px', marginRight: '4px' }} />
                              {patient.email}
                            </p>
                          )}
                          {patient.city && (
                            <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                              <i className="ti ti-map-pin" style={{ fontSize: '12px', marginRight: '4px' }} />
                              {patient.city}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Butoane */}
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0, marginLeft: '16px' }}>
                        <button
                          onClick={() => { setEditingWalkIn(patient); setShowWalkInForm(true); setWalkInForm({ firstName: patient.firstName, lastName: patient.lastName, cnp: patient.cnp, phone: patient.phone, email: patient.email ?? '', age: patient.age, address: patient.address ?? '', city: patient.city ?? '' }); }}
                          title="Editează"
                          style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#FAEEDA', color: '#854F0B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <i className="ti ti-pencil" style={{ fontSize: '15px' }} />
                        </button>
                        <button
                          onClick={() => {
                            setBookingPatientType('walkin');
                            setSelectedWalkIn(patient);
                            setCnpSearch(patient.cnp);
                            setCnpSearchResult(patient);
                            setShowBookingForm(true);
                            setActiveView('appointments');
                          }}
                          title="Programează"
                          style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#E6F1FB', color: '#185FA5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <i className="ti ti-calendar-plus" style={{ fontSize: '15px' }} />
                        </button>
                        <button
                          onClick={() => handleMigrateWalkIn(patient)}
                          title={patient.email ? 'Migrează la cont' : 'Adaugă email pentru migrare'}
                          style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: patient.email ? '#EEEDFE' : 'var(--color-background-secondary)', color: patient.email ? '#534AB7' : 'var(--color-text-tertiary)', border: 'none', cursor: patient.email ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: patient.email ? 1 : 0.4 }}
                          onMouseEnter={e => { if (patient.email) e.currentTarget.style.opacity = '0.75'; }}
                          onMouseLeave={e => { if (patient.email) e.currentTarget.style.opacity = '1'; }}
                        >
                          <i className="ti ti-user-plus" style={{ fontSize: '15px' }} />
                        </button>
                        {patient.isActive ? (
                          <button
                            onClick={() => handleDeactivateWalkIn(patient.id)}
                            title="Dezactivează"
                            style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#FCEBEB', color: '#A32D2D', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >
                            <i className="ti ti-ban" style={{ fontSize: '15px' }} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivateWalkIn(patient.id)}
                            title="Reactivează"
                            style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#EAF3DE', color: '#3B6D11', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >
                            <i className="ti ti-check" style={{ fontSize: '15px' }} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {walkInPatients && walkInPatients.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                  <button onClick={() => setWalkInPage(walkInPage - 1)} disabled={walkInPage === 1}
                    style={{ padding: '8px 16px', fontSize: '13px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', background: 'white', cursor: 'pointer', opacity: walkInPage === 1 ? 0.5 : 1 }}>
                    Anterior
                  </button>
                  <span style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {walkInPage} / {walkInPatients.totalPages}
                  </span>
                  <button onClick={() => setWalkInPage(walkInPage + 1)} disabled={walkInPage === walkInPatients.totalPages}
                    style={{ padding: '8px 16px', fontSize: '13px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', background: 'white', cursor: 'pointer', opacity: walkInPage === walkInPatients.totalPages ? 0.5 : 1 }}>
                    Următor
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal plată */}
      {paymentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: 'var(--border-radius-lg)', width: '100%', maxWidth: '360px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Procesează plata</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Metodă de plată</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {paymentMethods.map(method => (
                  <label key={method.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                    <input type="radio" value={method.value} checked={paymentMethod === method.value}
                      onChange={e => setPaymentMethod(e.target.value)} />
                    {method.label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handlePayment} disabled={processingId === paymentModal}
                style={{ ...btnStyle('#16a34a'), flex: 1, opacity: processingId === paymentModal ? 0.5 : 1 }}>
                {processingId === paymentModal ? 'Se procesează...' : 'Confirmă plata'}
              </button>
              <button onClick={() => setPaymentModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0 8px' }}>
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}