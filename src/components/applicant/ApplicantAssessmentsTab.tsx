import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Assessment, AssessmentResource, Application } from '../../types';
import { AssessmentRunner } from './AssessmentRunner';
import { 
  checkAssessmentAvailability, 
  syncServerTime 
} from '../../utils/serverTime';
import { 
  Paperclip, 
  FileText, 
  Sparkles, 
  Download, 
  Play, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  AlertCircle, 
  ExternalLink, 
  Award, 
  Search, 
  FileCheck, 
  Layers,
  HelpCircle,
  Calendar,
  Check,
  RotateCcw,
  Lock,
  Eye,
  AlertTriangle
} from 'lucide-react';

export const ApplicantAssessmentsTab: React.FC = () => {
  const { 
    currentUser, 
    applications, 
    assessments, 
    programs, 
    cohorts, 
    addToast,
    setApplicantTab 
  } = useApp();

  // Find current applicant's applications
  const myApplications = applications.filter(
    a => a.applicantId === currentUser.id || 
         (a.email && currentUser.email && a.email.toLowerCase() === currentUser.email.toLowerCase())
  );

  // Active or selected application
  const [selectedAppId, setSelectedAppId] = useState<string>(
    myApplications[0]?.id || ''
  );
  const activeApp = myApplications.find(a => a.id === selectedAppId) || myApplications[0];

  const activeCohort = cohorts.find(c => c.id === activeApp?.cohortId);
  const activeProg = programs.find(p => p.id === activeApp?.programId);

  // Identify cohort's active assessment or fallback to first available
  const cohortAssessment = assessments.find(a => a.id === activeCohort?.assessmentId) ||
    assessments.find(a => a.programId === activeApp?.programId) ||
    assessments[0];

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    cohortAssessment?.id || assessments[0]?.id || ''
  );

  const [activeTakingAssessment, setActiveTakingAssessment] = useState<Assessment | null>(null);

  const currentAssessment = assessments.find(a => a.id === selectedAssessmentId) || cohortAssessment || assessments[0];
  const currentProg = programs.find(p => p.id === currentAssessment?.programId);
  const currentCoh = cohorts.find(c => c.id === currentAssessment?.cohortId);

  const resources = currentAssessment?.resources || [];

  // Check server availability
  const [availability, setAvailability] = useState(() => checkAssessmentAvailability(currentAssessment));

  useEffect(() => {
    syncServerTime().then(() => {
      setAvailability(checkAssessmentAvailability(currentAssessment));
    });
  }, [currentAssessment]);

  const handleDownloadResource = (res: AssessmentResource) => {
    const dummyText = `NextGen Class Academy - Assessment Study Pack & Resource\n\nDocument: ${res.name}\nType: ${(res.fileType || 'file').toUpperCase()}\nAssessment: ${currentAssessment?.title || 'Screening Evaluation'}\nDescription: ${res.description || 'Reference Guide'}\n\nCandidate Notice: Use this resource to prepare for your online evaluation.`;
    const blob = new Blob([dummyText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', res.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      title: 'Downloading Resource',
      message: `Downloaded "${res.name}".`,
      type: 'info',
    });
  };

  const getFileBadge = (type?: AssessmentResource['fileType']) => {
    switch (type) {
      case 'pdf':
        return <span className="bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded text-[10px] font-mono">PDF</span>;
      case 'docx':
        return <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px] font-mono">DOCX</span>;
      case 'pptx':
        return <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded text-[10px] font-mono">PPTX</span>;
      case 'xlsx':
      case 'csv':
        return <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px] font-mono">{(type || 'file').toUpperCase()}</span>;
      case 'zip':
        return <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-[10px] font-mono">ZIP</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] font-mono">{(type || 'FILE').toUpperCase()}</span>;
    }
  };

  // Check if applicant already took this assessment
  const hasTaken = activeApp?.assessmentScore !== undefined;

  return (
    <div className="space-y-6" id="applicant-assessments-view">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Admissions Testing Hub
            </span>
            {activeApp && (
              <span className="text-[11px] font-medium text-slate-500">
                Application #{activeApp.id}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Assessments & Study Resources
          </h1>
          <p className="text-xs text-slate-600">
            Access screening assessments, study packs, curriculum guides, and test reference materials configured by the program managers.
          </p>
        </div>

        {activeApp && (
          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={() => setApplicantTab('dashboard')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Left Assessment Selection & Details, Right Resources Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assessment Overview & Questions Summary (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Assessment Selector Tabs if multiple assessments exist */}
          {assessments.length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Available Assessments
              </label>
              <div className="flex space-x-2 overflow-x-auto pb-1">
                {assessments.map((a) => {
                  const p = programs.find(prog => prog.id === a.programId);
                  const isSel = a.id === selectedAssessmentId;
                  const isMyCohort = a.id === activeCohort?.assessmentId;
                  const avail = checkAssessmentAvailability(a);

                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedAssessmentId(a.id)}
                      className={`p-3 rounded-xl text-left border transition shrink-0 max-w-xs cursor-pointer ${
                        isSel
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {a.title}
                        </span>
                        {isMyCohort && (
                          <span className="text-[9px] font-extrabold bg-indigo-600 text-white px-1.5 py-0.2 rounded shrink-0">
                            YOUR TRACK
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-2">
                        <span>{p?.name || 'Academic Track'}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${avail.badgeColor}`}>
                          {avail.badgeLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Assessment Details Card */}
          {currentAssessment && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {currentProg?.name || 'Programme Evaluation'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {currentCoh?.name || 'Cohort Intake'}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${availability.badgeColor}`}>
                      {availability.badgeLabel}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-2">
                    {currentAssessment.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    {currentAssessment.description}
                  </p>
                </div>

                <div className="shrink-0">
                  {hasTaken && currentAssessment.id === cohortAssessment?.id ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center space-y-1">
                      <div className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">
                        Your Score
                      </div>
                      <div className="text-2xl font-extrabold text-emerald-600">
                        {activeApp?.assessmentScore}%
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTakingAssessment(currentAssessment)}
                        className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline mt-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Locked Result</span>
                      </button>
                    </div>
                  ) : availability.isAvailable ? (
                    <button
                      type="button"
                      onClick={() => setActiveTakingAssessment(currentAssessment)}
                      className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Assessment</span>
                    </button>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 text-slate-500 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Currently Unavailable</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Server Availability Notice if Not Available */}
              {!availability.isAvailable && !hasTaken && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-900">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">Assessment Access Notice</span>
                    <p className="text-amber-800 leading-relaxed">{availability.reason}</p>
                    {availability.formattedSchedule && (
                      <div className="font-semibold text-indigo-700 mt-1">
                        ⏰ Schedule: {availability.formattedSchedule}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Assessment Key Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Duration</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    {currentAssessment.durationMinutes || currentAssessment.timeLimitMinutes || 30} Minutes
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-slate-500 flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Questions</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    {currentAssessment.questions?.length || 0} Questions
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-slate-500 flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>Passing Score</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    {currentAssessment.passingScore || 70}% Benchmark
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-slate-500 flex items-center space-x-1">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    <span>Study Files</span>
                  </div>
                  <div className="font-bold text-indigo-600">
                    {resources.length} Available
                  </div>
                </div>
              </div>

              {/* Assessment Guidelines & Instructions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Candidate Examination Instructions</span>
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2 text-slate-700">
                  {currentAssessment.instructions && currentAssessment.instructions.length > 0 ? (
                    currentAssessment.instructions.map((inst, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{inst}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">
                      Standard examination rules apply. Ensure you complete all questions before submitting.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Assessment Resources & Study Materials (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Assessment Resources & Study Pack
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Materials provided by program faculty
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {resources.length} File{resources.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Resources List */}
            {resources.length > 0 ? (
              <div className="space-y-3">
                {resources.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-200 transition group space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5">
                        <div className="mt-0.5 shrink-0">
                          {getFileBadge(res.fileType)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                            {res.name}
                          </h4>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-2">
                            <span>{res.fileSizeMb} MB</span>
                            {res.uploadedAt && (
                              <>
                                <span>•</span>
                                <span>Uploaded {res.uploadedAt}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadResource(res)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition shrink-0 cursor-pointer"
                        title={`Download ${res.name}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>

                    {res.description && (
                      <p className="text-[11px] text-slate-600 leading-relaxed pl-7">
                        {res.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Paperclip className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs font-bold text-slate-700">
                  No External Files Attached
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  This assessment does not require external reference documents. All questions are self-contained.
                </p>
              </div>
            )}

            {/* Quick Helper / Info Card */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start space-x-2.5 text-xs text-indigo-950">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Preparation Tip:</span>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  Download and review study packs and API documentation before starting your timed assessment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Taking Assessment Runner Modal */}
      {activeTakingAssessment && activeApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto flex items-center justify-center">
          <div className="max-w-5xl w-full">
            <AssessmentRunner
              assessment={activeTakingAssessment}
              application={activeApp}
              onComplete={() => setActiveTakingAssessment(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
