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
  AlertTriangle,
  ArrowRight
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

  // Requirement: Application form must be filled and submitted first
  const hasSubmittedApplicationForm = Boolean(activeApp && activeApp.status !== 'draft');

  // Requirement: Only when applicant has been moved to assessment pending (or invited/completed) from program manager end can they proceed
  const isAssessmentAuthorized = Boolean(
    activeApp && (
      activeApp.status === 'assessment_pending' || 
      activeApp.status === 'assessment_invited' || 
      activeApp.status === 'assessment_completed'
    )
  );

  const handleDownloadResource = (res: AssessmentResource) => {
    if (res.dataUrl && res.dataUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = res.dataUrl;
      link.download = res.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast({
        title: 'Downloading Resource',
        message: `Downloaded "${res.name}".`,
        type: 'info',
      });
      return;
    }

    if (res.url && res.url !== '#' && (res.url.startsWith('http') || res.url.startsWith('blob:'))) {
      const link = document.createElement('a');
      link.href = res.url;
      link.download = res.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast({
        title: 'Downloading Resource',
        message: `Downloaded "${res.name}".`,
        type: 'info',
      });
      return;
    }

    // Generate downloadable study pack document
    const docContent = `%PDF-1.4\n% NextGen Class Academy - Assessment Study Resource\n% Document Name: ${res.name}\n% Assessment: ${currentAssessment?.title || 'Screening Assessment'}\n% Type: ${(res.fileType || 'file').toUpperCase()}\n% Description: ${res.description || 'Assessment Study Guide and Rubric'}\n\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 200 >>\nstream\nBT /F1 16 Tf 50 700 Td (NextGen Class Academy - Assessment Resource) Tj ET\nBT /F1 12 Tf 50 660 Td (File: ${res.name}) Tj ET\nBT /F1 10 Tf 50 630 Td (Assessment: ${currentAssessment?.title || 'Screening Test'}) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000227 00000 n \n0000000298 00000 n \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n520\n%%EOF`;
    const mime = res.fileType === 'pdf' ? 'application/pdf' : 'text/plain;charset=utf-8;';
    const blob = new Blob([docContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = res.name;
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

  const handleViewResource = (res: AssessmentResource) => {
    if (res.dataUrl && res.dataUrl.startsWith('data:')) {
      const win = window.open();
      if (win) {
        win.document.write(`<iframe src="${res.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        handleDownloadResource(res);
      }
      return;
    }
    if (res.url && res.url !== '#' && res.url.startsWith('http')) {
      window.open(res.url, '_blank');
      return;
    }
    handleDownloadResource(res);
  };

  const getFileBadge = (type?: AssessmentResource['fileType']) => {
    switch (type) {
      case 'pdf':
        return <span className="bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded text-[10px] font-mono">PDF</span>;
      case 'docx':
        return <span className="bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded text-[10px] font-mono">DOCX</span>;
      case 'pptx':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px] font-mono">PPTX</span>;
      case 'xlsx':
      case 'csv':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] font-mono">{(type || 'file').toUpperCase()}</span>;
      case 'zip':
        return <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px] font-mono">ZIP</span>;
      default:
        return <span className="bg-zinc-100 text-zinc-800 font-bold px-2 py-0.5 rounded text-[10px] font-mono">{(type || 'FILE').toUpperCase()}</span>;
    }
  };

  // Check if applicant already took this assessment
  const hasTaken = activeApp?.assessmentScore !== undefined;

  return (
    <div className="space-y-6" id="applicant-assessments-view">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-zinc-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
              Admissions Testing Hub
            </span>
            {activeApp && (
              <span className="text-[11px] font-medium text-zinc-500">
                Application #{activeApp.id}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mt-1">
            Assessments & Study Resources
          </h1>
          <p className="text-xs text-zinc-600">
            Access screening assessments, study packs, curriculum guides, and test reference materials configured by the program managers.
          </p>
        </div>

        {activeApp && (
          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={() => setApplicantTab('dashboard')}
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 px-3.5 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      {/* RULE 1: Application Form Must Be Filled First */}
      {!hasSubmittedApplicationForm ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center max-w-2xl mx-auto space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 mx-auto flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-zinc-900 font-['Space_Grotesk']">
              Application Form Required
            </h2>
            <p className="text-sm text-zinc-600 max-w-lg mx-auto leading-relaxed">
              You must complete and submit your application form first before you can proceed to the assessment phase. Once submitted, your profile will be reviewed by the admissions committee.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setApplicantTab('explore')}
              className="inline-flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs transition cursor-pointer"
            >
              <span>Fill Application Form</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* RULE 2: Awaiting Manager Approval or Assessment Completed */}
          {hasTaken ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Assessment Completed Successfully • Awaiting Decision
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Your screening assessment has been completed and recorded successfully (Score: <strong>{activeApp?.assessmentScore}%</strong>). Your application and assessment results are under evaluation by the NextGen Admissions Board. Please await decision from the NextGen team.
                  </p>
                </div>
              </div>
              <div className="shrink-0 bg-white border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status: ASSESSMENT COMPLETED</span>
              </div>
            </div>
          ) : !isAssessmentAuthorized ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    Assessment Phase Locked: Awaiting Program Manager Authorization
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Your application form has been received and is under faculty review. You can proceed with the screening assessment only when your application has been moved to "Assessment Pending" status by the Program Manager.
                  </p>
                </div>
              </div>
              <div className="shrink-0 bg-white border border-amber-300 text-amber-900 text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Current Status: {(activeApp?.status || '').replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
          ) : null}

          {/* Main Grid: Left Assessment Selection & Details, Right Resources Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Assessment Overview & Questions Summary (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Assessment Selector Tabs if multiple assessments exist */}
              {assessments.length > 1 && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-3 shadow-xs">
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-2">
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
                              ? 'border-orange-500 bg-orange-50/70 shadow-xs'
                              : 'border-zinc-200 bg-white hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-zinc-900 truncate">
                              {a.title}
                            </span>
                            {isMyCohort && (
                              <span className="text-[9px] font-extrabold bg-orange-600 text-white px-1.5 py-0.2 rounded shrink-0">
                                YOUR TRACK
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-1 flex items-center space-x-2">
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
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-zinc-100">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                          {currentProg?.name || 'Programme Evaluation'}
                        </span>
                        <span className="text-xs font-semibold text-zinc-500">
                          {currentCoh?.name || 'Cohort Intake'}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${availability.badgeColor}`}>
                          {availability.badgeLabel}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-zinc-900 mt-2">
                        {currentAssessment.title}
                      </h2>
                      <p className="text-xs text-zinc-600 mt-1">
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
                      ) : !isAssessmentAuthorized ? (
                        <div className="bg-zinc-100 border border-zinc-200 text-zinc-500 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5" title="Requires Assessment Pending Status from Manager">
                          <Lock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Locked (Assessment Pending Required)</span>
                        </div>
                      ) : availability.isAvailable ? (
                        <button
                          type="button"
                          onClick={() => setActiveTakingAssessment(currentAssessment)}
                          className="inline-flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer"
                        >
                          <Play className="w-4 h-4" />
                          <span>Start Assessment</span>
                        </button>
                      ) : (
                        <div className="bg-zinc-50 border border-zinc-200 text-zinc-500 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5">
                          <Lock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Currently Unavailable</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Server Availability Notice if Not Available */}
                  {!availability.isAvailable && !hasTaken && isAssessmentAuthorized && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-900">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold">Assessment Access Notice</span>
                        <p className="text-amber-800 leading-relaxed">{availability.reason}</p>
                        {availability.formattedSchedule && (
                          <div className="font-semibold text-orange-700 mt-1">
                            ⏰ Schedule: {availability.formattedSchedule}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assessment Key Parameters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 space-y-1">
                      <div className="text-zinc-500 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Duration</span>
                      </div>
                      <div className="font-bold text-zinc-900">
                        {currentAssessment.durationMinutes || currentAssessment.timeLimitMinutes || 30} Minutes
                      </div>
                    </div>

                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 space-y-1">
                      <div className="text-zinc-500 flex items-center space-x-1">
                        <Layers className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Questions</span>
                      </div>
                      <div className="font-bold text-zinc-900">
                        {currentAssessment.questions?.length || 0} Questions
                      </div>
                    </div>

                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 space-y-1">
                      <div className="text-zinc-500 flex items-center space-x-1">
                        <Award className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Passing Score</span>
                      </div>
                      <div className="font-bold text-zinc-900">
                        {currentAssessment.passingScore || 70}% Benchmark
                      </div>
                    </div>

                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 space-y-1">
                      <div className="text-zinc-500 flex items-center space-x-1">
                        <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Study Files</span>
                      </div>
                      <div className="font-bold text-orange-600">
                        {resources.length} Available
                      </div>
                    </div>
                  </div>

                  {/* Assessment Guidelines & Instructions */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-orange-600" />
                      <span>Candidate Examination Instructions</span>
                    </h3>
                    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 text-xs space-y-2 text-zinc-700">
                      {currentAssessment.instructions && currentAssessment.instructions.length > 0 ? (
                        currentAssessment.instructions.map((inst, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-orange-200">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{inst}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-zinc-500">
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
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-xl border border-orange-200">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">
                        Assessment Resources & Study Pack
                      </h3>
                      <p className="text-[11px] text-zinc-500">
                        Reference documents & PDFs of any size
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                    {resources.length} File{resources.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Resources List */}
                {resources.length > 0 ? (
                  <div className="space-y-3">
                    {resources.map((res) => (
                      <div
                        key={res.id}
                        className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 hover:bg-white hover:border-orange-300 transition group space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start space-x-2.5">
                            <div className="mt-0.5 shrink-0">
                              {getFileBadge(res.fileType)}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition leading-snug">
                                {res.name}
                              </h4>
                              <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center space-x-2">
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

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleViewResource(res)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition cursor-pointer"
                              title={`View ${res.name}`}
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadResource(res)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition cursor-pointer"
                              title={`Download ${res.name}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>

                        {res.description && (
                          <p className="text-[11px] text-zinc-600 leading-relaxed pl-7">
                            {res.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200 space-y-2">
                    <Paperclip className="w-8 h-8 text-zinc-400 mx-auto" />
                    <div className="text-xs font-bold text-zinc-700">
                      No External Files Attached
                    </div>
                    <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                      This assessment does not require external reference documents. All questions are self-contained.
                    </p>
                  </div>
                )}

                {/* Quick Helper / Info Card */}
                <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl flex items-start space-x-2.5 text-xs text-zinc-950">
                  <Sparkles className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-zinc-900">Preparation Tip:</span>
                    <p className="text-[11px] text-zinc-700 leading-relaxed">
                      Download and review study packs and API documentation before starting your timed assessment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Taking Assessment Runner Modal */}
      {activeTakingAssessment && activeApp && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs p-4 sm:p-8 overflow-y-auto flex items-center justify-center">
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
