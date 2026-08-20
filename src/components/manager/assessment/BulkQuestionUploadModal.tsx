import React, { useState, useRef } from 'react';
import { Question } from '../../../types';
import { 
  parseQuestionBulkCSV, 
  downloadSampleAssessmentCSV, 
  BulkUploadParseResult, 
  QuestionUploadRow 
} from '../../../utils/assessmentBulkUpload';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Check, 
  Layers, 
  FileText,
  RotateCcw
} from 'lucide-react';

interface BulkQuestionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newQuestions: Question[], mode: 'append' | 'replace') => void;
  existingQuestions: Question[];
}

export const BulkQuestionUploadModal: React.FC<BulkQuestionUploadModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [csvText, setCsvText] = useState('');
  const [parseResult, setParseResult] = useState<BulkUploadParseResult | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'errors'>('all');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const existingIds = existingQuestions.map(q => q.id);

  const handleProcessCSV = (rawContent: string) => {
    setCsvText(rawContent);
    const res = parseQuestionBulkCSV(rawContent, importMode === 'replace' ? [] : existingIds);
    setParseResult(res);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      handleProcessCSV(content || '');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCommitImport = () => {
    if (!parseResult || parseResult.parsedQuestions.length === 0) return;
    onImport(parseResult.parsedQuestions, importMode);
    onClose();
  };

  const rowsToDisplay = parseResult
    ? filterMode === 'valid'
      ? parseResult.validRows
      : filterMode === 'errors'
      ? parseResult.errorRows
      : parseResult.allRows
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                Bulk Question Upload & Live Validation
              </h3>
              <p className="text-xs text-slate-500">
                Import multiple screening questions via CSV / Excel spreadsheet with strict schema validation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Top Actions: Sample Template Download & Mode */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-700">Expected Columns:</span>
              <span className="text-[11px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                ID, Question, Type, Option A-D, Correct Answer, Marks
              </span>
            </div>

            <button
              onClick={downloadSampleAssessmentCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download Sample CSV Template</span>
            </button>
          </div>

          {/* Upload / Paste Tabs */}
          <div className="flex border-b border-slate-200 space-x-4">
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 font-semibold text-xs border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'upload'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV / Spreadsheet File</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-2.5 font-semibold text-xs border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'paste'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Raw CSV Text</span>
            </button>
          </div>

          {/* Tab 1: File Drop Zone */}
          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                dragOver 
                  ? 'border-indigo-500 bg-indigo-50/50' 
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.txt,.tsv"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Click to browse or drag and drop your questions CSV file
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supports UTF-8 CSV, comma or tab delimited files
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Raw Text Area */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => handleProcessCSV(e.target.value)}
                placeholder="Question ID,Question,Type,Option A,Option B,Option C,Option D,Correct Answer,Marks&#10;Q1,What is vector embedding?,single_choice,Audio format,Mathematical text vector,GPU kernel,HTTP flag,B,10"
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          {/* Validation Metrics Ribbon */}
          {parseResult && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-3">
                <div 
                  onClick={() => setFilterMode('all')}
                  className={`p-3 rounded-xl border text-center cursor-pointer transition ${
                    filterMode === 'all' ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Rows</span>
                  <div className="text-xl font-bold text-slate-900 font-['Space_Grotesk']">
                    {parseResult.totalRows}
                  </div>
                </div>

                <div 
                  onClick={() => setFilterMode('valid')}
                  className={`p-3 rounded-xl border text-center cursor-pointer transition ${
                    filterMode === 'valid' ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-emerald-600 flex items-center justify-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Valid Questions</span>
                  </span>
                  <div className="text-xl font-bold text-emerald-700 font-['Space_Grotesk']">
                    {parseResult.validRows.length}
                  </div>
                </div>

                <div 
                  onClick={() => setFilterMode('errors')}
                  className={`p-3 rounded-xl border text-center cursor-pointer transition ${
                    filterMode === 'errors' ? 'bg-rose-50 border-rose-400 ring-1 ring-rose-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-rose-600 flex items-center justify-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Errors Detected</span>
                  </span>
                  <div className="text-xl font-bold text-rose-700 font-['Space_Grotesk']">
                    {parseResult.errorRows.length}
                  </div>
                </div>
              </div>

              {/* Import Mode Selector */}
              <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700">Import Destination Mode:</span>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => {
                        setImportMode('append');
                        if (csvText) handleProcessCSV(csvText);
                      }}
                      className="text-indigo-600"
                    />
                    <span className="text-xs text-slate-700">Append to current ({existingQuestions.length})</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => {
                        setImportMode('replace');
                        if (csvText) handleProcessCSV(csvText);
                      }}
                      className="text-rose-600"
                    />
                    <span className="text-xs text-rose-700 font-semibold">Replace all existing questions</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100/70 px-4 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Import Preview ({rowsToDisplay.length} rows showing)</span>
                  <div className="flex items-center space-x-1 text-[11px]">
                    <button
                      onClick={() => setFilterMode('all')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${filterMode === 'all' ? 'bg-white shadow-2xs font-bold' : 'text-slate-500'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterMode('valid')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${filterMode === 'valid' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-500'}`}
                    >
                      Valid Only
                    </button>
                    <button
                      onClick={() => setFilterMode('errors')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${filterMode === 'errors' ? 'bg-rose-100 text-rose-800 font-bold' : 'text-slate-500'}`}
                    >
                      Errors Only
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <th className="py-2 px-3">Row</th>
                        <th className="py-2 px-3">ID</th>
                        <th className="py-2 px-3">Question</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Correct Answer</th>
                        <th className="py-2 px-3">Marks</th>
                        <th className="py-2 px-3">Validation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rowsToDisplay.map((row) => (
                        <tr 
                          key={row.rowNumber}
                          className={row.isValid ? 'hover:bg-slate-50/50' : 'bg-rose-50/40 hover:bg-rose-50/60'}
                        >
                          <td className="py-2 px-3 font-mono text-slate-400">{row.rowNumber}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-700">{row.questionId}</td>
                          <td className="py-2 px-3 font-medium text-slate-800 max-w-xs truncate" title={row.prompt}>
                            {row.prompt || <span className="text-rose-500 italic">[Empty Question]</span>}
                          </td>
                          <td className="py-2 px-3 text-slate-600 capitalize">
                            {row.type.replace('_', ' ')}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-700 font-semibold">
                            {row.correctAnswer || <span className="text-rose-500 italic">[None]</span>}
                          </td>
                          <td className="py-2 px-3 font-bold text-indigo-600">
                            {row.marks} pts
                          </td>
                          <td className="py-2 px-3">
                            {row.isValid ? (
                              <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                                <Check className="w-3 h-3" />
                                <span>Valid</span>
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                {row.errors.map((err, errIdx) => (
                                  <span 
                                    key={errIdx}
                                    className="block text-rose-700 bg-rose-100/90 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                  >
                                    ✕ {err}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {parseResult ? (
              <span>
                {parseResult.validRows.length} of {parseResult.totalRows} questions ready for import.
              </span>
            ) : (
              <span>Upload or paste a CSV file to inspect preview.</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={!parseResult || parseResult.validRows.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-sm transition cursor-pointer flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Import Valid ({parseResult?.validRows.length || 0}) Questions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
