import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Assessment, Application, Question, AssessmentResource, AssessmentAttempt } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  getServerNow, 
  syncServerTime, 
  checkAssessmentAvailability 
} from '../../utils/serverTime';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Check, 
  ArrowRight,
  ShieldAlert,
  Code2,
  FileCheck2,
  Award,
  Paperclip,
  Download,
  FileText,
  HelpCircle,
  CheckSquare,
  Radio,
  ToggleLeft,
  Bookmark,
  RotateCcw,
  Wifi,
  WifiOff,
  CloudCheck,
  Lock,
  BookOpen,
  Info,
  ExternalLink,
  Copy,
  AlertCircle,
  Eye,
  Send,
  X
} from 'lucide-react';

interface AssessmentRunnerProps {
  assessment: Assessment;
  application: Application;
  onComplete: () => void;
}

export const AssessmentRunner: React.FC<AssessmentRunnerProps> = ({
  assessment,
  application,
  onComplete,
}) => {
  const { submitAssessment, addToast, currentUser } = useApp();

  const storageKey = `nextgen_assess_attempt_${currentUser.id}_${assessment.id}`;

  // Session & Stage States
  const [hasStarted, setHasStarted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.status === 'in_progress' || parsed.status === 'submitted';
      }
    } catch (e) {}
    return false;
  });

  const [honorCodeAccepted, setHonorCodeAccepted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.answers || {};
      }
    } catch (e) {}
    return {};
  });

  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.flaggedQuestions || [];
      }
    } catch (e) {}
    return [];
  });

  const [filterNav, setFilterNav] = useState<'all' | 'unanswered' | 'flagged'>('all');

  // Server Timing & Expiration
  const [serverExpireEpoch, setServerExpireEpoch] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.serverExpireEpoch || 0;
      }
    } catch (e) {}
    return 0;
  });

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const duration = assessment.durationMinutes || assessment.timeLimitMinutes || 30;
    return duration * 60;
  });

  // UI Drawers & Modals
  const [showResourcesDrawer, setShowResourcesDrawer] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Network & Auto-save status
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Submission Results State (if already submitted or on completion)
  const [completedResult, setCompletedResult] = useState<{
    attemptId: string;
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    submittedAt: string;
    timeTakenMinutes: number;
    categoryBreakdown: { category: string; score: number; maxScore: number; percent: number }[];
  } | null>(() => {
    // Check if application already has a recorded assessment score or attempt in localStorage
    if (application.assessmentScore !== undefined) {
      const duration = assessment.durationMinutes || 30;
      const passingScore = assessment.passingScore || 70;
      const isPassed = application.assessmentScore >= passingScore;
      return {
        attemptId: application.assessmentSubmissionId || `sub_${application.id}`,
        score: Math.round((application.assessmentScore / 100) * (assessment.questions.reduce((a, q) => a + (q.points || 10), 0) || 100)),
        maxScore: assessment.questions.reduce((a, q) => a + (q.points || 10), 0) || 100,
        percentage: application.assessmentScore,
        passed: isPassed,
        submittedAt: application.submittedAt || new Date().toISOString(),
        timeTakenMinutes: Math.round(duration * 0.7),
        categoryBreakdown: [],
      };
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.status === 'submitted' && parsed.result) {
          return parsed.result;
        }
      }
    } catch (e) {}
    return null;
  });

  // Check Availability using Server-Side Time
  const [availability, setAvailability] = useState(() => checkAssessmentAvailability(assessment));

  useEffect(() => {
    syncServerTime().then(() => {
      setAvailability(checkAssessmentAvailability(assessment));
    });
  }, [assessment]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast({
        title: 'Connection Restored',
        message: 'Online mode re-established. Syncing examination answers.',
        type: 'success',
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast({
        title: 'Network Disconnected',
        message: 'You are currently offline. Answers will continue saving locally.',
        type: 'warning',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  // Sync Timer from Server Start and Expiration Epoch
  useEffect(() => {
    if (!hasStarted || completedResult) return;

    const updateTimer = () => {
      const serverNow = getServerNow().getTime();
      if (serverExpireEpoch > 0) {
        const diffSecs = Math.max(0, Math.floor((serverExpireEpoch - serverNow) / 1000));
        setSecondsRemaining(diffSecs);
        if (diffSecs <= 0) {
          handleAutoSubmit('time_expired');
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [hasStarted, serverExpireEpoch, completedResult]);

  // Auto-Save Effect (Debounced saving to Local Storage & API)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSave = useCallback(async (currentAnswers: Record<string, any>, currentFlags: string[]) => {
    setIsAutoSaving(true);
    const nowIso = new Date().toISOString();

    // 1. Local Storage Snapshot
    const snapshot = {
      assessmentId: assessment.id,
      applicantId: currentUser.id,
      applicationId: application.id,
      status: completedResult ? 'submitted' : 'in_progress',
      answers: currentAnswers,
      flaggedQuestions: currentFlags,
      serverExpireEpoch,
      lastSavedAt: nowIso,
      result: completedResult,
    };
    localStorage.setItem(storageKey, JSON.stringify(snapshot));

    // 2. Server API Attempt Auto-Save
    if (navigator.onLine) {
      try {
        await fetch(`/api/assessments/${assessment.id}/save-attempt`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicantId: currentUser.id,
            applicationId: application.id,
            answers: currentAnswers,
            flaggedQuestions: currentFlags,
          }),
        });
      } catch (err) {
        // Silently keep local snapshot
      }
    }

    setIsAutoSaving(false);
    setLastSavedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [assessment.id, currentUser.id, application.id, serverExpireEpoch, completedResult, storageKey]);

  useEffect(() => {
    if (!hasStarted || completedResult) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      performSave(answers, flaggedQuestions);
    }, 600);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [answers, flaggedQuestions, hasStarted, completedResult, performSave]);

  // Start Assessment Attempt Handler
  const handleStartAttempt = async () => {
    // 1. Verify availability again via server
    await syncServerTime();
    const currentAvail = checkAssessmentAvailability(assessment);
    if (!currentAvail.isAvailable) {
      addToast({
        title: 'Assessment Unavailable',
        message: currentAvail.reason,
        type: 'error',
      });
      return;
    }

    const durationMinutes = assessment.durationMinutes || assessment.timeLimitMinutes || 30;
    const serverNowEpoch = getServerNow().getTime();
    const calculatedExpireEpoch = serverNowEpoch + durationMinutes * 60 * 1000;

    // Call server to initialize attempt
    try {
      const res = await fetch(`/api/assessments/${assessment.id}/start-attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: currentUser.id,
          applicationId: application.id,
          durationMinutes,
          assessmentState: assessment.status,
          openDate: assessment.openDate,
          openTime: assessment.openTime,
          closeDate: assessment.closeDate,
          closeTime: assessment.closeTime,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.code === 'ALREADY_SUBMITTED') {
          addToast({
            title: 'Attempt Locked',
            message: 'You have already submitted this assessment.',
            type: 'warning',
          });
          return;
        }
      }
    } catch (e) {
      // Offline fallback: allow proceeding with local timer
    }

    setServerExpireEpoch(calculatedExpireEpoch);
    setSecondsRemaining(durationMinutes * 60);
    setHasStarted(true);

    const initialSnapshot = {
      assessmentId: assessment.id,
      applicantId: currentUser.id,
      applicationId: application.id,
      status: 'in_progress',
      answers: {},
      flaggedQuestions: [],
      serverExpireEpoch: calculatedExpireEpoch,
      lastSavedAt: new Date().toISOString(),
    };
    localStorage.setItem(storageKey, JSON.stringify(initialSnapshot));

    addToast({
      title: 'Assessment Started ⏱️',
      message: `You have ${durationMinutes} minutes. Best of luck!`,
      type: 'info',
    });
  };

  // Answer Handlers
  const handleSingleSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleMultiSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => {
      const currentList: string[] = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      if (currentList.includes(optionId)) {
        return { ...prev, [questionId]: currentList.filter(id => id !== optionId) };
      } else {
        return { ...prev, [questionId]: [...currentList, optionId] };
      }
    });
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handleClearAnswer = (questionId: string) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleAutoSubmit = (reason?: string) => {
    if (reason === 'time_expired') {
      addToast({
        title: 'Time Limit Reached',
        message: 'The allocated duration has expired. Submitting your answers automatically.',
        type: 'warning',
      });
    }
    handleFinalSubmit();
  };

  // Final Submit and Grading
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmSubmitModal(false);

    // 1. Calculate score & category breakdown
    let totalEarned = 0;
    let totalMax = 0;

    const categoryMap: Record<string, { earned: number; max: number }> = {};

    assessment.questions.forEach(q => {
      const qPoints = q.points || 10;
      totalMax += qPoints;
      const cat = q.category || 'General';
      if (!categoryMap[cat]) categoryMap[cat] = { earned: 0, max: 0 };
      categoryMap[cat].max += qPoints;

      const userAns = answers[q.id];

      if (q.type === 'single_choice' || q.type === 'code' || q.type === 'scenario') {
        const correctOpt = q.options?.find(o => o.isCorrect);
        const correctKey = q.correctAnswer || (correctOpt ? correctOpt.id : undefined);
        if (correctKey && (userAns === correctKey || (correctOpt && userAns === correctOpt.id))) {
          totalEarned += qPoints;
          categoryMap[cat].earned += qPoints;
        }
      } else if (q.type === 'true_false') {
        const correctKey = q.correctAnswer || (q.options?.find(o => o.isCorrect)?.id);
        if (userAns && correctKey && String(userAns).toLowerCase() === String(correctKey).toLowerCase()) {
          totalEarned += qPoints;
          categoryMap[cat].earned += qPoints;
        }
      } else if (q.type === 'multiple_choice') {
        const correctKeys: string[] = Array.isArray(q.correctAnswer) 
          ? q.correctAnswer 
          : (q.options?.filter(o => o.isCorrect).map(o => o.id) || []);
        
        const userSelected: string[] = Array.isArray(userAns) ? userAns : [];

        const isMatch = correctKeys.length > 0 &&
          correctKeys.length === userSelected.length &&
          correctKeys.every(k => userSelected.includes(k));

        if (isMatch) {
          totalEarned += qPoints;
          categoryMap[cat].earned += qPoints;
        } else {
          const correctChosen = userSelected.filter(k => correctKeys.includes(k)).length;
          const wrongChosen = userSelected.filter(k => !correctKeys.includes(k)).length;
          if (wrongChosen === 0 && correctChosen > 0 && correctKeys.length > 0) {
            const partial = Math.round((correctChosen / correctKeys.length) * qPoints);
            totalEarned += partial;
            categoryMap[cat].earned += partial;
          }
        }
      } else if (q.type === 'short_answer') {
        const cleanUser = (typeof userAns === 'string' ? userAns.trim().toLowerCase() : '');
        const cleanKey = (typeof q.correctAnswer === 'string' ? q.correctAnswer.trim().toLowerCase() : '');
        if (cleanUser && cleanKey && (cleanUser === cleanKey || cleanUser.includes(cleanKey))) {
          totalEarned += qPoints;
          categoryMap[cat].earned += qPoints;
        }
      } else if (q.type === 'long_answer' || q.type === 'open_text') {
        if (typeof userAns === 'string' && userAns.trim().length > 30) {
          const essayCredit = Math.round(qPoints * 0.9);
          totalEarned += essayCredit;
          categoryMap[cat].earned += essayCredit;
        }
      }
    });

    const percentage = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
    const passingThreshold = assessment.passingScore || 70;
    const passed = percentage >= passingThreshold;
    const duration = assessment.durationMinutes || assessment.timeLimitMinutes || 30;
    const timeTaken = Math.max(1, Math.ceil((duration * 60 - secondsRemaining) / 60));

    const categoryBreakdown = Object.entries(categoryMap).map(([category, stats]) => ({
      category,
      score: stats.earned,
      maxScore: stats.max,
      percent: stats.max > 0 ? Math.round((stats.earned / stats.max) * 100) : 0,
    }));

    const finalResult = {
      attemptId: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      score: totalEarned,
      maxScore: totalMax,
      percentage,
      passed,
      submittedAt: new Date().toISOString(),
      timeTakenMinutes: timeTaken,
      categoryBreakdown,
    };

    // 2. Persist in AppContext
    submitAssessment({
      assessmentId: assessment.id,
      applicationId: application.id,
      applicantId: application.applicantId,
      answers,
      score: totalEarned,
      maxScore: totalMax,
      percentageScore: percentage,
      passed,
      timeTakenMinutes: timeTaken,
    });

    // 3. Persist to Server API
    try {
      await fetch(`/api/assessments/${assessment.id}/submit-attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: currentUser.id,
          applicationId: application.id,
          answers,
          questions: assessment.questions,
        }),
      });
    } catch (e) {}

    // 4. Lock in Local Storage
    const lockedSnapshot = {
      assessmentId: assessment.id,
      applicantId: currentUser.id,
      applicationId: application.id,
      status: 'submitted',
      answers,
      flaggedQuestions,
      result: finalResult,
      submittedAt: finalResult.submittedAt,
    };
    localStorage.setItem(storageKey, JSON.stringify(lockedSnapshot));

    setCompletedResult(finalResult);
    setIsSubmitting(false);

    addToast({
      title: passed ? 'Assessment Passed! 🎉' : 'Assessment Submitted',
      message: `Your final score of ${percentage}% has been recorded.`,
      type: passed ? 'success' : 'info',
    });
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const resources = assessment.resources || [];

  const handleDownloadResource = (res: AssessmentResource) => {
    const dummyText = `NextGen Class Academy - Assessment Study Pack & Reference File\n\nTitle: ${res.name}\nType: ${(res.fileType || 'file').toUpperCase()}\nAssessment: ${assessment.title}\nDescription: ${res.description || 'Reference Guide'}\n\nCandidate Notice: Reference material authorized for assessment preparation.`;
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

  const currentQ = assessment.questions[currentIndex] || assessment.questions[0];

  const answeredCount = Object.keys(answers).filter(k => {
    const v = answers[k];
    return Array.isArray(v) ? v.length > 0 : !!v;
  }).length;

  const totalQuestions = assessment.questions.length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const unansweredCount = totalQuestions - answeredCount;

  // Filtered Question Indices for navigation
  const visibleIndices = assessment.questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q, idx }) => {
      const isAnswered = Array.isArray(answers[q.id]) ? answers[q.id].length > 0 : !!answers[q.id];
      const isFlagged = flaggedQuestions.includes(q.id);
      if (filterNav === 'unanswered') return !isAnswered;
      if (filterNav === 'flagged') return isFlagged;
      return true;
    });

  // ==========================================
  // VIEW 1: COMPLETED & LOCKED SUBMISSION RECEIPT
  // ==========================================
  if (completedResult) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-10 text-center animate-in fade-in space-y-6">
        <div className="flex justify-center">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg ${
            completedResult.passed 
              ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white' 
              : 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-white'
          }`}>
            {completedResult.passed ? <Award className="w-10 h-10" /> : <FileCheck2 className="w-10 h-10" />}
          </div>
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Assessment Locked & Evaluation Recorded</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {completedResult.passed ? 'Screening Evaluation Passed' : 'Evaluation Completed & Under Review'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Your answers have been evaluated. Your dossier has been updated and faculty admissions review is underway.
          </p>
        </div>

        {/* Big Score Card */}
        <div className="bg-gradient-to-br from-slate-50 to-orange-50/40 border border-slate-200 rounded-3xl p-6 max-w-lg mx-auto space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-5xl font-black text-orange-600">
              {completedResult.percentage}%
            </span>
          </div>

          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Earned {completedResult.score} out of {completedResult.maxScore} Total Points
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-left text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Benchmark Passing Threshold</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{assessment.passingScore || 70}%</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Duration Spent</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{completedResult.timeTakenMinutes} Minutes</span>
            </div>
          </div>

          {/* Category Breakdown if available */}
          {completedResult.categoryBreakdown && completedResult.categoryBreakdown.length > 0 && (
            <div className="pt-3 border-t border-slate-200/80 space-y-2 text-left">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Domain Competency Performance:
              </span>
              <div className="space-y-1.5">
                {completedResult.categoryBreakdown.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700">{cat.category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-orange-500 h-1.5 rounded-full" 
                          style={{ width: `${cat.percent}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 w-9 text-right">{cat.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission Receipt */}
          <div className="pt-2 text-[11px] text-slate-400 font-mono text-center">
            Attempt Ref: {completedResult.attemptId} • Recorded: {new Date(completedResult.submittedAt).toLocaleString()}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onComplete}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-2xl text-xs shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            <span>Return to Application Hub</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: PRE-ASSESSMENT INSTRUCTIONS SCREEN
  // ==========================================
  if (!hasStarted) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-10 space-y-8 animate-in fade-in">
        {/* Header Title */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 uppercase tracking-wider">
              Admissions Screening Test
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${availability.badgeColor}`}>
              {availability.badgeLabel}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {assessment.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {assessment.description || 'Complete this timed technical and logical reasoning assessment to advance in the admissions process.'}
          </p>
        </div>

        {/* Server Availability Warning if Not Open */}
        {!availability.isAvailable && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Assessment is Not Currently Accessible</span>
              <p className="text-amber-800 leading-relaxed">{availability.reason}</p>
            </div>
          </div>
        )}

        {/* Exam Parameters Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-500 text-xs">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>Duration</span>
            </div>
            <div className="text-lg font-bold text-slate-900">
              {assessment.durationMinutes || assessment.timeLimitMinutes || 30} Mins
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-500 text-xs">
              <HelpCircle className="w-4 h-4 text-orange-500" />
              <span>Questions</span>
            </div>
            <div className="text-lg font-bold text-slate-900">
              {assessment.questions.length} Items
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-500 text-xs">
              <Award className="w-4 h-4 text-orange-500" />
              <span>Passing Score</span>
            </div>
            <div className="text-lg font-bold text-slate-900">
              {assessment.passingScore || 70}% Pass
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-500 text-xs">
              <Paperclip className="w-4 h-4 text-orange-500" />
              <span>Study Files</span>
            </div>
            <div className="text-lg font-bold text-orange-600">
              {resources.length} Attached
            </div>
          </div>
        </div>

        {/* Detailed Instructions & Rules */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-orange-500" />
            <span>Candidate Examination Guidelines & Rules</span>
          </h3>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs space-y-3 text-slate-700">
            {assessment.instructions && assessment.instructions.length > 0 ? (
              assessment.instructions.map((inst, idx) => (
                <div key={idx} className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-orange-200">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{inst}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-orange-200">1</span>
                  <span><strong>Continuous Timer:</strong> Once started, the timer runs continuously based on server time. Ensure you are ready before starting.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-orange-200">2</span>
                  <span><strong>Real-time Auto-Save:</strong> All answers are saved automatically as you make selections. Refreshing the browser will safely restore your test state.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-orange-200">3</span>
                  <span><strong>Single Attempt Policy:</strong> Once finalized and submitted, the test is permanently locked against further edits.</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resources Preview if available */}
        {resources.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Paperclip className="w-4 h-4 text-orange-500" />
              <span>Assessment Reference Documents ({resources.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {resources.map(res => (
                <div key={res.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-900 truncate block">{res.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{(res.fileType || 'file').toUpperCase()} • {res.fileSizeMb} MB</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadResource(res)}
                    className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
                    title="Download Study Document"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Academic Integrity & Honor Code Checkbox */}
        <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-4 space-y-2">
          <label className="flex items-start space-x-3 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={honorCodeAccepted}
              onChange={e => setHonorCodeAccepted(e.target.checked)}
              className="mt-0.5 rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
            />
            <span className="text-slate-800 leading-relaxed font-medium">
              I agree to abide by the NextGen Academy Academic Integrity Code. I confirm that I will complete this screening assessment independently without unauthorized external assistance.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onComplete}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Cancel & Return
          </button>

          <button
            type="button"
            disabled={!honorCodeAccepted || !availability.isAvailable}
            onClick={handleStartAttempt}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-8 py-3.5 rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            <span>Start Timed Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: IN-PROGRESS ASSESSMENT RUNNER
  // ==========================================
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Fixed Control Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-orange-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Applicant Technical Evaluation</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{assessment.title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Online / Offline status */}
          <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
            isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
            <span>{isOnline ? 'Synced' : 'Offline Buffer'}</span>
          </div>

          {/* Auto-save status indicator */}
          <div className="text-[11px] text-slate-500 flex items-center space-x-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            {isAutoSaving ? (
              <span className="text-orange-600 font-semibold animate-pulse">Saving...</span>
            ) : (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved {lastSavedTimestamp ? `at ${lastSavedTimestamp}` : 'locally'}</span>
              </>
            )}
          </div>

          {/* Resources Toggle Button */}
          {resources.length > 0 && (
            <button
              type="button"
              onClick={() => setShowResourcesDrawer(!showResourcesDrawer)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl border border-orange-200 transition cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Study Resources ({resources.length})</span>
            </button>
          )}

          {/* Instructions Modal Button */}
          <button
            type="button"
            onClick={() => setShowInstructionsModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            title="Review Guidelines"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          {/* Server-Side Time Timer */}
          <div className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold font-mono border ${
            secondsRemaining < 120
              ? 'bg-rose-100 border-rose-300 text-rose-800 animate-pulse ring-2 ring-rose-300'
              : secondsRemaining < 300
              ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
              : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          {/* Quick Submit Button */}
          <button
            type="button"
            onClick={() => setShowConfirmSubmitModal(true)}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish & Submit</span>
          </button>
        </div>
      </div>

      {/* Linked Resources Drawer */}
      {showResourcesDrawer && resources.length > 0 && (
        <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-zinc-900">
              <Paperclip className="w-4 h-4 text-orange-600" />
              <span>Assessment Reference Materials & Study Briefs</span>
            </div>
            <button
              type="button"
              onClick={() => setShowResourcesDrawer(false)}
              className="text-xs font-semibold text-orange-700 hover:text-orange-900 cursor-pointer"
            >
              Hide Panel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {resources.map(res => (
              <div
                key={res.id}
                className="bg-white rounded-xl p-3 border border-orange-100 shadow-2xs flex items-center justify-between space-x-2"
              >
                <div className="truncate">
                  <span className="font-bold text-xs text-slate-800 block truncate" title={res.name}>
                    {res.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(res.fileType || 'FILE').toUpperCase()} • {res.fileSizeMb} MB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadResource(res)}
                  className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition cursor-pointer"
                  title="Download Reference File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Question Navigator (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4 lg:order-1 order-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Question Navigator</span>
            <span className="text-slate-500 font-semibold">{answeredCount}/{totalQuestions} Answered</span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>{Math.round(progressPercent)}% Completed</span>
              <span>{flaggedQuestions.length} Bookmarked</span>
            </div>
          </div>

          {/* Filter Tabs on Navigator */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setFilterNav('all')}
              className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer ${
                filterNav === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              All ({totalQuestions})
            </button>
            <button
              type="button"
              onClick={() => setFilterNav('unanswered')}
              className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer ${
                filterNav === 'unanswered' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Left ({unansweredCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterNav('flagged')}
              className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer ${
                filterNav === 'flagged' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Flags ({flaggedQuestions.length})
            </button>
          </div>

          {/* Question Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2 pt-1 max-h-72 overflow-y-auto pr-1">
            {visibleIndices.map(({ q, idx }) => {
              const ansVal = answers[q.id];
              const isAnswered = Array.isArray(ansVal) ? ansVal.length > 0 : !!ansVal;
              const isCurrent = idx === currentIndex;
              const isFlagged = flaggedQuestions.includes(q.id);

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-10 rounded-xl text-xs font-bold transition flex items-center justify-center relative cursor-pointer ${
                    isCurrent
                      ? 'bg-orange-500 text-white ring-2 ring-orange-500 ring-offset-2'
                      : isAnswered
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{idx + 1}</span>
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white"></span>
                  )}
                  {isAnswered && !isCurrent && !isFlagged && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Flagged for Review</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
              <span>Unanswered</span>
            </div>
          </div>
        </div>

        {/* Right Column: Active Question Card (8 cols) */}
        {currentQ ? (
          <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6 lg:order-2 order-1">
            {/* Question Header & Quick Bookmark Toggle */}
            <div className="flex flex-wrap items-center justify-between text-xs pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-2">
                <span className="bg-orange-50 text-orange-700 font-bold px-2.5 py-1 rounded-full border border-orange-200">
                  {currentQ.category || 'Domain Competency'}
                </span>
                <span className="text-slate-500 font-medium">
                  Question {currentIndex + 1} of {totalQuestions} • ({currentQ.points} Points)
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleToggleFlag(currentQ.id)}
                  className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    flaggedQuestions.includes(currentQ.id)
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${flaggedQuestions.includes(currentQ.id) ? 'fill-amber-600 text-amber-600' : ''}`} />
                  <span>{flaggedQuestions.includes(currentQ.id) ? 'Flagged' : 'Flag for Review'}</span>
                </button>

                {answers[currentQ.id] && (
                  <button
                    type="button"
                    onClick={() => handleClearAnswer(currentQ.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                    title="Clear Selection"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Prompt Statement */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {currentQ.prompt}
              </h3>

              {currentQ.context && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed italic">
                  {currentQ.context}
                </p>
              )}

              {/* Code Snippet */}
              {currentQ.codeSnippet && (
                <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto shadow-inner relative group">
                  <pre className="leading-relaxed">{currentQ.codeSnippet}</pre>
                </div>
              )}
            </div>

            {/* Response Input based on Question Type */}
            <div className="space-y-3 pt-2">
              {/* 1. Single Choice, Scenario, Code */}
              {(currentQ.type === 'single_choice' || currentQ.type === 'scenario' || currentQ.type === 'code') && currentQ.options && (
                <div className="space-y-2.5">
                  {currentQ.options.map(opt => {
                    const isSelected = answers[currentQ.id] === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleSingleSelect(currentQ.id, opt.id)}
                        className={`flex items-start space-x-3 p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                          isSelected
                            ? 'bg-orange-50/80 border-orange-500 ring-1 ring-orange-500 text-zinc-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${currentQ.id}`}
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="font-bold mr-1 text-slate-500">{opt.id}.</span>
                        <span className="flex-1 leading-relaxed">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 2. Multiple Choice (Checkboxes) */}
              {currentQ.type === 'multiple_choice' && currentQ.options && (
                <div className="space-y-2.5">
                  <div className="text-[11px] text-slate-500 font-semibold italic mb-1 flex items-center space-x-1">
                    <CheckSquare className="w-3.5 h-3.5 text-orange-600" />
                    <span>Select all options that apply:</span>
                  </div>
                  {currentQ.options.map(opt => {
                    const selectedList: string[] = Array.isArray(answers[currentQ.id]) ? answers[currentQ.id] : [];
                    const isSelected = selectedList.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleMultiSelect(currentQ.id, opt.id)}
                        className={`flex items-start space-x-3 p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-bold mr-1 text-slate-500">{opt.id}.</span>
                        <span className="flex-1 leading-relaxed">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 3. True / False */}
              {currentQ.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-3">
                  {['True', 'False'].map(val => {
                    const isSelected = answers[currentQ.id] === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleSingleSelect(currentQ.id, val)}
                        className={`p-4 rounded-xl border font-bold text-xs transition cursor-pointer text-center ${
                          isSelected
                            ? val === 'True'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500'
                              : 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {val === 'True' ? '✓ TRUE' : '✕ FALSE'}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 4. Short Answer */}
              {currentQ.type === 'short_answer' && (
                <div>
                  <input
                    type="text"
                    value={answers[currentQ.id] || ''}
                    onChange={e => handleTextAnswer(currentQ.id, e.target.value)}
                    placeholder="Enter your concise answer or keyword..."
                    className="w-full text-xs p-3.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition font-medium"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Type your concise response clearly.
                  </span>
                </div>
              )}

              {/* 5. Long Answer / Open Text */}
              {(currentQ.type === 'long_answer' || currentQ.type === 'open_text') && (
                <div>
                  <textarea
                    rows={6}
                    value={answers[currentQ.id] || ''}
                    onChange={e => handleTextAnswer(currentQ.id, e.target.value)}
                    placeholder="Type your structured solution, architectural justification, and reasoning..."
                    className="w-full text-xs p-3.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition resize-y"
                  />
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>Clear, structured reasoning with actionable technical details is expected.</span>
                    <span>{(answers[currentQ.id] || '').length} characters</span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Question</span>
              </button>

              {currentIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                  className="flex items-center space-x-1 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmitModal(true)}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Review & Submit</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white p-8 rounded-2xl border border-slate-200 text-center">
            <p className="text-xs text-slate-500">No questions found in this assessment.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal Before Final Submission */}
      {showConfirmSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-orange-600">
                <Send className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Submit Assessment?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmSubmitModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please verify your answers before submitting. Once finalized, your test will be locked for grading and cannot be reopened.
            </p>

            {/* Summary Breakdown */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Questions:</span>
                <span className="font-bold text-slate-900">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700 font-semibold">Answered:</span>
                <span className="font-bold text-emerald-700">{answeredCount}</span>
              </div>
              {unansweredCount > 0 && (
                <div className="flex justify-between text-amber-700 bg-amber-50 p-2 rounded-xl">
                  <span className="font-semibold">⚠️ Unanswered Questions:</span>
                  <span className="font-bold">{unansweredCount}</span>
                </div>
              )}
              {flaggedQuestions.length > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Flagged for review:</span>
                  <span className="font-bold text-amber-600">{flaggedQuestions.length}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Return to Questions
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                {isSubmitting ? 'Grading & Submitting...' : 'Confirm Final Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guidelines Review Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-orange-600">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Examination Instructions</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructionsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2 text-slate-700 max-h-80 overflow-y-auto">
              {assessment.instructions && assessment.instructions.length > 0 ? (
                assessment.instructions.map((inst, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <span className="font-bold text-orange-600">{i + 1}.</span>
                    <span className="leading-relaxed">{inst}</span>
                  </div>
                ))
              ) : (
                <p>Standard testing guidelines apply. Maintain integrity and complete all questions before submitting.</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowInstructionsModal(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Guidelines
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
