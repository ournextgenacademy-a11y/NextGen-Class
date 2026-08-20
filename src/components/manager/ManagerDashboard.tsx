import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Layers, 
  Sparkles, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Send, 
  BarChart3, 
  Calendar,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  CalendarCheck,
  Check,
  Plus
} from 'lucide-react';

interface ManagerDashboardProps {
  onNavigateTab: (tab: 'overview' | 'programs' | 'forms' | 'applications' | 'assessments' | 'communications' | 'mne' | 'learners') => void;
  onSelectApplication: (appId: string) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  onNavigateTab,
  onSelectApplication,
}) => {
  const { 
    programs, 
    cohorts, 
    applications, 
    assessments, 
    learners,
    currentUser,
    openCohortApplications,
    closeCohortApplications
  } = useApp();

  const totalApplications = applications.length;
  const underReviewCount = applications.filter(a => a.status === 'submitted' || a.status === 'under_review').length;
  const admittedCount = applications.filter(a => a.status === 'admitted').length;
  const enrolledCount = applications.filter(a => a.status === 'enrolled').length;

  // Active Programmes & Cohorts
  const activePrograms = programs.filter(p => p.status === 'active');
  const activeCohorts = cohorts.filter(c => c.status !== 'archived' && c.status !== 'completed');
  const applicationsOpenCohorts = cohorts.filter(c => c.status === 'applications_open');
  
  // Upcoming cohort start dates (sorted by nearest start date)
  const upcomingCohorts = [...cohorts]
    .filter(c => c.status !== 'archived' && c.status !== 'completed')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Recent applications
  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6 shadow-md">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>NextGen Academy • Module 2 Manager Command</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk'] text-white">
            Programmes & Cohorts Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time programme management, application window telemetry, upcoming cohort timelines, and candidate enrollment yield.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTab('forms')}
            className="flex items-center space-x-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-indigo-400/40 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span>Form Builder (Module 4)</span>
          </button>
          <button
            onClick={() => onNavigateTab('programs')}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Manage Programmes</span>
          </button>
          <button
            onClick={() => onNavigateTab('applications')}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Review Admissions ({totalApplications})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FOUR PRIMARY TELEMETRY TILES SPECIFIED IN MODULE 2 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* 1. Active Programmes */}
        <div 
          onClick={() => onNavigateTab('programs')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Programmes</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">
              {activePrograms.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>{programs.length} total defined</span>
              <span className="text-indigo-600 font-semibold flex items-center">
                Configure <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 2. Active Cohorts */}
        <div 
          onClick={() => onNavigateTab('programs')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Cohorts</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">
              {activeCohorts.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Across all domains</span>
              <span className="text-emerald-600 font-semibold flex items-center">
                Manage <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 3. Applications Currently Open */}
        <div 
          onClick={() => onNavigateTab('programs')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Applications Open</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-['Space_Grotesk']">
              {applicationsOpenCohorts.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Accepting submissions</span>
              <span className="text-emerald-700 font-bold">Live Now</span>
            </div>
          </div>
        </div>

        {/* 4. Upcoming Cohort Start Dates */}
        <div 
          onClick={() => onNavigateTab('programs')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming Starts</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">
              {upcomingCohorts.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between truncate">
              <span>Next: {upcomingCohorts[0]?.startDate || 'TBD'}</span>
              <span className="text-purple-600 font-semibold flex items-center">
                Timeline <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETAILED SECTION 1: APPLICATIONS OPEN & UPCOMING START DATES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Currently Open */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                <CalendarCheck className="w-4 h-4" />
                <span>Live Intake Cycles</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk'] mt-0.5">
                Applications Currently Open ({applicationsOpenCohorts.length})
              </h3>
            </div>

            <button
              onClick={() => onNavigateTab('programs')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
            >
              <span>Manage Windows</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {applicationsOpenCohorts.map(cohort => {
              const prog = programs.find(p => p.id === cohort.programId);
              const cohortApps = applications.filter(a => a.cohortId === cohort.id);

              return (
                <div key={cohort.id} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-xs">{cohort.name}</span>
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                        {cohort.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Programme: <strong>{prog?.name || 'Academy Programme'}</strong>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-2">
                      <span>Deadline: <strong>{cohort.applicationDeadline}</strong></span>
                      <span>•</span>
                      <span>{cohortApps.length} Submitted</span>
                      <span>•</span>
                      <span>Capacity: {cohort.capacity} seats</span>
                    </div>
                  </div>

                  <button
                    onClick={() => closeCohortApplications(cohort.id)}
                    className="bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 text-[11px] font-bold px-3 py-1.5 rounded-lg transition shrink-0"
                    title="Close applications for this cohort"
                  >
                    Close Intake
                  </button>
                </div>
              );
            })}

            {applicationsOpenCohorts.length === 0 && (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-2">
                <div>No cohorts currently have open application windows.</div>
                <button
                  onClick={() => onNavigateTab('programs')}
                  className="text-xs text-indigo-600 hover:underline font-bold"
                >
                  Open intake from Cohorts studio →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Cohort Start Dates */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-purple-600 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-4 h-4" />
                <span>Term Schedules</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk'] mt-0.5">
                Upcoming Cohort Start Dates ({upcomingCohorts.length})
              </h3>
            </div>

            <button
              onClick={() => onNavigateTab('programs')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingCohorts.map(cohort => {
              const prog = programs.find(p => p.id === cohort.programId);
              const isStartingSoon = new Date(cohort.startDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

              return (
                <div key={cohort.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-xs truncate">{cohort.name}</span>
                      {isStartingSoon && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded shrink-0">
                          Upcoming
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate mt-0.5">
                      {prog?.name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Term: <strong>{cohort.startDate}</strong> → <strong>{cohort.endDate}</strong>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900">
                      {cohort.enrolledCount} / {cohort.capacity}
                    </div>
                    <div className="text-[10px] text-slate-400">enrolled seats</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETAILED SECTION 2: ACTIVE PROGRAMMES GRID */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1.5 text-indigo-600 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Academy Offerings</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk'] mt-0.5">
              Active Academy Programmes ({activePrograms.length})
            </h3>
          </div>

          <button
            onClick={() => onNavigateTab('programs')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
          >
            <span>+ Create New Programme</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activePrograms.map(prog => {
            const progCohorts = cohorts.filter(c => c.programId === prog.id);
            const progApps = applications.filter(a => a.programId === prog.id);

            return (
              <div
                key={prog.id}
                onClick={() => onNavigateTab('programs')}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition bg-white space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {prog.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                    {prog.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs font-['Space_Grotesk'] line-clamp-1">
                    {prog.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {prog.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{progCohorts.length} Cohorts</span>
                  <span>{progApps.length} Applicants</span>
                  <span>{prog.durationWeeks} Weeks</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODULE 6 APPLICATION PIPELINE METRICS BREAKDOWN (8 Lifecycle States)     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1.5 text-indigo-600 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Module 6 Admissions Command</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk'] mt-0.5">
              Applications Lifecycle Breakdown ({applications.length} Total Dossiers)
            </h3>
          </div>

          <button
            onClick={() => onNavigateTab('applications')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
          >
            <span>Open Application Pipeline</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Draft', count: applications.filter(a => a.status === 'draft').length, color: 'bg-slate-50 border-slate-200 text-slate-700' },
            { label: 'Submitted', count: applications.filter(a => a.status === 'submitted').length, color: 'bg-indigo-50/50 border-indigo-200 text-indigo-700' },
            { label: 'Under Review', count: applications.filter(a => a.status === 'under_review').length, color: 'bg-blue-50/50 border-blue-200 text-blue-700' },
            { label: 'Assess Pending', count: applications.filter(a => a.status === 'assessment_pending' || a.status === 'assessment_invited').length, color: 'bg-purple-50/50 border-purple-200 text-purple-700' },
            { label: 'Assess Done', count: applications.filter(a => a.status === 'assessment_completed').length, color: 'bg-cyan-50/50 border-cyan-200 text-cyan-700' },
            { label: 'Accepted', count: applications.filter(a => a.status === 'admitted' || a.status === 'accepted' || a.status === 'enrolled').length, color: 'bg-amber-50/70 border-amber-200 text-amber-900' },
            { label: 'Waitlisted', count: applications.filter(a => a.status === 'waitlisted').length, color: 'bg-orange-50/50 border-orange-200 text-orange-800' },
            { label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length, color: 'bg-rose-50/50 border-rose-200 text-rose-800' },
          ].map(stat => (
            <div
              key={stat.label}
              onClick={() => onNavigateTab('applications')}
              className={`p-3 rounded-xl border ${stat.color} hover:shadow-xs transition cursor-pointer flex flex-col justify-between`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate block">
                {stat.label}
              </span>
              <span className="text-xl font-extrabold font-['Space_Grotesk'] text-slate-900 mt-1">
                {stat.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Applications Feed */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
              Recent Candidate Submissions
            </h3>
            <p className="text-xs text-slate-500">Latest applicants across active programmes</p>
          </div>

          <button
            onClick={() => onNavigateTab('applications')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
          >
            <span>View Pipeline ({applications.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {recentApplications.map(app => {
            const prog = programs.find(p => p.id === app.programId);
            const coh = cohorts.find(c => c.id === app.cohortId);

            return (
              <div
                key={app.id}
                onClick={() => {
                  onSelectApplication(app.id);
                  onNavigateTab('applications');
                }}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-xl transition cursor-pointer text-xs"
              >
                <div className="flex items-center space-x-3 min-w-[200px]">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs shrink-0">
                    {app.fullName[0]}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{app.fullName}</div>
                    <div className="text-[11px] text-slate-500">{app.country} • {app.educationLevel}</div>
                  </div>
                </div>

                <div className="hidden sm:block">
                  <div className="font-semibold text-slate-800">{prog?.name}</div>
                  <div className="text-[11px] text-slate-500">{coh?.name}</div>
                </div>

                <div className="text-right">
                  {app.assessmentScore ? (
                    <div className="font-bold text-indigo-600">Score: {app.assessmentScore}%</div>
                  ) : (
                    <div className="text-slate-400 italic">Score pending</div>
                  )}
                  <span className={`inline-block mt-0.5 text-[9px] font-bold px-2 py-0.2 rounded uppercase ${
                    app.status === 'admitted'
                      ? 'bg-amber-100 text-amber-800'
                      : app.status === 'enrolled'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {app.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
