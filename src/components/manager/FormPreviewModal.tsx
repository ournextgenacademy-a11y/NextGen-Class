import React, { useState } from 'react';
import { ApplicationForm, ApplicationFormField } from '../../types';
import { FIELD_TYPE_LABELS } from '../../utils/formCsvParser';
import { 
  X, 
  Monitor, 
  Tablet, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  UploadCloud, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Eye,
  Check
} from 'lucide-react';

interface FormPreviewModalProps {
  form: ApplicationForm;
  programTitle?: string;
  onClose: () => void;
}

export const FormPreviewModal: React.FC<FormPreviewModalProps> = ({
  form,
  programTitle = 'Generative AI Academy',
  onClose,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submittedSimulated, setSubmittedSimulated] = useState(false);

  const sections = form.sections.sort((a, b) => a.displayOrder - b.displayOrder);
  const currentSection = sections[currentSectionIndex] || sections[0];

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Clear error on edit
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validateCurrentSection = (): boolean => {
    if (!currentSection) return true;
    const errors: Record<string, string> = {};

    currentSection.fields.forEach(field => {
      const val = formData[field.id];
      if (field.required) {
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          errors[field.id] = `${field.label} is required.`;
          return;
        }
      }

      if (val && field.validationRules) {
        if (field.validationRules.minLength && typeof val === 'string' && val.length < field.validationRules.minLength) {
          errors[field.id] = `Minimum length is ${field.validationRules.minLength} characters (current: ${val.length}).`;
        }
        if (field.validationRules.maxLength && typeof val === 'string' && val.length > field.validationRules.maxLength) {
          errors[field.id] = `Maximum length is ${field.validationRules.maxLength} characters.`;
        }
        if (field.validationRules.min !== undefined && typeof val === 'number' && val < field.validationRules.min) {
          errors[field.id] = `Value cannot be less than ${field.validationRules.min}.`;
        }
        if (field.validationRules.max !== undefined && typeof val === 'number' && val > field.validationRules.max) {
          errors[field.id] = `Value cannot exceed ${field.validationRules.max}.`;
        }
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextSection = () => {
    if (!validateCurrentSection()) return;
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
    } else {
      setSubmittedSimulated(true);
    }
  };

  const renderFieldInput = (field: ApplicationFormField) => {
    const val = formData[field.id] ?? '';
    const hasError = !!fieldErrors[field.id];

    switch (field.fieldType) {
      case 'short_text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            type={field.fieldType === 'email' ? 'email' : field.fieldType === 'phone' ? 'tel' : field.fieldType === 'url' ? 'url' : 'text'}
            value={val}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-white transition ${
              hasError 
                ? 'border-rose-400 focus:ring-2 focus:ring-rose-500' 
                : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
            }`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={val}
            min={field.validationRules?.min}
            max={field.validationRules?.max}
            placeholder={field.placeholder || '0'}
            onChange={(e) => handleInputChange(field.id, e.target.value === '' ? '' : parseFloat(e.target.value))}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-white transition ${
              hasError 
                ? 'border-rose-400 focus:ring-2 focus:ring-rose-500' 
                : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
            }`}
          />
        );

      case 'date':
        return (
          <div className="relative">
            <input
              type="date"
              value={val}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-white transition ${
                hasError 
                  ? 'border-rose-400 focus:ring-2 focus:ring-rose-500' 
                  : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
              }`}
            />
          </div>
        );

      case 'long_text':
        return (
          <div className="space-y-1">
            <textarea
              rows={4}
              value={val}
              placeholder={field.placeholder || 'Type your response here...'}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-white transition ${
                hasError 
                  ? 'border-rose-400 focus:ring-2 focus:ring-rose-500' 
                  : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
              }`}
            />
            {field.validationRules?.maxLength && (
              <div className="text-right text-[10px] text-slate-400">
                {(val as string).length} / {field.validationRules.maxLength} characters
              </div>
            )}
          </div>
        );

      case 'dropdown':
        return (
          <select
            value={val}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-white transition ${
              hasError 
                ? 'border-rose-400 focus:ring-2 focus:ring-rose-500' 
                : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
            }`}
          >
            <option value="">{field.placeholder || 'Select an option...'}</option>
            {(field.options || []).map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2 pt-1">
            {(field.options || []).map((opt, i) => (
              <label 
                key={i} 
                className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition ${
                  val === opt ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name={`preview-${field.id}`}
                  checked={val === opt}
                  onChange={() => handleInputChange(field.id, opt)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs sm:text-sm text-slate-800 font-medium">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
      case 'multiple_choice': {
        const selectedArr: string[] = Array.isArray(val) ? val : [];
        return (
          <div className="space-y-2 pt-1">
            {(field.options || []).map((opt, i) => {
              const isChecked = selectedArr.includes(opt);
              return (
                <label 
                  key={i} 
                  className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition ${
                    isChecked ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const next = isChecked 
                        ? selectedArr.filter(x => x !== opt) 
                        : [...selectedArr, opt];
                      handleInputChange(field.id, next);
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs sm:text-sm text-slate-800 font-medium">{opt}</span>
                </label>
              );
            })}
          </div>
        );
      }

      case 'file_upload':
        return (
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
            <UploadCloud className="w-7 h-7 text-indigo-600 mx-auto mb-1.5" />
            <div className="text-xs font-bold text-slate-800">
              {val ? `Selected: ${(val as string).split('/').pop() || 'sample_document.pdf'}` : 'Click or Drag document here to upload'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Allowed: {field.validationRules?.allowedFileExtensions?.join(', ') || 'PDF, DOCX'} • Max {field.validationRules?.maxFileSizeMb || 5}MB
            </p>
            <input
              type="file"
              className="hidden"
              id={`upload-${field.id}`}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleInputChange(field.id, e.target.files[0].name);
                }
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
      
      {/* Top Preview Bar */}
      <div className="w-full max-w-5xl bg-slate-900 text-white rounded-t-2xl px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Candidate Experience Preview
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-300">
                v{form.version} • {(form.status || 'draft').toUpperCase()}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white truncate max-w-md">
              {form.title}
            </h3>
          </div>
        </div>

        {/* Viewport Width Controls */}
        <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
              deviceMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('tablet')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
              deviceMode === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-4 h-4" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
              deviceMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Viewport Frame Container */}
      <div className="w-full max-w-5xl flex-1 bg-slate-900/60 p-4 flex justify-center items-center overflow-y-auto border-x border-b border-slate-800 rounded-b-2xl">
        
        <div 
          className={`bg-white rounded-2xl shadow-2xl border border-slate-200 transition-all duration-300 flex flex-col max-h-[80vh] overflow-hidden ${
            deviceMode === 'desktop' 
              ? 'w-full max-w-3xl' 
              : deviceMode === 'tablet' 
                ? 'w-[720px]' 
                : 'w-[375px]'
          }`}
        >
          {/* Simulated Applicant Screen Header */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white">
            <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">
              {programTitle} • Application Dossier
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-['Space_Grotesk'] text-white">
              {form.title}
            </h2>
            {form.description && (
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                {form.description}
              </p>
            )}

            {/* Section Progress Stepper */}
            {sections.length > 1 && (
              <div className="flex items-center space-x-2 mt-4 overflow-x-auto pb-1">
                {sections.map((sec, idx) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setCurrentSectionIndex(idx)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                      currentSectionIndex === idx
                        ? 'bg-indigo-600 text-white'
                        : idx < currentSectionIndex
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50'
                          : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{idx + 1}.</span>
                    <span>{sec.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Simulated Submission State */}
          {submittedSimulated ? (
            <div className="p-8 text-center space-y-4 my-auto">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-['Space_Grotesk']">
                Application Form Test Successful!
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                All mandatory fields and validation constraints were satisfied across {sections.length} sections and {sections.reduce((acc, s) => acc + s.fields.length, 0)} questions.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmittedSimulated(false);
                  setCurrentSectionIndex(0);
                  setFormData({});
                }}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Reset Test Form
              </button>
            </div>
          ) : (
            /* Active Section Fields Canvas */
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {currentSection ? (
                <div>
                  <div className="border-b border-slate-100 pb-3 mb-5">
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Section {currentSectionIndex + 1} of {sections.length}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk'] mt-0.5">
                      {currentSection.title}
                    </h3>
                    {currentSection.description && (
                      <p className="text-xs text-slate-500 mt-1">
                        {currentSection.description}
                      </p>
                    )}
                  </div>

                  {currentSection.fields.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No questions configured in this section yet.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {currentSection.fields
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((field) => (
                          <div key={field.id} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-800">
                                {field.label}
                                {field.required ? (
                                  <span className="text-rose-500 ml-1 font-bold">*</span>
                                ) : (
                                  <span className="text-slate-400 font-normal ml-1.5 text-[10px]">(Optional)</span>
                                )}
                              </label>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {FIELD_TYPE_LABELS[field.fieldType]}
                              </span>
                            </div>

                            {field.description && (
                              <p className="text-[11px] text-slate-500">{field.description}</p>
                            )}

                            {renderFieldInput(field)}

                            {fieldErrors[field.id] && (
                              <div className="flex items-center space-x-1 text-[11px] text-rose-600 font-medium pt-0.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{fieldErrors[field.id]}</span>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Preview Navigation Bottom Bar */}
          {!submittedSimulated && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                disabled={currentSectionIndex === 0}
                onClick={() => setCurrentSectionIndex(prev => prev - 1)}
                className="flex items-center space-x-1 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Section</span>
              </button>

              <button
                type="button"
                onClick={handleNextSection}
                className="flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                <span>{currentSectionIndex === sections.length - 1 ? 'Complete & Submit Test' : 'Continue to Next Section'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
