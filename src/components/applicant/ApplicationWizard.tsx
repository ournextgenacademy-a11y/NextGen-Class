import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Application, UploadedFileRecord } from '../../types';
import { DynamicFormRenderer } from './DynamicFormRenderer';
import { 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Calendar,
  AlertCircle,
  Check,
  Save,
  Clock,
  ShieldCheck,
  Send,
  UserCheck,
  FileCheck,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface ApplicationWizardProps {
  existingApplication?: Application | null;
  preselectedProgramId?: string | null;
  preselectedCohortId?: string | null;
  onCancel?: () => void;
  onComplete?: () => void;
}

// Helper to determine standard key corresponding to field definition
function getStandardKeyForField(field: { id: string; label: string; fieldType: string }): string | null {
  const idLower = field.id.toLowerCase();
  const labelLower = field.label.toLowerCase();

  if (idLower === 'fullname' || labelLower.includes('full legal name') || (labelLower.includes('full name') && !labelLower.includes('kin'))) {
    return 'fullName';
  }
  if (idLower === 'email' || field.fieldType === 'email' || labelLower.includes('email')) {
    return 'email';
  }
  if (idLower === 'phone' || field.fieldType === 'phone' || labelLower.includes('phone') || labelLower.includes('contact number')) {
    return 'phone';
  }
  if (idLower === 'country' || labelLower.includes('country of residence') || labelLower === 'country') {
    return 'country';
  }
  if (idLower === 'city' || labelLower.includes('city') || labelLower.includes('state of residence')) {
    return 'city';
  }
  if (idLower === 'gender' || labelLower.includes('gender')) {
    return 'gender';
  }
  if (idLower === 'agerange' || labelLower.includes('age range') || labelLower.includes('age group')) {
    return 'ageRange';
  }
  if (idLower === 'educationlevel' || labelLower.includes('education') || labelLower.includes('highest educational')) {
    return 'educationLevel';
  }
  if (idLower === 'fieldofstudy' || labelLower.includes('field of study') || labelLower.includes('discipline') || labelLower.includes('major')) {
    return 'fieldOfStudy';
  }
  if (idLower === 'employmentstatus' || labelLower.includes('employment status') || labelLower.includes('current employment')) {
    return 'employmentStatus';
  }
  if (idLower === 'yearsexperience' || labelLower.includes('years of experience') || labelLower.includes('technical / programming experience') || labelLower.includes('programming experience')) {
    return 'yearsExperience';
  }
  if (idLower === 'programmingbackground' || labelLower.includes('programming background') || labelLower.includes('languages & tools') || labelLower.includes('languages / technologies')) {
    return 'programmingBackground';
  }
  if (idLower === 'linkedinurl' || labelLower.includes('linkedin')) {
    return 'linkedinUrl';
  }
  if (idLower === 'githuburl' || labelLower.includes('github') || labelLower.includes('portfolio url')) {
    return 'githubUrl';
  }
  if (idLower === 'cvurl' || labelLower.includes('resume') || labelLower.includes('curriculum vitae') || labelLower.includes('cv')) {
    return 'cvUrl';
  }
  if (idLower === 'motivationstatement' || labelLower.includes('why do you want to join') || labelLower.includes('motivation')) {
    return 'motivationStatement';
  }
  if (idLower === 'goalsstatement' || labelLower.includes('career goals') || labelLower.includes('goals after completing')) {
    return 'goalsStatement';
  }

  return null;
}

export const ApplicationWizard: React.FC<ApplicationWizardProps> = ({
  existingApplication,
  preselectedProgramId,
  preselectedCohortId,
  onCancel,
  onComplete,
}) => {
  const { 
    currentUser, 
    programs, 
    cohorts, 
    applications,
    saveDraftApplication,
    submitApplication, 
    setApplicantTab,
    getPublishedFormForProgramme,
    addToast
  } = useApp();

  // Find existing draft for current user if not provided in props
  const existingDraft = existingApplication || applications.find(
    a => (a.applicantId === currentUser.id || a.email.toLowerCase() === currentUser.email.toLowerCase()) && 
         a.status === 'draft'
  );

  // Active available cohorts
  const availableCohorts = cohorts.filter(c => c.status !== 'archived');

  const [selectedProgId, setSelectedProgId] = useState<string>(
    preselectedProgramId || existingDraft?.programId || (availableCohorts[0]?.programId || programs[0]?.id || '')
  );

  const availableCohortsForProg = availableCohorts.filter(c => c.programId === selectedProgId || (c as any).programmeId === selectedProgId);

  const [selectedCohId, setSelectedCohId] = useState<string>(
    preselectedCohortId || existingDraft?.cohortId || (availableCohortsForProg[0]?.id || availableCohorts[0]?.id || '')
  );

  useEffect(() => {
    if (preselectedProgramId) {
      setSelectedProgId(preselectedProgramId);
    }
  }, [preselectedProgramId]);

  useEffect(() => {
    if (preselectedCohortId) {
      setSelectedCohId(preselectedCohortId);
    } else if (availableCohortsForProg.length > 0 && !availableCohortsForProg.some(c => c.id === selectedCohId)) {
      setSelectedCohId(availableCohortsForProg[0].id);
    }
  }, [selectedProgId, preselectedCohortId]);

  const [currentStep, setCurrentStep] = useState<number>(
    Math.min(3, Math.max(1, existingDraft?.lastSavedStep || 1))
  );

  const [draftAppId, setDraftAppId] = useState<string | undefined>(
    existingDraft?.id
  );

  // Dynamic Published Form for this Programme/Cohort
  const publishedCustomForm = getPublishedFormForProgramme(selectedProgId, selectedCohId);

  // Form State
  const [formData, setFormData] = useState({
    fullName: existingDraft?.fullName || currentUser.name || '',
    email: existingDraft?.email || currentUser.email || '',
    phone: existingDraft?.phone || currentUser.phone || '',
    country: existingDraft?.country || 'Nigeria',
    city: existingDraft?.city || '',
    gender: (existingDraft?.gender || 'Prefer not to say') as 'Female' | 'Male' | 'Non-Binary' | 'Prefer not to say',
    ageRange: (existingDraft?.ageRange || '18-24') as '18-24' | '25-34' | '35-44' | '45+',
    
    // Background
    educationLevel: (existingDraft?.educationLevel || '') as any,
    fieldOfStudy: existingDraft?.fieldOfStudy || '',
    employmentStatus: (existingDraft?.employmentStatus || '') as any,
    yearsExperience: existingDraft?.yearsExperience || '',
    programmingBackground: (existingDraft?.programmingBackground || '') as any,
    
    // Links & Portfolio
    linkedinUrl: existingDraft?.linkedinUrl || '',
    githubUrl: existingDraft?.githubUrl || '',
    portfolioUrl: existingDraft?.portfolioUrl || '',
    cvUrl: existingDraft?.cvUrl || '',
    
    // Statements
    motivationStatement: existingDraft?.motivationStatement || '',
    goalsStatement: existingDraft?.goalsStatement || '',
    
    // Dynamic Custom Form Answers
    customAnswers: (existingDraft?.customAnswers || {}) as Record<string, any>,
    
    // Uploaded Files
    uploadedFiles: (existingDraft?.uploadedFiles || {}) as Record<string, UploadedFileRecord>,
  });

  // Automatically prefill initial answers for dynamic form fields from profile or draft
  useEffect(() => {
    if (!publishedCustomForm) return;

    setFormData(prev => {
      const nextCustomAnswers = { ...prev.customAnswers };
      const nextUploadedFiles = { ...prev.uploadedFiles };
      let changed = false;

      publishedCustomForm.sections.forEach(sec => {
        sec.fields.forEach(f => {
          const stdKey = getStandardKeyForField(f);

          // If no custom answer yet and standard key exists in formData or currentUser
          if (nextCustomAnswers[f.id] === undefined || nextCustomAnswers[f.id] === '') {
            if (stdKey && (prev as any)[stdKey]) {
              nextCustomAnswers[f.id] = (prev as any)[stdKey];
              changed = true;
            } else if (f.fieldType === 'email' && (prev.email || currentUser.email)) {
              nextCustomAnswers[f.id] = prev.email || currentUser.email;
              changed = true;
            } else if ((f.label.toLowerCase().includes('name') || f.id === 'fullName') && (prev.fullName || currentUser.name)) {
              nextCustomAnswers[f.id] = prev.fullName || currentUser.name;
              changed = true;
            } else if ((f.fieldType === 'phone' || f.label.toLowerCase().includes('phone')) && (prev.phone || currentUser.phone)) {
              nextCustomAnswers[f.id] = prev.phone || currentUser.phone;
              changed = true;
            }
          }

          // If file upload field and CV already exists in draft
          if (f.fieldType === 'file_upload' && !nextUploadedFiles[f.id]) {
            if (stdKey === 'cvUrl' && prev.cvUrl) {
              nextUploadedFiles[f.id] = {
                id: `cv-rec-${f.id}`,
                fileName: prev.cvUrl.startsWith('http') ? 'Candidate_Resume.pdf' : prev.cvUrl,
                fileSize: 1024 * 350,
                fileType: 'application/pdf',
                uploadedAt: new Date().toISOString(),
                status: 'completed',
                fileUrl: prev.cvUrl,
              };
              nextCustomAnswers[f.id] = nextUploadedFiles[f.id].fileName;
              changed = true;
            }
          }
        });
      });

      if (!changed) return prev;
      return {
        ...prev,
        customAnswers: nextCustomAnswers,
        uploadedFiles: nextUploadedFiles,
      };
    });
  }, [publishedCustomForm?.id, currentUser.id]);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedHonorCode, setAgreedHonorCode] = useState(true);

  const selectedCohort = cohorts.find(c => c.id === selectedCohId);
  const selectedProgram = programs.find(p => p.id === selectedProgId);

  // Check if current authenticated applicant has already submitted for this cohort
  const alreadySubmittedApp = applications.find(
    a => (a.applicantId === currentUser.id || (a.email && currentUser.email && a.email.toLowerCase() === currentUser.email.toLowerCase())) &&
         a.cohortId === selectedCohId &&
         a.status !== 'draft'
  );

  // Synchronize dynamic field edits with top-level model fields
  const handleCustomFieldChange = (fieldId: string, val: any) => {
    setFormData(prev => {
      const nextCustomAnswers = {
        ...prev.customAnswers,
        [fieldId]: val,
      };

      // Find field metadata to synchronize with top-level attributes
      let stdKey: string | null = null;
      if (publishedCustomForm) {
        for (const sec of publishedCustomForm.sections) {
          const f = sec.fields.find(item => item.id === fieldId);
          if (f) {
            stdKey = getStandardKeyForField(f);
            break;
          }
        }
      }

      if (stdKey) {
        return {
          ...prev,
          [stdKey]: val,
          customAnswers: nextCustomAnswers,
        };
      }

      return {
        ...prev,
        customAnswers: nextCustomAnswers,
      };
    });

    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleCustomFileUpload = (fieldId: string, fileRec: UploadedFileRecord | null) => {
    if (fileRec) {
      setFormData(prev => {
        const nextFiles = {
          ...prev.uploadedFiles,
          [fieldId]: fileRec,
        };
        const nextAnswers = {
          ...prev.customAnswers,
          [fieldId]: fileRec.fileName,
        };

        // If field corresponds to CV / resume, sync to top-level cvUrl
        let isCv = false;
        if (publishedCustomForm) {
          for (const sec of publishedCustomForm.sections) {
            const f = sec.fields.find(item => item.id === fieldId);
            if (f && getStandardKeyForField(f) === 'cvUrl') {
              isCv = true;
              break;
            }
          }
        }

        return {
          ...prev,
          uploadedFiles: nextFiles,
          customAnswers: nextAnswers,
          ...(isCv ? { cvUrl: fileRec.fileUrl || fileRec.fileName } : {}),
        };
      });
    } else {
      setFormData(prev => {
        const nextFiles = { ...prev.uploadedFiles };
        const nextAnswers = { ...prev.customAnswers };
        delete nextFiles[fieldId];
        delete nextAnswers[fieldId];

        return {
          ...prev,
          uploadedFiles: nextFiles,
          customAnswers: nextAnswers,
        };
      });
    }

    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Step Validation Engine (Step 1: Programme & Cohort, Step 2: Questionnaire, Step 3: Confirmation)
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!selectedProgId) errors.programId = 'Please select a programme track.';
      if (!selectedCohId) errors.cohortId = 'Please select an intake cohort.';
    } else if (step === 2) {
      if (publishedCustomForm && publishedCustomForm.sections.length > 0) {
        publishedCustomForm.sections.forEach(sec => {
          sec.fields.forEach(f => {
            const val = formData.customAnswers[f.id] !== undefined ? formData.customAnswers[f.id] : (formData as any)[f.id];
            const file = formData.uploadedFiles[f.id];

            if (f.required) {
              if (f.fieldType === 'file_upload') {
                if (!file || file.status !== 'completed') {
                  errors[f.id] = `Please upload the required document for ${f.label}.`;
                }
              } else if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
                errors[f.id] = `${f.label} is mandatory.`;
              } else if (f.fieldType === 'email' && typeof val === 'string' && !val.includes('@')) {
                errors[f.id] = 'Please provide a valid email address.';
              } else if (f.validationRules?.minLength && typeof val === 'string' && val.trim().length < f.validationRules.minLength) {
                errors[f.id] = `${f.label} must be at least ${f.validationRules.minLength} characters.`;
              }
            }
          });
        });
      }
    } else if (step === 3) {
      if (!agreedHonorCode) {
        errors.honorCode = 'You must acknowledge and accept the admissions honor code to proceed.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setValidationErrors({});
      setCurrentStep(prev => Math.min(3, prev + 1));
      handleSaveDraft(false);
    }
  };

  const handlePrevStep = () => {
    setValidationErrors({});
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSaveDraft = (showToast = true) => {
    setIsSavingDraft(true);
    const draftPayload: Partial<Application> = {
      id: draftAppId,
      programId: selectedProgId,
      cohortId: selectedCohId,
      fullName: formData.fullName || currentUser.name,
      email: formData.email || currentUser.email,
      phone: formData.phone || currentUser.phone || '',
      country: formData.country,
      city: formData.city,
      gender: formData.gender,
      ageRange: formData.ageRange,
      educationLevel: formData.educationLevel,
      fieldOfStudy: formData.fieldOfStudy,
      employmentStatus: formData.employmentStatus,
      yearsExperience: formData.yearsExperience,
      programmingBackground: formData.programmingBackground,
      linkedinUrl: formData.linkedinUrl,
      githubUrl: formData.githubUrl,
      portfolioUrl: formData.portfolioUrl,
      cvUrl: formData.cvUrl,
      motivationStatement: formData.motivationStatement,
      goalsStatement: formData.goalsStatement,
      customAnswers: formData.customAnswers,
      uploadedFiles: formData.uploadedFiles,
      lastSavedStep: currentStep,
    };

    const saved = saveDraftApplication(draftPayload);
    setDraftAppId(saved.id);
    setTimeout(() => {
      setIsSavingDraft(false);
      if (showToast) {
        addToast({
          title: 'Draft Saved',
          message: 'Your application progress has been preserved.',
          type: 'success',
        });
      }
    }, 200);
  };

  const handleSaveAndExit = () => {
    handleSaveDraft(true);
    if (onCancel) {
      onCancel();
    } else {
      setApplicantTab('dashboard');
    }
  };

  const handleFinalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Verify all steps
    for (let s = 1; s <= 3; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        addToast({
          title: 'Missing Information',
          message: 'Please complete all required fields before submitting your application.',
          type: 'error',
        });
        return;
      }
    }

    if (alreadySubmittedApp) {
      addToast({
        title: 'Application Already Submitted',
        message: `You have already submitted an application for this cohort (${alreadySubmittedApp.id}).`,
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    const submissionPayload: Partial<Application> = {
      id: draftAppId,
      programId: selectedProgId,
      cohortId: selectedCohId,
      fullName: formData.fullName || currentUser.name,
      email: formData.email || currentUser.email,
      phone: formData.phone || currentUser.phone || '',
      country: formData.country,
      city: formData.city,
      gender: formData.gender,
      ageRange: formData.ageRange,
      educationLevel: formData.educationLevel,
      fieldOfStudy: formData.fieldOfStudy,
      employmentStatus: formData.employmentStatus,
      yearsExperience: formData.yearsExperience,
      programmingBackground: formData.programmingBackground,
      linkedinUrl: formData.linkedinUrl,
      githubUrl: formData.githubUrl,
      portfolioUrl: formData.portfolioUrl,
      cvUrl: formData.cvUrl,
      motivationStatement: formData.motivationStatement,
      goalsStatement: formData.goalsStatement,
      customAnswers: formData.customAnswers,
      uploadedFiles: formData.uploadedFiles,
      formId: publishedCustomForm?.id,
      formVersion: publishedCustomForm?.version,
    };

    submitApplication(submissionPayload);

    setTimeout(() => {
      setIsSubmitting(false);
      if (onComplete) {
        onComplete();
      } else {
        setApplicantTab('dashboard');
      }
    }, 400);
  };

  const stepsList = [
    { num: 1, label: 'Programme & Cohort', icon: BookOpen, desc: 'Track & Intake Selection' },
    { num: 2, label: 'Application Questionnaire', icon: FileText, desc: 'Admissions Criteria & Background' },
    { num: 3, label: 'Review & Submit', icon: CheckCircle2, desc: 'Verification & Final Oath' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" id="application-wizard-container">
      {/* Already Submitted Warning Banner */}
      {alreadySubmittedApp && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs sm:text-sm">Application Already Submitted for this Cohort</div>
              <div className="text-[11px] sm:text-xs text-amber-800 mt-0.5">
                You have already submitted an application for <strong>{selectedCohort?.name || 'this cohort'}</strong> (Ref: <span className="font-mono font-bold">#{alreadySubmittedApp.id}</span> • Status: <span className="font-bold uppercase bg-amber-200/60 px-1.5 py-0.5 rounded text-amber-900">{alreadySubmittedApp.status}</span>). NextGen Academy permits one application per cohort.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setApplicantTab('dashboard')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xs cursor-pointer shrink-0 transition"
          >
            View in Dashboard
          </button>
        </div>
      )}

      {/* Wizard Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                Candidate Admissions Portal
              </span>
              {draftAppId && (
                <span className="text-[11px] font-medium text-slate-500 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Draft Saved ({draftAppId})</span>
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Apply to NextGen Academy
            </h1>
            <p className="text-xs text-slate-600">
              Select your academic track, complete your profile questionnaire, and submit your application for admissions review.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSaveDraft(true)}
              disabled={isSavingDraft}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndExit}
              className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <span>Save & Exit</span>
            </button>
          </div>
        </div>

        {/* Step Indicator Navigation */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stepsList.map((st) => {
            const Icon = st.icon;
            const isPassed = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            return (
              <button
                key={st.num}
                type="button"
                onClick={() => {
                  if (st.num < currentStep || validateStep(currentStep)) {
                    setCurrentStep(st.num);
                  }
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl text-left transition ${
                  isCurrent
                    ? 'bg-orange-50/90 border-2 border-orange-500 ring-2 ring-orange-500/10'
                    : isPassed
                    ? 'bg-slate-50 border border-emerald-200 hover:bg-slate-100/80 cursor-pointer'
                    : 'bg-slate-50/50 border border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isCurrent 
                      ? 'bg-orange-500 text-white shadow-xs' 
                      : isPassed 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    0{st.num}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {st.label}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {st.desc}
                    </div>
                  </div>
                </div>
                {isPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Icon className={`w-4 h-4 ${isCurrent ? 'text-orange-500' : 'text-slate-400'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Step 1: Programme & Cohort Selection */}
        {currentStep === 1 && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                1. Select Academic Track & Scheduled Intake Cohort
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Choose the programme curriculum and start date that aligns with your professional learning goals.
              </p>
            </div>

            {/* Programme Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {programs.map((prog) => {
                const isSelected = selectedProgId === prog.id;
                const cohCount = cohorts.filter(c => (c.programId === prog.id || (c as any).programmeId === prog.id) && c.status !== 'archived').length;

                return (
                  <div
                    key={prog.id}
                    onClick={() => setSelectedProgId(prog.id)}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {prog.code}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{prog.name}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                        {prog.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{prog.durationWeeks} Weeks</span>
                      <span className="font-semibold text-orange-600">{cohCount} Open Cohort{cohCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cohort Selection for the chosen Programme */}
            {availableCohortsForProg.length > 0 ? (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-800">
                  Select Active Intake Cohort <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableCohortsForProg.map((coh) => {
                    const isCohSelected = selectedCohId === coh.id;
                    const daysLeft = Math.ceil((new Date(coh.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <div
                        key={coh.id}
                        onClick={() => setSelectedCohId(coh.id)}
                        className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                          isCohSelected
                            ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-900">{coh.name}</div>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Open for Applications
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-2 space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>Starts: {coh.startDate} • {coh.format}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-amber-700 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Deadline: {coh.applicationDeadline} ({daysLeft > 0 ? `${daysLeft} days left` : 'Closes today'})</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Target Seats: {coh.capacity}</span>
                          <span className="font-semibold text-orange-600">
                            {isCohSelected ? 'Selected Intake' : 'Select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No cohorts currently accepting applications for this track. Please select another program or check back soon.</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Dynamic Form Questions */}
        {currentStep === 2 && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-900">
                    2. Admissions Questionnaire & Background Assessment
                  </h2>
                  {publishedCustomForm && (
                    <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full border border-orange-200">
                      Form v{publishedCustomForm.version}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {publishedCustomForm?.description || `Application questionnaire for ${selectedProgram?.name || 'this track'}.`}
                </p>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Applicant: <strong>{currentUser.email}</strong></span>
              </div>
            </div>

            {/* Validation Banner if errors exist */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">Please complete the required fields ({Object.keys(validationErrors).length})</span>
                  <div className="mt-0.5 text-rose-700">Ensure all mandatory questionnaire fields and file uploads are filled out.</div>
                </div>
              </div>
            )}

            {publishedCustomForm && publishedCustomForm.sections.length > 0 ? (
              <div className="space-y-8">
                {publishedCustomForm.sections.map((sec, idx) => (
                  <div key={sec.id} className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4">
                    <div className="border-b border-slate-200/80 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                          {idx + 1}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{sec.title}</h3>
                      </div>
                      {sec.description && (
                        <p className="text-xs text-slate-600 mt-1 pl-8">{sec.description}</p>
                      )}
                    </div>

                    <div className="pl-0 sm:pl-2">
                      <DynamicFormRenderer
                        fields={sec.fields}
                        values={formData.customAnswers}
                        uploadedFiles={formData.uploadedFiles}
                        onChange={handleCustomFieldChange}
                        onFileUpload={handleCustomFileUpload}
                        errors={validationErrors}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Standard Intake Criteria</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Standard admissions profile loaded. Proceed to review and verify your application form.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review & Final Submission */}
        {currentStep === 3 && (
          <div className="p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                3. Review Application Form & Submit
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Please double-check your provided details and attachments before officially submitting to the NextGen Admissions Board.
              </p>
            </div>

            {/* Application Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Track & Intake */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <BookOpen className="w-4 h-4 text-orange-600" />
                  <span>Target Academic Track</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div><strong>Programme:</strong> {selectedProgram?.name || selectedProgId}</div>
                  <div><strong>Cohort:</strong> {selectedCohort?.name || selectedCohId}</div>
                  <div><strong>Format:</strong> {selectedCohort?.format || 'Full-Time Virtual'}</div>
                  <div><strong>Start Date:</strong> {selectedCohort?.startDate || 'Upcoming'}</div>
                </div>
              </div>

              {/* Card 2: Candidate Profile */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <UserCheck className="w-4 h-4 text-orange-600" />
                  <span>Candidate Identity</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div><strong>Full Name:</strong> {formData.fullName || currentUser.name}</div>
                  <div><strong>Email:</strong> {formData.email || currentUser.email}</div>
                  <div><strong>Phone:</strong> {formData.phone || 'Not specified'}</div>
                  <div><strong>Location:</strong> {[formData.city, formData.country].filter(Boolean).join(', ') || 'Nigeria'}</div>
                </div>
              </div>
            </div>

            {/* Answered Questions Digest */}
            {publishedCustomForm && publishedCustomForm.sections.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Questionnaire Summary
                </h3>
                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white overflow-hidden text-xs">
                  {publishedCustomForm.sections.map(sec => (
                    <div key={sec.id} className="p-4 space-y-3">
                      <div className="font-bold text-slate-900 flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        <span>{sec.title}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4">
                        {sec.fields.map(f => {
                          const val = formData.customAnswers[f.id] !== undefined ? formData.customAnswers[f.id] : (formData as any)[f.id];
                          const file = formData.uploadedFiles[f.id];
                          return (
                            <div key={f.id} className="space-y-0.5">
                              <span className="text-slate-500 font-medium">{f.label}:</span>
                              <div className="text-slate-900 font-semibold truncate">
                                {f.fieldType === 'file_upload' ? (
                                  file ? (
                                    <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold">
                                      <FileCheck className="w-3.5 h-3.5" />
                                      <span>{file.fileName}</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">None uploaded</span>
                                  )
                                ) : Array.isArray(val) ? (
                                  val.join(', ') || <span className="text-slate-400 italic">None</span>
                                ) : val ? (
                                  String(val)
                                ) : (
                                  <span className="text-slate-400 italic">Not provided</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Honor Code & Confirmation */}
            <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/70 border border-orange-200/90 space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedHonorCode}
                  onChange={(e) => setAgreedHonorCode(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                />
                <div className="text-xs text-slate-800 leading-relaxed">
                  <span className="font-bold text-slate-900">NextGen Academy Candidate Declaration & Honor Code:</span>{' '}
                  I certify that all information, answers, and supporting files provided in this application are true, authentic, and complete. I understand that submitting this application constitutes a binding commitment to participate in the admissions assessment cycle.
                </div>
              </label>

              {validationErrors.honorCode && (
                <div className="text-xs text-rose-600 font-semibold pl-7">
                  {validationErrors.honorCode}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveAndExit}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel & Exit
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleSaveDraft(true)}
              disabled={isSavingDraft}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
            </button>

            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition cursor-pointer"
              >
                <span>Continue to Questionnaire</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition cursor-pointer"
              >
                <span>Review & Submit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 3 && (
              alreadySubmittedApp ? (
                <button
                  type="button"
                  onClick={() => setApplicantTab('dashboard')}
                  className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700 shadow-none transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Already Submitted (#{alreadySubmittedApp.id})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFinalSubmit()}
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting Application...' : 'Submit Application'}</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
