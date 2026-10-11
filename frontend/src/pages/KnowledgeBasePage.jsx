import React, { useCallback, useEffect, useState } from 'react';
import { knowledgeApi } from '../api/knowledgeApi';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatDate } from '../utils/dateUtils';
import {
  BookOpen,
  Plus,
  UploadCloud,
  FileText,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Eye,
} from 'lucide-react';

export function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, SYSTEM, MY_UPLOADS
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success' | 'error', message }
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await knowledgeApi.listDocuments();
      setDocuments(data || []);
    } catch (err) {
      setLoadError(err.userMessage || 'Unable to load documents from the knowledge service.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = documents.filter((doc) => {
    if (activeTab === 'SYSTEM') return doc.source === 'System';
    if (activeTab === 'MY_UPLOADS') return doc.source === 'My Upload';
    return true;
  });

  const formatSize = (sizeBytes = 0) => {
    if (!sizeBytes) return 'Size unavailable';
    if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadStatus({
          type: 'error',
          message: 'Only PDF documents (.pdf) are supported.',
        });
        return;
      }
      setSelectedFile(file);
      setUploadStatus(null);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const response = await knowledgeApi.uploadPdf(selectedFile);
      setUploadStatus({
        type: 'success',
        message: `Successfully ingested "${response.title || selectedFile.name}" into the knowledge service.`,
      });
      setSelectedFile(null);
      await fetchDocuments();
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadStatus(null);
      }, 1800);
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: err.userMessage || 'Upload failed. Ensure knowledge-service is running on port 8083.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section (Screen 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Knowledge Base
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload and manage documents for RAG.
          </p>
        </div>

        <button
          onClick={() => {
            setShowUploadModal(true);
            setUploadStatus(null);
            setSelectedFile(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Upload PDF</span>
        </button>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tabs Row */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ALL'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Documents
          </button>
          <button
            onClick={() => setActiveTab('SYSTEM')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'SYSTEM'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            System Documents
          </button>
          <button
            onClick={() => setActiveTab('MY_UPLOADS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'MY_UPLOADS'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            My Uploads
          </button>
        </div>

        {/* Documents Table */}
        {loadError && (
          <div className="m-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-slate-500">Loading documents from knowledge service...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No documents found"
              description="Upload a PDF to register it in the backend knowledge base."
              actionLabel="Upload PDF"
              onAction={() => setShowUploadModal(true)}
            />
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Source</th>
                <th className="py-3.5 px-6">Chunks</th>
                <th className="py-3.5 px-6">Uploaded</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">{doc.name}</span>
                        <p className="text-[11px] text-slate-400">{formatSize(doc.sizeBytes)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {doc.source === 'System' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        System
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        My Upload
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-700">
                    {doc.chunks}
                  </td>
                  <td className="py-4 px-6 text-slate-500">
                    {doc.uploadedAt ? formatDate(doc.uploadedAt) : 'Unknown'}
                  </td>
                  <td className="py-4 px-6 text-right relative">
                    <button
                      onClick={() =>
                        setActiveMenuId(activeMenuId === doc.id ? null : doc.id)
                      }
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === doc.id && (
                      <div className="absolute right-6 top-10 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 text-left">
                        <button
                          onClick={() => {
                            alert(`Document: ${doc.name}\nChunks: ${doc.chunks}\nSource: ${doc.source}`);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Info</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Upload PDF Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Upload PDF for RAG</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadStatus && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                  uploadStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {uploadStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{uploadStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                <input
                  type="file"
                  id="pdfUploadInput"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="pdfUploadInput"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Click to select PDF document'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Maximum size: 10 MB (Scanned text requires OCR)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Ingesting into Vector Store...</span>
                    </>
                  ) : (
                    <span>Upload & Ingest</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
