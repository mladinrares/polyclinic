import { useState } from 'react';
import type { MedicalRecordFormData } from '../types/medical';

interface Props {
  onSubmit: (data: MedicalRecordFormData) => Promise<void>;
  onCancel: () => void;
}

export default function MedicalRecordForm({ onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<MedicalRecordFormData>({
    diagnosis: '',
    anamnesis: '',
    examinationNotes: '',
    treatmentPlan: '',
    recommendations: '',
    prescriptionItems: [],
    investigations: [],
  });
  const [submitting, setSubmitting] = useState(false);

  const addPrescriptionItem = () => {
    setForm({
      ...form,
      prescriptionItems: [...form.prescriptionItems, {
        medicationName: '', dosage: '', frequency: '',
        duration: '', instructions: '', quantity: 1,
      }]
    });
  };

  const removePrescriptionItem = (index: number) => {
    setForm({
      ...form,
      prescriptionItems: form.prescriptionItems.filter((_, i) => i !== index)
    });
  };

  const updatePrescriptionItem = (index: number, field: string, value: string | number) => {
    const items = [...form.prescriptionItems];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, prescriptionItems: items });
  };

  const addInvestigation = () => {
    setForm({
      ...form,
      investigations: [...form.investigations, { type: '', name: '', notes: '' }]
    });
  };

  const removeInvestigation = (index: number) => {
    setForm({
      ...form,
      investigations: form.investigations.filter((_, i) => i !== index)
    });
  };

  const updateInvestigation = (index: number, field: string, value: string) => {
    const items = [...form.investigations];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, investigations: items });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Diagnostic *</label>
        <input
          type="text"
          value={form.diagnosis}
          onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
          className={inputClass}
          placeholder="Ex: Hipertensiune arterială stadiul I"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Anamneză</label>
        <textarea
          value={form.anamnesis}
          onChange={(e) => setForm({ ...form, anamnesis: e.target.value })}
          className={inputClass}
          rows={3}
          placeholder="Istoricul pacientului, simptome declarate..."
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Examen obiectiv</label>
        <textarea
          value={form.examinationNotes}
          onChange={(e) => setForm({ ...form, examinationNotes: e.target.value })}
          className={inputClass}
          rows={3}
          placeholder="Rezultatele examinării fizice..."
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Plan de tratament</label>
        <textarea
          value={form.treatmentPlan}
          onChange={(e) => setForm({ ...form, treatmentPlan: e.target.value })}
          className={inputClass}
          rows={2}
          placeholder="Tratamentul recomandat..."
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Recomandări</label>
        <textarea
          value={form.recommendations}
          onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
          className={inputClass}
          rows={2}
          placeholder="Sfaturi și recomandări pentru pacient..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-800">Rețetă</h3>
          <button
            onClick={addPrescriptionItem}
            className="text-xs text-blue-600 hover:underline"
          >
            + Adaugă medicament
          </button>
        </div>

        {form.prescriptionItems.map((item, index) => (
          <div key={index} className="bg-gray-50 rounded-xl p-4 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Medicament</label>
                <input
                  type="text"
                  value={item.medicationName}
                  onChange={(e) => updatePrescriptionItem(index, 'medicationName', e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Enalapril"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Doză</label>
                <input
                  type="text"
                  value={item.dosage}
                  onChange={(e) => updatePrescriptionItem(index, 'dosage', e.target.value)}
                  className={inputClass}
                  placeholder="Ex: 10mg"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Frecvență</label>
                <input
                  type="text"
                  value={item.frequency}
                  onChange={(e) => updatePrescriptionItem(index, 'frequency', e.target.value)}
                  className={inputClass}
                  placeholder="Ex: de 2 ori pe zi"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Durată</label>
                <input
                  type="text"
                  value={item.duration}
                  onChange={(e) => updatePrescriptionItem(index, 'duration', e.target.value)}
                  className={inputClass}
                  placeholder="Ex: 30 zile"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cantitate</label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updatePrescriptionItem(index, 'quantity', Number(e.target.value))}
                  className={inputClass}
                  min={1}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Instrucțiuni</label>
                <input
                  type="text"
                  value={item.instructions}
                  onChange={(e) => updatePrescriptionItem(index, 'instructions', e.target.value)}
                  className={inputClass}
                  placeholder="Ex: după masă"
                />
              </div>
            </div>
            <button
              onClick={() => removePrescriptionItem(index)}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Elimină
            </button>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-800">Investigații</h3>
          <button
            onClick={addInvestigation}
            className="text-xs text-blue-600 hover:underline"
          >
            + Adaugă investigație
          </button>
        </div>

        {form.investigations.map((inv, index) => (
          <div key={index} className="bg-gray-50 rounded-xl p-4 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tip</label>
                <select
                  value={inv.type}
                  onChange={(e) => updateInvestigation(index, 'type', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selectează...</option>
                  <option value="blood_test">Analize sânge</option>
                  <option value="urine_test">Analize urină</option>
                  <option value="xray">Radiografie</option>
                  <option value="echo">Ecografie</option>
                  <option value="mri">RMN</option>
                  <option value="ct">CT</option>
                  <option value="ekg">EKG</option>
                  <option value="other">Altele</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Denumire</label>
                <input
                  type="text"
                  value={inv.name}
                  onChange={(e) => updateInvestigation(index, 'name', e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Hemoleucogramă completă"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Note</label>
                <input
                  type="text"
                  value={inv.notes}
                  onChange={(e) => updateInvestigation(index, 'notes', e.target.value)}
                  className={inputClass}
                  placeholder="Instrucțiuni speciale..."
                />
              </div>
            </div>
            <button
              onClick={() => removeInvestigation(index)}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Elimină
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={handleSubmit}
          disabled={submitting || !form.diagnosis}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? 'Se salvează...' : 'Salvează fișa medicală'}
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Anulează
        </button>
      </div>
    </div>
  );
}