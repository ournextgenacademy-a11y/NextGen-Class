import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  calculateMneMetrics,
  filterApplications,
  exportApplicationsToCSV,
  exportApplicationsToXLSX,
  MneFilters,
  MetricCalculationTrace
} from '../../utils/mneMetrics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Download,
  Award,
  Users,
  TrendingUp,
  Globe,
  Layers,
  Sparkles,
  CheckCircle2,
  FileText,
  Printer,
  ShieldCheck,
  Calendar,
  Filter,
  Search,
  FileSpreadsheet,
  FileDown,
  Info,
  X,
  UserCheck,
  GraduationCap,
  Briefcase,
  Percent,
  CheckSquare,
  Clock,
  ChevronRight,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

export const MneReportingView: React.FC = () => {
  const { programs, cohorts, applications, addToast } = useApp();

  // Filters State
  const [filters, setFilters] = useState<MneFilters>({
    programId: 'all',
    cohortId: 'all',
    dateRange: { preset: 'all' },
    status: 'all',
    searchQuery: '',
  });

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'assessments' | 'admissions' | 'demographics' | 'records'>('overview');

  // Selected Trace for Audit & Math Verification Inspector Modal
  const [selectedTrace, setSelectedTrace] = useState<MetricCalculationTrace | null>(null);

  // Dynamic filtered applications derived from actual database records
  const filteredApps = useMemo(() => {
    return filterApplications(applications, filters);
  }, [applications, filters]);

  // Real-time calculated M&E metrics computed directly from filtered application records
  const metrics = useMemo(() => {
    return calculateMneMetrics(filteredApps, cohorts);
  }, [filteredApps, cohorts]);

  // Handler for exporting CSV
  const handleExportCSV = () => {
    try {
      exportApplicationsToCSV(filteredApps, metrics, programs, cohorts);
      addToast({
        title: 'CSV Export Complete',
        message: `Successfully exported ${filteredApps.length} records to CSV with M&E summary headers.`,
        type: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Export Failed',
        message: err.message || 'Could not export CSV file.',
        type: 'error',
      });
    }
  };

  // Handler for exporting Excel (.xlsx)
  const handleExportXLSX = () => {
    try {
      const selectedProgName = programs.find(p => p.id === filters.programId)?.name || 'All Programmes';
      const selectedCohName = cohorts.find(c => c.id === filters.cohortId)?.name || 'All Cohorts';
      const summaryStr = `Programme: ${selectedProgName} | Cohort: ${selectedCohName} | Status: ${filters.status} | Date Range: ${filters.dateRange.preset}`;

      exportApplicationsToXLSX(filteredApps, metrics, programs, cohorts, summaryStr);
      addToast({
        title: 'Excel Workbook (.xlsx) Export Complete',
        message: `Generated multi-tab Excel report (Executive KPIs, Raw Records & Demographics).`,
        type: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Export Failed',
        message: err.message || 'Could not export Excel file.',
        type: 'error',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const resetFilters = () => {
    setFilters({
      programId: 'all',
      cohortId: 'all',
      dateRange: { preset: 'all' },
      status: 'all',
      searchQuery: '',
    });
  };

  const isFiltered = filters.programId !== 'all' ||
    filters.cohortId !== 'all' ||
    filters.status !== 'all' ||
    filters.dateRange.preset !== 'all' ||
    (filters.searchQuery && filters.searchQuery.trim() !== '');

  // Funnel chart data
  const funnelData = [
    { stage: 'Started', count: metrics.startedApplications, fill: '#6366f1' },
    { stage: 'Completed', count: metrics.completedApplications, fill: '#4f46e5' },
    { stage: 'Submitted', count: metrics.submittedApplications, fill: '#3b82f6' },
    { stage: 'Assessed', count: metrics.assessmentCompleted, fill: '#06b6d4' },
    { stage: 'Admitted', count: metrics.acceptedCount, fill: '#10b981' },
    { stage: 'Enrolled', count: metrics.enrolledCount, fill: '#059669' },
  ];

  // Gender Chart Data
  const genderChartData = metrics.gender.breakdown.map(g => ({
    name: g.label,
    value: g.count,
    color: g.color || '#6366f1',
    percentage: g.percentage,
  }));

  // Geographic Country Chart Data
  const countryChartData = metrics.location.countries.slice(0, 7).map(c => ({
    country: c.label,
    count: c.count,
    percentage: c.percentage,
  }));

  // Education Chart Data
  const educationChartData = metrics.education.breakdown.map(e => ({
    education: e.label,
    count: e.count,
    percentage: e.percentage,
  }));

  // Employment Chart Data
  const employmentChartData = metrics.employment.breakdown.map(e => ({
    status: e.label,
    count: e.count,
    percentage: e.percentage,
  }));

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>NextGen Class • Application Monitoring, Evaluation & Donor Reporting</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Space_Grotesk']">
            Program Manager Application Dashboard & M&E
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Live metrics calculated directly from database records. Monitor the complete funnel across applications, assessments, admissions, and demographic diversity benchmarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer border border-slate-300"
            title="Download CSV file with raw records and M&E metrics summary"
          >
            <FileDown className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>

          {/* XLSX Export */}
          <button
            onClick={handleExportXLSX}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm shadow-emerald-600/20 transition cursor-pointer"
            title="Download full multi-sheet Excel (.xlsx) workbook"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Export XLSX</span>
          </button>

          {/* Print / Stakeholder View */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm shadow-indigo-600/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Filter Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Filter By Programme, Cohort, Status & Date Range
            </h3>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            )}
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 text-xs font-medium">
              Showing <strong>{metrics.totalApplicants}</strong> of <strong>{applications.length}</strong> applications
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* 1. Programme Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Programme
            </label>
            <select
              value={filters.programId}
              onChange={e => {
                setFilters(prev => ({
                  ...prev,
                  programId: e.target.value,
                  cohortId: 'all', // Reset cohort on program change
                }));
              }}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800"
            >
              <option value="all">All Programmes ({programs.length})</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* 2. Cohort Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Cohort
            </label>
            <select
              value={filters.cohortId}
              onChange={e => setFilters(prev => ({ ...prev, cohortId: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800"
            >
              <option value="all">All Cohorts ({cohorts.length})</option>
              {cohorts
                .filter(c => filters.programId === 'all' || c.programId === filters.programId)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>

          {/* 3. Application Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Application Status
            </label>
            <select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft (Incomplete)</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="assessment_pending">Assessment Pending</option>
              <option value="assessment_invited">Assessment Invited</option>
              <option value="assessment_completed">Assessment Completed</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="admitted">Admitted / Accepted</option>
              <option value="waitlisted">Waitlisted</option>
              <option value="rejected">Rejected</option>
              <option value="enrolled">Enrolled</option>
            </select>
          </div>

          {/* 4. Date Range Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Date Range
            </label>
            <select
              value={filters.dateRange.preset}
              onChange={e => setFilters(prev => ({
                ...prev,
                dateRange: {
                  ...prev.dateRange,
                  preset: e.target.value as any,
                },
              }))}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800"
            >
              <option value="all">All Time (Entire Pipeline)</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="ytd">Year to Date (2026)</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* 5. Search Query Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Search Candidate / Location
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Name, email, country, edu..."
                value={filters.searchQuery || ''}
                onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                  className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Custom Date Pickers (Shown if preset === 'custom') */}
        {filters.dateRange.preset === 'custom' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs bg-slate-50 p-3 rounded-xl">
            <span className="font-bold text-slate-700">Custom Date Bounds:</span>
            <div className="flex items-center space-x-2">
              <label className="text-slate-500 font-medium">From:</label>
              <input
                type="date"
                value={filters.dateRange.startDate || ''}
                onChange={e => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, startDate: e.target.value },
                }))}
                className="p-1.5 rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-slate-500 font-medium">To:</label>
              <input
                type="date"
                value={filters.dateRange.endDate || ''}
                onChange={e => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, endDate: e.target.value },
                }))}
                className="p-1.5 rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Executive Overview & KPIs</span>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'applications'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Applications Pipeline ({metrics.totalApplicants})</span>
        </button>

        <button
          onClick={() => setActiveTab('assessments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'assessments'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Assessment Analytics ({metrics.assessmentCompleted})</span>
        </button>

        <button
          onClick={() => setActiveTab('admissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'admissions'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Admissions & Yield ({metrics.acceptedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('demographics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'demographics'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Demographics & Diversity</span>
        </button>

        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'records'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Filtered Records & Verifier ({filteredApps.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4 CORE METRIC QUADRANTS (APPLICATIONS, ASSESSMENT, ADMISSIONS, DEMOGRAPHICS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* QUADRANT 1: APPLICATIONS METRICS */}
        <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-600 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Applications</span>
            </span>
            <button
              onClick={() => setSelectedTrace(metrics.traces['applicationCompletionRate'])}
              className="text-slate-400 hover:text-indigo-600 text-xs transition cursor-pointer"
              title="Inspect Calculation Formula"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">
                {metrics.totalApplicants}
              </div>
              <div className="text-xs text-slate-500 font-medium">Total Applicants</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-indigo-600 font-['Space_Grotesk']">
                {metrics.applicationCompletionRate}%
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Completion Rate</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-2 rounded-xl">
              <div className="font-bold text-slate-800">{metrics.startedApplications}</div>
              <div className="text-[10px] text-slate-400">Started</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <div className="font-bold text-indigo-600">{metrics.completedApplications}</div>
              <div className="text-[10px] text-slate-400">Completed</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <div className="font-bold text-emerald-600">{metrics.submittedApplications}</div>
              <div className="text-[10px] text-slate-400">Submitted</div>
            </div>
          </div>
        </div>

        {/* QUADRANT 2: ASSESSMENT METRICS */}
        <div className="bg-white rounded-2xl p-5 border border-cyan-100 shadow-sm space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-cyan-700 flex items-center space-x-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Assessment</span>
            </span>
            <button
              onClick={() => setSelectedTrace(metrics.traces['passRate'])}
              className="text-slate-400 hover:text-cyan-700 text-xs transition cursor-pointer"
              title="Inspect Calculation Formula"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">
                {metrics.averageScore}%
              </div>
              <div className="text-xs text-slate-500 font-medium">Average Score</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-cyan-600 font-['Space_Grotesk']">
                {metrics.passRate}%
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Pass Rate (&gt;={metrics.passingScoreThreshold}%)</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-2 rounded-xl">
              <div className="font-bold text-slate-800">{metrics.assessmentEligible}</div>
              <div className="text-[10px] text-slate-400">Eligible</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <div className="font-bold text-cyan-600">{metrics.assessmentStarted}</div>
              <div className="text-[10px] text-slate-400">Started</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <div className="font-bold text-emerald-600">{metrics.assessmentCompleted}</div>
              <div className="text-[10px] text-slate-400">Completed</div>
            </div>
          </div>
        </div>

        {/* QUADRANT 3: ADMISSIONS METRICS */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-700 flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Admissions</span>
            </span>
            <button
              onClick={() => setSelectedTrace(metrics.traces['acceptanceRate'])}
              className="text-slate-400 hover:text-emerald-700 text-xs transition cursor-pointer"
              title="Inspect Calculation Formula"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">
                {metrics.acceptedCount}
              </div>
              <div className="text-xs text-slate-500 font-medium">Accepted Candidates</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-600 font-['Space_Grotesk']">
                {metrics.acceptanceRate}%
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Acceptance Rate</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-2 rounded-xl">
              <div className="font-bold text-emerald-600">{metrics.acceptedCount}</div>
              <div className="text-[10px] text-slate-400">Accepted</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <div className="font-bold text-amber-600">{metrics.waitlistedCount}</div>
              <div className="text-[10px] text-slate-400">Waitlisted</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <div className="font-bold text-rose-600">{metrics.rejectedCount}</div>
              <div className="text-[10px] text-slate-400">Rejected</div>
            </div>
          </div>
        </div>

        {/* QUADRANT 4: DEMOGRAPHICS METRICS */}
        <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-pink-700 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Demographics & Diversity</span>
            </span>
            <button
              onClick={() => setSelectedTrace(metrics.traces['femaleParticipationRate'])}
              className="text-slate-400 hover:text-pink-700 text-xs transition cursor-pointer"
              title="Inspect Calculation Formula"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-pink-600 font-['Space_Grotesk']">
                {metrics.gender.femalePercentage}%
              </div>
              <div className="text-xs text-slate-500 font-medium">Female Participation</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-800 font-['Space_Grotesk']">
                {metrics.location.totalCountries}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Countries Reached</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-2 rounded-xl">
              <div className="font-bold text-pink-600">{metrics.gender.female}</div>
              <div className="text-[10px] text-slate-400">Female</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <div className="font-bold text-blue-600">{metrics.gender.male}</div>
              <div className="text-[10px] text-slate-400">Male</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <div className="font-bold text-purple-600">{metrics.gender.nonBinary + metrics.gender.preferNotToSay}</div>
              <div className="text-[10px] text-slate-400">Other/N/A</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB CONTENT 1: EXECUTIVE OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Conversion Funnel + Diversity Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Admissions Conversion Funnel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Application Conversion Funnel</span>
                  </h3>
                  <p className="text-xs text-slate-500">Pipeline progression from Started to Enrolled</p>
                </div>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {metrics.applicationCompletionRate}% Completion
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gender Diversity Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center space-x-2">
                    <Users className="w-4 h-4 text-pink-600" />
                    <span>Gender Inclusivity Benchmark</span>
                  </h3>
                  <p className="text-xs text-slate-500">Target: 45%+ Female Representation across tech tracks</p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                  metrics.gender.femalePercentage >= 40 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {metrics.gender.femalePercentage}% Female
                </span>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {genderChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Assessment & Country Breakdown Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assessment Score Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center space-x-2">
                    <CheckSquare className="w-4 h-4 text-cyan-600" />
                    <span>Screening Score Distribution</span>
                  </h3>
                  <p className="text-xs text-slate-500">Average: {metrics.averageScore}% • Pass Threshold: {metrics.passingScoreThreshold}%</p>
                </div>
                <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg">
                  {metrics.passRate}% Pass Rate
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pan-African Geographic Reach */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <span>Geographic Distribution (Top Countries)</span>
                  </h3>
                  <p className="text-xs text-slate-500">{metrics.location.totalCountries} countries represented in active pool</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countryChartData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="country" type="category" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Education & Employment Backgrounds */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Education Level */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Applicant Education Level</span>
                </h3>
                <p className="text-xs text-slate-500">Highest academic or technical credential achieved</p>
              </div>

              <div className="space-y-3">
                {metrics.education.breakdown.map((edu, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-700">{edu.label}</span>
                      <span className="text-slate-500 font-bold">{edu.count} ({edu.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${edu.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Employment Status */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Applicant Employment Status</span>
                </h3>
                <p className="text-xs text-slate-500">Economic and employment profile at time of application</p>
              </div>

              <div className="space-y-3">
                {metrics.employment.breakdown.map((emp, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-700">{emp.label}</span>
                      <span className="text-slate-500 font-bold">{emp.count} ({emp.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${emp.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 2: APPLICATIONS PIPELINE */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                Detailed Applications Pipeline & Conversion
              </h3>
              <p className="text-xs text-slate-500">
                Tracking every applicant lifecycle touchpoint from initiation to submission.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Applicants</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalApplicants}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">100% of pipeline</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Started Applications</span>
                <div className="text-2xl font-bold text-indigo-600 mt-1">{metrics.startedApplications}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Initiated dossiers</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Completed Applications</span>
                <div className="text-2xl font-bold text-indigo-800 mt-1">{metrics.completedApplications}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Full forms filled</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Submitted Applications</span>
                <div className="text-2xl font-bold text-emerald-600 mt-1">{metrics.submittedApplications}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Sent for evaluation</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Completion Rate</span>
                <div className="text-2xl font-bold text-emerald-700 mt-1">{metrics.applicationCompletionRate}%</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Completed / Started</div>
              </div>
            </div>

            <div className="h-72 w-full pt-4 border-t border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 3: ASSESSMENTS ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                Technical Screening & Cognitive Assessment Metrics
              </h3>
              <p className="text-xs text-slate-500">
                Screening performance, average marks, pass rates, and score brackets across candidates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100">
                <span className="text-[10px] font-bold uppercase text-cyan-700">Assessment Eligible</span>
                <div className="text-2xl font-bold text-cyan-900 mt-1">{metrics.assessmentEligible}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Qualified for test</div>
              </div>

              <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100">
                <span className="text-[10px] font-bold uppercase text-cyan-700">Assessment Started</span>
                <div className="text-2xl font-bold text-cyan-900 mt-1">{metrics.assessmentStarted}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Launched challenge</div>
              </div>

              <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100">
                <span className="text-[10px] font-bold uppercase text-cyan-700">Assessment Completed</span>
                <div className="text-2xl font-bold text-cyan-900 mt-1">{metrics.assessmentCompleted}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Finished & scored</div>
              </div>

              <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100">
                <span className="text-[10px] font-bold uppercase text-cyan-700">Completion Rate</span>
                <div className="text-2xl font-bold text-cyan-900 mt-1">{metrics.assessmentCompletionRate}%</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Completed / Eligible</div>
              </div>

              <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100">
                <span className="text-[10px] font-bold uppercase text-cyan-700">Average Score</span>
                <div className="text-2xl font-bold text-indigo-700 mt-1">{metrics.averageScore}%</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Mean percentage mark</div>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold uppercase text-emerald-700">Pass Rate</span>
                <div className="text-2xl font-bold text-emerald-700 mt-1">{metrics.passRate}%</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{metrics.passedCount} of {metrics.assessmentCompleted} passed</div>
              </div>
            </div>

            <div className="h-72 w-full pt-4 border-t border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.scoreDistribution} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 4: ADMISSIONS & YIELD */}
      {/* ========================================================================= */}
      {activeTab === 'admissions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                Admissions Decisions, Acceptance Rate & Scholarship Grants
              </h3>
              <p className="text-xs text-slate-500">
                Final selection metrics and scholarship grant disbursements.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold uppercase text-emerald-700">Accepted Candidates</span>
                <div className="text-2xl font-bold text-emerald-800 mt-1">{metrics.acceptedCount}</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Admitted / Offers Issued</div>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <span className="text-[10px] font-bold uppercase text-amber-700">Waitlisted</span>
                <div className="text-2xl font-bold text-amber-800 mt-1">{metrics.waitlistedCount}</div>
                <div className="text-[11px] text-amber-600 mt-0.5">Reserve talent list</div>
              </div>

              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                <span className="text-[10px] font-bold uppercase text-rose-700">Rejected</span>
                <div className="text-2xl font-bold text-rose-800 mt-1">{metrics.rejectedCount}</div>
                <div className="text-[11px] text-rose-600 mt-0.5">Declined applications</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500">Acceptance Rate</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.acceptanceRate}%</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Accepted / Submitted</div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <span className="text-[10px] font-bold uppercase text-indigo-700">Scholarships Value</span>
                <div className="text-2xl font-bold text-indigo-800 mt-1">${metrics.scholarshipsTotalValue.toLocaleString()}</div>
                <div className="text-[11px] text-indigo-600 mt-0.5">{metrics.scholarshipsAwardedCount} donor grants</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 5: DEMOGRAPHICS */}
      {/* ========================================================================= */}
      {activeTab === 'demographics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gender Inclusivity */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                Gender Representation
              </h3>
              <div className="space-y-2">
                {metrics.gender.breakdown.map((g, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                      <span className="text-xs font-bold text-slate-700">{g.label}</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">{g.count} candidates ({g.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                Country Representation ({metrics.location.totalCountries} Countries)
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {metrics.location.countries.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">{c.label}</span>
                    <span className="text-xs font-extrabold text-indigo-600">{c.count} ({c.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 6: RAW RECORDS & CALCULATION VERIFIER */}
      {/* ========================================================================= */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                  Underlying Database Records ({filteredApps.length} Applications)
                </h3>
                <p className="text-xs text-slate-500">
                  Direct live data records currently evaluated in the active M&E filter scope.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer"
                >
                  Download CSV
                </button>
                <button
                  onClick={handleExportXLSX}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Download Excel
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">ID / Candidate</th>
                    <th className="p-3">Programme & Cohort</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Gender</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Education</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Applied Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredApps.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{app.fullName}</div>
                        <div className="text-[11px] text-slate-500">{app.email}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-700">{programs.find(p => p.id === app.programId)?.name || app.programId}</div>
                        <div className="text-[10px] text-slate-400">{cohorts.find(c => c.id === app.cohortId)?.name || app.cohortId}</div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          app.status === 'admitted' || app.status === 'enrolled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : app.status === 'waitlisted'
                            ? 'bg-amber-100 text-amber-800'
                            : app.status === 'draft'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{app.gender || '—'}</td>
                      <td className="p-3 font-medium">{app.city ? `${app.city}, ${app.country}` : app.country || '—'}</td>
                      <td className="p-3 font-medium">{app.educationLevel || '—'}</td>
                      <td className="p-3 font-bold">
                        {app.assessmentScore !== undefined ? (
                          <span className={app.assessmentScore >= 70 ? 'text-emerald-600' : 'text-rose-600'}>
                            {app.assessmentScore}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500">{app.appliedDate || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MATHEMATICAL AUDIT TRACE & CALCULATION INSPECTOR MODAL */}
      {/* ========================================================================= */}
      {selectedTrace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                    Calculation Audit Trace: {selectedTrace.metricName}
                  </h3>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                    Category: {selectedTrace.category}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrace(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-400">Calculated Value</div>
                <div className="text-2xl font-bold text-indigo-600 mt-0.5">
                  {selectedTrace.formattedValue}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-400">Arithmetic Formula</div>
                <code className="text-xs font-mono text-slate-800 font-bold bg-white p-2 rounded-lg block border border-slate-200">
                  {selectedTrace.formula}
                </code>
              </div>

              {selectedTrace.numerator !== undefined && selectedTrace.denominator !== undefined && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Numerator</div>
                    <div className="text-lg font-bold text-slate-800">{selectedTrace.numerator}</div>
                    <div className="text-[10px] text-slate-500">{selectedTrace.numeratorDescription}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Denominator</div>
                    <div className="text-lg font-bold text-slate-800">{selectedTrace.denominator}</div>
                    <div className="text-[10px] text-slate-500">{selectedTrace.denominatorDescription}</div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  Matching Record IDs in Calculation ({selectedTrace.matchingRecordIds.length})
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-28 overflow-y-auto font-mono text-[11px] text-slate-600 divide-y divide-slate-200">
                  {selectedTrace.matchingRecordIds.map(id => (
                    <div key={id} className="py-1">{id}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTrace(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Close Audit Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
