import { useState, useEffect } from 'react';
import { medicalRecordsApi } from '../api/medicalRecordsApi';
import type { MedicalRecordDto } from '../types/medical';

interface Props {
  patientId: string;
  patientName: string;
  onClose: () => void;
}

export default function PatientHistoryModal({ patientId, patientName, onClose }: Props) {
  const [records, setRecords] = useState<MedicalRecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const response = await medicalRecordsApi.getPatientHistoryForDoctor(patientId);
      setRecords(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [patientId]);

  const handleCompleteInvestigation = async (investigationId: string) => {
    setCompleting(investigationId);
    try {
      await medicalRecordsApi.completeInvestigation(investigationId);
      fetchHistory();
    } finally {
      setCompleting(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ro-RO', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Istoric medical — {patientName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Se încarcă...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Nu există fișe medicale anterioare</div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{record.diagnosis}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(record.recordDate)}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {expandedId === record.id ? '▲' : '▼'}
                      </span>
                    </div>
                  </button>

                  {expandedId === record.id && (
                    <div className="px-4 pb-4 border-t border-gray-50 space-y-3">
                      {record.anamnesis && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Anamneză</p>
                          <p className="text-sm text-gray-700">{record.anamnesis}</p>
                        </div>
                      )}
                      {record.examinationNotes && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Examen obiectiv</p>
                          <p className="text-sm text-gray-700">{record.examinationNotes}</p>
                        </div>
                      )}
                      {record.treatmentPlan && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Plan tratament</p>
                          <p className="text-sm text-gray-700">{record.treatmentPlan}</p>
                        </div>
                      )}
                      {record.prescriptions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Rețete</p>
                          {record.prescriptions.map((p) => (
                            <div key={p.id} className="bg-blue-50 rounded-lg p-3 mb-2">
                              <p className="text-xs text-blue-700 mb-1">{p.prescriptionNumber}</p>
                              {p.items.map((item, i) => (
                                <p key={i} className="text-sm text-gray-700">
                                  <span className="font-medium">{item.medicationName}</span> {item.dosage} — {item.frequency}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {record.investigations.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Investigații</p>
                          {record.investigations.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                              <div>
                                <p className="text-sm text-gray-700">{inv.name}</p>
                                {inv.resultUrl && (
                                  <a
                                  href={`http://localhost:5289${inv.resultUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                  >
                                    Vezi rezultat
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  inv.status === 'completed' ? 'bg-green-50 text-green-600' :
                                  inv.status === 'result_uploaded' ? 'bg-blue-50 text-blue-600' :
                                  'bg-yellow-50 text-yellow-600'
                                }`}>
                                  {inv.status === 'completed' ? 'Finalizat' :
                                   inv.status === 'result_uploaded' ? 'Rezultat încărcat' :
                                   'În așteptare'}
                                </span>
                                {inv.status !== 'completed' && (
                                  <button
                                    onClick={() => handleCompleteInvestigation(inv.id)}
                                    disabled={completing === inv.id}
                                    className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                  >
                                    {completing === inv.id ? '...' : 'Aprobă'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}