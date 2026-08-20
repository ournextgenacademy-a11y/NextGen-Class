import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Assessment, Question, AssessmentStatus } from '../../types';
import { AssessmentSettingsModal } from './assessment/AssessmentSettingsModal';
import { QuestionEditorModal } from './assessment/QuestionEditorModal';
import { BulkQuestionUploadModal } from './assessment/BulkQuestionUploadModal';
import { AssessmentResourceManager } from './assessment/AssessmentResourceManager';
import { AssessmentRunner } from '../applicant/AssessmentRunner';
import { 
  Sliders, 
  Sparkles, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Award, 
  Edit3, 
  Layers, 
  Code2, 
  HelpCircle,
  BarChart3,
  X,
  FileSpreadsheet,
  Paperclip,
  Play,
  Calendar,
  Lock,
  Archive,
  Copy,
  ChevronUp,
  ChevronDown,
  Percent,
  RotateCcw,
  CheckSquare,
  Radio,
  ToggleLeft,
  FileText,
  AlignLeft,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';

export const AssessmentStudio: React.FC = () => {
  const { 
    assessments, 
    createAssessment, 
    saveAssessment, 
    deleteAssessment, 
    duplicateAssessment, 
    updateAssessmentStatus,
    programs, 
    cohorts, 
    applications,
    currentUser
  } = useApp();

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessments[0]?.id || ''
  );

  // Modals & Drawers
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'resources' | 'submissions'>('questions');

  // Test Simulation Mode
  const [previewingAsApplicant, setPreviewingAsApplicant] = useState(false);

  const activeAssessment = assessments.find(a => a.id === selectedAssessmentId) || assessments[0];
  const targetProgram = programs.find(p => p.id === activeAssessment?.programId);
  const targetCohort = cohorts.find(c => c.id === activeAssessment?.cohortId);

  // Calculate statistics for the active assessment
  const relatedSubmissions = applications
    .filter(a => a.assessmentScore !== undefined && (!activeAssessment?.programId || a.programId === activeAssessment.programId));

  const candidateScores = relatedSubmissions.map(a => a.assessmentScore as number);
  const averageScore = candidateScores.length > 0 
    ? Math.round(candidateScores.reduce((a, b) => a + b, 0) / candidateScores.length)
    : 78;
  const passCount = relatedSubmissions.filter(a => (a.assessmentScore || 0) >= (activeAssessment?.passingScore || 70)).length;
  const passRate = relatedSubmissions.length > 0
    ? Math.round((passCount / relatedSubmissions.length) * 100)
    : 85;

  const totalPoints = (activeAssessment?.questions || []).reduce((acc, q) => acc + (q.points || 0), 0);

  // Status badge styling
  const getStatusBadge = (status: AssessmentStatus) => {
    switch (status) {
      case 'open':
      case 'published':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>OPEN / PUBLISHED</span>
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Calendar className="w-3 h-3 text-blue-600" />
            <span>SCHEDULED</span>
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Edit3 className="w-3 h-3 text-amber-600" />
            <span>DRAFT</span>
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>CLOSED</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <Archive className="w-3 h-3 text-rose-600" />
            <span>ARCHIVED</span>
          </span>
        );
    }
  };

  // Reorder question handler
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (!activeAssessment) return;
    const questions = [...activeAssessment.questions];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    const temp = questions[index];
    questions[index] = questions[targetIdx];
    questions[targetIdx] = temp;

    // Update display orders
    const reordered = questions.map((q, idx) => ({ ...q, displayOrder: idx + 1 }));
    saveAssessment({ ...activeAssessment, questions: reordered });
  };

  // Delete question
  const handleDeleteQuestion = (qId: string) => {
    if (!activeAssessment) return;
    const remaining = activeAssessment.questions.filter(q => q.id !== qId);
    saveAssessment({ ...activeAssessment, questions: remaining });
  };

  // Save / Add question from QuestionEditorModal
  const handleSaveQuestion = (q: Question) => {
    if (!activeAssessment) return;
    const exists = activeAssessment.questions.some(existing => existing.id === q.id);
    let updatedQuestions: Question[];
    if (exists) {
      updatedQuestions = activeAssessment.questions.map(existing => existing.id === q.id ? q : existing);
    } else {
      updatedQuestions = [...activeAssessment.questions, q];
    }
    saveAssessment({ ...activeAssessment, questions: updatedQuestions });
    setEditingQuestion(null);
  };

  // Bulk Import Questions
  const handleBulkImportQuestions = (newQuestions: Question[], mode: 'append' | 'replace') => {
    if (!activeAssessment) return;
    let combinedQuestions: Question[];
    if (mode === 'replace') {
      combinedQuestions = newQuestions.map((q, idx) => ({ ...q, displayOrder: idx + 1 }));
    } else {
      const current = activeAssessment.questions;
      combinedQuestions = [
        ...current,
        ...newQuestions.map((q, idx) => ({ ...q, displayOrder: current.length + idx + 1 }))
      ];
    }
    saveAssessment({ ...activeAssessment, questions: combinedQuestions });
  };

  // Helper for question type icons
  const getQuestionTypeIcon = (type: Question['type']) => {
    switch (type) {
      case 'single_choice':
        return <Radio className="w-3.5 h-3.5 text-indigo-600" />;
      case 'multiple_choice':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'true_false':
        return <ToggleLeft className="w-3.5 h-3.5 text-amber-600" />;
      case 'short_answer':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'long_answer':
        return <AlignLeft className="w-3.5 h-3.5 text-purple-600" />;
      case 'code':
        return <Code2 className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // If in Preview / Test Applicant Simulation mode
  if (previewingAsApplicant && activeAssessment) {
    const mockApp = applications[0] || {
      id: 'app-preview-sim',
      applicantId: currentUser.id,
      fullName: currentUser.name,
      email: currentUser.email,
      programId: activeAssessment.programId,
      cohortId: activeAssessment.cohortId || 'cohort-genai-2',
      status: 'assessment_pending',
      timeline: [],
    };

    return (
      <div className="space-y-4">
        <div className="bg-indigo-900 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2 text-xs font-bold">
            <Eye className="w-4 h-4 text-indigo-300" />
            <span>Applicant Test Runner Simulation Mode</span>
            <span className="bg-indigo-800 px-2 py-0.5 rounded text-[10px] text-indigo-200">
              Testing: {activeAssessment.title}
            </span>
          </div>
          <button
            onClick={() => setPreviewingAsApplicant(false)}
            className="px-4 py-1.5 bg-white text-indigo-950 font-bold text-xs rounded-xl hover:bg-indigo-50 transition cursor-pointer shadow-xs"
          >
            Exit Applicant Simulation
          </button>
        </div>

        <AssessmentRunner
          assessment={activeAssessment}
          application={mockApp as any}
          onComplete={() => setPreviewingAsApplicant(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Assessment Switcher */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Assessment Studio & Lifecycle Control</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-['Space_Grotesk']">
              Screening Assessments & Automated Evaluation Studio
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Create, configure, schedule, open, bulk-upload questions, and attach study resources to candidate evaluations.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const newOne = createAssessment();
                setSelectedAssessmentId(newOne.id);
                setShowSettingsModal(true);
              }}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Assessment</span>
            </button>
          </div>
        </div>

        {/* Assessment Dropdown / Selector Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Active Assessment:</label>
            <select
              value={selectedAssessmentId}
              onChange={e => setSelectedAssessmentId(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none truncate"
            >
              {assessments.map(a => (
                <option key={a.id} value={a.id}>
                  {a.title} ({(a.status || 'draft').toUpperCase()} • {a.questions?.length || 0} Qs)
                </option>
              ))}
            </select>
          </div>

          {/* Lifecycle State Controls */}
          {activeAssessment && (
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge(activeAssessment.status)}

              {/* Lifecycle Transitions */}
              {activeAssessment.status !== 'open' && activeAssessment.status !== 'published' && (
                <button
                  onClick={() => updateAssessmentStatus(activeAssessment.id, 'open')}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  title="Open assessment for candidate access"
                >
                  <Play className="w-3 h-3" />
                  <span>Open Assessment</span>
                </button>
              )}

              {activeAssessment.status !== 'scheduled' && (
                <button
                  onClick={() => updateAssessmentStatus(activeAssessment.id, 'scheduled')}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  title="Schedule for future opening"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Schedule</span>
                </button>
              )}

              {activeAssessment.status !== 'draft' && (
                <button
                  onClick={() => updateAssessmentStatus(activeAssessment.id, 'draft')}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                  title="Revert status to Draft"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Save as Draft</span>
                </button>
              )}

              {activeAssessment.status !== 'closed' && (
                <button
                  onClick={() => updateAssessmentStatus(activeAssessment.id, 'closed')}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                  title="Close candidate intake"
                >
                  <Lock className="w-3 h-3" />
                  <span>Close</span>
                </button>
              )}

              {activeAssessment.status !== 'archived' && (
                <button
                  onClick={() => updateAssessmentStatus(activeAssessment.id, 'archived')}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-semibold rounded-xl transition cursor-pointer"
                  title="Archive evaluation"
                >
                  <Archive className="w-3 h-3" />
                  <span>Archive</span>
                </button>
              )}

              {/* Duplicate & Delete */}
              <button
                onClick={() => {
                  const cloned = duplicateAssessment(activeAssessment.id);
                  setSelectedAssessmentId(cloned.id);
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                title="Duplicate Assessment"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              {assessments.length > 1 && (
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${activeAssessment.title}"?`)) {
                      deleteAssessment(activeAssessment.id);
                      setSelectedAssessmentId(assessments[0]?.id || '');
                    }
                  }}
                  className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-xl transition cursor-pointer"
                  title="Delete Assessment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {activeAssessment ? (
        <>
          {/* Assessment Overview Stats & Meta Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Questions & Points</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5 font-['Space_Grotesk']">
                  {activeAssessment.questions.length} Questions • {totalPoints} Pts
                </div>
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <HelpCircle className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Time Limit & Passing Mark</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5 font-['Space_Grotesk']">
                  {activeAssessment.durationMinutes || activeAssessment.timeLimitMinutes || 30} Mins • {activeAssessment.passingScore}% Pass
                </div>
              </div>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Candidate Benchmark</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5 font-['Space_Grotesk']">
                  Avg {averageScore}% • {passRate}% Pass Rate
                </div>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Schedule Window</span>
                <div className="text-xs font-bold text-slate-800 mt-0.5 truncate max-w-[150px]">
                  {activeAssessment.openDate || 'Immediate'} → {activeAssessment.closeDate || 'Rolling'}
                </div>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Assessment Navigation Tabs & Settings Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-1">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('questions')}
                className={`pb-2.5 font-bold text-xs border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'questions'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Questions & Rubrics ({activeAssessment.questions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('resources')}
                className={`pb-2.5 font-bold text-xs border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'resources'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Linked Study Resources ({activeAssessment.resources?.length || 0})</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewingAsApplicant(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                title="Simulate taking the assessment as an applicant"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Test / Preview as Applicant</span>
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Assessment Settings</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Questions Management */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {/* Question Action Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-800">
                    Question Bank & Rubrics
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({activeAssessment.questions.length} questions configured)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowBulkUploadModal(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Bulk Upload CSV / Excel</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingQuestion(null);
                      setShowQuestionModal(true);
                    }}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              {activeAssessment.questions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 font-['Space_Grotesk']">
                    No Screening Questions Configured
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Add multiple choice, single choice, true/false, short answer, or long answer questions, or import a batch via CSV spreadsheet.
                  </p>
                  <div className="flex justify-center space-x-3 pt-2">
                    <button
                      onClick={() => setShowBulkUploadModal(true)}
                      className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl hover:bg-emerald-100 transition cursor-pointer"
                    >
                      Upload CSV
                    </button>
                    <button
                      onClick={() => {
                        setEditingQuestion(null);
                        setShowQuestionModal(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                    >
                      Add First Question
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAssessment.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition space-y-3.5"
                    >
                      {/* Top Question Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {q.id}
                          </span>
                          <div className="flex items-center space-x-1 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-700 text-[11px] font-semibold capitalize">
                            {getQuestionTypeIcon(q.type)}
                            <span>{q.type.replace('_', ' ')}</span>
                          </div>
                          {q.category && (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                              {q.category}
                            </span>
                          )}
                        </div>

                        {/* Question Action Controls */}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                            {q.points} pts
                          </span>

                          <button
                            onClick={() => handleMoveQuestion(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded transition cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleMoveQuestion(idx, 'down')}
                            disabled={idx === activeAssessment.questions.length - 1}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded transition cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingQuestion(q);
                              setShowQuestionModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded transition cursor-pointer"
                            title="Edit Question"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question Prompt */}
                      <div className="space-y-1.5 pl-8">
                        <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                          {q.prompt}
                        </p>

                        {q.context && (
                          <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            {q.context}
                          </p>
                        )}

                        {q.codeSnippet && (
                          <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto">
                            <pre>{q.codeSnippet}</pre>
                          </div>
                        )}
                      </div>

                      {/* Options / Key Display */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8 pt-1">
                          {q.options.map(opt => (
                            <div
                              key={opt.id}
                              className={`px-3 py-2 rounded-xl text-xs flex items-center space-x-2 border ${
                                opt.isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-md font-bold flex items-center justify-center text-[10px] shrink-0 ${
                                opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {opt.id}
                              </span>
                              <span className="truncate flex-1">{opt.label}</span>
                              {opt.isCorrect && (
                                <span className="text-[10px] font-bold text-emerald-700 uppercase">
                                  ✓ Key
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Short answer / rubric display */}
                      {q.type === 'short_answer' && (
                        <div className="pl-8 pt-1 text-xs">
                          <span className="text-slate-500 font-medium">Accepted Key: </span>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {String(q.correctAnswer)}
                          </span>
                        </div>
                      )}

                      {q.type === 'long_answer' && (
                        <div className="pl-8 pt-1 text-xs text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 flex items-center justify-between">
                          <span>Evaluator Rubric Scoring: Open-ended qualitative evaluation</span>
                          <span className="font-bold">Max {q.points} pts</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Resource Management */}
          {activeTab === 'resources' && (
            <AssessmentResourceManager
              assessment={activeAssessment}
              onUpdate={saveAssessment}
            />
          )}

          {/* Settings Modal */}
          <AssessmentSettingsModal
            assessment={activeAssessment}
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            onSave={saveAssessment}
          />

          {/* Question Modal */}
          <QuestionEditorModal
            isOpen={showQuestionModal}
            question={editingQuestion}
            onClose={() => {
              setShowQuestionModal(false);
              setEditingQuestion(null);
            }}
            onSave={handleSaveQuestion}
            nextDisplayOrder={activeAssessment.questions.length + 1}
          />

          {/* Bulk Upload Modal */}
          <BulkQuestionUploadModal
            isOpen={showBulkUploadModal}
            onClose={() => setShowBulkUploadModal(false)}
            onImport={handleBulkImportQuestions}
            existingQuestions={activeAssessment.questions}
          />
        </>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <p className="text-slate-500 text-sm">No assessments found. Create one to get started.</p>
        </div>
      )}
    </div>
  );
};
