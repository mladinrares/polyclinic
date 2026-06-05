import { useState, useEffect, useRef } from 'react';
import { documentsApi } from '../api/documentsApi';
import type { DocumentDto } from '../types/document';
import { getErrorMessage } from '../utils/errorUtils';

const documentTypes = [
  { value: 'analysis', label: 'Analize laborator' },
  { value: 'imaging', label: 'Imagistică (RMN, CT, Eco)' },
  { value: 'prescription', label: 'Rețetă externă' },
  { value: 'insurance', label: 'Asigurare medicală' },
  { value: 'other', label: 'Altele' },
];

const typeIcons: Record<string, string> = {
  analysis: '🧪',
  imaging: '🔬',
  prescription: '💊',
  insurance: '📋',
  other: '📄',
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('analysis');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
    
  const fetchDocuments = async () => {
    try {
      const response = await documentsApi.getMyDocuments();
      setDocuments(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !uploadName) return;
    setUploading(true);
    setError(null);
    try {
      await documentsApi.uploadDocument(selectedFile, uploadType, uploadName);
      setSuccess('Document încărcat cu succes');
      setShowUploadForm(false);
      setSelectedFile(null);
      setUploadName('');
      fetchDocuments();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest document?')) return;
    try {
      await documentsApi.deleteDocument(id);
      setDocuments(documents.filter(d => d.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ro-RO', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

  if (loading) return <div className="text-center py-20 text-gray-400">Se încarcă...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800 mb-2">Documentele mele</h1>
          <p className="text-gray-500">Analize, imagistică și alte documente medicale</p>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Încarcă document
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>
      )}

      {showUploadForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="font-medium text-gray-800 mb-4">Document nou</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nume document</label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Hemoleucogramă completă 2026"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tip document</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Fișier (PDF, JPG, PNG — max 10MB)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedFile && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedFile.name} — {Math.round(selectedFile.size / 1024)} KB
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !uploadName}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {uploading ? 'Se încarcă...' : 'Încarcă'}
              </button>
              <button
                onClick={() => { setShowUploadForm(false); setSelectedFile(null); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          Nu ai documente încărcate
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{typeIcons[doc.type] ?? '📄'}</span>
                <div>
                  <p className="font-medium text-gray-800">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    {documentTypes.find(t => t.value === doc.type)?.label} • {doc.fileSize} • {formatDate(doc.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                href={`http://localhost:5289/${doc.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
                >
                    Descarcă
                </a>
                
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Șterge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}