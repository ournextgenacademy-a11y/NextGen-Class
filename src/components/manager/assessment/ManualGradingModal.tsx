import React, { useState, useEffect } from 'react';
import { 
  Assessment, 
  Question, 
  AssessmentSubmission, 
  Application,
  User 
} from '../../../types';
import { useApp } from '../../../context/AppContext';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Award, 
  Clock, 
  Save, 
  UserCheck, 
  UserX, 
  UserMinus, 
  FileText, 
  Code2, 
  Check, 
  HelpCircle,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

interface ManualGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment;
  application: Application;
  submission?: AssessmentSubmission | null;
}

export const ManualGradingModal: React.FC<ManualGradingModalProps> = ({
  isOpen,
  onClose,
  assessment,
  application,
  submission,
}) => {
  const { 
    currentUser, 
    gradeAssessmentSubmission, 
    makeAdmissionDecision,
    addToast 
  } = useApp();

  // Map questionId -> score assigned
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({});
  const [questionFeedback, setQuestionFeedback] = useState<Record<string, string>>({});
  const [generalFeedback, setGeneralFeedback] = useState('');
  
  // Admission decision state within grading view
  const [decisionReason, setDecisionReason] = useState('');
  const [showDecisionSection, setShowDecisionSection] = useState(false);

  // Initialize scores based on submission answers and auto-grader keys
  useEffect(() => {
    if (!isOpen) return;

    const initialScores: Record<string, number> = {};
    const candidateAnswers = submission?.answers || {};

    assessment.questions.forEach(q => {
      const candidateAns = candidateAnswers[q.id];
      const maxPts = q.points || 10;

      if (candidateAns === undefined || candidateAns === null || candidateAns === '') {
        initialScores[q.id] = 0;
        return;
      }

      // Objective Auto-Grading Rules
      if (q.type === 'single_choice' || q.type === 'true_false') {
        const correctKey = q.correctAnswer || q.options?.find(o => o.isCorrect)?.id;
        if (correctKey && String(candidateAns).trim().toLowerCase() === String(correctKey).trim().toLowerCase()) {
          initialScores[q.id] = maxPts;
        } else {
          initialScores[q.id] = 0;
        }
      } else if (q.type === 'multiple_choice') {
        const correctOptions = q.options?.filter(o => o.isCorrect).map(o => o.id) || [];
        if (Array.isArray(candidateAns) && correctOptions.length > 0) {
          const isFullMatch = 
            candidateAns.length === correctOptions.length &&
            candidateAns.every(ans => correctOptions.includes(ans));
          initialScores[q.id] = isFullMatch ? maxPts : 0;
        } else {
          initialScores[q.id] = 0;
        }
      } else if (q.type === 'short_answer') {
        if (q.correctAnswer && String(candidateAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
          initialScores[q.id] = maxPts;
        } else {
          // Default to partial score if answer provided, awaiting manual review
          initialScores[q.id] = String(candidateAns).trim().length > 3 ? Math.round(maxPts * 0.7) : 0;
        }
      } else {
        // Subjective (long answer, scenario, code, open text): default to reasonable starting value based on length
        if (typeof candidateAns === 'string' && candidateAns.trim().length > 20) {
          initialScores[q.id] = Math.round(maxPts * 0.8);
        } else {
          initialScores[q.id] = Math.round(maxPts * 0.5);
        }
      }
    });

    setQuestionScores(initialScores);
    setGeneralFeedback(submission?.evaluatorFeedback || '');
  }, [isOpen, assessment, submission]);

  if (!isOpen) return null;

  // Calculate live scores
  const rawScore = (Object.values(questionScores) as number[]).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
  const maxScore = assessment.questions.reduce((a: number, q: Question) => a + (Number(q.points) || 0), 0) || 100;
  const percentageScore = Math.min(100, Math.max(0, Math.round((rawScore / maxScore) * 100)));
  const passingScore = assessment.passingScore || 70;
  const isPassed = percentageScore >= passingScore;

  const handleScoreChange = (questionId: string, value: number, maxPts: number) => {
    const clamped = Math.max(0, Math.min(maxPts, value));
    setQuestionScores(prev => ({
      ...prev,
      [questionId]: clamped,
    }));
  };

  const handleSaveGrades = () => {
    gradeAssessmentSubmission({
      submissionId: submission?.id,
      applicationId: application.id,
      assessmentId: assessment.id,
      questionScores,
      evaluatorFeedback: generalFeedback,
      passed: isPassed,
    });

    addToast({
      title: 'Grades Saved & Verified 🎯',
      message: `Updated score for ${application.fullName}: ${rawScore}/${maxScore} pts (${percentageScore}% - ${isPassed ? 'PASSED' : 'NEEDS REVIEW'}).`,
      type: 'success',
    });

    onClose();
  };

  const handleQuickDecision = (decision: 'ACCEPTED' | 'REJECTED' | 'WAITLISTED') => {
    // First save the grades to ensure consistency
    gradeAssessmentSubmission({
      submissionId: submission?.id,
      applicationId: application.id,
      assessmentId: assessment.id,
      questionScores,
      evaluatorFeedback: generalFeedback,
      passed: isPassed,
    });

    makeAdmissionDecision({
      applicationId: application.id,
      decision,
      reason: decisionReason || `Admissions decision based on evaluation score of ${percentageScore}% (${rawScore}/${maxScore} pts).`,
      decidedBy: currentUser.name,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-400/30 uppercase tracking-wider">
                Manual Assessment Grading & Admissions Review
              </span>
              <span className="text-xs text-slate-400 font-mono">
                App #{application.id}
              </span>
            </div>
            <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">
              {application.fullName} — {assessment.title}
            </h2>
            <p className="text-xs text-slate-300">
              Candidate Email: <span className="text-white font-medium">{application.email}</span> • Benchmark: <span className="text-indigo-300 font-bold">{passingScore}%</span> to pass
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Score Summary Banner */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 px-6 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Raw Score</span>
              <span className="text-lg font-bold text-slate-900 font-mono">
                {rawScore} <span className="text-xs text-slate-400 font-normal">/ {maxScore} pts</span>
              </span>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Calculated Percentage</span>
              <span className={`text-lg font-bold font-mono ${isPassed ? 'text-emerald-600' : 'text-amber-600'}`}>
                {percentageScore}%
              </span>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outcome Status</span>
              <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isPassed 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{isPassed ? 'PASSED BENCHMARK' : 'BELOW BENCHMARK'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDecisionSection(!showDecisionSection)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition cursor-pointer flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{showDecisionSection ? 'Hide Decision Panel' : 'Admissions Decision'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Questions & Manual Grading Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          
          {/* Quick Decision Box if toggled */}
          {showDecisionSection && (
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Program Manager Admission Decision Hub</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Decision Maker: <strong className="text-white">{currentUser.name}</strong>
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">
                  Decision Justification & Internal Reason (Logged in Audit Trail)
                </label>
                <input
                  type="text"
                  value={decisionReason}
                  onChange={e => setDecisionReason(e.target.value)}
                  placeholder={`e.g., Exceeded technical threshold with ${percentageScore}%; approved for admission offer.`}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:border-indigo-400 outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => handleQuickDecision('ACCEPTED')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer text-xs flex items-center space-x-1.5 shadow-xs"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Accept Candidate</span>
                </button>

                <button
                  onClick={() => handleQuickDecision('WAITLISTED')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition cursor-pointer text-xs flex items-center space-x-1.5 shadow-xs"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Place on Waitlist</span>
                </button>

                <button
                  onClick={() => handleQuickDecision('REJECTED')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer text-xs flex items-center space-x-1.5 shadow-xs"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Reject Candidate</span>
                </button>
              </div>
            </div>
          )}

          {/* Question-by-Question Grading List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-['Space_Grotesk']">
                Question Responses & Point Allocation ({assessment.questions.length})
              </h3>
              <span className="text-[11px] text-slate-400">
                Adjust points for subjective review or grant partial credit
              </span>
            </div>

            {assessment.questions.map((q, idx) => {
              const candidateAns = submission?.answers?.[q.id];
              const maxPts = q.points || 10;
              const assignedScore = questionScores[q.id] ?? 0;
              const isSubjective = ['short_answer', 'long_answer', 'scenario', 'code', 'open_text'].includes(q.type);

              return (
                <div 
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs hover:border-slate-300 transition"
                >
                  {/* Question Header & Point Control */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {q.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {q.type.replace('_', ' ')}
                      </span>
                      {isSubjective && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                          Subjective Review
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-500 font-medium">Assigned Points:</span>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          min={0}
                          max={maxPts}
                          value={assignedScore}
                          onChange={e => handleScoreChange(q.id, Number(e.target.value), maxPts)}
                          className="w-16 p-1.5 text-center font-bold font-mono text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-indigo-500 outline-none"
                        />
                        <span className="text-xs font-bold text-slate-400">/ {maxPts}</span>
                      </div>

                      {/* Quick Auto-Fill Buttons */}
                      <button
                        type="button"
                        onClick={() => handleScoreChange(q.id, maxPts, maxPts)}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-lg transition cursor-pointer"
                        title="Award Full Points"
                      >
                        Full
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScoreChange(q.id, Math.round(maxPts / 2), maxPts)}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg transition cursor-pointer"
                        title="Award Half Points"
                      >
                        Half
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScoreChange(q.id, 0, maxPts)}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg transition cursor-pointer"
                        title="Award Zero"
                      >
                        Zero
                      </button>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900 text-xs leading-relaxed">
                      {q.prompt}
                    </p>
                    {q.context && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {q.context}
                      </p>
                    )}
                  </div>

                  {/* Candidate Response Display */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span>Candidate Submission:</span>
                      {candidateAns === undefined && (
                        <span className="text-rose-600">Unanswered</span>
                      )}
                    </div>

                    {/* Single / Multiple Choice Candidate View */}
                    {(q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'true_false') && (
                      <div className="space-y-1.5 pt-1">
                        {q.options?.map(opt => {
                          const isSelected = Array.isArray(candidateAns)
                            ? candidateAns.includes(opt.id)
                            : candidateAns === opt.id;
                          const isKey = Boolean(opt.isCorrect || q.correctAnswer === opt.id);

                          return (
                            <div
                              key={opt.id}
                              className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                                isSelected && isKey
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                  : isSelected && !isKey
                                  ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                                  : isKey
                                  ? 'bg-emerald-50/50 border-dashed border-emerald-300 text-emerald-800'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center ${
                                  isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {opt.id}
                                </span>
                                <span>{opt.label}</span>
                              </div>
                              <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase">
                                {isSelected && <span className="text-indigo-600">Candidate Selected</span>}
                                {isKey && <span className="text-emerald-700">✓ Correct Key</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer / Text Display */}
                    {(q.type === 'short_answer' || q.type === 'long_answer' || q.type === 'scenario' || q.type === 'open_text') && (
                      <div className="space-y-2">
                        <div className="p-3 bg-white rounded-lg border border-slate-200 font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {candidateAns ? String(candidateAns) : <span className="italic text-slate-400">No response entered by applicant.</span>}
                        </div>
                        {q.correctAnswer && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50/60 p-2 rounded-lg border border-emerald-200">
                            <strong>Official Answer Key / Reference:</strong> {String(q.correctAnswer)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Code Display */}
                    {q.type === 'code' && (
                      <div className="space-y-2">
                        <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                          {candidateAns ? String(candidateAns) : '// No code submitted'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* General Feedback Textarea */}
          <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Overall Evaluator Feedback / Reviewer Notes</span>
            </label>
            <textarea
              rows={3}
              value={generalFeedback}
              onChange={e => setGeneralFeedback(e.target.value)}
              placeholder="e.g., Solid logical foundations, clear code formatting. Recommended for technical track admission."
              className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Final Score: <strong className="text-slate-900 font-mono">{rawScore}/{maxScore} pts ({percentageScore}%)</strong> • Status: <strong className={isPassed ? 'text-emerald-700' : 'text-amber-700'}>{isPassed ? 'PASSED' : 'NEEDS REVIEW'}</strong>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 font-bold text-xs text-slate-700 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSaveGrades}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save & Finalize Grades</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
