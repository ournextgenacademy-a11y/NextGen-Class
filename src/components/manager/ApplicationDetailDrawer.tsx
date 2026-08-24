import React, { useState, useEffect } from 'react';
import { 
  Application, 
  Program, 
  Cohort, 
  ApplicationStatus, 
  RubricEvaluation, 
  UploadedFileRecord,
  InternalNote 
} from '../../types';
import { useApp } from '../../context/AppContext';
import { SubmittedApplicationFormView } from '../common/SubmittedApplicationFormView';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  FileText, 
  Linkedin, 
  Github, 
  Globe, 
  Award, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Star, 
  Send, 
  ShieldCheck, 
  AlertCircle,
  FileCheck2,
  ChevronRight,
  MessageSquare,
  History,
  Check,
  AlertTriangle,
  FileSearch,
  Plus,
  Tag,
  Download,
  ExternalLink
} from 'lucide-react';

interface ApplicationDetailDrawerProps {
  application: Application;
  onClose: () => void;
}

export const ApplicationDetailDrawer: React.FC<ApplicationDetailDrawerProps> = ({
  application,
  onClose,
}) => {
  const { 
    programs, 
    cohorts, 
    currentUser, 
    updateApplicationStatus, 
    updateRubricEvaluation, 
    addInternalNote,
    updateDocumentVerification,
    toggleStarApplication,
    sendMessage,
    makeAdmissionDecision,
    getPublishedFormForProgramme
  } = useApp();

  const program = programs.find(p => p.id === application.programId);
  const cohort = cohorts.find(c => c.id === application.cohortId);
  const publishedForm = getPublishedFormForProgramme(application.programId, application.cohortId);

  const [activeTab, setActiveTab] = useState<'form' | 'rubric' | 'notes' | 'decision' | 'timeline' | 'message'>('form');

  // Status Change State with Note
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(application.status);
  const [statusChangeNote, setStatusChangeNote] = useState('');
  const [isApplyingStatus, setIsApplyingStatus] = useState(false);

  useEffect(() => {
    setSelectedStatus(application.status);
  }, [application.status]);

  // New Note State
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<InternalNote['category']>('general');

  // Rubric State
  const [rubric, setRubric] = useState<RubricEvaluation>({
    technicalAptitude: application.rubricEvaluation?.technicalAptitude || 4,
    problemSolving: application.rubricEvaluation?.problemSolving || 4,
    motivationAndCommitment: application.rubricEvaluation?.motivationAndCommitment || 5,
    communicationSkills: application.rubricEvaluation?.communicationSkills || 4,
    overallRecommendation: application.rubricEvaluation?.overallRecommendation || 'admit',
    reviewerNotes: application.rubricEvaluation?.reviewerNotes || '',
    evaluatedBy: currentUser.name,
    evaluatedAt: new Date().toISOString().split('T')[0],
  });

  // Direct message state
  const [directMessageText, setDirectMessageText] = useState('');

  // Document verification modal/note state
  const [verifyingFieldId, setVerifyingFieldId] = useState<string | null>(null);
  const [docVerifyNote, setDocVerifyNote] = useState('');

  const handleStatusChangeSubmit = (newStatus: ApplicationStatus) => {
    if (newStatus === 'admitted' || newStatus === 'waitlisted' || newStatus === 'rejected') {
      makeAdmissionDecision({
        applicationId: application.id,
        decision: newStatus,
        reason: statusChangeNote || `Administrative admission decision: ${newStatus.toUpperCase()}`,
        decidedBy: currentUser.name,
      });
    } else {
      updateApplicationStatus(
        application.id, 
        newStatus, 
        statusChangeNote || `Administrative status change to ${(newStatus || '').replace('_', ' ').toUpperCase()} by ${currentUser.name}`
      );
    }
    setStatusChangeNote('');
    setIsApplyingStatus(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addInternalNote(application.id, newNoteText, newNoteCategory);
    setNewNoteText('');
  };

  const handleSaveRubric = (e: React.FormEvent) => {
    e.preventDefault();
    updateRubricEvaluation(application.id, rubric);
  };

  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directMessageText.trim()) return;

    sendMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      recipientId: application.applicantId,
      recipientName: application.fullName,
      programId: application.programId,
      cohortId: application.cohortId,
      type: 'direct',
      subject: `Admissions Update: ${program?.name || 'NextGen Academy'}`,
      content: directMessageText,
    });

    setDirectMessageText('');
    setActiveTab('timeline');
  };

  const statusOptions: { value: ApplicationStatus; label: string; badgeColor: string }[] = [
    { value: 'draft', label: 'Draft in Progress', badgeColor: 'bg-slate-100 text-slate-800 border-slate-300' },
    { value: 'submitted', label: 'Submitted', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { value: 'under_review', label: 'Under Review', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'assessment_pending', label: 'Assessment Pending', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
    { value: 'assessment_completed', label: 'Assessment Completed', badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
    { value: 'admitted', label: 'Accepted / Admitted', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300' },
    { value: 'waitlisted', label: 'Waitlisted', badgeColor: 'bg-orange-50 text-orange-800 border-orange-200' },
    { value: 'rejected', label: 'Rejected', badgeColor: 'bg-rose-50 text-rose-800 border-rose-200' },
    { value: 'enrolled', label: 'Enrolled', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  ];

  const currentStatusConfig = statusOptions.find(o => o.value === application.status) || statusOptions[1];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-400/30 uppercase tracking-wider">
                Ref #{application.id}
              </span>
              <button
                onClick={() => toggleStarApplication(application.id)}
                className={`p-1 rounded transition ${application.starred ? 'text-amber-400' : 'text-slate-500 hover:text-white'}`}
                title="Toggle Star"
              >
                <Star className="w-4 h-4 fill-current" />
              </button>
            </div>

            <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">
              {application.fullName}
            </h2>
            <div className="text-xs text-slate-300">
              {program?.name} • <span className="text-indigo-300">{cohort?.name}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Status Control Bar */}
        <div className="bg-indigo-50/70 p-4 px-6 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">Current Status:</span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${currentStatusConfig.badgeColor}`}>
              {(currentStatusConfig.label || '').toUpperCase()}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {application.assessmentScore !== undefined && (
              <div className="flex items-center space-x-1.5 font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg border border-indigo-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Score: {application.assessmentScore}%</span>
              </div>
            )}
            <button
              onClick={() => setActiveTab('decision')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1 rounded-lg shadow-xs transition cursor-pointer"
            >
              Update Status / Decision
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-white text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('form')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'form' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Application Form
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Internal Notes</span>
            {application.internalNotes && application.internalNotes.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {application.internalNotes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('rubric')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'rubric' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Faculty Rubric
          </button>
          <button
            onClick={() => setActiveTab('decision')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'decision' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Decision Hub
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'timeline' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Audit History ({application.timeline.length})
          </button>
          <button
            onClick={() => setActiveTab('message')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'message' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Direct Message
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs text-slate-700">
          
          {/* TAB 1: Submitted Application Form */}
          {activeTab === 'form' && (
            <SubmittedApplicationFormView
              application={application}
              publishedForm={publishedForm}
              isManagerView={true}
              onVerifyDocument={updateDocumentVerification}
            />
          )}

          {/* TAB 2: Internal Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Add Note Card */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Add Administrative / Review Note</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">Author: {currentUser.name}</span>
                </div>

                <form onSubmit={handleAddNote} className="space-y-3">
                  <div>
                    <textarea
                      rows={3}
                      value={newNoteText}
                      onChange={e => setNewNoteText(e.target.value)}
                      placeholder="Write confidential internal review notes, interview feedback, or scholarship recommendations..."
                      className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-500">Category:</span>
                      <select
                        value={newNoteCategory}
                        onChange={e => setNewNoteCategory(e.target.value as any)}
                        className="p-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                      >
                        <option value="general">General</option>
                        <option value="eligibility">Eligibility</option>
                        <option value="interview">Interview</option>
                        <option value="scholarship">Scholarship</option>
                        <option value="background_check">Background Check</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={!newNoteText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer text-xs flex items-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Note</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Notes List */}
              <div className="space-y-3">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Internal Notes History ({application.internalNotes?.length || 0})
                </div>

                {application.internalNotes && application.internalNotes.length > 0 ? (
                  <div className="space-y-3">
                    {application.internalNotes.map(note => (
                      <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{note.authorName}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-indigo-600 font-semibold">{note.authorRole}</span>
                          </div>
                          <span className="text-slate-400 text-[10px]">{note.createdAt}</span>
                        </div>

                        <p className="text-slate-800 leading-relaxed text-xs">
                          {note.content}
                        </p>

                        {note.category && (
                          <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {note.category.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p>No internal notes recorded yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Use the form above to attach evaluation remarks.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Faculty Rubric */}
          {activeTab === 'rubric' && (
            <form onSubmit={handleSaveRubric} className="space-y-6">
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Admissions Assessment Scorecard</h4>
                  <p className="text-[11px] text-slate-500">Standardized faculty scoring (1 = Poor, 5 = Outstanding)</p>
                </div>
                <div className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg border border-indigo-200">
                  Total: {rubric.technicalAptitude + rubric.problemSolving + rubric.motivationAndCommitment + rubric.communicationSkills} / 20 pts
                </div>
              </div>

              {/* Rubric Sliders */}
              <div className="space-y-4">
                {[
                  { key: 'technicalAptitude', label: 'Technical Foundations & Algorithmic Aptitude', val: rubric.technicalAptitude },
                  { key: 'problemSolving', label: 'Problem Formulation & Logical Reasoning', val: rubric.problemSolving },
                  { key: 'motivationAndCommitment', label: 'Motivation, Drive & Cohort Commitment', val: rubric.motivationAndCommitment },
                  { key: 'communicationSkills', label: 'Communication, Clarity & Collaboration', val: rubric.communicationSkills },
                ].map(item => (
                  <div key={item.key} className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{item.label}</span>
                      <span className="font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {item.val} / 5
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={item.val}
                      onChange={e => setRubric(prev => ({ ...prev, [item.key]: Number(e.target.value) }))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                ))}
              </div>

              {/* Overall Recommendation */}
              <div className="space-y-2">
                <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Faculty Recommendation
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'strong_hire', label: 'Strong Admit (100%)', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                    { id: 'admit', label: 'Admit Standard', color: 'border-indigo-500 bg-indigo-50 text-indigo-800' },
                    { id: 'borderline', label: 'Borderline / Waitlist', color: 'border-amber-500 bg-amber-50 text-amber-800' },
                    { id: 'reject', label: 'Reject / Decline', color: 'border-rose-500 bg-rose-50 text-rose-800' },
                  ].map(rec => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => setRubric(prev => ({ ...prev, overallRecommendation: rec.id as any }))}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                        rubric.overallRecommendation === rec.id ? rec.color + ' ring-2 ring-indigo-400' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {rec.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reviewer Notes */}
              <div className="space-y-2">
                <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Evaluator Remarks & Scholarship Justification
                </label>
                <textarea
                  rows={3}
                  value={rubric.reviewerNotes}
                  onChange={e => setRubric(prev => ({ ...prev, reviewerNotes: e.target.value }))}
                  placeholder="e.g., Outstanding technical profile, recommended for NextGen full scholarship..."
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-400">
                  Evaluated by <strong>{currentUser.name}</strong>
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Scorecard
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Decision & Status Management */}
          {activeTab === 'decision' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Program Manager Decision Panel</span>
                </div>
                <h3 className="text-lg font-bold font-['Space_Grotesk'] text-white">
                  Administrative Status & Offer Lifecycle
                </h3>
                <p className="text-xs text-slate-300">
                  Every status change updates the applicant's portal in real time and creates an immutable audit trail entry.
                </p>
              </div>

              {/* Status Update Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Select Administrative State
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {statusOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedStatus(opt.value)}
                      className={`p-3 rounded-xl border text-left font-bold text-xs flex items-center justify-between transition cursor-pointer ${
                        selectedStatus === opt.value 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/30' 
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selectedStatus === opt.value && <Check className="w-4 h-4 text-indigo-600" />}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="font-semibold text-slate-800 text-xs">
                    Audit Log Reason / Notes (Required for Transparency)
                  </label>
                  <input
                    type="text"
                    value={statusChangeNote}
                    onChange={e => setStatusChangeNote(e.target.value)}
                    placeholder={`e.g., Qualified during technical review; approved for admission offer.`}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => handleStatusChangeSubmit(selectedStatus)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer text-xs"
                  >
                    Commit Status: {(selectedStatus || '').toUpperCase()}
                  </button>
                </div>
              </div>

              {/* Admission Offer & Scholarship Details */}
              {(application.status === 'admitted' || selectedStatus === 'admitted') && (
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Admissions Offer & Scholarship Status</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-amber-950">
                    <div>
                      <span className="text-amber-800/80 block text-[10px]">Scholarship Award</span>
                      <strong>{application.scholarshipAwarded ? `${application.scholarshipPercentage}% Tuition Grant` : 'None'}</strong>
                    </div>
                    <div>
                      <span className="text-amber-800/80 block text-[10px]">Offer Dispatched</span>
                      <strong>{application.offerLetterSentDate || 'Today'}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Audit Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Immutable Audit History & Timeline ({application.timeline.length} events)
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {application.timeline.map((event, idx) => (
                  <div key={event.id || idx} className="relative space-y-1">
                    {/* Circle Node */}
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900">{event.title}</span>
                      <span className="text-slate-400">{event.timestamp}</span>
                    </div>

                    <p className="text-slate-600 leading-relaxed text-xs">
                      {event.description}
                    </p>

                    <div className="text-[10px] text-slate-400">
                      Actor: <strong>{event.actor}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Direct Message */}
          {activeTab === 'message' && (
            <form onSubmit={handleSendDirectMessage} className="space-y-4">
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">Direct Candidate Communication</h4>
                <p className="text-[11px] text-slate-500">
                  Sends an instant notification and message into {application.fullName}'s applicant inbox.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Message Content
                </label>
                <textarea
                  rows={5}
                  value={directMessageText}
                  onChange={e => setDirectMessageText(e.target.value)}
                  placeholder={`Hi ${application.fullName},\n\nWe have reviewed your application and would like to schedule a quick 15-minute admissions chat...`}
                  className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:border-indigo-500 outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!directMessageText.trim()}
                  className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Message</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Drawer Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Last Updated: <strong>{application.updatedDate || application.appliedDate}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl transition cursor-pointer"
          >
            Close Drawer
          </button>
        </div>

      </div>
    </div>
  );
};
