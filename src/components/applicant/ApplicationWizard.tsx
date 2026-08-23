import React, { useState, useEffect } from 'react';
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
  Send
} from 'lucide-react';

interface ApplicationWizardProps {
  existingApplication?: Application | null;
  preselectedProgramId?: string | null;
  preselectedCohortId?: string | null;
  onCancel?: () => void;
  onComplete?: () => void;
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
    Math.min(2, Math.max(1, existingDraft?.lastSavedStep || 1))
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

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCohort = cohorts.find(c => c.id === selectedCohId);
  const selectedProgram = programs.find(p => p.id === selectedProgId);

  // Check if current authenticated applicant has already submitted for this cohort
  const alreadySubmittedApp = applications.find(
    a => (a.applicantId === currentUser.id || (a.email && currentUser.email && a.email.toLowerCase() === currentUser.email.toLowerCase())) &&
         a.cohortId === selectedCohId &&
         a.status !== 'draft'
  );

  const handleCustomFieldChange = (fieldId: string, val: any) => {
    setFormData(prev => ({
      ...prev,
      customAnswers: {
        ...prev.customAnswers,
        [fieldId]: val,
      },
    }));
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
      setFormData(prev => ({
        ...prev,
        uploadedFiles: {
          ...prev.uploadedFiles,
          [fieldId]: fileRec,
        },
        customAnswers: {
          ...prev.customAnswers,
          [fieldId]: fileRec.fileName,
        },
      }));
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

  // Step Validation Engine (Step 1: Programme & Cohort, Step 2: Dynamic Form Questions)
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!selectedProgId) errors.programId = 'Please select a programme.';
      if (!selectedCohId) errors.cohortId = 'Please select a cohort.';
    } else if (step === 2) {
      // Validate dynamic custom form if published
      if (publishedCustomForm) {
        publishedCustomForm.sections.forEach(sec => {
          sec.fields.forEach(f => {
            const val = formData.customAnswers[f.id];
            const file = formData.uploadedFiles[f.id];

            if (f.required) {
              if (f.fieldType === 'file_upload') {
                if (!file || file.status !== 'completed') {
                  errors[f.id] = `Please upload the required document for ${f.label}.`;
                }
              } else if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
                errors[f.id] = `${f.label} is required.`;
              }
            }
          });
        });
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setValidationErrors({});
      setCurrentStep(prev => Math.min(2, prev + 1));
      // Autosave progress
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
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
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
    setTimeout(() => setIsSavingDraft(false), 250);
  };

  const handleSaveAndExit = () => {
    handleSaveDraft(true);
    if (onCancel) {
      onCancel();
    } else {
      setApplicantTab('overview');
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verify all steps (Step 1 and Step 2)
    let allValid = true;
    for (let s = 1; s <= 2; s++) {
      if (!validateStep(s)) {
        allValid = false;
        setCurrentStep(s);
        break;
      }
    }

    if (!allValid) {
      addToast({
        title: 'Missing Required Fields',
        message: 'Please complete all highlighted mandatory questions before submitting.',
        type: 'error',
      });
      return;
    }

    if (alreadySubmittedApp) {
      addToast({
        title: 'Application Already Submitted',
        message: `You have already submitted an application for this cohort (${alreadySubmittedApp.id}). Only one application is permitted per cohort.`,
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    const submissionPayload: Partial<Application> = {
      id: draftAppId,
      programId: selectedProgId,
      cohortId: selectedCohId,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
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
        setApplicantTab('overview');
      }
    }, 400);
  };

  const stepsList = [
    { num: 1, label: 'Programme & Cohort', icon: BookOpen, desc: 'Track & Intake Selection' },
    { num: 2, label: 'Form Questions', icon: FileText, desc: 'Admissions Questionnaire' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" id="application-wizard-container">
      {/* Already Submitted Warning Banner */}
      {alreadySubmittedApp && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
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
            onClick={() => setApplicantTab('overview')}
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
                  <span>Draft in Progress ({draftAppId})</span>
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Apply to NextGen Academy
            </h1>
            <p className="text-xs text-slate-600">
              Select your desired programme cohort and complete the application questions.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSaveDraft(true)}
              disabled={isSavingDraft}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndExit}
              className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <span>Continue Later</span>
            </button>
          </div>
        </div>

        {/* Step Indicator Navigation */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stepsList.map((st) => {
            const Icon = st.icon;
            const isPassed = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            return (
              <button
                key={st.num}
                type="button"
                onClick={() => {
                  // Only allow jumping back or to next if validated
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
                1. Select Desired Academic Track & Cohort
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Choose the program track and scheduled cohort intake that best matches your learning objectives.
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
                    2. Programme & Cohort Application Questions
                  </h2>
                  {publishedCustomForm && (
                    <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full border border-orange-200">
                      Form v{publishedCustomForm.version}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {publishedCustomForm?.description || `Custom admissions assessment criteria tailored for ${selectedProgram?.name || 'this track'}.`}
                </p>
              </div>
            </div>

            {/* Validation Banner if errors exist */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">Please complete the required fields ({Object.keys(validationErrors).length})</span>
                  <div className="mt-0.5 text-rose-700">Fill in all mandatory questionnaire fields before submitting your application.</div>
                </div>
              </div>
            )}

            {publishedCustomForm && publishedCustomForm.sections.length > 0 ? (
              <div className="space-y-8">
                {publishedCustomForm.sections.map((sec, idx) => (
                  <div key={sec.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4">
                    <div className="border-b border-slate-200/80 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
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
                    No additional custom questions are configured for this programme intake. You can submit your application directly.
                  </p>
                </div>
              </div>
            )}

            {/* Honor Code & Confirmation */}
            <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/80 space-y-2 mt-4">
              <div className="flex items-start space-x-2 text-xs text-zinc-900 font-medium">
                <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span>
                  I confirm that all provided responses are accurate and authentic. Submitting this application will route it to the admissions board for review and assessment.
                </span>
              </div>
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

            {currentStep < 2 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition cursor-pointer"
              >
                <span>Continue to Step 02</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : alreadySubmittedApp ? (
              <button
                type="button"
                onClick={() => setApplicantTab('overview')}
                className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700 shadow-none transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Already Submitted (#{alreadySubmittedApp.id})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Application...' : 'Submit Application'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
