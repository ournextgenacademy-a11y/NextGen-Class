import React from 'react';
import { ApplicationFormField, UploadedFileRecord } from '../../types';
import { FileUploadField } from './FileUploadField';
import { 
  AlertCircle, 
  Check, 
  HelpCircle,
  Link as LinkIcon,
  Mail,
  Phone,
  Calendar,
  Hash,
  Type
} from 'lucide-react';

interface DynamicFormRendererProps {
  fields: ApplicationFormField[];
  values: Record<string, any>;
  uploadedFiles: Record<string, UploadedFileRecord>;
  onChange: (fieldId: string, value: any) => void;
  onFileUpload: (fieldId: string, fileRecord: UploadedFileRecord | null) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  fields,
  values,
  uploadedFiles,
  onChange,
  onFileUpload,
  errors = {},
  disabled = false,
}) => {
  // Sort by display order
  const sortedFields = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-6">
      {sortedFields.map((field) => {
        const val = values[field.id];
        const error = errors[field.id];
        const hasError = !!error;

        return (
          <div key={field.id} id={`form-field-${field.id}`} className="space-y-1.5">
            {/* Field Label & Required Asterisk (Except for file upload which has internal label) */}
            {field.fieldType !== 'file_upload' && (
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-800">
                  {field.label} {field.required && <span className="text-rose-500 font-bold">*</span>}
                </label>
                {field.description && (
                  <span className="text-[11px] text-slate-600 flex items-center space-x-1">
                    <HelpCircle className="w-3 h-3 text-slate-600" />
                    <span>{field.description}</span>
                  </span>
                )}
              </div>
            )}

            {/* 1. Short Text */}
            {field.fieldType === 'short_text' && (
              <div className="relative">
                <input
                  type="text"
                  value={val || ''}
                  disabled={disabled}
                  placeholder={field.placeholder || 'Enter your response...'}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className={`w-full text-xs p-3 rounded-xl border transition outline-none ${
                    hasError
                      ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  } ${disabled ? 'bg-slate-100 text-slate-500' : ''}`}
                />
              </div>
            )}

            {/* 2. Long Text */}
            {field.fieldType === 'long_text' && (
              <div className="space-y-1">
                <textarea
                  rows={4}
                  value={val || ''}
                  disabled={disabled}
                  placeholder={field.placeholder || 'Provide detailed response...'}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className={`w-full text-xs p-3 rounded-xl border transition outline-none resize-y ${
                    hasError
                      ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  } ${disabled ? 'bg-slate-100 text-slate-500' : ''}`}
                />
                <div className="flex justify-between text-[10px] text-slate-600 px-1">
                  <span>
                    {field.validationRules?.minLength ? `Min ${field.validationRules.minLength} chars` : ''}
                  </span>
                  <span>{(val || '').length} characters</span>
                </div>
              </div>
            )}

            {/* 3. Email */}
            {field.fieldType === 'email' && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={val || ''}
                  disabled={disabled}
                  placeholder={field.placeholder || 'you@domain.com'}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className={`w-full text-xs pl-9 p-3 rounded-xl border transition outline-none ${
                    hasError
                      ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  } ${disabled ? 'bg-slate-100 text-slate-500' : ''}`}
                />
              </div>
            )}

            {/* 4. Phone */}
            {field.fieldType === 'phone' && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={val || ''}
                  disabled={disabled}
                  placeholder={field.placeholder || '+234 800 000 0000'}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className={`w-full text-xs pl-9 p-3 rounded-xl border transition outline-none ${
                    hasError
                      ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  } ${disabled ? 'bg-slate-100 text-slate-500' : ''}`}
                />
              </div>
            )}

            {/* 5. Number */}
            {field.fieldType === 'number' && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min={field.validationRules?.min}
                  max={field.validationRules?.max}
                  value={val !== undefined && val !== null ? val : ''}
                  disabled={disabled}
                  placeholder={field.placeholder || '0'}
                  onChange={(e) => onChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
                  className={`w-full text-xs pl-9 p-3 rounded-xl border transition outline-none ${
                    hasError
                      ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  } ${disabled ? 'bg-slate-100 text-slate-500' : ''}`}
                />
              </div>
            )}

            {/* 6. Date */}
            {field.fieldType === 'date' && (
              <div className="relative">
                <input
                  type="date"
                  value={val || ''}
                  disabled={disabled}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className={`w-full text-xs p-3 rounded-xl border transition outline-none ${
                    hasError
                      ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  } ${disabled ? 'bg-slate-100 text-slate-500' : ''}`}
                />
              </div>
            )}

            {/* 7. Dropdown */}
            {field.fieldType === 'dropdown' && (
              <select
                value={val || ''}
                disabled={disabled}
                onChange={(e) => onChange(field.id, e.target.value)}
                className={`w-full text-xs p-3 rounded-xl border transition outline-none bg-white ${
                  hasError
                    ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                } ${disabled ? 'bg-slate-100 text-slate-500' : ''}`}
              >
                <option value="">{field.placeholder || '-- Please Select an Option --'}</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {/* 8. Radio Buttons */}
            {field.fieldType === 'radio' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {field.options?.map((opt) => {
                  const isSelected = val === opt;
                  return (
                    <label
                      key={opt}
                      className={`flex items-center space-x-3 p-3 rounded-xl border text-xs transition cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-950 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`radio-${field.id}`}
                        value={opt}
                        checked={isSelected}
                        disabled={disabled}
                        onChange={() => onChange(field.id, opt)}
                        className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* 9. Checkbox (Single Boolean or Multiple) */}
            {field.fieldType === 'checkbox' && (
              <div className="space-y-2 pt-1">
                {field.options && field.options.length > 0 ? (
                  field.options.map((opt) => {
                    const currentArr: string[] = Array.isArray(val) ? val : [];
                    const isChecked = currentArr.includes(opt);
                    return (
                      <label
                        key={opt}
                        className={`flex items-center space-x-3 p-3 rounded-xl border text-xs transition cursor-pointer ${
                          isChecked
                            ? 'border-indigo-600 bg-indigo-50/50 font-semibold text-indigo-950 shadow-sm'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={disabled}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onChange(field.id, [...currentArr, opt]);
                            } else {
                              onChange(field.id, currentArr.filter((item) => item !== opt));
                            }
                          }}
                          className="text-indigo-600 focus:ring-indigo-500 rounded h-4 w-4"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })
                ) : (
                  <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!val}
                      disabled={disabled}
                      onChange={(e) => onChange(field.id, e.target.checked)}
                      className="text-indigo-600 focus:ring-indigo-500 rounded h-4 w-4"
                    />
                    <span>{field.placeholder || field.label}</span>
                  </label>
                )}
              </div>
            )}

            {/* 10. Multiple Choice (Multi-Select Tags) */}
            {field.fieldType === 'multiple_choice' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {field.options?.map((opt) => {
                  const currentArr: string[] = Array.isArray(val) ? val : [];
                  const isSelected = currentArr.includes(opt);
                  return (
                    <div
                      key={opt}
                      onClick={() => {
                        if (disabled) return;
                        if (isSelected) {
                          onChange(field.id, currentArr.filter((item) => item !== opt));
                        } else {
                          onChange(field.id, [...currentArr, opt]);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs transition cursor-pointer select-none ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold shadow-sm ring-1 ring-indigo-600/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      <span>{opt}</span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-slate-50'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 11. File Upload */}
            {field.fieldType === 'file_upload' && (
              <FileUploadField
                id={field.id}
                label={field.label}
                description={field.description}
                required={field.required}
                allowedExtensions={field.validationRules?.allowedFileExtensions || ['.pdf', '.doc', '.docx', '.png', '.jpg']}
                maxFileSizeMb={field.validationRules?.maxFileSizeMb || 5}
                value={uploadedFiles[field.id]}
                onChange={(fileRec) => onFileUpload(field.id, fileRec)}
                error={error}
                disabled={disabled}
              />
            )}

            {/* 12. URL */}
            {field.fieldType === 'url' && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={val || ''}
                  disabled={disabled}
                  placeholder={field.placeholder || 'https://...'}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className={`w-full text-xs pl-9 p-3 rounded-xl border transition outline-none ${
                    hasError
                      ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  } ${disabled ? 'bg-slate-100 text-slate-500' : ''}`}
                />
              </div>
            )}

            {/* Error Display for standard fields */}
            {field.fieldType !== 'file_upload' && hasError && (
              <div className="flex items-center space-x-1.5 text-rose-600 text-xs font-medium pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
