import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Application, ApplicationStatus, InternalNote, UploadedFileRecord } from '../../types';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Download, 
  Star, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Clock, 
  MoreVertical, 
  UserCheck, 
  Send, 
  X,
  ChevronDown,
  Plus,
  FileText,
  FileCheck2,
  AlertCircle,
  MessageSquare,
  History,
  Grid,
  Check,
  Eye,
  Trash2,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { ApplicationDetailDrawer } from './ApplicationDetailDrawer';

interface ApplicationPipelineProps {
  initialSelectedAppId?: string | null;
}

export const ApplicationPipeline: React.FC<ApplicationPipelineProps> = ({
  initialSelectedAppId,
}) => {
  const { 
    applications, 
    programs, 
    cohorts, 
    bulkUpdateStatus, 
    toggleStarApplication,
    createTestApplication,
    addToast 
  } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [starredOnly, setStarredOnly] = useState(false);
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'score_desc' | 'progress_desc'>('date_desc');

  // Selected for bulk actions
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [activeDrawerAppId, setActiveDrawerAppId] = useState<string | null>(initialSelectedAppId || null);

  // Test Application Generator Modal State
  const [showTestModal, setShowTestModal] = useState(false);
  const [testFormStatus, setTestFormStatus] = useState<ApplicationStatus>('submitted');
  const [testFormName, setTestFormName] = useState('');
  const [testFormProgramId, setTestFormProgramId] = useState(programs[0]?.id || 'prog-genai');
  const [testFormCohortId, setTestFormCohortId] = useState('');

  // Status Metrics calculation
  const totalCount = applications.length;
  const draftCount = applications.filter(a => a.status === 'draft').length;
  const submittedCount = applications.filter(a => a.status === 'submitted').length;
  const underReviewCount = applications.filter(a => a.status === 'under_review').length;
  const assessmentPendingCount = applications.filter(a => a.status === 'assessment_pending' || a.status === 'assessment_invited').length;
  const assessmentCompletedCount = applications.filter(a => a.status === 'assessment_completed').length;
  const acceptedCount = applications.filter(a => a.status === 'admitted' || a.status === 'accepted' || a.status === 'enrolled').length;
  const waitlistedCount = applications.filter(a => a.status === 'waitlisted').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  const statusMetrics = [
    { id: 'all', label: 'Total Applications', count: totalCount, color: 'border-slate-300 text-slate-800 bg-white' },
    { id: 'draft', label: 'Draft', count: draftCount, color: 'border-slate-300 text-slate-700 bg-slate-50' },
    { id: 'submitted', label: 'Submitted', count: submittedCount, color: 'border-indigo-200 text-indigo-700 bg-indigo-50/50' },
    { id: 'under_review', label: 'Under Review', count: underReviewCount, color: 'border-blue-200 text-blue-700 bg-blue-50/50' },
    { id: 'assessment_pending', label: 'Assessment Pending', count: assessmentPendingCount, color: 'border-purple-200 text-purple-700 bg-purple-50/50' },
    { id: 'assessment_completed', label: 'Assessment Completed', count: assessmentCompletedCount, color: 'border-cyan-200 text-cyan-700 bg-cyan-50/50' },
    { id: 'admitted', label: 'Accepted / Offer', count: acceptedCount, color: 'border-amber-300 text-amber-900 bg-amber-50/70' },
    { id: 'waitlisted', label: 'Waitlisted', count: waitlistedCount, color: 'border-orange-200 text-orange-800 bg-orange-50/50' },
    { id: 'rejected', label: 'Rejected', count: rejectedCount, color: 'border-rose-200 text-rose-800 bg-rose-50/50' },
  ];

  // Filtered & Sorted applications
  const filteredApps = applications.filter(app => {
    const matchesProgram = selectedProgramFilter === 'all' || app.programId === selectedProgramFilter;
    const matchesCohort = selectedCohortFilter === 'all' || app.cohortId === selectedCohortFilter;
    const matchesStatus = 
      selectedStatusFilter === 'all' || 
      (selectedStatusFilter === 'assessment_pending' 
        ? (app.status === 'assessment_pending' || app.status === 'assessment_invited')
        : (selectedStatusFilter === 'admitted'
          ? (app.status === 'admitted' || app.status === 'accepted' || app.status === 'enrolled')
          : app.status === selectedStatusFilter));

    const matchesStarred = !starredOnly || app.starred;
    const matchesScore = minScoreFilter === 0 || (app.assessmentScore && app.assessmentScore >= minScoreFilter);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      !searchQuery ||
      app.fullName.toLowerCase().includes(searchLower) ||
      app.email.toLowerCase().includes(searchLower) ||
      app.country.toLowerCase().includes(searchLower) ||
      app.city.toLowerCase().includes(searchLower) ||
      app.id.toLowerCase().includes(searchLower) ||
      (app.educationLevel && app.educationLevel.toLowerCase().includes(searchLower)) ||
      (app.fieldOfStudy && app.fieldOfStudy.toLowerCase().includes(searchLower));

    return matchesProgram && matchesCohort && matchesStatus && matchesStarred && matchesScore && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date_desc':
        return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
      case 'date_asc':
        return new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
      case 'name_asc':
        return a.fullName.localeCompare(b.fullName);
      case 'name_desc':
        return b.fullName.localeCompare(a.fullName);
      case 'score_desc':
        return (b.assessmentScore || 0) - (a.assessmentScore || 0);
      case 'progress_desc':
        return (b.progressPercentage || 100) - (a.progressPercentage || 100);
      default:
        return 0;
    }
  });

  const activeDrawerApp = activeDrawerAppId ? applications.find(a => a.id === activeDrawerAppId) || null : null;

  const handleSelectAll = () => {
    if (selectedAppIds.length === filteredApps.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(filteredApps.map(a => a.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAppIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCreateTestCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProgram = programs.find(p => p.id === testFormProgramId) || programs[0];
    const targetCohort = cohorts.find(c => c.id === testFormCohortId && c.programId === targetProgram?.id) || 
                         cohorts.find(c => c.programId === targetProgram?.id) || cohorts[0];

    const newTestApp = createTestApplication({
      fullName: testFormName || undefined,
      programId: targetProgram?.id,
      cohortId: targetCohort?.id,
      status: testFormStatus,
    });

    setShowTestModal(false);
    setTestFormName('');
    setActiveDrawerAppId(newTestApp.id);
  };

  const handleExportCSV = () => {
    const headers = [
      'Application ID', 
      'Full Name', 
      'Email', 
      'Phone',
      'Country', 
      'City',
      'Programme', 
      'Cohort', 
      'Status', 
      'Assessment Score', 
      'Education Level', 
      'Field of Study',
      'Employment',
      'Applied Date',
      'Internal Notes Count'
    ];

    const rows = filteredApps.map(app => {
      const prog = programs.find(p => p.id === app.programId)?.name || app.programId;
      const coh = cohorts.find(c => c.id === app.cohortId)?.name || app.cohortId;
      return [
        app.id,
        `"${app.fullName}"`,
        app.email,
        app.phone,
        app.country,
        app.city,
        `"${prog}"`,
        `"${coh}"`,
        app.status,
        app.assessmentScore !== undefined ? app.assessmentScore : 'N/A',
        `"${app.educationLevel}"`,
        `"${app.fieldOfStudy}"`,
        `"${app.employmentStatus}"`,
        app.appliedDate,
        app.internalNotes?.length || 0,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NextGen_Class_Applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      title: 'CSV Export Generated',
      message: `Exported ${filteredApps.length} candidate dossiers to spreadsheet.`,
      type: 'success',
    });
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredApps, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `NextGen_Applications_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      title: 'JSON Export Complete',
      message: `Exported ${filteredApps.length} complete application records.`,
      type: 'success',
    });
  };

  const renderStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            DRAFT
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            SUBMITTED
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            UNDER REVIEW
          </span>
        );
      case 'assessment_pending':
      case 'assessment_invited':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            ASSESSMENT PENDING
          </span>
        );
      case 'assessment_completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
            ASSESSMENT DONE
          </span>
        );
      case 'admitted':
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            ACCEPTED / ADMITTED
          </span>
        );
      case 'waitlisted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
            WAITLISTED
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            REJECTED
          </span>
        );
      case 'enrolled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            ENROLLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. MODULE 6 DASHBOARD STATUS METRICS RIBBON (All 8 Lifecycle States)       */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 font-['Space_Grotesk'] text-sm sm:text-base">
              Application Pipeline Overview (Module 6)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click any metric badge to filter instantly
          </span>
        </div>

        {/* 8-Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
          {statusMetrics.map(item => {
            const isSelected = selectedStatusFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedStatusFilter(item.id)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'ring-2 ring-orange-600 border-orange-600 bg-orange-50 shadow-xs' 
                    : item.color + ' hover:border-zinc-400 hover:shadow-xs'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 truncate block">
                  {item.label}
                </span>
                <span className="text-xl sm:text-2xl font-extrabold font-['Space_Grotesk'] text-zinc-900 mt-1">
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOOLBAR, SEARCH, FILTERS & ACTION CONTROLS                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 font-['Space_Grotesk']">
              Admissions Applications & Candidate Dossiers
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Showing {filteredApps.length} of {applications.length} total applicant records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Create Test Application Button */}
            <button
              onClick={() => setShowTestModal(true)}
              className="flex items-center space-x-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-orange-200 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Test Application</span>
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-orange-700 shadow-sm font-bold' : 'text-zinc-600'
                }`}
                title="Data Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-orange-700 shadow-sm font-bold' : 'text-zinc-600'
                }`}
                title="Candidate Cards View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-white text-orange-700 shadow-sm font-bold' : 'text-zinc-600'
                }`}
                title="Kanban Board View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Export Dropdown / Buttons */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
                title="Export filtered records to CSV spreadsheet"
              >
                <Download className="w-3.5 h-3.5 text-zinc-600" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center space-x-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
                title="Export complete dossier data to JSON"
              >
                <Download className="w-3.5 h-3.5 text-zinc-600" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-3 border-t border-zinc-100 text-xs">
          
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate name, email, city, ID, education..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-300 text-xs focus:border-orange-500 outline-none"
            />
          </div>

          {/* Programme Filter */}
          <select
            value={selectedProgramFilter}
            onChange={e => {
              setSelectedProgramFilter(e.target.value);
              setSelectedCohortFilter('all');
            }}
            className="p-2 rounded-xl border border-slate-300 bg-white text-xs outline-none"
          >
            <option value="all">All Programmes ({programs.length})</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Cohort Filter */}
          <select
            value={selectedCohortFilter}
            onChange={e => setSelectedCohortFilter(e.target.value)}
            className="p-2 rounded-xl border border-slate-300 bg-white text-xs outline-none"
          >
            <option value="all">All Cohorts ({cohorts.length})</option>
            {cohorts
              .filter(c => selectedProgramFilter === 'all' || c.programId === selectedProgramFilter)
              .map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="p-2 rounded-xl border border-slate-300 bg-white text-xs outline-none font-semibold text-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft in Progress</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="assessment_pending">Assessment Pending</option>
            <option value="assessment_completed">Assessment Completed</option>
            <option value="admitted">Accepted / Admitted</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="p-2 rounded-xl border border-slate-300 bg-white text-xs outline-none"
          >
            <option value="date_desc">Applied Date (Newest)</option>
            <option value="date_asc">Applied Date (Oldest)</option>
            <option value="name_asc">Name (A to Z)</option>
            <option value="name_desc">Name (Z to A)</option>
            <option value="score_desc">Assessment Score (High to Low)</option>
            <option value="progress_desc">Draft Progress %</option>
          </select>
        </div>

        {/* Secondary Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setStarredOnly(!starredOnly)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl border text-xs transition cursor-pointer ${
                starredOnly ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${starredOnly ? 'fill-amber-400 text-amber-500' : ''}`} />
              <span>Starred Candidates Only</span>
            </button>

            {(selectedStatusFilter !== 'all' || selectedProgramFilter !== 'all' || selectedCohortFilter !== 'all' || searchQuery || starredOnly || minScoreFilter > 0) && (
              <button
                onClick={() => {
                  setSelectedStatusFilter('all');
                  setSelectedProgramFilter('all');
                  setSelectedCohortFilter('all');
                  setSearchQuery('');
                  setStarredOnly(false);
                  setMinScoreFilter(0);
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 flex items-center space-x-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
            <span>Min Assessment Score: {minScoreFilter}%</span>
            <input
              type="range"
              min={0}
              max={90}
              step={10}
              value={minScoreFilter}
              onChange={e => setMinScoreFilter(Number(e.target.value))}
              className="w-20 accent-indigo-600"
            />
          </div>
        </div>

        {/* Bulk Action Ribbon (If items selected) */}
        {selectedAppIds.length > 0 && (
          <div className="bg-slate-900 text-white p-3 px-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center space-x-2">
              <span className="font-bold bg-indigo-600 text-white px-2.5 py-0.5 rounded">
                {selectedAppIds.length} Selected
              </span>
              <span>Batch Status Updates:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  bulkUpdateStatus(selectedAppIds, 'under_review');
                  setSelectedAppIds([]);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg font-semibold transition cursor-pointer"
              >
                Mark Under Review
              </button>
              <button
                onClick={() => {
                  bulkUpdateStatus(selectedAppIds, 'assessment_pending');
                  setSelectedAppIds([]);
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg font-semibold transition cursor-pointer"
              >
                Invite to Assessment
              </button>
              <button
                onClick={() => {
                  bulkUpdateStatus(selectedAppIds, 'admitted');
                  setSelectedAppIds([]);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg transition cursor-pointer"
              >
                Admit / Accept
              </button>
              <button
                onClick={() => {
                  bulkUpdateStatus(selectedAppIds, 'waitlisted');
                  setSelectedAppIds([]);
                }}
                className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded-lg font-semibold transition cursor-pointer"
              >
                Waitlist
              </button>
              <button
                onClick={() => {
                  bulkUpdateStatus(selectedAppIds, 'rejected');
                  setSelectedAppIds([]);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg font-semibold transition cursor-pointer"
              >
                Decline / Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. PRIMARY VIEW: TABLE / CARDS / KANBAN                                   */}
      {/* ========================================================================= */}

      {/* VIEW A: DATA TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredApps.length > 0 && selectedAppIds.length === filteredApps.length}
                      onChange={handleSelectAll}
                      className="rounded accent-indigo-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Applicant & Contact</th>
                  <th className="p-4">Programme & Cohort</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Score / Documents</th>
                  <th className="p-4">Internal Notes</th>
                  <th className="p-4">Applied Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map(app => {
                  const prog = programs.find(p => p.id === app.programId);
                  const coh = cohorts.find(c => c.id === app.cohortId);
                  const isSelected = selectedAppIds.includes(app.id);
                  const filesCount = app.uploadedFiles ? Object.keys(app.uploadedFiles).length : 0;
                  const verifiedFilesCount = app.uploadedFiles 
                    ? (Object.values(app.uploadedFiles) as (UploadedFileRecord | null)[]).filter(f => f && f.verificationStatus === 'verified').length 
                    : 0;

                  return (
                    <tr 
                      key={app.id} 
                      onClick={() => setActiveDrawerAppId(app.id)}
                      className={`hover:bg-zinc-50/80 transition cursor-pointer ${
                        isSelected ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => handleToggleSelect(app.id, e as any)}
                          className="rounded accent-orange-600 cursor-pointer"
                        />
                      </td>

                      {/* Candidate Name & Info */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              toggleStarApplication(app.id);
                            }}
                            className={`p-1 rounded hover:bg-slate-100 transition ${
                              app.starred ? 'text-amber-400' : 'text-slate-300 hover:text-slate-500'
                            }`}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>

                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{app.fullName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">#{app.id}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                              <span>{app.email}</span>
                              <span>•</span>
                              <span>{app.city}, {app.country}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Programme & Cohort */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{prog?.name || 'Standard Track'}</div>
                        <div className="text-[11px] text-indigo-600 font-medium">{coh?.name || 'Cohort'}</div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {renderStatusBadge(app.status)}
                      </td>

                      {/* Score / Documents */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {app.assessmentScore !== undefined ? (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              <Sparkles className="w-3 h-3" />
                              <span>{app.assessmentScore}% Score</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Score pending</span>
                          )}

                          {filesCount > 0 && (
                            <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span>{verifiedFilesCount}/{filesCount} docs verified</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Internal Notes */}
                      <td className="p-4">
                        {app.internalNotes && app.internalNotes.length > 0 ? (
                          <div className="flex items-center space-x-1 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg w-fit text-[11px] font-medium">
                            <MessageSquare className="w-3 h-3 text-indigo-600" />
                            <span>{app.internalNotes.length} notes</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Applied Date */}
                      <td className="p-4 text-slate-500 text-[11px]">
                        {app.appliedDate}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveDrawerAppId(app.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer"
                        >
                          Review Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                      <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No applicant dossiers match current filters.</p>
                      <p className="text-xs text-slate-400 mt-1">Try broadening your search or resetting filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW B: CANDIDATE CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map(app => {
            const prog = programs.find(p => p.id === app.programId);
            const coh = cohorts.find(c => c.id === app.cohortId);

            return (
              <div 
                key={app.id}
                onClick={() => setActiveDrawerAppId(app.id)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono">Ref #{app.id}</span>
                      <h4 className="font-bold text-slate-900 font-['Space_Grotesk'] text-base">
                        {app.fullName}
                      </h4>
                      <p className="text-xs text-slate-500">{app.email} • {app.country}</p>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleStarApplication(app.id);
                      }}
                      className={`p-1 rounded hover:bg-slate-100 transition ${
                        app.starred ? 'text-amber-400' : 'text-slate-300 hover:text-slate-500'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <div><strong>Track:</strong> {prog?.name}</div>
                    <div className="text-indigo-600"><strong>Cohort:</strong> {coh?.name}</div>
                  </div>

                  {app.motivationStatement && (
                    <p className="text-xs text-slate-600 line-clamp-2 italic">
                      "{app.motivationStatement}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    {renderStatusBadge(app.status)}
                  </div>

                  {app.assessmentScore !== undefined ? (
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {app.assessmentScore}% Score
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">{app.appliedDate}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW C: KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 overflow-x-auto pb-4">
          {[
            { id: 'draft', title: '1. Draft', color: 'border-slate-300 bg-slate-50' },
            { id: 'submitted', title: '2. Submitted', color: 'border-indigo-300 bg-indigo-50/30' },
            { id: 'under_review', title: '3. Under Review', color: 'border-blue-300 bg-blue-50/30' },
            { id: 'assessment_pending', title: '4. Assess Pending', color: 'border-purple-300 bg-purple-50/30' },
            { id: 'assessment_completed', title: '5. Assess Done', color: 'border-cyan-300 bg-cyan-50/30' },
            { id: 'admitted', title: '6. Accepted / Offer', color: 'border-amber-300 bg-amber-50/40' },
            { id: 'waitlisted', title: '7. Waitlisted', color: 'border-orange-300 bg-orange-50/30' },
            { id: 'rejected', title: '8. Rejected', color: 'border-rose-300 bg-rose-50/30' },
          ].map(col => {
            const colApps = filteredApps.filter(a => {
              if (col.id === 'assessment_pending') return a.status === 'assessment_pending' || a.status === 'assessment_invited';
              if (col.id === 'admitted') return a.status === 'admitted' || a.status === 'accepted' || a.status === 'enrolled';
              return a.status === col.id;
            });

            return (
              <div key={col.id} className={`rounded-2xl border p-3 flex flex-col min-w-[220px] ${col.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider font-['Space_Grotesk']">
                    {col.title}
                  </span>
                  <span className="bg-white text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {colApps.map(app => (
                    <div
                      key={app.id}
                      onClick={() => setActiveDrawerAppId(app.id)}
                      className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate">{app.fullName}</span>
                        {app.starred && <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0 ml-1" />}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{app.country}</div>
                      {app.assessmentScore !== undefined && (
                        <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 w-fit">
                          {app.assessmentScore}% Score
                        </div>
                      )}
                    </div>
                  ))}

                  {colApps.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-[11px] italic">
                      No candidates in this stage.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: CREATE TEST APPLICATION (For verification & live testing)        */}
      {/* ========================================================================= */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold font-['Space_Grotesk'] text-base">
                  Generate Test Application Dossier
                </h3>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTestCandidate} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Target Lifecycle State</label>
                <select
                  value={testFormStatus}
                  onChange={e => setTestFormStatus(e.target.value as ApplicationStatus)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 outline-none"
                >
                  <option value="draft">DRAFT (In progress draft state)</option>
                  <option value="submitted">SUBMITTED (Ready for review)</option>
                  <option value="under_review">UNDER_REVIEW (Assigned to faculty)</option>
                  <option value="assessment_pending">ASSESSMENT_PENDING (Invitation sent)</option>
                  <option value="assessment_completed">ASSESSMENT_COMPLETED (Challenge graded)</option>
                  <option value="admitted">ACCEPTED (Offer & scholarship dispatched)</option>
                  <option value="waitlisted">WAITLISTED (Priority waitlist)</option>
                  <option value="rejected">REJECTED (Declined with feedback)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Candidate Full Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Samuel Adebayo (Leave blank for auto-generated name)"
                  value={testFormName}
                  onChange={e => setTestFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Programme</label>
                  <select
                    value={testFormProgramId}
                    onChange={e => {
                      setTestFormProgramId(e.target.value);
                      const matchingCohorts = cohorts.filter(c => c.programId === e.target.value);
                      if (matchingCohorts[0]) setTestFormCohortId(matchingCohorts[0].id);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none"
                  >
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Cohort</label>
                  <select
                    value={testFormCohortId}
                    onChange={e => setTestFormCohortId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none"
                  >
                    {cohorts
                      .filter(c => c.programId === testFormProgramId)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="bg-indigo-50 p-3.5 rounded-xl text-slate-700 space-y-1 border border-indigo-100 text-[11px]">
                <div className="font-bold text-indigo-900">Automatic Test Enrichment:</div>
                <p>
                  This injects complete profiles, sample CV attachments, initial internal review notes, and timeline audit logs so you can immediately test filtering, reviewing, changing status, and audit tracking.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate Test Candidate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. APPLICATION DETAIL DRAWER (When candidate is opened)                   */}
      {/* ========================================================================= */}
      {activeDrawerApp && (
        <ApplicationDetailDrawer
          application={activeDrawerApp}
          onClose={() => setActiveDrawerAppId(null)}
        />
      )}

    </div>
  );
};
