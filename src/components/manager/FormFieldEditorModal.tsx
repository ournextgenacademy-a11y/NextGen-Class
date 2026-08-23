import React, { useState } from 'react';
import { 
  ApplicationFormField, 
  FormFieldType, 
  FormFieldValidationRules 
} from '../../types';
import { FIELD_TYPE_LABELS } from '../../utils/formCsvParser';
import { 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Sliders, 
  FileText, 
  HelpCircle, 
  Type, 
  AlignLeft, 
  Mail, 
  Phone, 
  Hash, 
  Calendar, 
  List, 
  CheckSquare, 
  Radio, 
  UploadCloud, 
  Link2,
  AlertCircle
} from 'lucide-react';

interface FormFieldEditorModalProps {
  field?: ApplicationFormField | null;
  sectionId: string;
  formId: string;
  onSave: (fieldData: Omit<ApplicationFormField, 'id' | 'formId' | 'sectionId'>) => void;
  onClose: () => void;
}

export const FIELD_TYPE_ICONS: Record<FormFieldType, React.ReactNode> = {
  short_text: <Type className="w-4 h-4" />,
  long_text: <AlignLeft className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  number: <Hash className="w-4 h-4" />,
  date: <Calendar className="w-4 h-4" />,
  dropdown: <List className="w-4 h-4" />,
  radio: <Radio className="w-4 h-4" />,
  checkbox: <CheckSquare className="w-4 h-4" />,
  multiple_choice: <CheckSquare className="w-4 h-4 text-orange-600" />,
  file_upload: <UploadCloud className="w-4 h-4" />,
  url: <Link2 className="w-4 h-4" />,
};

