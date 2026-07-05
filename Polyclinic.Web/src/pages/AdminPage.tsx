import { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import type { AdminStatsDto, CreateDoctorDto, CreateSpecialtyDto, CreateLocationDto, CreateMedicalServiceDto, DoctorScheduleDto, CreateDoctorScheduleDto, MonthlyStatsDto, AnalyticsSummaryDto, SlotsByDateDto } from '../api/adminApi';
import type { SpecialtyDto, LocationDto, DoctorDto, MedicalServiceDto, PagedResult, UpdateDoctorDto } from '../types/doctor';
import { doctorsApi } from '../api/doctorsApi';
import type { AuditLogDto } from '../types/audit';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import z from 'zod';
import { useUIContext } from '../hooks/UIContext';

type Tab = 'stats' | 'doctors' | 'specialties' | 'locations' | 'services' | 'analytics' |'audit';

const s: Record<string, React.CSSProperties> = {
  card: { background: 'white', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '20px' },
  input: { width: '100%', padding: '8px 12px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', fontSize: '13px', color: 'var(--color-text-primary)', background: 'white', boxSizing: 'border-box' as const },
  select: { padding: '8px 12px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', fontSize: '13px', color: 'var(--color-text-primary)', background: 'white', cursor: 'pointer' },
  label: { display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' },
  btnPrimary: { background: '#378ADD', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  btnDanger: { background: 'none', border: 'none', fontSize: '13px', color: 'var(--color-text-danger)', cursor: 'pointer' },
  btnSuccess: { background: 'none', border: 'none', fontSize: '13px', color: 'var(--color-text-success)', cursor: 'pointer' },
  btnLink: { background: 'none', border: 'none', fontSize: '13px', color: '#378ADD', cursor: 'pointer' },
  btnSecondary: { background: 'none', border: 'none', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' },
};

function Modal({ title, onClose, children, maxWidth = '500px' }: { title: string; onClose: () => void; children: React.ReactNode; maxWidth?: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: 'var(--border-radius-lg)', width: '100%', maxWidth, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--color-text-tertiary)', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, hasNext, hasPrev, onChange }: { page: number; totalPages: number; hasNext: boolean; hasPrev: boolean; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
      <button onClick={() => onChange(page - 1)} disabled={!hasPrev} style={{ ...s.select, opacity: hasPrev ? 1 : 0.4 }}>Anterior</button>
      <span style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{page} / {totalPages}</span>
      <button onClick={() => onChange(page + 1)} disabled={!hasNext} style={{ ...s.select, opacity: hasNext ? 1 : 0.4 }}>Următor</button>
    </div>
  );
}

function Badge({ label, type }: { label: string; type: 'danger' | 'success' | 'info' | 'warning' }) {
  const colors = {
    danger: { bg: '#FCEBEB', color: '#A32D2D' },
    success: { bg: '#EAF3DE', color: '#3B6D11' },
    info: { bg: '#E6F1FB', color: '#185FA5' },
    warning: { bg: '#FAEEDA', color: '#854F0B' },
  };
  const c = colors[type];
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: c.bg, color: c.color, fontWeight: 500 }}>
      {label}
    </span>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<AdminStatsDto | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatsDto[]>([]);
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [services, setServices] = useState<MedicalServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [searchDoctor, setSearchDoctor] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchService, setSearchService] = useState('');
  const [filterSpecialtyId, setFilterSpecialtyId] = useState('');
  const [doctorPage, setDoctorPage] = useState(1);
  const [specialtyPage, setSpecialtyPage] = useState(1);
  const [locationPage, setLocationPage] = useState(1);
  const [servicePage, setServicePage] = useState(1);
  const PAGE_SIZE = 10;
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [showSpecialtyForm, setShowSpecialtyForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [doctorForm, setDoctorForm] = useState<CreateDoctorDto>({ email: '', password: '', firstName: '', lastName: '', specialtyId: '', licenseNumber: '', experienceYears: 0, consultationFee: 0 });
  const [specialtyForm, setSpecialtyForm] = useState<CreateSpecialtyDto>({ name: '', description: '' });
  const [locationForm, setLocationForm] = useState<CreateLocationDto>({ name: '', address: '', city: '', county: '' });
  const [serviceForm, setServiceForm] = useState<CreateMedicalServiceDto>({ specialtyId: '', name: '', durationMinutes: 30, price: 0, requiresReferral: false, isBookableOnline: true, isCNASCovered: false });
  const [editingDoctor, setEditingDoctor] = useState<DoctorDto | null>(null);
  const [editDoctorForm, setEditDoctorForm] = useState<UpdateDoctorDto>({ firstName: '', lastName: '', specialtyId: '', bio: '', experienceYears: 0, consultationFee: 0, licenseNumber: '' });
  const [editingSpecialty, setEditingSpecialty] = useState<SpecialtyDto | null>(null);
  const [editSpecialtyForm, setEditSpecialtyForm] = useState<CreateSpecialtyDto>({ name: '', description: '' });
  const [editingLocation, setEditingLocation] = useState<LocationDto | null>(null);
  const [editLocationForm, setEditLocationForm] = useState<CreateLocationDto>({ name: '', address: '', city: '', county: '' });
  const [editingService, setEditingService] = useState<MedicalServiceDto | null>(null);
  const [editServiceForm, setEditServiceForm] = useState<CreateMedicalServiceDto>({ specialtyId: '', name: '', durationMinutes: 30, price: 0, requiresReferral: false, isBookableOnline: true, isCNASCovered: false });
  const [doctorServicesModal, setDoctorServicesModal] = useState<{ id: string; name: string } | null>(null);
  const [doctorCurrentServices, setDoctorCurrentServices] = useState<MedicalServiceDto[]>([]);
  const [serviceFilter, setServiceFilter] = useState('');
  const [doctorScheduleModal, setDoctorScheduleModal] = useState<{ id: string; name: string } | null>(null);
  const [doctorSchedules, setDoctorSchedules] = useState<DoctorScheduleDto[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<CreateDoctorScheduleDto>({ doctorId: '', locationId: '', serviceId: '', workingDays: [], startTime: '09:00', endTime: '13:00' });
  const [auditLogs, setAuditLogs] = useState<PagedResult<AuditLogDto> | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilters, setAuditFilters] = useState({ userEmail: '', action: '', entityType: '', dateFrom: '', dateTo: '' });
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummaryDto | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [slotCalendarModal, setSlotCalendarModal] = useState<{ id: string; name: string } | null>(null);
  const [slotCalendar, setSlotCalendar] = useState<SlotsByDateDto[]>([]);
  const [slotCalendarLoading, setSlotCalendarLoading] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [generateDays, setGenerateDays] = useState(30);
  const [cancelReason, setCancelReason] = useState('');
  const [deletingSlot, setDeletingSlot] = useState(false);
  const {toast, confirm} = useUIContext();

  const weekDays = [
    { value: 'Monday', label: 'Luni' }, { value: 'Tuesday', label: 'Marți' },
    { value: 'Wednesday', label: 'Miercuri' }, { value: 'Thursday', label: 'Joi' },
    { value: 'Friday', label: 'Vineri' }, { value: 'Saturday', label: 'Sâmbătă' },
    { value: 'Sunday', label: 'Duminică' },
  ];

  function paginate<T>(items: T[], page: number) {
    const start = (page - 1) * PAGE_SIZE;
    return { items: items.slice(start, start + PAGE_SIZE), totalPages: Math.ceil(items.length / PAGE_SIZE), hasNext: start + PAGE_SIZE < items.length, hasPrev: page > 1 };
  }

  const filteredDoctors = doctors.filter(d => {
    const name = `${d.firstName} ${d.lastName}`.toLowerCase();
    return (!searchDoctor || name.includes(searchDoctor.toLowerCase())) && (!filterSpecialtyId || d.specialtyId === filterSpecialtyId);
  });
  const filteredSpecialties = specialties.filter(s => !searchSpecialty || s.name.toLowerCase().includes(searchSpecialty.toLowerCase()));
  const filteredLocations = locations.filter(l => !searchLocation || l.name.toLowerCase().includes(searchLocation.toLowerCase()));
  const filteredServices = services.filter(s => (!searchService || s.name.toLowerCase().includes(searchService.toLowerCase())) && (!filterSpecialtyId || s.specialtyId === filterSpecialtyId));

  const pagedDoctors = paginate(filteredDoctors, doctorPage);
  const pagedSpecialties = paginate(filteredSpecialties, specialtyPage);
  const pagedLocations = paginate(filteredLocations, locationPage);
  const pagedServices = paginate(filteredServices, servicePage);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, doctorsRes, specialtiesRes, locationsRes, servicesRes, monthlyRes] = await Promise.all([
        adminApi.getStats(), adminApi.getAllDoctors(showInactive), adminApi.getSpecialties(showInactive),
        adminApi.getLocations(showInactive), adminApi.getServices(showInactive), adminApi.getMonthlyStats(),
      ]);
      setStats(statsRes.data); setDoctors(doctorsRes.data); setSpecialties(specialtiesRes.data);
      setLocations(locationsRes.data); setServices(servicesRes.data); setMonthlyStats(monthlyRes.data);
    } finally { setLoading(false); }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const response = await adminApi.getAuditLogs({ ...auditFilters, page: auditPage, pageSize: 50 });
      setAuditLogs(response.data);
    } finally { setAuditLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [showInactive]);
  useEffect(() => { if (activeTab === 'audit') fetchAuditLogs(); }, [activeTab, auditPage, auditFilters]);
  useEffect(() => {
    if (activeTab === 'analytics') {
      setAnalyticsLoading(true);
      adminApi.getAnalyticsSummary()
        .then(r => setAnalyticsSummary(r.data))
        .finally(() => setAnalyticsLoading(false));
    }
  }, [activeTab]);

  const openDoctorServices = async (doctorId: string, doctorName: string, specialtyId: string) => {
    setDoctorServicesModal({ id: doctorId, name: doctorName });
    setServiceFilter(specialtyId);
    const response = await doctorsApi.getAllDoctorServices(doctorId);
    setDoctorCurrentServices(response.data);
  };

  const openDoctorSchedule = async (doctorId: string, doctorName: string) => {
    setDoctorScheduleModal({ id: doctorId, name: doctorName });
    setScheduleForm(prev => ({ ...prev, doctorId }));
    const [schedulesRes, servicesRes] = await Promise.all([adminApi.getDoctorSchedules(doctorId), doctorsApi.getAllDoctorServices(doctorId)]);
    setDoctorSchedules(schedulesRes.data); setDoctorCurrentServices(servicesRes.data);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'stats', label: 'Statistici' },
    { key: 'doctors', label: 'Doctori' },
    { key: 'specialties', label: 'Specialități' },
    { key: 'locations', label: 'Locații' },
    { key: 'services', label: 'Servicii' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'audit', label: 'Audit Log' },
  ];


  const validate = (schema: z.ZodSchema, data: unknown): boolean => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue: z.ZodIssue) =>{
        const key = issue.path[0] as string;
        if (key && !errors[key]) errors[key] = issue.message;
      });
      setFormErrors(errors);
      return false;
    }
    setFormErrors({});
    return true;
  };

  const doctorSchema = z.object({
    firstName: z.string().min(2, 'Prenumele trebuie să aibă cel puțin 2 caractere'),
    lastName: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
    email: z.string().email('Email invalid'),
    password: z.string()
      .min(8, 'Parola trebuie să aibă cel puțin 8 caractere')
      .regex(/[A-Z]/, 'Cel puțin o literă mare')
      .regex(/[^a-zA-Z0-9]/, 'Cel puțin un caracter special'),
    licenseNumber: z.string().min(1, 'Numărul de licență este obligatoriu'),
    specialtyId: z.string().min(1, 'Specialitatea este obligatorie'),
    experienceYears: z.number().min(0, 'Ani de experiență invalid').max(60),
    consultationFee: z.number().min(0, 'Tariful nu poate fi negativ'),
  });

  const specialtySchema = z.object({
    name: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
    description: z.string().optional(),
  });

  const locationSchema = z.object({
    name: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
    address: z.string().min(5, 'Adresa trebuie să aibă cel puțin 5 caractere'),
    city: z.string().min(2, 'Orașul este obligatoriu'),
    county: z.string().min(2, 'Județul este obligatoriu'),
    phone: z.string().optional(),
  });

  const serviceSchema = z.object({
    name: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
    specialtyId: z.string().min(1, 'Specialitatea este obligatorie'),
    durationMinutes: z.number().min(5, 'Durata minimă este 5 minute').max(480),
    price: z.number().min(0, 'Prețul nu poate fi negativ'),
    requiresReferral: z.boolean(),
    isBookableOnline: z.boolean(),
    isCNASCovered: z.boolean(),
    cnasCoveredAmount: z.number().optional(),
  });

  const editDoctorSchema = z.object({
    firstName: z.string().min(2, 'Prenumele trebuie să aibă cel puțin 2 caractere'),
    lastName: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
    licenseNumber: z.string().min(1, 'Numărul de licență este obligatoriu'),
    specialtyId: z.string().min(1, 'Specialitatea este obligatorie'),
    experienceYears: z.number().min(0).max(60),
    consultationFee: z.number().min(0),
    bio: z.string().optional(),
  });

  const handleCreateDoctor = async () => {
    if (!validate(doctorSchema, { ...doctorForm, experienceYears: Number(doctorForm.experienceYears), consultationFee: Number(doctorForm.consultationFee) })) return;
    await adminApi.createDoctor(doctorForm);
    toast('Doctor create cu succes', 'success');
    setShowDoctorForm(false);
    fetchAll();
  };

  const handleCreateSpecialty = async () => {
    if (!validate(specialtySchema, specialtyForm)) return;
    await adminApi.createSpecialty(specialtyForm);
    toast('Specialitate creată cu succes', 'success');
    setShowSpecialtyForm(false);
    fetchAll();
  };

  const handleCreateLocation = async () => {
    if (!validate(locationSchema, locationForm)) return;
    await adminApi.createLocation(locationForm);
    toast('Locație creată cu succes', 'success');
    
    setShowLocationForm(false);
    fetchAll();
  };

  const handleCreateService = async () => {
    if (!validate(serviceSchema, { ...serviceForm, durationMinutes: Number(serviceForm.durationMinutes), price: Number(serviceForm.price) })) return;
    await adminApi.createService(serviceForm);
    toast('Serviciu creat cu succes', 'success');
    setShowServiceForm(false);
    fetchAll();
  };

  const openSlotCalendar = async (doctorId: string, doctorName: string) => {
    setSlotCalendarModal({ id: doctorId, name: doctorName });
    setSlotCalendarLoading(true);
    try {
      const r = await adminApi.getSlotCalendar(doctorId);
      setSlotCalendar(r.data);
    } finally {
      setSlotCalendarLoading(false);
    }
  };

  const handleGenerateSlotsCustom = async () => {
    if (!slotCalendarModal) return;
    await adminApi.generateSlotsCustom(slotCalendarModal.id, generateDays);
    const r = await adminApi.getSlotCalendar(slotCalendarModal.id);
    setSlotCalendar(r.data);
  };

  const handleDeleteDay = async (date: string) => {
    if (!slotCalendarModal || !cancelReason.trim()) return;
    setDeletingSlot(true);
    try {
      await adminApi.deleteSlotsByDate(slotCalendarModal.id, date, cancelReason);
      const r = await adminApi.getSlotCalendar(slotCalendarModal.id);
      setSlotCalendar(r.data);
      setSelectedCalendarDate(null);
      setCancelReason('');
    } finally {
      setDeletingSlot(false);
    }
  };

  const handleDeleteTime = async (date: string, time: string) => {
    if (!slotCalendarModal || !cancelReason.trim()) return;
    setDeletingSlot(true);
    try {
      await adminApi.deleteSlotsByTime(slotCalendarModal.id, date, time, cancelReason);
      const r = await adminApi.getSlotCalendar(slotCalendarModal.id);
      setSlotCalendar(r.data);
      setCancelReason('');
    } finally {
      setDeletingSlot(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-tertiary)' }}>Se încarcă...</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Panou admin</h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Gestionează platforma</p>
      </div>

      <div style={{ marginBottom: '28px' }}>
        <div style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          scrollbarWidth: 'none' as any,
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '8px 16px', fontSize: '14px', fontWeight: 500,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '2px solid #378ADD' : '2px solid transparent',
              color: activeTab === tab.key ? '#378ADD' : 'var(--color-text-secondary)',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap', flexShrink: 0,
              paddingBottom: '9px',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* STATS */}
      {activeTab === 'stats' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'Pacienți', value: stats.totalPatients, icon: 'ti-users' },
              { label: 'Doctori', value: stats.totalDoctors, icon: 'ti-stethoscope' },
              { label: 'Programări total', value: stats.totalAppointments, icon: 'ti-calendar' },
              { label: 'Programări azi', value: stats.appointmentsToday, icon: 'ti-calendar-event' },
              { label: 'Luna aceasta', value: stats.appointmentsThisMonth, icon: 'ti-calendar-stats' },
              { label: 'În așteptare', value: stats.pendingAppointments, icon: 'ti-clock' },
              { label: 'Anulate', value: stats.cancelledAppointments, icon: 'ti-x' },
              { label: 'Venit total', value: `${stats.totalRevenue} lei`, icon: 'ti-currency-dollar' },
            ].map(stat => (
              <div key={stat.label} style={{ ...s.card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--border-radius-md)', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ${stat.icon}`} style={{ fontSize: '16px', color: '#185FA5' }} />
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{stat.label}</p>
                </div>
                <p style={{ fontSize: '24px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {monthlyStats.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={s.card}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '20px' }}>Programări pe luni</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyStats} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                    <Bar dataKey="appointments" name="Programări" fill="#378ADD" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cancellations" name="Anulate" fill="#F09595" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={s.card}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '20px' }}>Venit lunar (lei)</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} formatter={(v: any) => [`${v} lei`, 'Venit']} />
                    <Line type="monotone" dataKey="revenue" name="Venit" stroke="#378ADD" strokeWidth={2} dot={{ fill: '#378ADD', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DOCTORS */}
      {activeTab === 'doctors' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>{filteredDoctors.length} doctori</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
                Arată inactivi
              </label>
              <button onClick={() => setShowDoctorForm(!showDoctorForm)} style={s.btnPrimary}>+ Adaugă doctor</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input type="text" placeholder="Caută după nume..." value={searchDoctor}
              onChange={e => { setSearchDoctor(e.target.value); setDoctorPage(1); }}
              style={{ ...s.input, width: '220px' }} />
            <select value={filterSpecialtyId} onChange={e => setFilterSpecialtyId(e.target.value)} style={s.select}>
              <option value="">Toate specialitățile</option>
              {specialties.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {showDoctorForm && (
            <div style={{ ...s.card, marginBottom: '16px' }}>
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Doctor nou</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[{ key: 'firstName', label: 'Prenume', type: 'text' }, { key: 'lastName', label: 'Nume', type: 'text' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'password', label: 'Parolă', type: 'password' }, { key: 'licenseNumber', label: 'Nr. licență', type: 'text' }, { key: 'experienceYears', label: 'Ani experiență', type: 'number' }, { key: 'consultationFee', label: 'Tarif (lei)', type: 'number' }].map(f => (
                  <div key={f.key}>
                    <label style={s.label}>{f.label}</label>
                    <input
                      type={f.type}
                      value={String(doctorForm[f.key as keyof CreateDoctorDto] ?? '')}
                      onChange={e => setDoctorForm({ ...doctorForm, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                      style={{ ...s.input, borderColor: formErrors[f.key] ? '#E24B4A' : 'var(--color-border-tertiary)' }}
                    />
                    {formErrors[f.key] && (
                      <p style={{ fontSize: '11px', color: '#E24B4A', marginTop: '3px' }}>{formErrors[f.key]}</p>
                    )}
                  </div>
                ))}
                <div>
                  <label style={s.label}>Specialitate</label>
                  <select value={doctorForm.specialtyId} onChange={e => setDoctorForm({ ...doctorForm, specialtyId: e.target.value })} style={{ ...s.select, width: '100%' }}>
                    <option value="">Selectează...</option>
                    {specialties.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={() => { handleCreateDoctor() }} style={s.btnPrimary}>Salvează</button>
                <button onClick={() => setShowDoctorForm(false)} style={s.btnSecondary}>Anulează</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pagedDoctors.items.map(doctor => (
              <div key={doctor.id} style={{ ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: !doctor.isAvailable ? 0.65 : 1, borderColor: !doctor.isAvailable ? '#F09595' : 'var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 500, color: '#185FA5', overflow: 'hidden', flexShrink: 0 }}>
                    {doctor.profilePictureUrl ? <img src={`http://localhost:5289${doctor.profilePictureUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${doctor.firstName[0]}${doctor.lastName[0]}`}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Dr. {doctor.firstName} {doctor.lastName}</p>
                      {!doctor.isAvailable && <Badge label="Inactiv" type="danger" />}
                    </div>
                    <p style={{ fontSize: '13px', color: '#378ADD' }}>{doctor.specialtyName} · {doctor.consultationFee} lei</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[
                    { icon: 'ti-list', color: '#185FA5', bg: '#E6F1FB', label: 'Servicii', onClick: () => openDoctorServices(doctor.id, `Dr. ${doctor.firstName} ${doctor.lastName}`, doctor.specialtyId ?? '') },
                    { icon: 'ti-calendar', color: '#16a34a', bg: '#EAF3DE', label: 'Calendar', onClick: () => openSlotCalendar(doctor.id, `Dr. ${doctor.firstName} ${doctor.lastName}`) },
                    { icon: 'ti-clock', color: '#7C3AED', bg: '#EEEDFE', label: 'Program', onClick: () => openDoctorSchedule(doctor.id, `Dr. ${doctor.firstName} ${doctor.lastName}`) },
                    { icon: 'ti-pencil', color: '#854F0B', bg: '#FAEEDA', label: 'Editează', onClick: () => { setEditingDoctor(doctor); setEditDoctorForm({ firstName: doctor.firstName, lastName: doctor.lastName, specialtyId: doctor.specialtyId ?? '', bio: doctor.bio ?? '', experienceYears: doctor.experienceYears, consultationFee: doctor.consultationFee, licenseNumber: doctor.licenseNumber ?? '' }); } },
                  ].map(btn => (
                    <button
                      key={btn.label}
                      onClick={btn.onClick}
                      title={btn.label}
                      style={{
                        width: '30px', height: '30px',
                        borderRadius: 'var(--border-radius-md)',
                        background: btn.bg, color: btn.color,
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <i className={`ti ${btn.icon}`} style={{ fontSize: '15px' }} />
                    </button>
                  ))}
                  {doctor.isAvailable ? (
                    <button
                      onClick={async () => { const ok = await confirm({ title: 'Dezactivezi doctorul?', message: `Dr. ${doctor.firstName} ${doctor.lastName} nu va mai fi vizibil pe platformă.`, confirmLabel: 'Dezactivează', variant: 'danger' });
                      if (!ok) return; await adminApi.deleteDoctor(doctor.id); fetchAll(); }}
                      title="Dezactivează"
                      style={{
                        width: '30px', height: '30px',
                        borderRadius: 'var(--border-radius-md)',
                        background: '#FCEBEB', color: '#A32D2D',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <i className="ti ti-ban" style={{ fontSize: '15px' }} />
                    </button>
                  ) : (
                    <button
                      onClick={async () => { await adminApi.reactivateDoctor(doctor.id); fetchAll(); }}
                      title="Reactivează"
                      style={{
                        width: '30px', height: '30px',
                        borderRadius: 'var(--border-radius-md)',
                        background: '#EAF3DE', color: '#3B6D11',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <i className="ti ti-check" style={{ fontSize: '15px' }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={doctorPage} totalPages={pagedDoctors.totalPages} hasNext={pagedDoctors.hasNext} hasPrev={pagedDoctors.hasPrev} onChange={setDoctorPage} />
        </div>
      )}

      {/* SPECIALTIES */}
      {activeTab === 'specialties' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>{filteredSpecialties.length} specialități</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} /> Arată inactive
              </label>
              <button onClick={() => setShowSpecialtyForm(!showSpecialtyForm)} style={s.btnPrimary}>+ Adaugă specialitate</button>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <input type="text" placeholder="Caută după nume..." value={searchSpecialty}
              onChange={e => { setSearchSpecialty(e.target.value); setSpecialtyPage(1); }}
              style={{ ...s.input, width: '220px' }} />
          </div>

          {showSpecialtyForm && (
            <div style={{ ...s.card, marginBottom: '16px' }}>
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Specialitate nouă</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={s.label}>Nume</label>
                  <input type="text" value={specialtyForm.name}
                    onChange={e => setSpecialtyForm({ ...specialtyForm, name: e.target.value })}
                    style={{ ...s.input, borderColor: formErrors.name ? '#E24B4A' : 'var(--color-border-tertiary)' }} />
                  {formErrors.name && <p style={{ fontSize: '11px', color: '#E24B4A', marginTop: '3px' }}>{formErrors.name}</p>}
                </div>
                <div>
                  <label style={s.label}>Descriere</label>
                  <input type="text" value={specialtyForm.description ?? ''}
                    onChange={e => setSpecialtyForm({ ...specialtyForm, description: e.target.value })}
                    style={s.input} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={() => handleCreateSpecialty()} style={s.btnPrimary}>Salvează</button>
                <button onClick={() => { setShowSpecialtyForm(false); setFormErrors({}); }} style={s.btnSecondary}>Anulează</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pagedSpecialties.items.map(specialty => (
              <div key={specialty.id} style={{ ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: !specialty.isActive ? 0.65 : 1, borderColor: !specialty.isActive ? '#F09595' : 'var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{specialty.name}</p>
                  {!specialty.isActive && <Badge label="Inactivă" type="danger" />}
                  <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>{specialty.doctorCount} doctori</p>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => { setEditingSpecialty(specialty); setEditSpecialtyForm({ name: specialty.name, description: specialty.description ?? '' }); }}
                    title="Editează"
                    style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#FAEEDA', color: '#854F0B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <i className="ti ti-pencil" style={{ fontSize: '15px' }} />
                  </button>
                  {specialty.isActive ? (
                    <button
                      onClick={async () => {const ok = await confirm({ title: 'Dezactivezi specialitatea?', message: `Specialitatea "${specialty.name}" nu va mai fi vizibilă.`, confirmLabel: 'Dezactivează', variant: 'danger' });
                      if (!ok) return; await adminApi.deleteSpecialty(specialty.id); fetchAll(); }}
                      title="Dezactivează"
                      style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#FCEBEB', color: '#A32D2D', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <i className="ti ti-ban" style={{ fontSize: '15px' }} />
                    </button>
                  ) : (
                    <button
                      onClick={async () => { await adminApi.reactivateSpecialty(specialty.id); fetchAll(); }}
                      title="Reactivează"
                      style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#EAF3DE', color: '#3B6D11', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <i className="ti ti-check" style={{ fontSize: '15px' }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={specialtyPage} totalPages={pagedSpecialties.totalPages} hasNext={pagedSpecialties.hasNext} hasPrev={pagedSpecialties.hasPrev} onChange={setSpecialtyPage} />
        </div>
      )}

      {/* LOCATIONS */}
      {activeTab === 'locations' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>{filteredLocations.length} locații</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} /> Arată inactive
              </label>
              <button onClick={() => setShowLocationForm(!showLocationForm)} style={s.btnPrimary}>+ Adaugă locație</button>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <input type="text" placeholder="Caută după nume..." value={searchLocation}
              onChange={e => { setSearchLocation(e.target.value); setLocationPage(1); }}
              style={{ ...s.input, width: '220px' }} />
          </div>

          {showLocationForm && (
            <div style={{ ...s.card, marginBottom: '16px' }}>
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Locație nouă</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[{ key: 'name', label: 'Nume' }, { key: 'address', label: 'Adresă' }, { key: 'city', label: 'Oraș' }, { key: 'county', label: 'Județ' }, { key: 'phone', label: 'Telefon' }].map(f => (
                  <div key={f.key}>
                    <label style={s.label}>{f.label}</label>
                    <input type="text"
                      value={String(locationForm[f.key as keyof CreateLocationDto] ?? '')}
                      onChange={e => setLocationForm({ ...locationForm, [f.key]: e.target.value })}
                      style={{ ...s.input, borderColor: formErrors[f.key] ? '#E24B4A' : 'var(--color-border-tertiary)' }} />
                    {formErrors[f.key] && <p style={{ fontSize: '11px', color: '#E24B4A', marginTop: '3px' }}>{formErrors[f.key]}</p>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={() => handleCreateLocation()} style={s.btnPrimary}>Salvează</button>
                <button onClick={() => { setShowLocationForm(false); setFormErrors({}); }} style={s.btnSecondary}>Anulează</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pagedLocations.items.map(location => (
              <div key={location.id} style={{ ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: !location.isActive ? 0.65 : 1, borderColor: !location.isActive ? '#F09595' : 'var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{location.name}</p>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{location.address}, {location.city}</p>
                  </div>
                  {!location.isActive && <Badge label="Inactivă" type="danger" />}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => { setEditingLocation(location); setEditLocationForm({ name: location.name, address: location.address, city: location.city, county: location.county, phone: location.phone ?? '' }); }}
                    title="Editează"
                    style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#FAEEDA', color: '#854F0B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <i className="ti ti-pencil" style={{ fontSize: '15px' }} />
                  </button>
                  {location.isActive ? (
                    <button
                      onClick={async () => { const ok = await confirm({ title: 'Dezactivezi locația?', message: `Locația "${location.name}" nu va mai fi vizibilă.`, confirmLabel: 'Dezactivează', variant: 'danger' });
                      if (!ok) return; await adminApi.deleteLocation(location.id); fetchAll(); }}
                      title="Dezactivează"
                      style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#FCEBEB', color: '#A32D2D', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <i className="ti ti-ban" style={{ fontSize: '15px' }} />
                    </button>
                  ) : (
                    <button
                      onClick={async () => { await adminApi.reactivateLocation(location.id); fetchAll(); }}
                      title="Reactivează"
                      style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#EAF3DE', color: '#3B6D11', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <i className="ti ti-check" style={{ fontSize: '15px' }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={locationPage} totalPages={pagedLocations.totalPages} hasNext={pagedLocations.hasNext} hasPrev={pagedLocations.hasPrev} onChange={setLocationPage} />
        </div>
      )}

      {/* SERVICES */}
      {activeTab === 'services' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>{filteredServices.length} servicii</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} /> Arată inactive
              </label>
              <button onClick={() => setShowServiceForm(!showServiceForm)} style={s.btnPrimary}>+ Adaugă serviciu</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input type="text" placeholder="Caută după nume..." value={searchService} onChange={e => { setSearchService(e.target.value); setServicePage(1); }} style={{ ...s.input, width: '220px' }} />
            <select value={filterSpecialtyId} onChange={e => setFilterSpecialtyId(e.target.value)} style={s.select}>
              <option value="">Toate specialitățile</option>
              {specialties.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {showServiceForm && (
            <div style={{ ...s.card, marginBottom: '16px' }}>
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Serviciu nou</p>
              <ServiceForm form={serviceForm} setForm={setServiceForm} specialties={specialties} errors={formErrors} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={() =>  handleCreateService() } style={s.btnPrimary}>Salvează</button>
                <button onClick={() => { setShowServiceForm(false); setFormErrors({}); }} style={s.btnSecondary}>Anulează</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pagedServices.items.map(service => (
              <div key={service.id} style={{ ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: !service.isActive ? 0.65 : 1, borderColor: !service.isActive ? '#F09595' : 'var(--color-border-tertiary)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{service.name}</p>
                    {!service.isActive && <Badge label="Inactiv" type="danger" />}
                    {service.isCNASCovered && <Badge label="CNAS" type="success" />}
                    {service.isBookableOnline && <Badge label="Online" type="info" />}
                    {service.requiresReferral && <Badge label="Trimitere" type="warning" />}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{service.specialtyName} · {service.durationMinutes} min · {service.price} lei</p>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => { setEditingService(service); setEditServiceForm({ specialtyId: service.specialtyId ?? '', name: service.name, durationMinutes: service.durationMinutes, price: service.price, requiresReferral: service.requiresReferral, isBookableOnline: service.isBookableOnline ?? true, isCNASCovered: service.isCNASCovered ?? false, cnasCoveredAmount: service.cnasCoveredAmount }); }}
                    title="Editează"
                    style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#FAEEDA', color: '#854F0B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <i className="ti ti-pencil" style={{ fontSize: '15px' }} />
                  </button>
                  {service.isActive ? (
                    <button
                      onClick={async () => {const ok = await confirm({ title: 'Dezactivezi serviciul?', message: `Serviciul "${service.name}" nu va mai fi disponibil.`, confirmLabel: 'Dezactivează', variant: 'danger' });
                      if (!ok) return; await adminApi.deleteService(service.id); fetchAll(); }}
                      title="Dezactivează"
                      style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#FCEBEB', color: '#A32D2D', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <i className="ti ti-ban" style={{ fontSize: '15px' }} />
                    </button>
                  ) : (
                    <button
                      onClick={async () => { await adminApi.reactivateService(service.id); fetchAll(); }}
                      title="Reactivează"
                      style={{ width: '30px', height: '30px', borderRadius: 'var(--border-radius-md)', background: '#EAF3DE', color: '#3B6D11', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <i className="ti ti-check" style={{ fontSize: '15px' }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={servicePage} totalPages={pagedServices.totalPages} hasNext={pagedServices.hasNext} hasPrev={pagedServices.hasPrev} onChange={setServicePage} />
        </div>
      )}

      {/* AUDIT */}
      {activeTab === 'audit' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>{auditLogs?.totalCount ?? 0} înregistrări</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <input type="text" placeholder="Email utilizator..." value={auditFilters.userEmail} onChange={e => { setAuditFilters({ ...auditFilters, userEmail: e.target.value }); setAuditPage(1); }} style={{ ...s.input, width: '200px' }} />
            <select value={auditFilters.action} onChange={e => { setAuditFilters({ ...auditFilters, action: e.target.value }); setAuditPage(1); }} style={s.select}>
              <option value="">Toate acțiunile</option>
              {['LOGIN', 'LOGOUT', 'REGISTER', 'CREATE_APPOINTMENT', 'CANCEL_APPOINTMENT', 'CREATE_DOCTOR', 'DEACTIVATE_DOCTOR', 'REACTIVATE_DOCTOR'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={auditFilters.entityType} onChange={e => { setAuditFilters({ ...auditFilters, entityType: e.target.value }); setAuditPage(1); }} style={s.select}>
              <option value="">Toate entitățile</option>
              {['User', 'Appointment', 'Doctor'].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input type="date" value={auditFilters.dateFrom} onChange={e => { setAuditFilters({ ...auditFilters, dateFrom: e.target.value }); setAuditPage(1); }} style={s.select} />
            <input type="date" value={auditFilters.dateTo} onChange={e => { setAuditFilters({ ...auditFilters, dateTo: e.target.value }); setAuditPage(1); }} style={s.select} />
            {Object.values(auditFilters).some(Boolean) && (
              <button onClick={() => { setAuditFilters({ userEmail: '', action: '', entityType: '', dateFrom: '', dateTo: '' }); setAuditPage(1); }} style={s.btnSecondary}>
                <i className="ti ti-x" style={{ fontSize: '13px' }} /> Resetează
              </button>
            )}
          </div>

          {auditLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-tertiary)' }}>Se încarcă...</div>
          ) : (
            <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-background-secondary)' }}>
                    {['Utilizator', 'Acțiune', 'Entitate', 'IP', 'Data'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs?.items.map((log, i) => {
                    const actionColor = log.action.includes('CREATE') ? { bg: '#EAF3DE', color: '#3B6D11' } : log.action.includes('CANCEL') || log.action.includes('DEACTIVATE') ? { bg: '#FCEBEB', color: '#A32D2D' } : log.action.includes('LOGIN') || log.action.includes('REGISTER') ? { bg: '#E6F1FB', color: '#185FA5' } : { bg: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' };
                    return (
                      <tr key={log.id} style={{ borderBottom: i < (auditLogs?.items.length ?? 0) - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                        <td style={{ padding: '10px 16px', color: 'var(--color-text-primary)' }}>{log.userEmail ?? 'System'}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: actionColor.bg, color: actionColor.color, fontWeight: 500 }}>{log.action}</span>
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--color-text-secondary)' }}>{log.entityType}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--color-text-tertiary)', fontSize: '12px' }}>{log.ipAddress ?? '-'}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--color-text-tertiary)', fontSize: '12px' }}>{new Date(log.createdAt).toLocaleString('ro-RO')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {auditLogs && auditLogs.totalPages > 1 && (
            <Pagination page={auditPage} totalPages={auditLogs.totalPages} hasNext={auditLogs.hasNextPage} hasPrev={auditLogs.hasPreviousPage} onChange={setAuditPage} />
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          {analyticsLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-tertiary)' }}>
              Se încarcă...
            </div>
          ) : analyticsSummary ? (
            <div>
              {/* Stats generale */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'Total events (30 zile)', value: analyticsSummary.totalEvents, icon: 'ti-activity' },
                  { label: 'Utilizatori unici', value: analyticsSummary.uniqueUsers, icon: 'ti-users' },
                ].map(stat => (
                  <div key={stat.label} style={{ ...s.card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: 'var(--border-radius-md)', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={`ti ${stat.icon}`} style={{ fontSize: '16px', color: '#185FA5' }} />
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{stat.label}</p>
                    </div>
                    <p style={{ fontSize: '24px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Grafic events zilnice */}
              {analyticsSummary.dailyEvents.length > 0 && (
                <div style={{ ...s.card, marginBottom: '16px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '20px' }}>
                    Evenimente pe zi (ultimele 30 zile)
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={analyticsSummary.dailyEvents}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                      <Line type="monotone" dataKey="count" name="Evenimente" stroke="#378ADD" strokeWidth={2} dot={{ fill: '#378ADD', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Top events */}
                <div style={s.card}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                    Top evenimente
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analyticsSummary.topEvents.map(e => (
                      <div key={e.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{e.name}</span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{e.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top pagini */}
                <div style={s.card}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                    Top pagini
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analyticsSummary.topPages.map(p => (
                      <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{p.name}</span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{p.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top cautari */}
                <div style={s.card}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                    Top căutări
                  </p>
                  {analyticsSummary.topSearches.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Nu există căutări</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {analyticsSummary.topSearches.map(s => (
                        <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{s.name}</span>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{s.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top specialitati */}
                <div style={s.card}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                    Top specialități căutate
                  </p>
                  {analyticsSummary.topSpecialties.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Nu există date</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {analyticsSummary.topSpecialties.map(sp => (
                        <div key={sp.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{sp.name}</span>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{sp.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-tertiary)' }}>
              Nu există date analytics
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {doctorServicesModal && (
        <Modal title={`Servicii — ${doctorServicesModal.name}`} onClose={() => setDoctorServicesModal(null)} maxWidth="540px">
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '10px' }}>Servicii asociate</p>
          {doctorCurrentServices.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: '20px' }}>Niciun serviciu asociat</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
              {doctorCurrentServices.map(sv => (
                <div key={sv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                  <div><p style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{sv.name}</p><p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{sv.price} lei · {sv.durationMinutes} min</p></div>
                  <button onClick={async () => { await adminApi.removeServiceFromDoctor(doctorServicesModal.id, sv.id); const r = await doctorsApi.getAllDoctorServices(doctorServicesModal.id); setDoctorCurrentServices(r.data); }} style={s.btnDanger}>Elimină</button>
                </div>
              ))}
            </div>
          )}
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '10px' }}>Adaugă serviciu</p>
          <select disabled value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} style={{ ...s.select, width: '100%', marginBottom: '10px' }}>
            <option value="">Toate specialitățile</option>
            {specialties.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
          </select>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {services.filter(sv => !doctorCurrentServices.find(ds => ds.id === sv.id) && (!serviceFilter || sv.specialtyId === serviceFilter)).map(sv => (
              <div key={sv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)' }}>
                <div><p style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{sv.name}</p><p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{sv.price} lei · {sv.durationMinutes} min</p></div>
                <button onClick={async () => { await adminApi.addServiceToDoctor(doctorServicesModal.id, sv.id); const r = await doctorsApi.getAllDoctorServices(doctorServicesModal.id); setDoctorCurrentServices(r.data); }} style={s.btnLink}>+ Adaugă</button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {slotCalendarModal && (
        <Modal title={`Calendar sloturi — ${slotCalendarModal.name}`} onClose={() => { setSlotCalendarModal(null); setSelectedCalendarDate(null); setCancelReason(''); }} maxWidth="700px">
          
          {/* Generare sloturi */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <input
              type="number"
              value={generateDays}
              onChange={e => setGenerateDays(Number(e.target.value))}
              min={1} max={365}
              style={{ ...s.input, width: '80px' }}
            />
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>zile</span>
            <button onClick={handleGenerateSlotsCustom} style={s.btnPrimary}>
              Generează sloturi
            </button>
          </div>

          {slotCalendarLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-tertiary)' }}>Se încarcă...</div>
          ) : slotCalendar.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
              Nu există sloturi generate
            </p>
          ) : (
            <div style={{ display: 'flex', gap: '16px' }}>
              
              {/* Lista zile */}
              <div style={{ width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '400px', overflowY: 'auto' }}>
                {slotCalendar.map(day => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedCalendarDate(day.date === selectedCalendarDate ? null : day.date)}
                    style={{
                      textAlign: 'left', padding: '8px 12px',
                      borderRadius: 'var(--border-radius-md)',
                      border: selectedCalendarDate === day.date ? '1.5px solid #378ADD' : '0.5px solid var(--color-border-tertiary)',
                      background: selectedCalendarDate === day.date ? '#E6F1FB' : 'white',
                      cursor: 'pointer', fontSize: '13px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <p style={{ fontWeight: 500 }}>
                      {new Date(day.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                      {day.slots.length} sloturi · {day.slots.filter(s => s.hasAppointment).length} programări
                    </p>
                  </button>
                ))}
              </div>

              {/* Detalii zi selectată */}
              {selectedCalendarDate && (() => {
                const day = slotCalendar.find(d => d.date === selectedCalendarDate);
                if (!day) return null;
                return (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {new Date(day.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Motiv anulare */}
                    <div style={{ marginBottom: '12px' }}>
                      <input
                        type="text"
                        placeholder="Motiv anulare (obligatoriu pentru ștergere)..."
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                        style={{ ...s.input, fontSize: '12px' }}
                      />
                    </div>

                    {/* Sterge toata ziua */}
                    <button
                      onClick={() => handleDeleteDay(day.date)}
                      disabled={!cancelReason.trim() || deletingSlot}
                      style={{
                        width: '100%', padding: '8px',
                        background: '#FCEBEB', color: '#A32D2D',
                        border: '0.5px solid #F09595',
                        borderRadius: 'var(--border-radius-md)',
                        fontSize: '13px', cursor: 'pointer',
                        marginBottom: '12px',
                        opacity: !cancelReason.trim() || deletingSlot ? 0.5 : 1,
                      }}
                    >
                      <i className="ti ti-trash" style={{ fontSize: '13px', marginRight: '6px' }} />
                      Șterge toată ziua ({day.slots.filter(s => s.hasAppointment).length} programări vor fi anulate)
                    </button>

                    {/* Sloturi individuale */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                      {day.slots.map(slot => (
                        <div key={slot.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 'var(--border-radius-md)',
                          border: '0.5px solid var(--color-border-tertiary)',
                          background: slot.hasAppointment ? '#FFFBEB' : 'white',
                        }}>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                              {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                            </p>
                            {slot.hasAppointment && slot.patientName && (
                              <p style={{ fontSize: '11px', color: '#92400E' }}>
                                <i className="ti ti-user" style={{ fontSize: '11px' }} /> {slot.patientName}
                              </p>
                            )}
                            {slot.locationName && (
                              <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                                {slot.locationName}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {slot.hasAppointment && (
                              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '99px', background: '#FFFBEB', color: '#92400E' }}>
                                Programat
                              </span>
                            )}
                            {!slot.isAvailable && !slot.hasAppointment && (
                              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '99px', background: 'var(--color-background-secondary)', color: 'var(--color-text-tertiary)' }}>
                                Blocat
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteTime(day.date, slot.startTime)}
                              disabled={!cancelReason.trim() || deletingSlot}
                              style={{
                                background: 'none', border: 'none',
                                color: 'var(--color-text-danger)',
                                cursor: 'pointer', fontSize: '13px',
                                opacity: !cancelReason.trim() || deletingSlot ? 0.4 : 1,
                              }}
                            >
                              <i className="ti ti-trash" style={{ fontSize: '14px' }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </Modal>
      )}

      {doctorScheduleModal && (
        <Modal title={`Program — ${doctorScheduleModal.name}`} onClose={() => { setDoctorScheduleModal(null); setShowScheduleForm(false); }} maxWidth="640px">
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
            <button onClick={async () => { await adminApi.generateSlots(doctorScheduleModal.id); toast('Sloturi generate cu succes!', 'success'); }} style={{ ...s.btnPrimary, background: '#16a34a' }}>Generează sloturi (30 zile)</button>
            <button onClick={() => setShowScheduleForm(!showScheduleForm)} style={s.btnPrimary}>+ Adaugă program</button>
          </div>
          {showScheduleForm && (
            <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={s.label}>Locație</label>
                  <select value={scheduleForm.locationId} onChange={e => setScheduleForm({ ...scheduleForm, locationId: e.target.value })} style={{ ...s.select, width: '100%' }}>
                    <option value="">Selectează...</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Serviciu (opțional)</label>
                  <select value={scheduleForm.serviceId} onChange={e => setScheduleForm({ ...scheduleForm, serviceId: e.target.value })} style={{ ...s.select, width: '100%' }}>
                    <option value="">Toate serviciile</option>
                    {doctorCurrentServices.map(sv => <option key={sv.id} value={sv.id}>{sv.name} ({sv.durationMinutes} min)</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Ora început</label>
                  <input type="time" value={scheduleForm.startTime} onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>Ora sfârșit</label>
                  <input type="time" value={scheduleForm.endTime} onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} style={s.input} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={s.label}>Zile lucrătoare</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {weekDays.map(day => (
                    <label key={day.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={scheduleForm.workingDays.includes(day.value)}
                        onChange={e => setScheduleForm({ ...scheduleForm, workingDays: e.target.checked ? [...scheduleForm.workingDays, day.value] : scheduleForm.workingDays.filter(d => d !== day.value) })} />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={async () => { await adminApi.createDoctorSchedule(scheduleForm); const r = await adminApi.getDoctorSchedules(scheduleForm.doctorId); setDoctorSchedules(r.data); setShowScheduleForm(false); }} disabled={!scheduleForm.locationId || scheduleForm.workingDays.length === 0} style={{ ...s.btnPrimary, opacity: (!scheduleForm.locationId || scheduleForm.workingDays.length === 0) ? 0.5 : 1 }}>Salvează</button>
                <button onClick={() => setShowScheduleForm(false)} style={s.btnSecondary}>Anulează</button>
              </div>
            </div>
          )}
          {doctorSchedules.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-tertiary)', fontSize: '14px' }}>Nu există program setat</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {doctorSchedules.map(schedule => (
                <div key={schedule.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{schedule.locationName}</p>
                    {schedule.serviceName && <p style={{ fontSize: '12px', color: '#378ADD' }}>{schedule.serviceName}</p>}
                    <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{schedule.workingDays} · {schedule.startTime.substring(0, 5)} - {schedule.endTime.substring(0, 5)}</p>
                  </div>
                  <button onClick={async () => { const ok = await confirm({ title: 'Ștergi programul?', message: 'Programul va fi șters și sloturile viitoare vor fi eliminate. Programările existente vor fi anulate.', confirmLabel: 'Șterge', variant: 'danger' });
                  if (!ok) return; await adminApi.deleteDoctorSchedule(schedule.id); const r = await adminApi.getDoctorSchedules(doctorScheduleModal.id); setDoctorSchedules(r.data); }} style={s.btnDanger}>Șterge</button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {editingDoctor && (
        <Modal title="Editează doctor" onClose={() => { setEditingDoctor(null); setFormErrors({}); }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[{ key: 'firstName', label: 'Prenume', type: 'text' }, { key: 'lastName', label: 'Nume', type: 'text' }, { key: 'licenseNumber', label: 'Nr. licență', type: 'text' }, { key: 'experienceYears', label: 'Ani experiență', type: 'number' }, { key: 'consultationFee', label: 'Tarif (lei)', type: 'number' }].map(f => (
              <div key={f.key}>
                <label style={s.label}>{f.label}</label>
                <input type={f.type}
                  value={String(editDoctorForm[f.key as keyof UpdateDoctorDto] ?? '')}
                  onChange={e => setEditDoctorForm({ ...editDoctorForm, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                  style={{ ...s.input, borderColor: formErrors[f.key] ? '#E24B4A' : 'var(--color-border-tertiary)' }} />
                {formErrors[f.key] && <p style={{ fontSize: '11px', color: '#E24B4A', marginTop: '3px' }}>{formErrors[f.key]}</p>}
              </div>
            ))}
            <div>
              <label style={s.label}>Specialitate</label>
              <select value={editDoctorForm.specialtyId}
                onChange={e => setEditDoctorForm({ ...editDoctorForm, specialtyId: e.target.value })}
                style={{ ...s.select, width: '100%', borderColor: formErrors.specialtyId ? '#E24B4A' : 'var(--color-border-tertiary)' }}>
                <option value="">Selectează...</option>
                {specialties.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
              </select>
              {formErrors.specialtyId && <p style={{ fontSize: '11px', color: '#E24B4A', marginTop: '3px' }}>{formErrors.specialtyId}</p>}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={s.label}>Bio</label>
              <textarea value={editDoctorForm.bio ?? ''}
                onChange={e => setEditDoctorForm({ ...editDoctorForm, bio: e.target.value })}
                rows={3} style={{ ...s.input, resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <button onClick={async () => {
              if (!validate(editDoctorSchema, { ...editDoctorForm, experienceYears: Number(editDoctorForm.experienceYears), consultationFee: Number(editDoctorForm.consultationFee) })) return;
              await adminApi.updateDoctor(editingDoctor.id, editDoctorForm);
              setEditingDoctor(null);
              setFormErrors({});
              fetchAll();
            }} style={{ ...s.btnPrimary, flex: 1 }}>Salvează</button>
            <button onClick={() => { setEditingDoctor(null); setFormErrors({}); }} style={s.btnSecondary}>Anulează</button>
          </div>
        </Modal>
      )}

      {editingSpecialty && (
        <Modal title="Editează specialitate" onClose={() => { setEditingSpecialty(null); setFormErrors({}); }} maxWidth="440px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={s.label}>Nume</label>
              <input type="text" value={editSpecialtyForm.name}
                onChange={e => setEditSpecialtyForm({ ...editSpecialtyForm, name: e.target.value })}
                style={{ ...s.input, borderColor: formErrors.name ? '#E24B4A' : 'var(--color-border-tertiary)' }} />
              {formErrors.name && <p style={{ fontSize: '11px', color: '#E24B4A', marginTop: '3px' }}>{formErrors.name}</p>}
            </div>
            <div>
              <label style={s.label}>Descriere</label>
              <input type="text" value={editSpecialtyForm.description ?? ''}
                onChange={e => setEditSpecialtyForm({ ...editSpecialtyForm, description: e.target.value })}
                style={s.input} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <button onClick={async () => {
              if (!validate(specialtySchema, editSpecialtyForm)) return;
              await adminApi.updateSpecialty(editingSpecialty.id, editSpecialtyForm);
              setEditingSpecialty(null);
              setFormErrors({});
              fetchAll();
            }} style={{ ...s.btnPrimary, flex: 1 }}>Salvează</button>
            <button onClick={() => { setEditingSpecialty(null); setFormErrors({}); }} style={s.btnSecondary}>Anulează</button>
          </div>
        </Modal>
      )}

      {editingLocation && (
        <Modal title="Editează locație" onClose={() => { setEditingLocation(null); setFormErrors({}); }} maxWidth="480px">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[{ key: 'name', label: 'Nume' }, { key: 'address', label: 'Adresă' }, { key: 'city', label: 'Oraș' }, { key: 'county', label: 'Județ' }, { key: 'phone', label: 'Telefon' }].map(f => (
              <div key={f.key}>
                <label style={s.label}>{f.label}</label>
                <input type="text"
                  value={String(editLocationForm[f.key as keyof CreateLocationDto] ?? '')}
                  onChange={e => setEditLocationForm({ ...editLocationForm, [f.key]: e.target.value })}
                  style={{ ...s.input, borderColor: formErrors[f.key] ? '#E24B4A' : 'var(--color-border-tertiary)' }} />
                {formErrors[f.key] && <p style={{ fontSize: '11px', color: '#E24B4A', marginTop: '3px' }}>{formErrors[f.key]}</p>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <button onClick={async () => {
              if (!validate(locationSchema, editLocationForm)) return;
              await adminApi.updateLocation(editingLocation.id, editLocationForm);
              setEditingLocation(null);
              setFormErrors({});
              fetchAll();
            }} style={{ ...s.btnPrimary, flex: 1 }}>Salvează</button>
            <button onClick={() => { setEditingLocation(null); setFormErrors({}); }} style={s.btnSecondary}>Anulează</button>
          </div>
        </Modal>
      )}

      {editingService && (
        <Modal title="Editează serviciu" onClose={() => { setEditingService(null); setFormErrors({}); }}>
          <ServiceForm form={editServiceForm} setForm={setEditServiceForm} specialties={specialties} errors={formErrors} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <button onClick={async () => {
              if (!validate(serviceSchema, { ...editServiceForm, durationMinutes: Number(editServiceForm.durationMinutes), price: Number(editServiceForm.price) })) return;
              await adminApi.updateService(editingService.id, editServiceForm);
              setEditingService(null);
              setFormErrors({});
              fetchAll();
            }} style={{ ...s.btnPrimary, flex: 1 }}>Salvează</button>
            <button onClick={() => { setEditingService(null); setFormErrors({}); }} style={s.btnSecondary}>Anulează</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ServiceForm({ form, setForm, specialties, errors = {} }: { form: CreateMedicalServiceDto; setForm: (f: CreateMedicalServiceDto) => void; specialties: SpecialtyDto[]; errors?: Record<string, string> }) {
  const s2: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', fontSize: '13px', color: 'var(--color-text-primary)', background: 'white', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' };
  const err = (key: string) => errors[key] ? <p style={{ fontSize: '11px', color: '#E24B4A', marginTop: '3px' }}>{errors[key]}</p> : null;
  const inp = (key: string): React.CSSProperties => ({ ...s2, borderColor: errors[key] ? '#E24B4A' : 'var(--color-border-tertiary)' });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <div>
        <label style={lbl}>Nume</label>
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp('name')} />
        {err('name')}
      </div>
      <div>
        <label style={lbl}>Specialitate</label>
        <select value={form.specialtyId} onChange={e => setForm({ ...form, specialtyId: e.target.value })} style={inp('specialtyId')}>
          <option value="">Selectează...</option>
          {specialties.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
        </select>
        {err('specialtyId')}
      </div>
      <div>
        <label style={lbl}>Durată (min)</label>
        <input type="number" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} style={inp('durationMinutes')} />
        {err('durationMinutes')}
      </div>
      <div>
        <label style={lbl}>Preț (lei)</label>
        <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} style={inp('price')} />
        {err('price')}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input type="checkbox" checked={form.requiresReferral} onChange={e => setForm({ ...form, requiresReferral: e.target.checked })} />
        <label style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>Necesită trimitere</label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input type="checkbox" checked={form.isBookableOnline} onChange={e => setForm({ ...form, isBookableOnline: e.target.checked })} />
        <label style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>Rezervabil online</label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input type="checkbox" checked={form.isCNASCovered} onChange={e => setForm({ ...form, isCNASCovered: e.target.checked, cnasCoveredAmount: undefined })} />
        <label style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>Decontat CNAS</label>
      </div>
      {form.isCNASCovered && (
        <div>
          <label style={lbl}>Sumă decontată (lei)</label>
          <input type="number" value={form.cnasCoveredAmount ?? ''} onChange={e => setForm({ ...form, cnasCoveredAmount: Number(e.target.value) })} placeholder="0 = gratuit" style={s2} />
        </div>
      )}
    </div>
  );
}
