import React, { useState, useRef } from 'react';
import { BulkUploadValidationError } from '../../types';
import { validateAndParseFormCsv, SAMPLE_FORM_CSV } from '../../utils/formCsvParser';
import { 
  X, 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  FileSpreadsheet, 
  ArrowRight,
  Layers,
  HelpCircle,
  Check,
  AlertTriangle
} from 'lucide-react';

interface FormBulkUploadModalProps {
  formId: string;
  formTitle: string;
  onImport: (csvData: string, mode: 'replace' | 'append') => void;
  onClose: () => void;
}

export const FormBulkUploadModal: React.FC<FormBulkUploadModalProps> = ({
  formId,
  formTitle,
  onImport,
  onClose,
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [validationResult, setValidationResult] = useState<{
    tested: boolean;
    validCount: number;
    errors: BulkUploadValidationError[];
  }>({ tested: false, validCount: 0, errors: [] });
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      runValidation(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const runValidation = (text: string) => {
    if (!text.trim()) {
      setValidationResult({ tested: false, validCount: 0, errors: [] });
      return;
    }
    const result = validateAndParseFormCsv(text, formId);
    setValidationResult({
      tested: true,
      validCount: result.validRows.length,
      errors: result.errors,
    });
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_FORM_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'nextgen_application_form_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = () => {
    if (validationResult.errors.length > 0) return;
    if (!csvContent.trim()) return;
    onImport(csvContent, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Space_Grotesk'] text-white">
                Bulk Upload Application Questions
              </h3>
              <p className="text-xs text-slate-300">
                Target Form: <span className="text-indigo-300 font-semibold">{formTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Format Specification Banner */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex flex-wrap sm:flex-nowrap items-start justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-indigo-900 flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Required CSV Header Schema</span>
              </div>
              <p className="text-slate-600">
                Your spreadsheet must include these columns: <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono text-[11px] text-indigo-800">Section, Question, Type, Required, Options, Description</code>
              </p>
              <p className="text-[11px] text-slate-500">
                Options for dropdowns/radios/checkboxes should be separated by semicolons (e.g. <code>Option A; Option B; Option C</code>).
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadSample}
              className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Template</span>
            </button>
          </div>

          {/* Mode Switcher: Upload File vs Paste Text */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                inputMode === 'upload'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Upload CSV / XLSX File
            </button>
            <button
              type="button"
              onClick={() => setInputMode('paste')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                inputMode === 'paste'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Paste CSV / TSV Raw Text
            </button>
          </div>

          {/* UPLOAD MODE */}
          {inputMode === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                dragActive 
                  ? 'border-indigo-600 bg-indigo-50/50' 
                  : fileName
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              {fileName ? (
                <div>
                  <div className="text-sm font-bold text-emerald-800 flex items-center justify-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{fileName}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Click to replace file</p>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    Click to browse or drag & drop CSV file
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Accepts formatted .csv or .tsv spreadsheets (Max 10MB)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PASTE MODE */}
          {inputMode === 'paste' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Raw CSV / TSV Content
              </label>
              <textarea
                rows={6}
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  runValidation(e.target.value);
                }}
                placeholder="Section,Question,Type,Required,Options,Description&#10;Personal,Full Legal Name,Short text,true,,As in passport&#10;Experience,Years in Tech,Number,true,,Enter 0 if beginner"
                className="w-full font-mono text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          )}

          {/* VALIDATION PRE-FLIGHT REPORT */}
          {validationResult.tested && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Pre-Flight Validation Results
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  validationResult.errors.length === 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  {validationResult.errors.length === 0 
                    ? `✓ Ready to Import (${validationResult.validCount} valid questions)` 
                    : `⚠️ ${validationResult.errors.length} Errors Found`}
                </span>
              </div>

              {validationResult.errors.length > 0 ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
                  <div className="text-xs font-bold text-rose-900 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Upload halted: Fix the following issues in your file before importing:</span>
                  </div>
                  <div className="divide-y divide-rose-100 text-xs">
                    {validationResult.errors.map((err, idx) => (
                      <div key={idx} className="py-1.5 flex items-start space-x-2 text-rose-800">
                        <span className="font-mono font-bold bg-rose-200/70 px-1 rounded text-[10px]">
                          {err.row > 0 ? `Row ${err.row}` : err.column}
                        </span>
                        <span className="flex-1">{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center space-x-2.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <strong className="font-bold">Spreadsheet structure is 100% valid!</strong>
                    <div>Found {validationResult.validCount} structured questions across sections ready to attach.</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* IMPORT MODE (Append vs Replace) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Integration Strategy
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                importMode === 'append'
                  ? 'border-indigo-600 bg-indigo-50/60'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">Append to Existing Form</div>
                  <div className="text-[11px] text-slate-500">Adds imported questions to existing matching sections without deleting current fields.</div>
                </div>
              </label>

              <label className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                importMode === 'replace'
                  ? 'border-rose-600 bg-rose-50/60'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">Replace Entire Form Content</div>
                  <div className="text-[11px] text-slate-500">Overwrites all current sections and fields with the uploaded questions.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!validationResult.tested || validationResult.errors.length > 0 || validationResult.validCount === 0}
            onClick={handleExecuteImport}
            className="flex items-center space-x-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Import {validationResult.validCount > 0 ? `${validationResult.validCount} Questions` : 'Questions'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
