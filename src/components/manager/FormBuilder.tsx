import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ApplicationForm, 
  ApplicationFormSection, 
  ApplicationFormField, 
  FormFieldType 
} from '../../types';
import { FIELD_TYPE_LABELS } from '../../utils/formCsvParser';
import { FormFieldEditorModal, FIELD_TYPE_ICONS } from './FormFieldEditorModal';
import { FormBulkUploadModal } from './FormBulkUploadModal';
import { FormPreviewModal } from './FormPreviewModal';
import { 
  Plus, 
  Layers, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Sliders, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Globe, 
  FileText, 
  RotateCcw, 
  Sparkles, 
  Lock, 
  Unlock, 
  Archive, 
  BookOpen, 
  ChevronRight, 
  ChevronDown,
  HelpCircle,
  Clock,
  Send
} from 'lucide-react';

export const FormBuilder: React.FC = () => {
  const { 
    forms, 
    programs, 
    cohorts, 
    addForm, 
    updateForm, 
    deleteForm, 
    publishForm, 
    unpublishForm, 
    createFormVersion, 
    addSectionToForm, 
    updateSectionInForm, 
    deleteSectionFromForm, 
    reorderSectionsInForm, 
    addFieldToSection, 
    updateFieldInSection, 
    deleteFieldFromSection, 
    reorderFieldsInSection, 
    bulkImportFieldsToForm,
    addToast
  } = useApp();

  // Selected Form for Editing
  const [selectedFormId, setSelectedFormId] = useState<string | null>(forms[0]?.id || null);
  
  // List Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingFieldData, setEditingFieldData] = useState<{
    sectionId: string;
    field: ApplicationFormField | null;
  } | null>(null);
  const [editingSectionData, setEditingSectionData] = useState<ApplicationFormSection | null>(null);
  const [showNewSectionInput, setShowNewSectionInput] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');

  // New Form Modal State
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormProgramId, setNewFormProgramId] = useState(programs[0]?.id || '');
  const [newFormCohortId, setNewFormCohortId] = useState<string>('');
  const [newFormDescription, setNewFormDescription] = useState('');

  const activeForm = forms.find(f => f.id === selectedFormId) || forms[0];
  const activeProgram = programs.find(p => p.id === activeForm?.programId);

  // Filtered Forms List
  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProgram = selectedProgramFilter === 'all' || form.programId === selectedProgramFilter;
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    return matchesSearch && matchesProgram && matchesStatus;
  });

  const handleCreateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim()) return;

    const created = addForm({
      title: newFormTitle.trim(),
      programId: newFormProgramId,
      cohortId: newFormCohortId || undefined,
      description: newFormDescription.trim() || undefined,
      sections: [
        {
          id: `sec_${Date.now()}_1`,
          title: 'Candidate Profile & Background',
          description: 'Basic applicant background information.',
          displayOrder: 1,
          fields: [
            {
              id: `fld_${Date.now()}_1`,
              formId: '',
              sectionId: `sec_${Date.now()}_1`,
              fieldType: 'short_text',
              label: 'Full Legal Name',
              placeholder: 'Jane Doe',
              required: true,
              displayOrder: 1,
            },
            {
              id: `fld_${Date.now()}_2`,
              formId: '',
              sectionId: `sec_${Date.now()}_1`,
              fieldType: 'email',
              label: 'Primary Contact Email',
              placeholder: 'jane@example.com',
              required: true,
              displayOrder: 2,
            }
          ]
        }
      ]
    });

    setSelectedFormId(created.id);
    setShowCreateModal(false);
    setNewFormTitle('');
    setNewFormDescription('');
  };

  const handlePublishToggle = (form: ApplicationForm) => {
    if (form.status === 'published') {
      unpublishForm(form.id);
    } else {
      publishForm(form.id);
    }
  };

  const handleAddSection = () => {
    if (!activeForm || !newSectionTitle.trim()) return;
    addSectionToForm(activeForm.id, {
      title: newSectionTitle.trim(),
      description: newSectionDescription.trim() || undefined,
      displayOrder: (activeForm.sections.length || 0) + 1,
    });
    setNewSectionTitle('');
    setNewSectionDescription('');
    setShowNewSectionInput(false);
  };

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    if (!activeForm) return;
    const sorted = [...activeForm.sections].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex(s => s.id === sectionId);
    if (index < 0) return;

    if (direction === 'up' && index > 0) {
      const temp = sorted[index];
      sorted[index] = sorted[index - 1];
      sorted[index - 1] = temp;
    } else if (direction === 'down' && index < sorted.length - 1) {
      const temp = sorted[index];
      sorted[index] = sorted[index + 1];
      sorted[index + 1] = temp;
    }

    const reorderedIds = sorted.map(s => s.id);
    reorderSectionsInForm(activeForm.id, reorderedIds);
  };

  const handleMoveField = (sectionId: string, fieldId: string, direction: 'up' | 'down') => {
    if (!activeForm) return;
    const section = activeForm.sections.find(s => s.id === sectionId);
    if (!section) return;

    const sorted = [...section.fields].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex(f => f.id === fieldId);
    if (index < 0) return;

    if (direction === 'up' && index > 0) {
      const temp = sorted[index];
      sorted[index] = sorted[index - 1];
      sorted[index - 1] = temp;
    } else if (direction === 'down' && index < sorted.length - 1) {
      const temp = sorted[index];
      sorted[index] = sorted[index + 1];
      sorted[index + 1] = temp;
    }

    const reorderedIds = sorted.map(f => f.id);
    reorderFieldsInSection(activeForm.id, sectionId, reorderedIds);
  };

  const handleDuplicateField = (sectionId: string, field: ApplicationFormField) => {
    if (!activeForm) return;
    const section = activeForm.sections.find(s => s.id === sectionId);
    if (!section) return;

    addFieldToSection(activeForm.id, sectionId, {
      fieldType: field.fieldType,
      label: `${field.label} (Copy)`,
      description: field.description,
      placeholder: field.placeholder,
      required: field.required,
      options: field.options ? [...field.options] : undefined,
      validationRules: field.validationRules ? { ...field.validationRules } : undefined,
      displayOrder: section.fields.length + 1,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6 shadow-md">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Module 4 • Dynamic Application Form Builder</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk'] text-white">
            Application Forms Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Design multi-section admissions questionnaires, customize validation parameters, version form blueprints, and bulk-import questions via spreadsheet without developer intervention.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Form</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout: Forms Selector Left, Active Form Editor Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: FORMS DIRECTORY & SELECTOR (4 COLS) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Application Forms ({forms.length})
              </span>
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                title="Create Form"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search forms by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedProgramFilter}
                  onChange={(e) => setSelectedProgramFilter(e.target.value)}
                  className="w-full p-1.5 border border-slate-200 rounded-lg text-[11px] bg-slate-50 text-slate-700"
                >
                  <option value="all">All Programmes</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full p-1.5 border border-slate-200 rounded-lg text-[11px] bg-slate-50 text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Forms List Items */}
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto pt-1">
              {filteredForms.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No application forms matched the criteria.
                </div>
              ) : (
                filteredForms.map((form) => {
                  const prog = programs.find(p => p.id === form.programId);
                  const isSelected = activeForm?.id === form.id;
                  const totalFields = form.sections.reduce((acc, s) => acc + s.fields.length, 0);

                  return (
                    <div
                      key={form.id}
                      onClick={() => setSelectedFormId(form.id)}
                      className={`p-3.5 rounded-xl cursor-pointer transition text-left space-y-1.5 my-1 ${
                        isSelected 
                          ? 'bg-indigo-50/90 border border-indigo-200 shadow-sm' 
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          form.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : form.status === 'draft'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-200 text-slate-700'
                        }`}>
                          {(form.status || 'draft').toUpperCase()} • v{form.version}
                        </span>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {totalFields} questions
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {form.title}
                      </h4>

                      <div className="text-[11px] text-slate-500 truncate flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        <span>{prog?.title || 'Global Form'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ACTIVE FORM WORKSPACE CANVAS (8 COLS) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {activeForm ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              
              {/* Form Workspace Header */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/70 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        activeForm.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {(activeForm.status || 'draft').toUpperCase()}
                      </span>
                      <span className="text-xs font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md">
                        Version {activeForm.version}
                      </span>
                      <span className="text-xs text-slate-500">
                        • {activeProgram?.title || 'Academy Wide'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold font-['Space_Grotesk'] text-slate-900 mt-1">
                      {activeForm.title}
                    </h3>
                    {activeForm.description && (
                      <p className="text-xs text-slate-600 mt-0.5">
                        {activeForm.description}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Live Preview Button */}
                    <button
                      onClick={() => setShowPreviewModal(true)}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 rounded-xl transition cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Preview Candidate UX</span>
                    </button>

                    {/* Bulk Upload Button */}
                    <button
                      onClick={() => setShowBulkUploadModal(true)}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 rounded-xl transition cursor-pointer shadow-sm"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Bulk Upload (CSV)</span>
                    </button>

                    {/* Version Form (Duplicate new draft v+1) */}
                    <button
                      onClick={() => createFormVersion(activeForm.id)}
                      title="Create new version draft"
                      className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Version (v{activeForm.version + 1})</span>
                    </button>

                    {/* Publish / Unpublish Toggle */}
                    <button
                      onClick={() => handlePublishToggle(activeForm)}
                      className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer shadow-sm ${
                        activeForm.status === 'published'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {activeForm.status === 'published' ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Unpublish Draft</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3.5 h-3.5" />
                          <span>Publish Form</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Form Association Meta */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                  <div>
                    <strong>Sections:</strong> {activeForm.sections.length}
                  </div>
                  <div>
                    <strong>Total Questions:</strong> {activeForm.sections.reduce((acc, s) => acc + s.fields.length, 0)}
                  </div>
                  <div>
                    <strong>Last Updated:</strong> {new Date(activeForm.updatedAt).toLocaleDateString()}
                  </div>
                  {activeForm.status === 'draft' && (
                    <div className="text-amber-700 font-semibold flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Draft state: hidden from public applicants until published.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sections & Fields Canvas */}
              <div className="p-6 space-y-6">
                
                {/* Form Sections */}
                {activeForm.sections
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((section, secIdx) => (
                    <div 
                      key={section.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:border-slate-300 transition"
                    >
                      {/* Section Header */}
                      <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center font-mono">
                            {secIdx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {section.title}
                            </h4>
                            {section.description && (
                              <p className="text-[11px] text-slate-500">
                                {section.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Section Controls */}
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            disabled={secIdx === 0}
                            onClick={() => handleMoveSection(section.id, 'up')}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                            title="Move Section Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={secIdx === activeForm.sections.length - 1}
                            onClick={() => handleMoveSection(section.id, 'down')}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                            title="Move Section Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSectionData(section)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                            title="Edit Section Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={activeForm.sections.length <= 1}
                            onClick={() => deleteSectionFromForm(activeForm.id, section.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                            title="Delete Section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Fields in Section */}
                      <div className="p-4 space-y-3">
                        {section.fields.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            No questions added to this section yet.
                          </div>
                        ) : (
                          section.fields
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((field, fieldIdx) => (
                              <div
                                key={field.id}
                                className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white transition flex items-center justify-between gap-4 group"
                              >
                                <div className="flex items-start space-x-3 flex-1 min-w-0">
                                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
                                    {FIELD_TYPE_ICONS[field.fieldType]}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h5 className="text-xs font-bold text-slate-900 truncate">
                                        {field.label}
                                      </h5>
                                      {field.required ? (
                                        <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-1.5 py-0.2 rounded border border-rose-200">
                                          Mandatory
                                        </span>
                                      ) : (
                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                          Optional
                                        </span>
                                      )}
                                      <span className="text-[10px] font-mono text-slate-400">
                                        {FIELD_TYPE_LABELS[field.fieldType]}
                                      </span>
                                    </div>

                                    {field.description && (
                                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                        {field.description}
                                      </p>
                                    )}

                                    {field.options && field.options.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {field.options.slice(0, 4).map((opt, i) => (
                                          <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                            {opt}
                                          </span>
                                        ))}
                                        {field.options.length > 4 && (
                                          <span className="text-[10px] text-slate-400">+{field.options.length - 4} more</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Field Row Controls */}
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    disabled={fieldIdx === 0}
                                    onClick={() => handleMoveField(section.id, field.id, 'up')}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                    title="Move Field Up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={fieldIdx === section.fields.length - 1}
                                    onClick={() => handleMoveField(section.id, field.id, 'down')}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                    title="Move Field Down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateField(section.id, field)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                    title="Duplicate Question"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingFieldData({ sectionId: section.id, field })}
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                    title="Edit Question Settings"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteFieldFromSection(activeForm.id, section.id, field.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                    title="Delete Question"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                        )}

                        {/* Add Field Button */}
                        <button
                          type="button"
                          onClick={() => setEditingFieldData({ sectionId: section.id, field: null })}
                          className="w-full py-2.5 border border-dashed border-indigo-200 hover:border-indigo-500 rounded-xl bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Question to {section.title}</span>
                        </button>
                      </div>
                    </div>
                  ))}

                {/* Add New Section Drawer */}
                {showNewSectionInput ? (
                  <div className="p-4 border-2 border-indigo-200 rounded-2xl bg-indigo-50/30 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                      New Form Section
                    </h4>
                    <input
                      type="text"
                      placeholder="Section Title (e.g. Technical Aptitude, Portfolio & Code Repositories)"
                      value={newSectionTitle}
                      onChange={e => setNewSectionTitle(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Optional section description or instructions..."
                      value={newSectionDescription}
                      onChange={e => setNewSectionDescription(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowNewSectionInput(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddSection}
                        className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition"
                      >
                        Create Section
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewSectionInput(true)}
                    className="w-full py-3.5 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-indigo-600" />
                    <span>Add New Section</span>
                  </button>
                )}

              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              Select or create an application form to begin building.
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW FORM */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-['Space_Grotesk']">
                Create Application Form
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateForm} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Form Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFormTitle}
                  onChange={e => setNewFormTitle(e.target.value)}
                  placeholder="e.g. NextGen Fullstack Engineering Admissions Dossier"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Target Programme <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newFormProgramId}
                  onChange={e => {
                    setNewFormProgramId(e.target.value);
                    setNewFormCohortId('');
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Target Cohort <span className="text-slate-400 font-normal">(Optional: Global across cohorts if blank)</span>
                </label>
                <select
                  value={newFormCohortId}
                  onChange={e => setNewFormCohortId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">All Cohorts for this Programme</option>
                  {cohorts
                    .filter(c => c.programId === newFormProgramId)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Form Description / Candidate Instructions
                </label>
                <textarea
                  rows={3}
                  value={newFormDescription}
                  onChange={e => setNewFormDescription(e.target.value)}
                  placeholder="Instructions for prospective candidates applying through this form..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                >
                  Initialize Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT SECTION METADATA */}
      {/* ========================================================================= */}
      {editingSectionData && activeForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-['Space_Grotesk']">
                Edit Section Details
              </h3>
              <button onClick={() => setEditingSectionData(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Section Title</label>
                <input
                  type="text"
                  value={editingSectionData.title}
                  onChange={e => setEditingSectionData({ ...editingSectionData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Section Description</label>
                <textarea
                  rows={3}
                  value={editingSectionData.description || ''}
                  onChange={e => setEditingSectionData({ ...editingSectionData, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingSectionData(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSectionInForm(activeForm.id, editingSectionData.id, {
                      title: editingSectionData.title,
                      description: editingSectionData.description,
                    });
                    setEditingSectionData(null);
                  }}
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl"
                >
                  Save Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: FIELD EDITOR MODAL (ALL 12 TYPES & VALIDATIONS) */}
      {/* ========================================================================= */}
      {editingFieldData && activeForm && (
        <FormFieldEditorModal
          field={editingFieldData.field}
          sectionId={editingFieldData.sectionId}
          formId={activeForm.id}
          onSave={(fieldPayload) => {
            if (editingFieldData.field) {
              updateFieldInSection(activeForm.id, editingFieldData.sectionId, editingFieldData.field.id, fieldPayload);
            } else {
              addFieldToSection(activeForm.id, editingFieldData.sectionId, fieldPayload);
            }
            setEditingFieldData(null);
          }}
          onClose={() => setEditingFieldData(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: BULK CSV UPLOAD MODAL */}
      {/* ========================================================================= */}
      {showBulkUploadModal && activeForm && (
        <FormBulkUploadModal
          formId={activeForm.id}
          formTitle={activeForm.title}
          onImport={(csvContent, mode) => {
            bulkImportFieldsToForm(activeForm.id, csvContent, mode);
          }}
          onClose={() => setShowBulkUploadModal(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: LIVE FORM PREVIEW MODAL */}
      {/* ========================================================================= */}
      {showPreviewModal && activeForm && (
        <FormPreviewModal
          form={activeForm}
          programTitle={activeProgram?.title}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

    </div>
  );
};
