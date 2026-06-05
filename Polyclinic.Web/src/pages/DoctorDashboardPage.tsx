import { useState, useEffect } from 'react';
import { doctorAppointmentsApi, medicalRecordsApi } from '../api/medicalRecordsApi';
import type { DoctorAppointmentDto } from '../types/medical';
import type { MedicalRecordFormData } from '../types/medical';
import MedicalRecordForm from '../components/MedicalRecordForm';
import { getErrorMessage } from '../utils/errorUtils';
import PatientHistoryModal from '../components/PatientHistoryModal';
import type { MedicalServiceDto, SpecialtyDto } from '../types/doctor';
import { doctorsApi } from '../api/doctorsApi';
import { referralsApi } from '../api/referralsApi';
import { useUIContext } from '../hooks/UIContext';

export default function DoctorDashboardPage() {
  const [appointments, setAppointments] = useState<DoctorAppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [showMedicalForm, setShowMedicalForm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [patientHistory, setPatientHistory] = useState<{ id: string; name: string } | null>(null);

  const [referralModal, setReferralModal] = useState<{ appointmentId: string; patientId: string; patientName: string } | null>(null);
  const [referralForm, setReferralForm] = useState({
    specialtyId: '',
    serviceId: '',
    reason: '',
    notes: '',
    validDays: 30,
  });
  const [specialties, setSpecialties] = useState<SpecialtyDto[]>([]);
  const [availableServices, setAvailableServices] = useState<MedicalServiceDto[]>([]);
  const [submittingReferral, setSubmittingReferral] = useState(false);

  const [statusFilter, setStatusFilter] = useState('');
  const [searchName, setSearchName] = useState('');

  const {toast, confirm} = useUIContext();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await doctorAppointmentsApi.getDoctorAppointments(selectedDate);
      setAppointments(response.data);
    } catch (err) {
  
      toast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  useEffect(() => {
    const fetchSpecialties = async () => {
      const response = await doctorsApi.getSpecialties();
      setSpecialties(response.data);
    };
    fetchSpecialties();
  }, []);

  useEffect(() => {
    if (!referralForm.specialtyId) return;
    const fetchServices = async () => {
      const response = await doctorsApi.getServicesBySpecialty(referralForm.specialtyId);
      setAvailableServices(response.data);
      setReferralForm(prev => ({ ...prev, serviceId: '' }));
    };
    fetchServices();
  }, [referralForm.specialtyId]);

  const handleComplete = async (id: string) => {
    const ok = await confirm({ title: 'Finalizare consultație', message: 'Marchezi consultația ca finalizată?', confirmLabel: 'Confirmă', variant: 'primary' });
    if (!ok) return;
    
    setCompletingId(id);
    try {
      await doctorAppointmentsApi.completeAppointment(id);
      toast('Consultația a fost marcată ca finalizată', 'success');
      fetchAppointments();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setCompletingId(null);
    }
  };

  const handleSubmitMedicalRecord = async (appointmentId: string, data: MedicalRecordFormData) => {
    try {
      await medicalRecordsApi.createMedicalRecord(appointmentId, data);
      toast('Fișa medicală a fost salvată', 'success');
      setShowMedicalForm(null);
      fetchAppointments();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const handleCreateReferral = async () => {
    if (!referralModal) return;
    setSubmittingReferral(true);
    try {
      await referralsApi.createReferral({
        patientId: referralModal.patientId,
        specialtyId: referralForm.specialtyId,
        serviceId: referralForm.serviceId,
        reason: referralForm.reason,
        notes: referralForm.notes,
        validDays: referralForm.validDays,
      });
      toast('Referral emis cu succes', 'success');
      setReferralModal(null);
      setReferralForm({ specialtyId: '', serviceId: '', reason: '', notes: '', validDays: 30 });
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSubmittingReferral(false);
    }
  };

  const formatTime = (time: string) => time.substring(0, 5);

  const statusLabels: Record<string, string> = {
    confirmed: 'Confirmată',
    completed: 'Finalizată',
    cancelled: 'Anulată',
    pending: 'În așteptare',
  };

  const statusColors: Record<string, string> = {
    confirmed: 'bg-blue-50 text-blue-600',
    completed: 'bg-green-50 text-green-600',
    cancelled: 'bg-red-50 text-red-600',
    pending: 'bg-yellow-50 text-yellow-600',
  };

  const filteredAppointments = appointments.filter(a => {
    const matchStatus = !statusFilter || a.status === statusFilter;
    const matchName = !searchName || a.patientName.toLowerCase().includes(searchName.toLowerCase());
    return matchStatus && matchName;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-800 mb-2">Dashboard Doctor</h1>
        <p className="text-gray-500">Gestionează programările și fișele medicale</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm text-gray-600 mb-2">Selectează ziua</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Caută după numele pacientului..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toate statusurile</option>
          <option value="confirmed">Confirmate</option>
          <option value="completed">Finalizate</option>
          <option value="cancelled">Anulate</option>
          <option value="pending_referral_verification">Referral în așteptare</option>
        </select>
        {(statusFilter || searchName) && (
          <button
            onClick={() => { setStatusFilter(''); setSearchName(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 px-3"
          >
            Resetează
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Se încarcă...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          Nu ai programări în această zi
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-800">{appointment.patientName}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[appointment.status] ?? 'bg-gray-50 text-gray-600'}`}>
                      {statusLabels[appointment.status] ?? appointment.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{appointment.patientEmail}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">
                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  </p>
                  <p className="text-sm text-gray-500">{appointment.locationName}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="text-sm text-gray-500">
                  <span>{appointment.serviceName}</span>
                  {appointment.reason && (
                    <span className="ml-2 text-gray-400">— {appointment.reason}</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-800">
                    {appointment.pricePaid} lei
                  </span>

                  {appointment.status === 'confirmed' && (
                    <button
                      onClick={() => handleComplete(appointment.id)}
                      disabled={completingId === appointment.id}
                      className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {completingId === appointment.id ? 'Se procesează...' : 'Finalizează'}
                    </button>
                  )}

                  {appointment.status === 'completed' && !appointment.hasMedicalRecord && !appointment.isWalkIn && (
                    <button
                      onClick={() => setShowMedicalForm(
                        showMedicalForm === appointment.id ? null : appointment.id
                      )}
                      className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition"
                    >
                      Completează fișa
                    </button>
                  )}

                  {appointment.status === 'completed' && appointment.hasMedicalRecord && !appointment.isWalkIn && (
                    <span className="text-sm text-green-600">✓ Fișă completată</span>
                  )}

                  {appointment.status === 'completed' && !appointment.isWalkIn && (
                    <button
                      onClick={() => setReferralModal({
                        appointmentId: appointment.id,
                        patientId: appointment.patientId,
                        patientName: appointment.patientName
                      })}
                      className="text-sm bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 transition"
                    >
                      Emite referral
                    </button>
                  )}
                  
                </div>
              </div>

              {!appointment.isWalkIn && (
                <button
                  onClick={() => setPatientHistory({ 
                    id: appointment.patientId, 
                    name: appointment.patientName 
                  })}
                  className="text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  Vezi istoric
                </button>
              )}

              {showMedicalForm === appointment.id && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-medium text-gray-800 mb-4">Fișă medicală</h3>
                  <MedicalRecordForm
                    onSubmit={(data) => handleSubmitMedicalRecord(appointment.id, data)}
                    onCancel={() => setShowMedicalForm(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {referralModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Emite referral — {referralModal.patientName}</h2>
              <button onClick={() => setReferralModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Specialitate</label>
                <select
                  value={referralForm.specialtyId}
                  onChange={(e) => setReferralForm({ ...referralForm, specialtyId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selectează specialitate...</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Serviciu</label>
                <select
                  value={referralForm.serviceId}
                  onChange={(e) => setReferralForm({ ...referralForm, serviceId: e.target.value })}
                  disabled={!referralForm.specialtyId}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">Selectează serviciu...</option>
                  {availableServices.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Motiv</label>
                <textarea
                  value={referralForm.reason}
                  onChange={(e) => setReferralForm({ ...referralForm, reason: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Motivul trimiterii..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Note (opțional)</label>
                <textarea
                  value={referralForm.notes}
                  onChange={(e) => setReferralForm({ ...referralForm, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Note suplimentare..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Valabilitate (zile)</label>
                <input
                  type="number"
                  value={referralForm.validDays}
                  onChange={(e) => setReferralForm({ ...referralForm, validDays: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={1}
                  max={365}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateReferral}
                disabled={submittingReferral || !referralForm.specialtyId || !referralForm.serviceId || !referralForm.reason}
                className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
              >
                {submittingReferral ? 'Se procesează...' : 'Emite referral'}
              </button>
              <button
                onClick={() => setReferralModal(null)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
      {patientHistory && (
        <PatientHistoryModal
          patientId={patientHistory.id}
          patientName={patientHistory.name}
          onClose={() => setPatientHistory(null)}
        />
      )}
    </div>
  );
}