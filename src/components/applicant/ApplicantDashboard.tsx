import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Application, Program, Cohort, ApplicationStatus, UploadedFileRecord, AssessmentResource } from '../../types';
import { 
  FileText, 
  Sparkles, 
  Award, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  ChevronRight, 
  ShieldCheck, 
  ExternalLink,
  BookOpen,
  Send,
  Lock,
  Eye,
  Trash2,
  Play,
  RotateCcw,
  Check,
  X,
  FileCheck,
  AlertTriangle,
  FolderOpen,
  Paperclip,
  Download
} from 'lucide-react';
import { AdmissionOfferModal } from './AdmissionOfferModal';
import { AssessmentRunner } from './AssessmentRunner';

interface ApplicantDashboardProps {
  onStartNewApplication: () => void;
  onResumeDraft?: (draftApp: Application) => void;
}

export const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({
  onStartNewApplication,
  onResumeDraft,
}) => {
  const { 
    currentUser, 
    applications, 
    programs, 
    cohorts, 
    assessments, 
    deleteDraftApplication,
    setActivePortal, 
    setApplicantTab,
    addToast
  } = useApp();

  // Strict User Isolation: Filter ONLY applications belonging to this applicant
  const myApplications = applications.filter(
    a => a.applicantId === currentUser.id || 
         (a.email && currentUser.email && a.email.toLowerCase() === currentUser.email.toLowerCase())
  );

  const [selectedAppId, setSelectedAppId] = useState<string>(
    myApplications[0]?.id || ''
  );
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showViewDossierModal, setShowViewDossierModal] = useState(false);
  const [takingAssessmentApp, setTakingAssessmentApp] = useState<Application | null>(null);

  // Active Selected Application
  const activeApp = myApplications.find(a => a.id === (selectedAppId || myApplications[0]?.id)) || myApplications[0];
  const activeProg = programs.find(p => p.id === activeApp?.programId);
  const activeCohort = cohorts.find(c => c.id === activeApp?.cohortId);
  const activeAssessment = assessments.find(a => a.id === activeCohort?.assessmentId) || 
    assessments.find(a => a.programId === activeApp?.programId) || 
    assessments[0];

  const resources = activeAssessment?.resources || [];

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

    const docContent = `%PDF-1.4\n% NextGen Class Academy - Assessment Study Resource\n% Document Name: ${res.name}\n% Assessment: ${activeAssessment?.title || 'Screening Assessment'}\n% Type: ${(res.fileType || 'file').toUpperCase()}\n% Description: ${res.description || 'Assessment Study Guide and Rubric'}\n\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 200 >>\nstream\nBT /F1 16 Tf 50 700 Td (NextGen Class Academy - Assessment Resource) Tj ET\nBT /F1 12 Tf 50 660 Td (File: ${res.name}) Tj ET\nBT /F1 10 Tf 50 630 Td (Assessment: ${activeAssessment?.title || 'Screening Test'}) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000227 00000 n \n0000000298 00000 n \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n520\n%%EOF`;
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

  // Stage progress mapping
  const getStageIndex = (status: ApplicationStatus) => {
    switch (status) {
      case 'draft': return 0;
      case 'submitted': return 1;
      case 'under_review': return 2;
      case 'assessment_pending':
      case 'assessment_invited': return 3;
      case 'assessment_completed': return 3;
      case 'interview_scheduled': return 3;
      case 'admitted':
      case 'accepted': return 4;
      case 'enrolled': return 5;
      case 'rejected': return -1;
      case 'waitlisted': return 2;
      default: return 1;
    }
  };

  const currentStage = activeApp ? getStageIndex(activeApp.status) : 0;

  const stages = [
    { num: 1, title: 'Submission', desc: 'Dossier locked' },
    { num: 2, title: 'Faculty Review', desc: 'Eligibility check' },
    { num: 3, title: 'Assessment', desc: 'Technical & logic test' },
    { num: 4, title: 'Admitted', desc: 'Offer & scholarship' },
    { num: 5, title: 'Enrolled', desc: 'Seat locked in cohort' },
  ];

  // Calculate days remaining to cohort application deadline
  const calculateDaysLeft = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    const diff = new Date(deadlineStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysLeft(activeCohort?.applicationDeadline);

  // Status Badge Helper
  const renderStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>DRAFT IN PROGRESS</span>
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-300">
            <Check className="w-3.5 h-3.5 text-zinc-600" />
            <span>SUBMITTED</span>
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>UNDER REVIEW</span>
          </span>
        );
      case 'assessment_pending':
      case 'assessment_invited':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 animate-pulse">
            <Play className="w-3.5 h-3.5 text-orange-600" />
            <span>ASSESSMENT PENDING</span>
          </span>
        );
      case 'assessment_completed':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
            <span>ASSESSMENT COMPLETED</span>
          </span>
        );
      case 'admitted':
      case 'accepted':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 ring-2 ring-amber-300/30">
            <Award className="w-3.5 h-3.5 text-amber-700" />
            <span>ACCEPTED / ADMITTED</span>
          </span>
        );
      case 'waitlisted':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
            <Clock className="w-3.5 h-3.5 text-orange-600" />
            <span>WAITLISTED</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
            <X className="w-3.5 h-3.5 text-rose-600" />
            <span>REJECTED</span>
          </span>
        );
      case 'enrolled':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-bold px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 ring-2 ring-emerald-300/30">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
            <span>ENROLLED IN COHORT</span>
          </span>
        );
      default:
        return (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
            {((status as string) || '').replace('_', ' ').toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8" id="applicant-dashboard-view">
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-zinc-200 p-6 sm:p-7 flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center space-x-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-100 shadow-xs"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 font-['Space_Grotesk']">
                Welcome, {currentUser.name}
              </h2>
              <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-orange-200">
                Applicant
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 flex flex-wrap items-center gap-2">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span>{currentUser.location || 'Lagos, Nigeria'}</span>
              </span>
              <span>•</span>
              <span>{currentUser.email}</span>
              <span>•</span>
              <span className="font-semibold text-orange-600">{myApplications.length} Application{myApplications.length !== 1 ? 's' : ''} on file</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setApplicantTab('explore')}
            className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition cursor-pointer"
          >
            Explore Catalog
          </button>
          <button
            type="button"
            onClick={onStartNewApplication}
            className="flex items-center space-x-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Apply to New Cohort</span>
          </button>
        </div>
      </div>

      {/* Multiple Applications Switcher Tabs (if user has > 1 application/draft) */}
      {myApplications.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-zinc-600 shrink-0 mr-1">Your Applications:</span>
          {myApplications.map((app) => {
            const p = programs.find(prog => prog.id === app.programId);
            const c = cohorts.find(coh => coh.id === app.cohortId);
            const isSel = activeApp?.id === app.id;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedAppId(app.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                  isSel
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <span>{p?.name || 'Programme'} ({c?.name || 'Cohort'})</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                  isSel ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-700'
                }`}>
                  {app.status}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* If Taking Assessment */}
      {takingAssessmentApp && activeAssessment && (
        <div className="animate-in fade-in">
          <AssessmentRunner
            assessment={activeAssessment}
            application={takingAssessmentApp}
            onComplete={() => setTakingAssessmentApp(null)}
          />
        </div>
      )}

      {/* Main Active Application Dossier Card */}
      {!takingAssessmentApp && activeApp && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xs border border-zinc-200 overflow-hidden">
            {/* Header with Programme info & Status Pill */}
            <div className="p-6 bg-zinc-900 text-white flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  <span>Application Reference #{activeApp.id}</span>
                  <span>•</span>
                  <span>{activeApp.status === 'draft' ? 'Draft Saved' : 'Applied'} on {activeApp.appliedDate}</span>
                </div>
                <h3 className="text-xl font-bold font-['Space_Grotesk'] text-white">
                  {activeProg?.name || 'Programme Track'}
                </h3>
                <p className="text-xs text-zinc-300 mt-0.5">
                  {activeCohort?.name || 'Intake Cohort'} • Starts {activeCohort?.startDate || 'Upcoming'} • {activeCohort?.format || 'Online'}
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-2">
                {renderStatusBadge(activeApp.status)}
              </div>
            </div>

            {/* Application Progress & Deadline Bar */}
            <div className="p-6 bg-zinc-50/90 border-b border-zinc-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-800">
                      Application Completion Progress
                    </span>
                    <span className="font-extrabold text-orange-600">
                      {activeApp.progressPercentage || (activeApp.status === 'draft' ? 45 : 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        activeApp.status === 'draft' ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${activeApp.progressPercentage || (activeApp.status === 'draft' ? 45 : 100)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-zinc-600">
                    {activeApp.status === 'draft' 
                      ? 'Draft in progress. Complete all sections before the intake deadline.' 
                      : 'All required sections and documents locked and verified.'}
                  </div>
                </div>

                {/* Deadline & Assessment Status */}
                <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 text-xs">
                  {activeCohort?.applicationDeadline && (
                    <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs space-y-0.5">
                      <div className="text-[10px] uppercase font-bold text-zinc-600 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-zinc-600" />
                        <span>Application Deadline</span>
                      </div>
                      <div className="font-bold text-zinc-900">
                        {activeCohort.applicationDeadline}
                        {daysLeft !== null && (
                          <span className={`ml-1.5 text-[11px] font-semibold ${
                            daysLeft <= 3 ? 'text-rose-600' : 'text-amber-600'
                          }`}>
                            ({daysLeft > 0 ? `${daysLeft} days remaining` : 'Closing Today'})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assessment Status Pill */}
                  <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs space-y-0.5">
                    <div className="text-[10px] uppercase font-bold text-zinc-600 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-orange-500" />
                      <span>Assessment Status</span>
                    </div>
                    <div className="font-bold text-zinc-900">
                      {activeApp.assessmentScore !== undefined ? (
                        <span className="text-emerald-700">Completed ({activeApp.assessmentScore}%)</span>
                      ) : activeApp.status === 'assessment_invited' || activeApp.status === 'assessment_pending' ? (
                        <span className="text-orange-700 animate-pulse">Test Ready to Take</span>
                      ) : (
                        <span className="text-zinc-500">Locked Until Manager Approval</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Roadmap Stepper for Submitted/Active Applications */}
            {activeApp.status !== 'draft' && (
              <div className="p-6 bg-white border-b border-zinc-200">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
                  {stages.map((st) => {
                    const isCompleted = currentStage > st.num;
                    const isCurrent = currentStage === st.num;

                    return (
                      <div key={st.num} className="flex flex-col items-center text-center space-y-2 relative z-10">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-orange-600 text-white ring-4 ring-orange-100'
                            : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : st.num}
                        </div>

                        <div>
                          <div className={`text-xs font-bold ${
                            isCurrent ? 'text-orange-600' : isCompleted ? 'text-zinc-800' : 'text-zinc-400'
                          }`}>
                            {st.title}
                          </div>
                          <div className="text-[10px] text-zinc-600 mt-0.5">{st.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status-Specific Interactive Action Banners */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* 1. DRAFT STATE BANNER */}
              {activeApp.status === 'draft' && (
                <div className="bg-amber-50/80 rounded-2xl p-6 border border-amber-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                      <Clock className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                        Incomplete Application Draft
                      </div>
                      <h4 className="text-base font-bold text-zinc-900 mt-1">
                        Resume your application for {activeProg?.name}
                      </h4>
                      <p className="text-xs text-zinc-600 mt-1 max-w-xl">
                        Your draft was saved {activeApp.draftSavedAt ? `on ${new Date(activeApp.draftSavedAt).toLocaleDateString()}` : 'recently'}. Complete your answers, upload your documents, and submit before {activeCohort?.applicationDeadline || 'the intake cutoff'}. You must complete this form before the assessment phase unlocks.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => deleteDraftApplication(activeApp.id)}
                      className="p-2.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Discard Draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onResumeDraft ? onResumeDraft(activeApp) : onStartNewApplication()}
                      className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <span>Continue Application</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. ADMITTED / ACCEPTED STATE */}
              {(activeApp.status === 'admitted' || activeApp.status === 'accepted') && (
                <div className="bg-gradient-to-r from-amber-50 via-amber-50/60 to-yellow-50 rounded-2xl p-6 border border-amber-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-amber-100 rounded-xl text-amber-700 shadow-xs shrink-0">
                      <Award className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-900 uppercase tracking-wide">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Action Required: Official Admission Offer Ready</span>
                      </div>
                      <h4 className="text-base font-bold text-zinc-900 mt-1">
                        Congratulations! NextGen Admissions Board has accepted your dossier.
                      </h4>
                      <p className="text-xs text-zinc-600 mt-1 max-w-xl">
                        You have been awarded a <strong>{activeApp.scholarshipPercentage || 100}% Scholarship</strong>. Review the official admission terms and lock your seat before the enrollment cutoff.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowOfferModal(true)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition cursor-pointer"
                  >
                    <span>View & Accept Offer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 3. ENROLLED STATE */}
              {activeApp.status === 'enrolled' && (
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                        Enrollment Confirmed & Seat Locked
                      </div>
                      <h4 className="text-base font-bold text-zinc-900 mt-1">
                        You are an official NextGen Learner in {activeCohort?.name}!
                      </h4>
                      <p className="text-xs text-zinc-600 mt-1">
                        Access your cohort schedule, live class links, assignments, and capstone milestones in the Learner Hub.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActivePortal('learner')}
                    className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <span>Open Learner Hub</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 4. ASSESSMENT PENDING / INVITED STATE */}
              {(activeApp.status === 'assessment_invited' || activeApp.status === 'assessment_pending') && (
                <div className="bg-orange-50/70 rounded-2xl p-6 border border-orange-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-orange-100 rounded-xl text-orange-700 shrink-0">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-orange-900 uppercase tracking-wide">
                        Authorized: Technical & Logic Screening Test
                      </div>
                      <h4 className="text-base font-bold text-zinc-900 mt-1">
                        Screening Assessment for {activeProg?.name}
                      </h4>
                      <p className="text-xs text-zinc-600 mt-1">
                        You have been moved to Assessment Pending by the Program Manager. Complete your 30-minute timed evaluation before {activeCohort?.assessmentDeadline || 'intake deadline'}.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTakingAssessmentApp(activeApp)}
                    className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition cursor-pointer"
                  >
                    <span>Start Screening Test (30 Min)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 5. SUBMITTED / UNDER REVIEW / ASSESSMENT COMPLETED */}
              {(activeApp.status === 'submitted' || activeApp.status === 'under_review' || activeApp.status === 'assessment_completed') && (
                <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-zinc-200 rounded-xl text-zinc-700 shrink-0">
                      <Lock className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-700 uppercase tracking-wide">
                        {activeApp.status === 'assessment_completed' ? 'Assessment Completed • Final Review' : 'Application Form Submitted & In Review'}
                      </div>
                      <h4 className="text-base font-bold text-zinc-900 mt-1">
                        {activeApp.status === 'assessment_completed' 
                          ? `Screening test completed (Score: ${activeApp.assessmentScore}%). Admissions board is finalizing results.`
                          : 'NextGen Admissions Faculty is reviewing your submitted application form.'}
                      </h4>
                      <p className="text-xs text-zinc-600 mt-1">
                        {activeApp.assessmentScore 
                          ? 'Review board is completing holistic evaluation and scholarship allocation.'
                          : 'Your screening assessment will unlock as soon as the Program Manager moves your candidate status to "Assessment Pending".'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowViewDossierModal(true)}
                      className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-800 hover:text-zinc-900 bg-white hover:bg-zinc-100 px-4 py-2.5 rounded-xl border border-zinc-300 transition cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Submitted Dossier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplicantTab('assessments')}
                      className="flex items-center space-x-1.5 text-xs font-semibold text-orange-700 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 px-4 py-2.5 rounded-xl border border-orange-200 transition cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Study Resources</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 6. WAITLISTED STATE */}
              {activeApp.status === 'waitlisted' && (
                <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-orange-100 rounded-xl text-orange-700 shrink-0">
                      <Clock className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-orange-900 uppercase tracking-wide">
                        Application Waitlisted for {activeCohort?.name}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">
                        High Demand Intake Round
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Due to high candidate volume, your application is placed on priority waitlist. If seats open up before {activeCohort?.startDate}, you will be automatically notified.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setApplicantTab('inbox')}
                    className="text-xs font-semibold text-orange-800 bg-orange-100 hover:bg-orange-200 px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Contact Admissions
                  </button>
                </div>
              )}

              {/* 7. REJECTED STATE */}
              {activeApp.status === 'rejected' && (
                <div className="bg-rose-50 rounded-2xl p-6 border border-rose-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-rose-100 rounded-xl text-rose-700 shrink-0">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                        Admissions Decision
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">
                        Application Declined for This Cycle
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Thank you for your interest. Unfortunately we were unable to offer admission for this cohort. We encourage you to strengthen your prerequisites and reapply in the next intake cycle.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onStartNewApplication}
                    className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Apply to Another Track
                  </button>
                </div>
              )}

              {/* Assessment Study Materials & Reference Pack */}
              {resources.length > 0 && (
                <div className="mt-6 p-5 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-orange-100 text-orange-700 rounded-lg">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">
                          Assessment Reference Materials & Study Pack ({resources.length})
                        </h4>
                        <p className="text-[11px] text-zinc-600">
                          Curated study guides and reference datasets for {activeAssessment?.title}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setApplicantTab('assessments')}
                      className="text-xs font-bold text-orange-600 hover:text-orange-800 hover:underline flex items-center space-x-1"
                    >
                      <span>Open Testing Hub</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {resources.map((res) => (
                      <div
                        key={res.id}
                        className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs hover:border-orange-300 transition flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-bold uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                              {res.fileType}
                            </span>
                            <div className="text-xs font-bold text-zinc-900 truncate">
                              {res.name}
                            </div>
                          </div>
                          {res.description && (
                            <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                              {res.description}
                            </div>
                          )}
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {res.fileSizeMb} MB • Click to download
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleViewResource(res)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition cursor-pointer"
                            title="Preview Resource"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadResource(res)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 transition cursor-pointer"
                            title="Download Resource"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Get</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Candidate Dossier Summary & Audit Log Grid */}
              <div className="mt-8 pt-6 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Candidate Profile Snapshot</span>
                    <button
                      type="button"
                      onClick={() => setShowViewDossierModal(true)}
                      className="text-[11px] text-orange-600 hover:underline font-semibold"
                    >
                      View Full Dossier
                    </button>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs space-y-2.5 text-zinc-700">
                    <div>
                      <span className="text-zinc-600">Applicant:</span>{' '}
                      <strong className="text-zinc-900">{activeApp.fullName}</strong> ({activeApp.email})
                    </div>
                    <div>
                      <span className="text-zinc-600">Education:</span>{' '}
                      <strong className="text-zinc-900">{activeApp.educationLevel} in {activeApp.fieldOfStudy}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-600">Experience:</span>{' '}
                      <strong className="text-zinc-900">{activeApp.yearsExperience} ({activeApp.programmingBackground})</strong>
                    </div>
                    <div>
                      <span className="text-zinc-600">Employment:</span>{' '}
                      <strong className="text-zinc-900">{activeApp.employmentStatus}</strong>
                    </div>
                    {activeApp.assessmentScore !== undefined && (
                      <div className="text-orange-700 font-bold flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Technical Screening Score: {activeApp.assessmentScore}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Timeline & Admissions Audit Log
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3 max-h-48 overflow-y-auto text-xs">
                    {activeApp.timeline && activeApp.timeline.length > 0 ? (
                      activeApp.timeline.map((ev, idx) => (
                        <div key={ev.id || idx} className="flex items-start space-x-2.5">
                          <span className="w-2 h-2 rounded-full bg-orange-600 mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <div className="font-bold text-zinc-800">{ev.title}</div>
                            <div className="text-[11px] text-zinc-500">{ev.description}</div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">{ev.timestamp} • {ev.actor}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-400 text-xs italic">No timeline events recorded yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State if Candidate Has No Applications */}
      {!takingAssessmentApp && myApplications.length === 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 font-['Space_Grotesk']">
              No Active Applications Found
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              You haven't submitted an application yet. Explore our open programmes and cohorts to submit your candidate dossier.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartNewApplication}
            className="inline-flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-xs transition cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Start Your Application</span>
          </button>
        </div>
      )}

      {/* View Submitted Dossier Modal (Read-Only) */}
      {showViewDossierModal && activeApp && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-zinc-200">
            <div className="p-5 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-orange-400" />
                <h3 className="text-base font-bold font-['Space_Grotesk']">
                  Submitted Candidate Dossier #{activeApp.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowViewDossierModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-800">
              {/* Program & Status */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-500">Track & Cohort</div>
                  <div className="text-sm font-bold text-zinc-900">{activeProg?.name} • {activeCohort?.name}</div>
                  <div className="text-zinc-500 text-[11px] mt-0.5">Applied: {activeApp.appliedDate}</div>
                </div>
                <div>{renderStatusBadge(activeApp.status)}</div>
              </div>

              {/* Personal Details */}
              <div className="space-y-2">
                <div className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
                  Personal & Academic Details
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Name</span>
                    <div className="font-medium text-zinc-900">{activeApp.fullName}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Email</span>
                    <div className="font-medium text-zinc-900">{activeApp.email}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Phone</span>
                    <div className="font-medium text-zinc-900">{activeApp.phone}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Location</span>
                    <div className="font-medium text-zinc-900">{activeApp.city}, {activeApp.country}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Education</span>
                    <div className="font-medium text-zinc-900">{activeApp.educationLevel}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Discipline</span>
                    <div className="font-medium text-zinc-900">{activeApp.fieldOfStudy}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Experience</span>
                    <div className="font-medium text-zinc-900">{activeApp.yearsExperience}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Employment</span>
                    <div className="font-medium text-zinc-900">{activeApp.employmentStatus}</div>
                  </div>
                </div>
              </div>

              {/* Motivation & Vision */}
              <div className="space-y-2">
                <div className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
                  Motivation & Vision Statements
                </div>
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Why NextGen Academy:</span>
                    <p className="text-zinc-800 mt-1 leading-relaxed">{activeApp.motivationStatement}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Career Goals:</span>
                    <p className="text-zinc-800 mt-1 leading-relaxed">{activeApp.goalsStatement}</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Form Responses */}
              {activeApp.customAnswers && Object.keys(activeApp.customAnswers).length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
                    Custom Dynamic Form Answers
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    {Object.entries(activeApp.customAnswers).map(([k, val]) => (
                      <div key={k} className="bg-white p-3 rounded-lg border border-zinc-200">
                        <div className="text-[10px] text-zinc-500 font-semibold">{k}</div>
                        <div className="font-medium text-zinc-900 mt-0.5">
                          {Array.isArray(val) ? val.join(', ') : String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Documents */}
              {activeApp.uploadedFiles && Object.keys(activeApp.uploadedFiles).length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
                    Attached Documents
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    {Object.entries(activeApp.uploadedFiles).map(([k, file]) => {
                      const fileRecord = file as UploadedFileRecord;
                      return (
                        <div key={k} className="bg-white p-3 rounded-lg border border-zinc-200 flex items-center justify-between">
                          <div className="truncate">
                            <div className="text-[10px] text-zinc-500 font-semibold truncate">{k}</div>
                            <div className="font-bold text-zinc-900 truncate">📎 {fileRecord.fileName}</div>
                            <div className="text-[10px] text-zinc-400">{fileRecord.fileSizeMb} MB</div>
                          </div>
                          {fileRecord.fileUrl && (
                            <a
                              href={fileRecord.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg shrink-0"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowViewDossierModal(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && activeApp && activeProg && activeCohort && (
        <AdmissionOfferModal
          application={activeApp}
          program={activeProg}
          cohort={activeCohort}
          onClose={() => setShowOfferModal(false)}
        />
      )}

      {/* Timed Assessment Runner Modal */}
      {takingAssessmentApp && activeAssessment && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto flex items-center justify-center">
          <div className="max-w-5xl w-full">
            <AssessmentRunner
              assessment={activeAssessment}
              application={takingAssessmentApp}
              onComplete={() => setTakingAssessmentApp(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
