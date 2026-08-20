import React, { useState, useRef } from 'react';
import { Assessment, AssessmentResource } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { 
  Paperclip, 
  FileText, 
  File, 
  FileArchive, 
  Trash2, 
  Plus, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  X
} from 'lucide-react';

interface AssessmentResourceManagerProps {
  assessment: Assessment;
  onUpdate: (updated: Assessment) => void;
}

export const AssessmentResourceManager: React.FC<AssessmentResourceManagerProps> = ({
  assessment,
  onUpdate,
}) => {
  const { addToast } = useApp();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [resourceName, setResourceName] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceType, setResourceType] = useState<AssessmentResource['fileType']>('pdf');
  const [resourceSizeMb, setResourceSizeMb] = useState(1.5);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resources = assessment.resources || [];

  const getFileIcon = (type?: AssessmentResource['fileType']) => {
    switch (type) {
      case 'pdf':
        return <span className="bg-rose-100 text-rose-700 font-bold px-2 py-1 rounded text-[10px] font-mono">PDF</span>;
      case 'docx':
        return <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-[10px] font-mono">DOCX</span>;
      case 'pptx':
        return <span className="bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded text-[10px] font-mono">PPTX</span>;
      case 'xlsx':
      case 'csv':
        return <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded text-[10px] font-mono">{(type || 'file').toUpperCase()}</span>;
      case 'zip':
        return <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-[10px] font-mono">ZIP</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded text-[10px] font-mono">{(type || 'FILE').toUpperCase()}</span>;
    }
  };

  const handleFilePicked = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let detectedType: AssessmentResource['fileType'] = 'other';
    if (ext === 'pdf') detectedType = 'pdf';
    else if (ext === 'doc' || ext === 'docx') detectedType = 'docx';
    else if (ext === 'ppt' || ext === 'pptx') detectedType = 'pptx';
    else if (ext === 'xlsx') detectedType = 'xlsx';
    else if (ext === 'csv') detectedType = 'csv';
    else if (ext === 'zip') detectedType = 'zip';
    else if (ext === 'txt') detectedType = 'txt';

    const sizeMb = Number((file.size / (1024 * 1024)).toFixed(2));
    setResourceName(file.name);
    setResourceType(detectedType);
    setResourceSizeMb(sizeMb > 0 ? sizeMb : 0.5);
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceName.trim()) return;

    const newRes: AssessmentResource = {
      id: 'res-' + Date.now().toString(36),
      name: resourceName.trim(),
      fileType: resourceType,
      fileSizeMb: Number(resourceSizeMb) || 1.2,
      description: resourceDescription.trim() || undefined,
      uploadedAt: new Date().toISOString().split('T')[0],
      url: '#',
    };

    const updatedAssessment: Assessment = {
      ...assessment,
      resources: [...resources, newRes],
      updatedAt: new Date().toISOString(),
    };

    onUpdate(updatedAssessment);
    setShowUploadModal(false);
    setResourceName('');
    setResourceDescription('');
    addToast({
      title: 'Resource Linked 📎',
      message: `"${newRes.name}" attached to ${assessment.title}.`,
      type: 'success',
    });
  };

  const handleRemoveResource = (resId: string) => {
    const target = resources.find(r => r.id === resId);
    const updated: Assessment = {
      ...assessment,
      resources: resources.filter(r => r.id !== resId),
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
    addToast({
      title: 'Resource Removed',
      message: target ? `"${target.name}" was unlinked.` : 'Resource removed.',
      type: 'info',
    });
  };

  const handleDownloadStub = (res: AssessmentResource) => {
    // Generate sample document simulation download
    const dummyText = `NextGen Class Academy - Assessment Study Pack & Resource\n\nDocument Name: ${res.name}\nType: ${(res.fileType || 'file').toUpperCase()}\nAssessment: ${assessment.title}\nDescription: ${res.description || 'Assessment reference material.'}\nUploaded Date: ${res.uploadedAt}\n\nCandidate Instructions: Refer to this document during your screening test if specified.`;
    const blob = new Blob([dummyText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', res.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-0.5">
            <Paperclip className="w-3.5 h-3.5" />
            <span>Assessment Resource Management</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
            Attached Reference Materials & Study Guides
          </h3>
          <p className="text-xs text-slate-500">
            Upload PDFs, DOCX, PPTX, and reference files linked to this assessment for candidate reference.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              const samplePresets: AssessmentResource[] = [
                {
                  id: `res-sample-pdf-${Date.now()}`,
                  name: 'Candidate_Screening_Study_Guide.pdf',
                  fileType: 'pdf',
                  fileSizeMb: 2.4,
                  uploadedAt: new Date().toISOString().split('T')[0],
                  description: 'Comprehensive curriculum overview, problem-solving guidelines, and rubric grading criteria.',
                },
                {
                  id: `res-sample-pptx-${Date.now()}`,
                  name: 'System_Architecture_Reference_Slides.pptx',
                  fileType: 'pptx',
                  fileSizeMb: 4.8,
                  uploadedAt: new Date().toISOString().split('T')[0],
                  description: 'Slide deck outlining core architecture paradigms tested in the scenario section.',
                },
                {
                  id: `res-sample-xlsx-${Date.now()}`,
                  name: 'Benchmark_Evaluation_Dataset.xlsx',
                  fileType: 'xlsx',
                  fileSizeMb: 1.1,
                  uploadedAt: new Date().toISOString().split('T')[0],
                  description: 'Reference data matrix and sample numerical cases for logic questions.',
                }
              ];
              const randomPreset = samplePresets[Math.floor(Math.random() * samplePresets.length)];
              const updatedAssessment: Assessment = {
                ...assessment,
                resources: [...resources, randomPreset],
                updatedAt: new Date().toISOString(),
              };
              onUpdate(updatedAssessment);
              addToast({
                title: 'Sample Resource Added',
                message: `Added "${randomPreset.name}" to assessment.`,
                type: 'success',
              });
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            title="Generate a pre-filled sample resource"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Quick Sample Preset</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Resource</span>
          </button>
        </div>
      </div>

      {/* Program Manager Guidance Notice */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-indigo-950">
        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Applicant Visibility:</span>
          <p className="text-[11px] text-indigo-900 leading-relaxed">
            All files uploaded here are immediately available to enrolled applicants in the <strong>Assessments & Resources</strong> hub on their applicant portal and inside their active examination screen.
          </p>
        </div>
      </div>

      {/* Resource Cards Grid */}
      {resources.length === 0 ? (
        <div className="bg-slate-50 rounded-xl p-6 text-center border border-dashed border-slate-200 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-200/70 text-slate-400 mx-auto flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-slate-700">No Attached Resources Yet</div>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Attach candidate briefs, coding cheat sheets, architecture diagrams, or PPTX slides to support this screening test.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {resources.map(res => (
            <div
              key={res.id}
              className="bg-slate-50/80 hover:bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex flex-col justify-between space-y-3 transition"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(res.fileType)}
                    <span className="font-bold text-slate-800 text-xs truncate max-w-[170px]" title={res.name}>
                      {res.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveResource(res.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                    title="Remove Attachment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {res.description && (
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {res.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>{res.fileSizeMb} MB • {res.uploadedAt}</span>
                <button
                  onClick={() => handleDownloadStub(res)}
                  className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Resource Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                  Attach Resource to Assessment
                </h4>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="p-6 space-y-4 text-xs">
              {/* Drop area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFilePicked(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                  dragOver ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.csv,.zip,.txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilePicked(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-indigo-600 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-700">Click to choose or drag & drop file</p>
                <p className="text-[10px] text-slate-400 mt-0.5">PDF, DOCX, PPTX, XLSX, ZIP (Max 25MB)</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Resource Name / File Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={resourceName}
                  onChange={e => setResourceName(e.target.value)}
                  placeholder="e.g. GenAI_Candidate_Study_Pack.pdf"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    File Type
                  </label>
                  <select
                    value={resourceType}
                    onChange={e => setResourceType(e.target.value as AssessmentResource['fileType'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-xs font-semibold"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="docx">Word Document (DOCX)</option>
                    <option value="pptx">PowerPoint Slides (PPTX)</option>
                    <option value="xlsx">Excel Spreadsheet (XLSX)</option>
                    <option value="csv">CSV Data</option>
                    <option value="zip">ZIP Archive</option>
                    <option value="txt">Text Guide (TXT)</option>
                    <option value="other">Other Attachment</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    File Size (MB)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={resourceSizeMb}
                    onChange={e => setResourceSizeMb(parseFloat(e.target.value) || 1.0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description / Purpose (Optional)
                </label>
                <textarea
                  rows={2}
                  value={resourceDescription}
                  onChange={e => setResourceDescription(e.target.value)}
                  placeholder="Brief note on how candidate should use this resource..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!resourceName.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-bold transition cursor-pointer shadow-sm flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Attach to Assessment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
