import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Program, Cohort, CohortStatus, ProgramStatus, CustomFormField, ProgramCategory } from '../../types';
import { 
  Plus, 
  Layers, 
  Calendar, 
  Clock, 
  Users, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Eye,
  TrendingUp, 
  DollarSign, 
  Settings2, 
  HelpCircle,
  CheckCircle2,
  FileQuestion,
  ToggleLeft,
  ToggleRight,
  Archive,
  Lock,
  Unlock,
  AlertCircle,
  Search,
  Filter,
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  ChevronRight
} from 'lucide-react';

export const ProgramCohortManager: React.FC = () => {
  const { 
    programs, 
    cohorts, 
    addProgram, 
    updateProgram, 
    archiveProgram,
    toggleProgramStatus,
    deleteProgram, 
    addCohort, 
    updateCohort, 
    archiveCohort,
    openCohortApplications,
    closeCohortApplications,
    updateCohortStatus,
    deleteCohort,
    applications,
    assessments 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'programs' | 'cohorts'>('programs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>(programs[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Program Modals
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showViewProgramModal, setShowViewProgramModal] = useState(false);
  const [viewingProgram, setViewingProgram] = useState<Program | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  const [programForm, setProgramForm] = useState({
    name: '',
    code: '',
    category: 'Artificial Intelligence' as ProgramCategory,
    description: '',
    summary: '',
    durationWeeks: 12,
    format: '100% Online' as '100% Online' | 'Hybrid' | 'In-Person Intensive',
    status: 'active' as ProgramStatus,
    targetAudience: '',
    skillsTaught: 'Generative AI, LLMs, Automation, Prompt Systems',
    prerequisites: 'Basic programming knowledge, Problem-solving interest',
    icon: 'Sparkles',
    color: 'from-purple-600 to-indigo-600',
  });

  // Cohort Modals
  const [showCohortModal, setShowCohortModal] = useState(false);
  const [showViewCohortModal, setShowViewCohortModal] = useState(false);
  const [viewingCohort, setViewingCohort] = useState<Cohort | null>(null);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [cohortForm, setCohortForm] = useState({
    programId: programs[0]?.id || '',
    name: '',
    code: '',
    description: '',
    applicationOpenDate: new Date().toISOString().split('T')[0],
    applicationDeadline: '2026-09-30',
    startDate: '2026-10-15',
    endDate: '2027-01-30',
    status: 'applications_open' as CohortStatus,
    capacity: 50,
    tuitionFee: 1200,
    scholarshipAvailable: true,
    assessmentId: assessments[0]?.id || '',
    assessmentDeadline: '2026-10-05',
    schedule: 'Tuesdays & Thursdays, 18:00 - 20:30 GMT + Saturday Labs',
    customFields: [] as CustomFormField[],
  });

  // Custom question builder within Cohort Modal
  const [newQuestionLabel, setNewQuestionLabel] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'text' | 'textarea' | 'select'>('textarea');
  const [newQuestionOptions, setNewQuestionOptions] = useState('');
  const [newQuestionRequired, setNewQuestionRequired] = useState(true);

  // Program Handlers
  const openNewProgramModal = () => {
    setEditingProgram(null);
    setProgramForm({
      name: '',
      code: 'NGA-' + Math.floor(100 + Math.random() * 900),
      category: 'Artificial Intelligence',
      description: '',
      summary: '',
      durationWeeks: 12,
      format: '100% Online',
      status: 'active',
      targetAudience: 'Tech professionals, developers, and automation specialists',
      skillsTaught: 'Generative AI, Prompt Engineering, Agentic Workflows, API Automation',
      prerequisites: 'Basic Python scripting, interest in modern AI tools',
      icon: 'Sparkles',
      color: 'from-indigo-600 to-purple-600',
    });
    setShowProgramModal(true);
  };

  const openEditProgramModal = (prog: Program) => {
    setEditingProgram(prog);
    setProgramForm({
      name: prog.name,
      code: prog.code,
      category: prog.category || 'Artificial Intelligence',
      description: prog.description,
      summary: prog.summary || prog.description,
      durationWeeks: prog.durationWeeks || 12,
      format: prog.format || '100% Online',
      status: prog.status || 'active',
      targetAudience: prog.targetAudience || '',
      skillsTaught: prog.skillsTaught?.join(', ') || '',
      prerequisites: prog.prerequisites?.join(', ') || '',
      icon: prog.icon || 'Sparkles',
      color: prog.color || 'from-indigo-600 to-purple-600',
    });
    setShowProgramModal(true);
  };

  const openViewProgramModal = (prog: Program) => {
    setViewingProgram(prog);
    setShowViewProgramModal(true);
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = programForm.skillsTaught.split(',').map(s => s.trim()).filter(Boolean);
    const prereqs = programForm.prerequisites.split(',').map(p => p.trim()).filter(Boolean);

    if (editingProgram) {
      updateProgram(editingProgram.id, {
        name: programForm.name,
        code: programForm.code,
        category: programForm.category,
        description: programForm.description,
        summary: programForm.summary || programForm.description,
        durationWeeks: Number(programForm.durationWeeks),
        format: programForm.format,
        status: programForm.status,
        targetAudience: programForm.targetAudience,
        skillsTaught: skills,
        prerequisites: prereqs,
        icon: programForm.icon,
        color: programForm.color,
      });
    } else {
      const created = addProgram({
        name: programForm.name,
        code: programForm.code,
        category: programForm.category,
        description: programForm.description,
        summary: programForm.summary || programForm.description,
        durationWeeks: Number(programForm.durationWeeks),
        format: programForm.format,
        targetAudience: programForm.targetAudience,
        skillsTaught: skills,
        prerequisites: prereqs,
        status: programForm.status,
        icon: programForm.icon,
        color: programForm.color,
      });
      setSelectedProgramId(created.id);
    }

    setShowProgramModal(false);
  };

  // Cohort Handlers
  const openNewCohortModal = (progId?: string) => {
    setEditingCohort(null);
    const targetProgram = programs.find(p => p.id === (progId || selectedProgramId)) || programs[0];
    const generatedCode = targetProgram ? `${targetProgram.code || 'COH'}-C${cohorts.length + 1}-2026` : 'COH-2026';
    
    setCohortForm({
      programId: targetProgram?.id || '',
      name: '',
      code: generatedCode,
      description: '',
      applicationOpenDate: new Date().toISOString().split('T')[0],
      applicationDeadline: '2026-09-30',
      startDate: '2026-10-15',
      endDate: '2027-01-30',
      status: 'applications_open',
      capacity: 50,
      tuitionFee: 1200,
      scholarshipAvailable: true,
      assessmentId: assessments[0]?.id || '',
      assessmentDeadline: '2026-10-05',
      schedule: 'Tuesdays & Thursdays, 18:00 - 20:30 GMT + Saturday Labs',
      customFields: [],
    });
    setShowCohortModal(true);
  };

  const openEditCohortModal = (cohort: Cohort) => {
    setEditingCohort(cohort);
    setCohortForm({
      programId: cohort.programId,
      name: cohort.name,
      code: cohort.code,
      description: cohort.description || '',
      applicationOpenDate: cohort.applicationOpenDate || new Date().toISOString().split('T')[0],
      applicationDeadline: cohort.applicationDeadline,
      startDate: cohort.startDate,
      endDate: cohort.endDate,
      status: cohort.status,
      capacity: cohort.capacity,
      tuitionFee: cohort.tuitionFee,
      scholarshipAvailable: cohort.scholarshipAvailable,
      assessmentId: cohort.assessmentId || '',
      assessmentDeadline: cohort.assessmentDeadline || '',
      schedule: cohort.schedule,
      customFields: cohort.customFields || [],
    });
    setShowCohortModal(true);
  };

  const openViewCohortModal = (cohort: Cohort) => {
    setViewingCohort(cohort);
    setShowViewCohortModal(true);
  };

  const handleAddCustomQuestion = () => {
    if (!newQuestionLabel.trim()) return;

    const newField: CustomFormField = {
      id: 'cf_' + Date.now().toString(36),
      label: newQuestionLabel,
      type: newQuestionType,
      options: newQuestionType === 'select' ? newQuestionOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined,
      required: newQuestionRequired,
    };

    setCohortForm(prev => ({
      ...prev,
      customFields: [...prev.customFields, newField],
    }));

    setNewQuestionLabel('');
    setNewQuestionOptions('');
  };

  const handleRemoveCustomQuestion = (fieldId: string) => {
    setCohortForm(prev => ({
      ...prev,
      customFields: prev.customFields.filter(f => f.id !== fieldId),
    }));
  };

  const handleSaveCohort = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCohort) {
      updateCohort(editingCohort.id, {
        programId: cohortForm.programId,
        name: cohortForm.name,
        code: cohortForm.code,
        description: cohortForm.description,
        applicationOpenDate: cohortForm.applicationOpenDate,
        applicationDeadline: cohortForm.applicationDeadline,
        startDate: cohortForm.startDate,
        endDate: cohortForm.endDate,
        status: cohortForm.status,
        capacity: Number(cohortForm.capacity),
        tuitionFee: Number(cohortForm.tuitionFee),
        scholarshipAvailable: cohortForm.scholarshipAvailable,
        assessmentId: cohortForm.assessmentId,
        assessmentDeadline: cohortForm.assessmentDeadline,
        schedule: cohortForm.schedule,
        customFields: cohortForm.customFields,
      });
    } else {
      addCohort({
        programId: cohortForm.programId,
        name: cohortForm.name,
        code: cohortForm.code,
        description: cohortForm.description,
        applicationOpenDate: cohortForm.applicationOpenDate,
        applicationDeadline: cohortForm.applicationDeadline,
        startDate: cohortForm.startDate,
        endDate: cohortForm.endDate,
        status: cohortForm.status,
        capacity: Number(cohortForm.capacity),
        tuitionFee: Number(cohortForm.tuitionFee),
        scholarshipAvailable: cohortForm.scholarshipAvailable,
        assessmentId: cohortForm.assessmentId,
        assessmentDeadline: cohortForm.assessmentDeadline,
        schedule: cohortForm.schedule,
        customFields: cohortForm.customFields,
      });
    }

    setShowCohortModal(false);
  };

  // Filtered Programs
  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Cohorts
  const filteredCohorts = cohorts.filter(c => {
    const prog = programs.find(p => p.id === c.programId);
    const matchesProg = !selectedProgramId || c.programId === selectedProgramId;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prog?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesProg && matchesSearch && matchesStatus;
  });

  const activeProgramsCount = programs.filter(p => p.status === 'active').length;
  const activeCohortsCount = cohorts.filter(c => c.status !== 'archived' && c.status !== 'completed').length;
  const applicationsOpenCount = cohorts.filter(c => c.status === 'applications_open').length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Summary Metrics & Quick Action CTAs */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6 shadow-md">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Settings2 className="w-4 h-4" />
            <span>NextGen Academy • Module 2 Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk'] text-white">
            Programmes & Cohorts Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Fully dynamic, programme-agnostic configuration. Create any programme (such as <em>Generative AI & AI Automation</em>), launch cohorts, schedule application cycles, and manage capacity in real-time.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-medium text-slate-300">
            <span className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span><strong>{activeProgramsCount}</strong> Active Programmes</span>
            </span>
            <span className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span><strong>{activeCohortsCount}</strong> Active Cohorts</span>
            </span>
            <span className="flex items-center space-x-1.5 bg-emerald-950/60 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-800/40">
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span><strong>{applicationsOpenCount}</strong> Application Windows Open</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openNewProgramModal}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Create Programme</span>
          </button>

          <button
            onClick={() => openNewCohortModal()}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Launch New Cohort</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('programs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'programs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Programmes ({programs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cohorts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'cohorts'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cohorts ({cohorts.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 flex-1 sm:flex-initial">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, code, skill..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-slate-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            {activeTab === 'programs' ? (
              <>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </>
            ) : (
              <>
                <option value="applications_open">Applications Open</option>
                <option value="applications_closed">Applications Closed</option>
                <option value="active">Active / In Session</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* TAB 1: PROGRAMMES MANAGEMENT VIEW */}
      {activeTab === 'programs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPrograms.map(prog => {
              const progCohorts = cohorts.filter(c => c.programId === prog.id);
              const progApps = applications.filter(a => a.programId === prog.id);
              const isArchived = prog.status === 'archived';
              const isActive = prog.status === 'active';

              return (
                <div
                  key={prog.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 shadow-sm hover:shadow-md ${
                    isArchived
                      ? 'border-slate-200 opacity-70 bg-slate-50/70'
                      : isActive
                      ? 'border-slate-200 hover:border-indigo-300'
                      : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {prog.code}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1.5 font-['Space_Grotesk'] leading-snug">
                          {prog.name}
                        </h3>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : isArchived
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {prog.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {prog.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Cohorts</span>
                        <strong className="text-slate-800">{progCohorts.length}</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Applicants</span>
                        <strong className="text-slate-800">{progApps.length}</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                        <strong className="text-slate-800">{prog.durationWeeks} wks</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Lifecycle Controls */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openViewProgramModal(prog)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="View Programme Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditProgramModal(prog)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit Programme"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleProgramStatus(prog.id)}
                        className={`p-1.5 rounded-lg transition ${
                          isActive
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={isActive ? 'Deactivate (Set to Draft)' : 'Activate Programme'}
                      >
                        {isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      {!isArchived ? (
                        <button
                          onClick={() => archiveProgram(prog.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="Archive Programme"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => updateProgram(prog.id, { status: 'active' })}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Unarchive Programme"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setProgramToDelete(prog)}
                        className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Programme"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => openNewCohortModal(prog.id)}
                      className="flex items-center space-x-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1.5 rounded-lg transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Launch Cohort</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPrograms.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Programmes Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No programmes matched your filter or search query. You can configure a new custom programme at any time.
              </p>
              <button
                onClick={openNewProgramModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                + Create New Programme
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COHORTS MANAGEMENT VIEW */}
      {activeTab === 'cohorts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCohorts.map(cohort => {
              const prog = programs.find(p => p.id === cohort.programId);
              const cohortApps = applications.filter(a => a.cohortId === cohort.id);
              const fillRate = Math.min(100, Math.round((cohort.enrolledCount / cohort.capacity) * 100));
              const isOpen = cohort.status === 'applications_open';
              const isClosed = cohort.status === 'applications_closed';
              const isArchived = cohort.status === 'archived';

              return (
                <div
                  key={cohort.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 shadow-sm hover:shadow-md ${
                    isArchived
                      ? 'border-slate-200 opacity-70 bg-slate-50/70'
                      : isOpen
                      ? 'border-emerald-300/80 hover:border-emerald-400'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                          {cohort.code}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1 font-['Space_Grotesk'] leading-snug">
                          {cohort.name}
                        </h3>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {prog?.name || 'Unassigned Programme'}
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        isOpen
                          ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/50'
                          : isClosed
                          ? 'bg-amber-100 text-amber-800'
                          : isArchived
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {cohort.status.replace('_', ' ')}
                      </span>
                    </div>

                    {cohort.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {cohort.description}
                      </p>
                    )}

                    {/* Timeline and Dates */}
                    <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>App Window:</span>
                        </span>
                        <strong className="text-slate-800 font-medium">
                          {cohort.applicationOpenDate || 'Open'} → {cohort.applicationDeadline}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Programme Term:</span>
                        </span>
                        <strong className="text-slate-800 font-medium">
                          {cohort.startDate} → {cohort.endDate}
                        </strong>
                      </div>
                    </div>

                    {/* Capacity & Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-medium">
                          Capacity: <strong>{cohort.enrolledCount}</strong> / {cohort.capacity} enrolled ({cohort.admittedCount} admitted)
                        </span>
                        <span className="font-bold text-slate-800">{fillRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${fillRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Open/Close Apps, Edit, View, Archive */}
                  <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                    {/* Quick status transition bar */}
                    <div className="flex items-center gap-2">
                      {!isOpen ? (
                        <button
                          onClick={() => openCohortApplications(cohort.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition flex items-center justify-center space-x-1 shadow-sm"
                        >
                          <Unlock className="w-3 h-3" />
                          <span>Open Applications</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => closeCohortApplications(cohort.id)}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition flex items-center justify-center space-x-1 shadow-sm"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Close Applications</span>
                        </button>
                      )}

                      <select
                        value={cohort.status}
                        onChange={e => updateCohortStatus(cohort.id, e.target.value as CohortStatus)}
                        className="text-[10px] p-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="applications_open">Applications Open</option>
                        <option value="applications_closed">Applications Closed</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openViewCohortModal(cohort)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="View Cohort Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditCohortModal(cohort)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Cohort"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {!isArchived ? (
                          <button
                            onClick={() => archiveCohort(cohort.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Archive Cohort"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateCohortStatus(cohort.id, 'applications_open')}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Re-open Cohort"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteCohort(cohort.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Cohort Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-500 font-medium">
                        {cohortApps.length} Applicants
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCohorts.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Cohorts Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No cohorts found for the selected criteria. Launch a new cohort to open applications for candidates.
              </p>
              <button
                onClick={() => openNewCohortModal()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                + Launch New Cohort
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PROGRAMME CREATE & EDIT */}
      {/* ========================================================================= */}
      {showProgramModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">
                  {editingProgram ? 'Edit Academy Programme' : 'Create New Academy Programme'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamic programme creation without developer intervention.
                </p>
              </div>
              <button onClick={() => setShowProgramModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Programme Name *</label>
                <input
                  type="text"
                  required
                  value={programForm.name}
                  onChange={e => setProgramForm({ ...programForm, name: e.target.value })}
                  placeholder="e.g. Generative AI & AI Automation"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Programme Code *</label>
                  <input
                    type="text"
                    required
                    value={programForm.code}
                    onChange={e => setProgramForm({ ...programForm, code: e.target.value })}
                    placeholder="e.g. NGA-GENAI"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Status *</label>
                  <select
                    value={programForm.status}
                    onChange={e => setProgramForm({ ...programForm, status: e.target.value as ProgramStatus })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none bg-white font-medium"
                  >
                    <option value="active">ACTIVE</option>
                    <option value="draft">DRAFT</option>
                    <option value="archived">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={programForm.description}
                  onChange={e => setProgramForm({ ...programForm, description: e.target.value })}
                  placeholder="Comprehensive curriculum objectives, competencies gained, and industry outcomes..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={programForm.category}
                    onChange={e => setProgramForm({ ...programForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Data & Analytics">Data & Analytics</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Product & Design">Product & Design</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Weeks)</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={programForm.durationWeeks}
                    onChange={e => setProgramForm({ ...programForm, durationWeeks: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Key Skills Taught (comma-separated)</label>
                <input
                  type="text"
                  value={programForm.skillsTaught}
                  onChange={e => setProgramForm({ ...programForm, skillsTaught: e.target.value })}
                  placeholder="e.g. LLMs, Multi-Agent Systems, LangChain, Tool Use"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                {editingProgram ? (
                  <button
                    type="button"
                    onClick={() => {
                      setProgramToDelete(editingProgram);
                      setShowProgramModal(false);
                    }}
                    className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition text-xs cursor-pointer border border-rose-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Programme</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowProgramModal(false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    {editingProgram ? 'Save Changes' : 'Create Programme'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW PROGRAMME DETAILS */}
      {/* ========================================================================= */}
      {showViewProgramModal && viewingProgram && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                  {viewingProgram.code}
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] mt-1">
                  {viewingProgram.name}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Category: <strong>{viewingProgram.category}</strong> • Status: <strong className="uppercase">{viewingProgram.status}</strong>
                </div>
              </div>
              <button onClick={() => setShowViewProgramModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">Curriculum & Overview</h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {viewingProgram.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Skills Curriculum</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {viewingProgram.skillsTaught?.map((s, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Prerequisites</span>
                  <p className="text-slate-700 text-xs mt-1">
                    {viewingProgram.prerequisites?.join(', ') || 'No formal prerequisites required.'}
                  </p>
                </div>
              </div>

              {/* Linked Cohorts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Linked Cohorts ({cohorts.filter(c => c.programId === viewingProgram.id).length})
                  </h4>
                  <button
                    onClick={() => {
                      setShowViewProgramModal(false);
                      openNewCohortModal(viewingProgram.id);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    + Add Cohort
                  </button>
                </div>

                <div className="space-y-2">
                  {cohorts.filter(c => c.programId === viewingProgram.id).map(c => (
                    <div key={c.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-500">
                          Starts: {c.startDate} • Capacity: {c.capacity} seats
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    toggleProgramStatus(viewingProgram.id);
                    setShowViewProgramModal(false);
                  }}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  {viewingProgram.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    archiveProgram(viewingProgram.id);
                    setShowViewProgramModal(false);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Archive
                </button>
                <button
                  onClick={() => {
                    setProgramToDelete(viewingProgram);
                    setShowViewProgramModal(false);
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center space-x-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setShowViewProgramModal(false);
                  openEditProgramModal(viewingProgram);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Edit Programme
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: COHORT CREATE & EDIT */}
      {/* ========================================================================= */}
      {showCohortModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">
                  {editingCohort ? 'Edit Cohort Parameters' : 'Launch New Programme Cohort'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure admission dates, capacity limits, and screening parameters.
                </p>
              </div>
              <button onClick={() => setShowCohortModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCohort} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Target Programme *</label>
                  <select
                    value={cohortForm.programId}
                    onChange={e => setCohortForm({ ...cohortForm, programId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none bg-white font-medium"
                  >
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cohort Name *</label>
                  <input
                    type="text"
                    required
                    value={cohortForm.name}
                    onChange={e => setCohortForm({ ...cohortForm, name: e.target.value })}
                    placeholder="e.g. Winter 2026 Flagship Cohort"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cohort Code *</label>
                  <input
                    type="text"
                    required
                    value={cohortForm.code}
                    onChange={e => setCohortForm({ ...cohortForm, code: e.target.value })}
                    placeholder="e.g. GENAI-C1-2026"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Application Opening Date</label>
                  <input
                    type="date"
                    value={cohortForm.applicationOpenDate}
                    onChange={e => setCohortForm({ ...cohortForm, applicationOpenDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Application Closing Date *</label>
                  <input
                    type="date"
                    required
                    value={cohortForm.applicationDeadline}
                    onChange={e => setCohortForm({ ...cohortForm, applicationDeadline: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Programme Start Date *</label>
                  <input
                    type="date"
                    required
                    value={cohortForm.startDate}
                    onChange={e => setCohortForm({ ...cohortForm, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Programme End Date *</label>
                  <input
                    type="date"
                    required
                    value={cohortForm.endDate}
                    onChange={e => setCohortForm({ ...cohortForm, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Seat Capacity *</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={cohortForm.capacity}
                    onChange={e => setCohortForm({ ...cohortForm, capacity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cohort Status *</label>
                  <select
                    value={cohortForm.status}
                    onChange={e => setCohortForm({ ...cohortForm, status: e.target.value as CohortStatus })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none bg-white font-medium"
                  >
                    <option value="applications_open">APPLICATIONS_OPEN</option>
                    <option value="applications_closed">APPLICATIONS_CLOSED</option>
                    <option value="draft">DRAFT</option>
                    <option value="active">ACTIVE</option>
                    <option value="completed">COMPLETED</option>
                    <option value="archived">ARCHIVED</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Cohort Description / Focus Note</label>
                  <textarea
                    rows={2}
                    value={cohortForm.description}
                    onChange={e => setCohortForm({ ...cohortForm, description: e.target.value })}
                    placeholder="Specific orientation instructions, regional sponsorship notes, or schedule parameters..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Custom Screening Questions */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <FileQuestion className="w-4 h-4 text-indigo-600" />
                    <span>Cohort-Specific Screening Questions ({cohortForm.customFields.length})</span>
                  </span>
                </div>

                {cohortForm.customFields.map(field => (
                  <div key={field.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{field.label}</div>
                      <div className="text-[10px] text-slate-500">
                        Type: {field.type} • {field.required ? 'Mandatory' : 'Optional'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomQuestion(field.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
                  <div className="font-semibold text-indigo-950 text-[11px]">Add Custom Screening Field:</div>
                  <input
                    type="text"
                    value={newQuestionLabel}
                    onChange={e => setNewQuestionLabel(e.target.value)}
                    placeholder="e.g. Describe an automation system you have engineered..."
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                  <div className="flex items-center space-x-2">
                    <select
                      value={newQuestionType}
                      onChange={e => setNewQuestionType(e.target.value as any)}
                      className="p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    >
                      <option value="textarea">Paragraph Answer</option>
                      <option value="text">Single Line Text</option>
                      <option value="select">Dropdown Options</option>
                    </select>

                    {newQuestionType === 'select' && (
                      <input
                        type="text"
                        value={newQuestionOptions}
                        onChange={e => setNewQuestionOptions(e.target.value)}
                        placeholder="Option 1, Option 2, Option 3..."
                        className="flex-1 p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    )}

                    <button
                      type="button"
                      onClick={handleAddCustomQuestion}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCohortModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
                >
                  {editingCohort ? 'Save Cohort Parameters' : 'Launch Cohort'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: VIEW COHORT DOSSIER */}
      {/* ========================================================================= */}
      {showViewCohortModal && viewingCohort && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                  {viewingCohort.code}
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] mt-1">
                  {viewingCohort.name}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Programme: <strong>{programs.find(p => p.id === viewingCohort.programId)?.name}</strong>
                </div>
              </div>
              <button onClick={() => setShowViewCohortModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Application Dates</span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Opens:</span>
                    <strong className="text-slate-800">{viewingCohort.applicationOpenDate || 'Immediate'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Closes:</span>
                    <strong className="text-slate-800">{viewingCohort.applicationDeadline}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Programme Term</span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Starts:</span>
                    <strong className="text-slate-800">{viewingCohort.startDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ends:</span>
                    <strong className="text-slate-800">{viewingCohort.endDate}</strong>
                  </div>
                </div>
              </div>

              {/* Status and Capacity Gauge */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Capacity & Enrollment Metrics</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-indigo-100 text-indigo-800">
                    {viewingCohort.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Total Capacity</span>
                    <strong className="text-slate-900 text-sm">{viewingCohort.capacity}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Admitted</span>
                    <strong className="text-slate-900 text-sm">{viewingCohort.admittedCount}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Enrolled Seats</span>
                    <strong className="text-emerald-700 text-sm">{viewingCohort.enrolledCount}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {viewingCohort.status !== 'applications_open' ? (
                <button
                  onClick={() => {
                    openCohortApplications(viewingCohort.id);
                    setShowViewCohortModal(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Open Applications
                </button>
              ) : (
                <button
                  onClick={() => {
                    closeCohortApplications(viewingCohort.id);
                    setShowViewCohortModal(false);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Close Applications
                </button>
              )}

              <button
                onClick={() => {
                  setShowViewCohortModal(false);
                  openEditCohortModal(viewingCohort);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
              >
                Edit Cohort
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DELETE PROGRAMME CONFIRMATION */}
      {/* ========================================================================= */}
      {programToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Programme</h3>
                <p className="text-xs text-slate-500">Irreversible Action</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900 font-semibold">{programToDelete.name}</strong> ({programToDelete.code})? This will permanently remove the programme from the catalog and Firestore database.
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setProgramToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProgram(programToDelete.id);
                  setProgramToDelete(null);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 text-sm rounded-xl transition shadow-sm cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Programme</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