export const FormFieldEditorModal: React.FC<FormFieldEditorModalProps> = ({
  field,
  sectionId,
  formId,
  onSave,
  onClose,
}) => {
  const [fieldType, setFieldType] = useState<FormFieldType>(field?.fieldType || 'short_text');
  const [label, setLabel] = useState(field?.label || '');
  const [description, setDescription] = useState(field?.description || '');
  const [placeholder, setPlaceholder] = useState(field?.placeholder || '');
  const [required, setRequired] = useState(field?.required ?? true);
  const [options, setOptions] = useState<string[]>(
    field?.options && field.options.length > 0 ? field.options : ['Option 1', 'Option 2']
  );
  const [newOptionText, setNewOptionText] = useState('');
  const [bulkOptionsText, setBulkOptionsText] = useState('');
  const [showBulkOptions, setShowBulkOptions] = useState(false);

  // Validation rules
  const [validationRules, setValidationRules] = useState<FormFieldValidationRules>(
    field?.validationRules || {}
  );

  const [activeTab, setActiveTab] = useState<'basic' | 'options' | 'validation'>('basic');
  const [error, setError] = useState<string | null>(null);

  const isChoiceType = ['dropdown', 'radio', 'checkbox', 'multiple_choice'].includes(fieldType);
  const isFileType = fieldType === 'file_upload';
  const isTextType = fieldType === 'short_text' || fieldType === 'long_text';
  const isNumberType = fieldType === 'number';

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    setOptions(prev => [...prev, newOptionText.trim()]);
    setNewOptionText('');
  };

  const handleRemoveOption = (index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkOptionsApply = () => {
    const parsed = bulkOptionsText
      .split(/[\n,;]/)
      .map(o => o.trim())
      .filter(o => o.length > 0);
    if (parsed.length > 0) {
      setOptions(parsed);
      setShowBulkOptions(false);
      setBulkOptionsText('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Field label / question text is required.');
      return;
    }

    if (isChoiceType && options.length < 2) {
      setError('Fields of this type require at least 2 selectable options.');
      setActiveTab('options');
      return;
    }

    setError(null);
    onSave({
      fieldType,
      label: label.trim(),
      description: description.trim() || undefined,
      placeholder: placeholder.trim() || undefined,
      required,
      options: isChoiceType ? options : undefined,
      validationRules: Object.keys(validationRules).length > 0 ? validationRules : undefined,
      displayOrder: field?.displayOrder || 1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-orange-600 text-white shadow-sm shadow-orange-600/30">
              {FIELD_TYPE_ICONS[fieldType]}
            </div>
            <div>
              <h3 className="text-base font-bold font-['Space_Grotesk'] text-white">
                {field ? 'Edit Application Field' : 'Add New Application Question'}
              </h3>
              <p className="text-xs text-slate-300">
                Configure field parameters, validation rules, and choice sets.
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

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'basic'
                ? 'border-orange-600 text-orange-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Basic Settings
          </button>
          
          {isChoiceType && (
            <button
              type="button"
              onClick={() => setActiveTab('options')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'options'
                  ? 'border-orange-600 text-orange-700 bg-white rounded-t-lg shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Choices & Options</span>
              <span className="bg-orange-100 text-orange-700 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {options.length}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('validation')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'validation'
                ? 'border-orange-600 text-orange-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Validation Rules
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: BASIC SETTINGS */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {/* Field Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Field Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(FIELD_TYPE_LABELS) as FormFieldType[]).map(typeKey => (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => {
                        setFieldType(typeKey);
                        if (['dropdown', 'radio', 'checkbox', 'multiple_choice'].includes(typeKey) && options.length === 0) {
                          setOptions(['Option 1', 'Option 2']);
                        }
                      }}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs text-left transition cursor-pointer ${
                        fieldType === typeKey
                          ? 'border-orange-600 bg-orange-50/70 text-orange-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-1 rounded-lg ${fieldType === typeKey ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {FIELD_TYPE_ICONS[typeKey]}
                      </div>
                      <span className="truncate">{FIELD_TYPE_LABELS[typeKey]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Label / Question */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Question / Field Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Years of professional programming experience"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                />
              </div>

              {/* Description / Hint */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Help Text / Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide additional instructions, formats, or criteria for the applicant..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                />
              </div>

              {/* Placeholder */}
              {!['radio', 'checkbox', 'multiple_choice', 'file_upload'].includes(fieldType) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Placeholder Text <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={placeholder}
                    onChange={e => setPlaceholder(e.target.value)}
                    placeholder="e.g. https://github.com/username or Select highest qualification..."
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  />
                </div>
              )}

              {/* Required Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="text-xs font-bold text-slate-800">Mandatory / Required Field</div>
                  <div className="text-[11px] text-slate-500">Applicant cannot submit dossier without completing this field.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setRequired(!required)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    required ? 'bg-orange-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      required ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: OPTIONS (For Dropdown, Radio, Checkbox, Multiple Choice) */}
          {activeTab === 'options' && isChoiceType && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Selectable Option Values</div>
                  <div className="text-[11px] text-slate-500">Define the choices presented to the candidate.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkOptions(!showBulkOptions)}
                  className="text-xs text-orange-600 font-semibold hover:text-orange-800 underline cursor-pointer"
                >
                  {showBulkOptions ? 'Individual View' : 'Bulk Paste Options'}
                </button>
              </div>

              {showBulkOptions ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={bulkOptionsText}
                    onChange={e => setBulkOptionsText(e.target.value)}
                    placeholder="Option 1&#10;Option 2&#10;Option 3&#10;(Separate with commas, semicolons, or linebreaks)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleBulkOptionsApply}
                      className="px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition cursor-pointer"
                    >
                      Apply Bulk List
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-slate-400 w-5 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const updated = [...options];
                          updated[idx] = e.target.value;
                          setOptions(updated);
                        }}
                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        disabled={options.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      value={newOptionText}
                      onChange={e => setNewOptionText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                      placeholder="Add another option choice..."
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VALIDATION RULES */}
          {activeTab === 'validation' && (
            <div className="space-y-4 text-xs">
              {isTextType && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Minimum Characters</label>
                    <input
                      type="number"
                      min={0}
                      value={validationRules.minLength ?? ''}
                      onChange={e => setValidationRules({
                        ...validationRules,
                        minLength: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      placeholder="e.g. 10"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Maximum Characters</label>
                    <input
                      type="number"
                      min={1}
                      value={validationRules.maxLength ?? ''}
                      onChange={e => setValidationRules({
                        ...validationRules,
                        maxLength: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {isNumberType && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Minimum Value</label>
                    <input
                      type="number"
                      value={validationRules.min ?? ''}
                      onChange={e => setValidationRules({
                        ...validationRules,
                        min: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      placeholder="e.g. 0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Maximum Value</label>
                    <input
                      type="number"
                      value={validationRules.max ?? ''}
                      onChange={e => setValidationRules({
                        ...validationRules,
                        max: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      placeholder="e.g. 100"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {isFileType && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Max File Size (Megabytes)</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={validationRules.maxFileSizeMb ?? 5}
                      onChange={e => setValidationRules({
                        ...validationRules,
                        maxFileSizeMb: e.target.value ? parseInt(e.target.value) : 5
                      })}
                      placeholder="5"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Allowed File Formats</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'zip'].map(ext => {
                        const isSelected = validationRules.allowedFileExtensions?.includes(ext);
                        return (
                          <button
                            key={ext}
                            type="button"
                            onClick={() => {
                              const current = validationRules.allowedFileExtensions || ['pdf', 'doc', 'docx'];
                              const next = isSelected ? current.filter(e => e !== ext) : [...current, ext];
                              setValidationRules({ ...validationRules, allowedFileExtensions: next });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase transition cursor-pointer ${
                              isSelected ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            .{ext}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Custom Error Prompt</label>
                <input
                  type="text"
                  value={validationRules.customErrorMessage || ''}
                  onChange={e => setValidationRules({
                    ...validationRules,
                    customErrorMessage: e.target.value || undefined
                  })}
                  placeholder="e.g. Please provide a valid portfolio URL"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/20 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{field ? 'Save Field Changes' : 'Add Field to Section'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
