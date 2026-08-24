import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Program, 
  Cohort, 
  CohortStatus,
  Application, 
  Assessment, 
  AssessmentStatus,
  AssessmentResource,
  AssessmentSubmission, 
  CommunicationMessage, 
  CommunicationTemplate, 
  CommunicationType,
  CommunicationLogEntry,
  DeliveryStatus,
  User, 
  UserRole,
  ApplicationStatus,
  ApplicationTimelineEvent,
  RubricEvaluation,
  LearnerRecord,
  ApplicationForm,
  ApplicationFormSection,
  ApplicationFormField,
  BulkUploadValidationError,
  InternalNote,
  UploadedFileRecord,
} from '../types';
import { 
  SEED_USERS, 
  SEED_PROGRAMS, 
  SEED_COHORTS, 
  SEED_ASSESSMENTS, 
  SEED_APPLICATIONS, 
  SEED_MESSAGES, 
  SEED_TEMPLATES,
  SEED_COMMUNICATION_LOGS,
  SEED_LEARNERS,
  SEED_APPLICATION_FORMS,
  createDefaultProgrammeApplicationForm
} from '../data/seedData';
import { 
  dispatchNotificationEvent, 
  interpolateVariables, 
  NotificationContext, 
  DEFAULT_COMMUNICATION_TEMPLATES,
  TEMPLATE_VARIABLES 
} from '../notifications/notificationService';
import { validateAndParseFormCsv } from '../utils/formCsvParser';
import confetti from 'canvas-confetti';
import { db, auth } from '../firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const cleanForFirestore = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item)).filter(item => item !== undefined);
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = cleanForFirestore(value);
    }
  }
  return clean;
};

const syncDocToFirestore = async (col: string, id: string, data: any) => {
  try {
    const sanitized = cleanForFirestore(data);
    await setDoc(doc(db, col, id), sanitized, { merge: true });
  } catch (err) {
    console.warn(`Firestore sync error on ${col}/${id}:`, err);
  }
};

const deleteDocFromFirestore = async (col: string, id: string) => {
  try {
    await deleteDoc(doc(db, col, id));
  } catch (err) {
    console.warn(`Firestore delete error on ${col}/${id}:`, err);
  }
};

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  // Authentication & Role
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  allUsers: User[];
  
  // Navigation
  activePortal: 'applicant' | 'manager' | 'learner' | 'facilitator';
  setActivePortal: (portal: 'applicant' | 'manager' | 'learner' | 'facilitator') => void;
  managerTab: 'overview' | 'programs' | 'forms' | 'applications' | 'assessments' | 'communications' | 'mne' | 'learners';
  setManagerTab: (tab: 'overview' | 'programs' | 'forms' | 'applications' | 'assessments' | 'communications' | 'mne' | 'learners') => void;
  applicantTab: 'dashboard' | 'explore' | 'assessments' | 'inbox' | 'apply';
  setApplicantTab: (tab: 'dashboard' | 'explore' | 'assessments' | 'inbox' | 'apply') => void;
  
  // Selected Context
  selectedProgramId: string | null;
  setSelectedProgramId: (id: string | null) => void;
  selectedCohortId: string | null;
  setSelectedCohortId: (id: string | null) => void;
  targetApplicationForApply: { programId: string; cohortId: string } | null;
  setTargetApplicationForApply: (target: { programId: string; cohortId: string } | null) => void;
  
  // Programmes & Cohorts
  programs: Program[];
  cohorts: Cohort[];
  addProgram: (program: Omit<Program, 'id'>) => Program;
  updateProgram: (id: string, updates: Partial<Program>) => void;
  archiveProgram: (id: string) => void;
  toggleProgramStatus: (id: string) => void;
  deleteProgram: (id: string) => void;
  addCohort: (cohort: Omit<Cohort, 'id' | 'admittedCount' | 'enrolledCount'>) => Cohort;
  updateCohort: (id: string, updates: Partial<Cohort>) => void;
  archiveCohort: (id: string) => void;
  openCohortApplications: (id: string) => void;
  closeCohortApplications: (id: string) => void;
  updateCohortStatus: (id: string, status: CohortStatus) => void;
  deleteCohort: (id: string) => void;
  
  // Application Form Builder (Module 4)
  forms: ApplicationForm[];
  activeFormId: string | null;
  setActiveFormId: (id: string | null) => void;
  addForm: (form: Omit<ApplicationForm, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => ApplicationForm;
  updateForm: (id: string, updates: Partial<ApplicationForm>) => void;
  deleteForm: (id: string) => void;
  publishForm: (id: string) => { success: boolean; errors?: string[] };
  unpublishForm: (id: string) => void;
  createFormVersion: (id: string) => ApplicationForm;
  addSectionToForm: (formId: string, section: Omit<ApplicationFormSection, 'id' | 'formId' | 'fields'>) => ApplicationFormSection;
  updateSectionInForm: (formId: string, sectionId: string, updates: Partial<ApplicationFormSection>) => void;
  deleteSectionFromForm: (formId: string, sectionId: string) => void;
  reorderSectionsInForm: (formId: string, sourceIndexOrIds: number | string[], destIndex?: number) => void;
  addFieldToSection: (formId: string, sectionId: string, field: Omit<ApplicationFormField, 'id' | 'formId' | 'sectionId'>) => ApplicationFormField;
  updateFieldInSection: (formId: string, sectionId: string, fieldId: string, updates: Partial<ApplicationFormField>) => void;
  deleteFieldFromSection: (formId: string, sectionId: string, fieldId: string) => void;
  reorderFieldsInSection: (formId: string, sectionId: string, sourceIndexOrIds: number | string[], destIndex?: number) => void;
  bulkImportFieldsToForm: (formId: string, csvData: string, mode?: 'replace' | 'append') => { success: boolean; importedCount: number; errors: BulkUploadValidationError[] };
  getPublishedFormForProgramme: (programmeId: string, cohortId?: string) => ApplicationForm | undefined;

  // Applications
  applications: Application[];
  saveDraftApplication: (appData: Partial<Application>) => Application;
  submitApplication: (appData: Partial<Application>) => Application;
  deleteDraftApplication: (appId: string) => void;
  updateApplicationStatus: (appId: string, status: ApplicationStatus, note?: string) => void;
  updateRubricEvaluation: (appId: string, rubric: RubricEvaluation) => void;
  addInternalNote: (appId: string, content: string, category?: InternalNote['category']) => void;
  updateDocumentVerification: (appId: string, fieldId: string, status: 'verified' | 'pending' | 'rejected', note?: string) => void;
  createTestApplication: (customData?: Partial<Application>) => Application;
  toggleStarApplication: (appId: string) => void;
  bulkUpdateStatus: (appIds: string[], status: ApplicationStatus) => void;
  
  // Assessments
  assessments: Assessment[];
  assessmentSubmissions: AssessmentSubmission[];
  createAssessment: (initialData?: Partial<Assessment>) => Assessment;
  saveAssessment: (assessment: Assessment) => void;
  deleteAssessment: (assessmentId: string) => void;
  duplicateAssessment: (assessmentId: string) => Assessment;
  updateAssessmentStatus: (assessmentId: string, status: AssessmentStatus) => void;
  addAssessmentResource: (assessmentId: string, resource: Omit<AssessmentResource, 'id' | 'uploadedAt'>) => void;
  removeAssessmentResource: (assessmentId: string, resourceId: string) => void;
  submitAssessment: (submission: Omit<AssessmentSubmission, 'id' | 'submittedAt'>) => AssessmentSubmission;
  gradeAssessmentSubmission: (params: {
    submissionId?: string;
    applicationId: string;
    assessmentId: string;
    questionScores: Record<string, number>;
    evaluatorFeedback?: string;
    passed?: boolean;
  }) => void;
  
  // Communications & Notifications (Module 10)
  messages: CommunicationMessage[];
  templates: CommunicationTemplate[];
  communicationLogs: CommunicationLogEntry[];
  sendMessage: (msg: Omit<CommunicationMessage, 'id' | 'sentAt' | 'status'>) => void;
  broadcastToCohort: (cohortId: string, subject: string, content: string, tags?: string[]) => void;
  saveTemplate: (template: CommunicationTemplate) => void;
  toggleTemplateAutomation: (templateIdOrType: string, enabled?: boolean) => void;
  resetTemplatesToDefault: () => void;
  clearCommunicationLogs: () => void;
  resendCommunication: (logId: string) => Promise<boolean>;
  triggerNotification: (
    type: CommunicationType,
    context: NotificationContext,
    options?: {
      forceSend?: boolean;
      customSubject?: string;
      customBody?: string;
      channelsOverride?: { email: boolean; inApp: boolean; sms: boolean };
      sender?: { id: string; name: string; role: UserRole };
    }
  ) => Promise<{ dispatched: boolean; reason?: string; log?: CommunicationLogEntry }>;
  broadcastManualMessage: (params: {
    targetAudience: 'all' | 'cohort' | 'status' | 'individual';
    cohortId?: string;
    statusFilter?: string;
    individualApplicantId?: string;
    templateId?: string;
    subject: string;
    content: string;
    channels: { email: boolean; inApp: boolean; sms: boolean };
    tags?: string[];
  }) => Promise<{ success: boolean; dispatchedCount: number }>;
  broadcastMessage?: any;
  
  // Admissions & Learner Transition
  makeAdmissionDecision: (params: {
    applicationId: string;
    decision: 'ACCEPTED' | 'REJECTED' | 'WAITLISTED' | 'admitted' | 'rejected' | 'waitlisted';
    reason?: string;
    decidedBy?: string;
  }) => void;
  acceptAdmissionOffer: (applicationId: string) => void;
  learners: LearnerRecord[];
  
  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // System Reset
  resetToDefaultSeed: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'nextgen_class_users_v2',
  CURRENT_USER: 'nextgen_class_current_user',
  CURRENT_USER_ID: 'nextgen_class_current_user_id',
  PROGRAMS: 'nextgen_class_programs_v2',
  COHORTS: 'nextgen_class_cohorts_v2',
  APPLICATIONS: 'nextgen_class_applications_v2',
  ASSESSMENTS: 'nextgen_class_assessments_v2',
  SUBMISSIONS: 'nextgen_class_submissions_v2',
  MESSAGES: 'nextgen_class_messages_v2',
  TEMPLATES: 'nextgen_class_templates_v2',
  COMMUNICATION_LOGS: 'nextgen_class_comm_logs_v2',
  LEARNERS: 'nextgen_class_learners_v2',
  FORMS: 'nextgen_class_forms_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from local storage or fallback to seeds
  const [allUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : SEED_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const savedUserStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.id && parsed.role) return parsed;
      }
      const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || localStorage.getItem('nextgen_class_current_user_v2');
      if (savedId) {
        const found = allUsers.find(u => u.id === savedId);
        if (found) return found;
      }
    } catch (e) {
      console.warn('Error reading saved user session:', e);
    }
    return allUsers[0]; // Default Administrator / First User
  });

  const [activePortal, setActivePortal] = useState<'applicant' | 'manager' | 'learner' | 'facilitator'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) return 'manager';
      if (path.startsWith('/learn')) return 'learner';
      if (path.startsWith('/facilitator')) return 'facilitator';
      if (path.startsWith('/apply')) return 'applicant';
    }
    if (currentUser.role === 'program_manager' || currentUser.role === 'reviewer') return 'manager';
    if (currentUser.role === 'learner') return 'learner';
    if (currentUser.role === 'facilitator') return 'facilitator';
    return 'applicant';
  });

  const [managerTab, setManagerTab] = useState<'overview' | 'programs' | 'forms' | 'applications' | 'assessments' | 'communications' | 'mne' | 'learners'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/admin/programs')) return 'programs';
      if (path.includes('/admin/forms')) return 'forms';
      if (path.includes('/admin/applications')) return 'applications';
      if (path.includes('/admin/assessments')) return 'assessments';
      if (path.includes('/admin/communications')) return 'communications';
      if (path.includes('/admin/mne')) return 'mne';
      if (path.includes('/admin/learners')) return 'learners';
    }
    return 'overview';
  });

  const [applicantTab, setApplicantTab] = useState<'dashboard' | 'explore' | 'assessments' | 'inbox' | 'apply'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/apply/explore')) return 'explore';
      if (path.includes('/apply/assessments')) return 'assessments';
      if (path.includes('/apply/apply') || path.includes('/apply/wizard') || path.includes('/apply/dossier')) return 'apply';
      if (path.includes('/apply/inbox')) return 'inbox';
    }
    return 'dashboard';
  });
  
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [targetApplicationForApply, setTargetApplicationForApply] = useState<{ programId: string; cohortId: string } | null>(null);

  const [programs, setPrograms] = useState<Program[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROGRAMS);
    return saved ? JSON.parse(saved) : SEED_PROGRAMS;
  });

  const [cohorts, setCohorts] = useState<Cohort[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COHORTS);
    return saved ? JSON.parse(saved) : SEED_COHORTS;
  });

  const [forms, setForms] = useState<ApplicationForm[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FORMS);
    return saved ? JSON.parse(saved) : SEED_APPLICATION_FORMS;
  });

  const [activeFormId, setActiveFormId] = useState<string | null>(null);

  const [applications, setApplications] = useState<Application[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    return saved ? JSON.parse(saved) : SEED_APPLICATIONS;
  });

  const [assessments, setAssessments] = useState<Assessment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
    return saved ? JSON.parse(saved) : SEED_ASSESSMENTS;
  });

  const [assessmentSubmissions, setAssessmentSubmissions] = useState<AssessmentSubmission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [messages, setMessages] = useState<CommunicationMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!saved) return SEED_MESSAGES;
      const parsed: CommunicationMessage[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return SEED_MESSAGES;
      const seen = new Set<string>();
      const deduplicated: CommunicationMessage[] = [];
      for (let i = 0; i < parsed.length; i++) {
        let msg = parsed[i];
        if (!msg || typeof msg !== 'object') continue;
        if (!msg.id || seen.has(msg.id)) {
          msg = { ...msg, id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7) + '-' + i };
        }
        seen.add(msg.id);
        deduplicated.push(msg);
      }
      return deduplicated;
    } catch {
      return SEED_MESSAGES;
    }
  });

  const [templates, setTemplates] = useState<CommunicationTemplate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return saved ? JSON.parse(saved) : SEED_TEMPLATES;
  });

  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMMUNICATION_LOGS);
    return saved ? JSON.parse(saved) : SEED_COMMUNICATION_LOGS;
  });

  const [learners, setLearners] = useState<LearnerRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEARNERS);
    return saved ? JSON.parse(saved) : SEED_LEARNERS;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
    } catch (e) {
      console.warn('Could not save current user to localStorage:', e);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs));
  }, [programs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COHORTS, JSON.stringify(cohorts));
  }, [cohorts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(assessments));
  }, [assessments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(assessmentSubmissions));
  }, [assessmentSubmissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMMUNICATION_LOGS, JSON.stringify(communicationLogs));
  }, [communicationLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEARNERS, JSON.stringify(learners));
  }, [learners]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FORMS, JSON.stringify(forms));
  }, [forms]);

  // Real-time Firestore synchronization & initial seeding
  useEffect(() => {
    // 1. Synchronize Programmes from Firestore
    const unsubProgrammes = onSnapshot(collection(db, 'programmes'), (snapshot) => {
      if (snapshot.empty) {
        try {
          const batch = writeBatch(db);
          SEED_PROGRAMS.forEach(p => {
            batch.set(doc(db, 'programmes', p.id), p);
          });
          batch.commit().catch(() => {});
        } catch (_) {}
      } else {
        const liveProgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Program));
        setPrograms(liveProgs);
      }
    }, (err) => console.warn('Firestore programmes listener note:', err));

    // 2. Synchronize Cohorts from Firestore
    const unsubCohorts = onSnapshot(collection(db, 'cohorts'), (snapshot) => {
      if (snapshot.empty) {
        try {
          const batch = writeBatch(db);
          SEED_COHORTS.forEach(c => {
            batch.set(doc(db, 'cohorts', c.id), c);
          });
          batch.commit().catch(() => {});
        } catch (_) {}
      } else {
        const liveCohorts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Cohort));
        setCohorts(liveCohorts);
      }
    }, (err) => console.warn('Firestore cohorts listener note:', err));

    // 3. Synchronize Application Forms from Firestore
    const unsubForms = onSnapshot(collection(db, 'forms'), (snapshot) => {
      if (snapshot.empty) {
        try {
          const batch = writeBatch(db);
          SEED_APPLICATION_FORMS.forEach(f => {
            batch.set(doc(db, 'forms', f.id), f);
          });
          batch.commit().catch(() => {});
        } catch (_) {}
      } else {
        const liveForms = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ApplicationForm));
        setForms(liveForms);
      }
    }, (err) => console.warn('Firestore forms listener note:', err));

    // 4. Synchronize Applications from Firestore
    const unsubApplications = onSnapshot(collection(db, 'applications'), (snapshot) => {
      if (snapshot.empty) {
        try {
          const batch = writeBatch(db);
          SEED_APPLICATIONS.forEach(a => {
            batch.set(doc(db, 'applications', a.id), cleanForFirestore(a));
          });
          batch.commit().catch(() => {});
        } catch (_) {}
      } else {
        const liveApps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Application));
        setApplications(prev => {
          const liveMap = new Map(liveApps.map(a => [a.id, a]));
          const merged = liveApps.slice();
          prev.forEach(localApp => {
            if (!liveMap.has(localApp.id)) {
              merged.push(localApp);
            }
          });
          return merged;
        });
      }
    }, (err) => console.warn('Firestore applications listener note:', err));

    // 5. Synchronize Assessments from Firestore
    const unsubAssessments = onSnapshot(collection(db, 'assessments'), (snapshot) => {
      if (snapshot.empty) {
        try {
          const batch = writeBatch(db);
          SEED_ASSESSMENTS.forEach(a => {
            batch.set(doc(db, 'assessments', a.id), a);
          });
          batch.commit().catch(() => {});
        } catch (_) {}
      } else {
        const liveAsms = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Assessment));
        setAssessments(liveAsms);
      }
    }, (err) => console.warn('Firestore assessments listener note:', err));

    // 6. Synchronize Assessment Submissions from Firestore
    const unsubSubmissions = onSnapshot(collection(db, 'submissions'), (snapshot) => {
      if (!snapshot.empty) {
        const liveSubs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AssessmentSubmission));
        setAssessmentSubmissions(liveSubs);
      }
    }, (err) => console.warn('Firestore submissions listener note:', err));

    // 7. Synchronize Messages from Firestore
    const unsubMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
      if (!snapshot.empty) {
        const liveMsgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CommunicationMessage));
        setMessages(liveMsgs);
      }
    }, (err) => console.warn('Firestore messages listener note:', err));

    return () => {
      unsubProgrammes();
      unsubCohorts();
      unsubForms();
      unsubApplications();
      unsubAssessments();
      unsubSubmissions();
      unsubMessages();
    };
  }, []);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const switchRole = (role: UserRole) => {
    const targetUser = allUsers.find(u => u.role === role) || allUsers[0];
    setCurrentUser(targetUser);
    if (role === 'program_manager' || role === 'reviewer') {
      setActivePortal('manager');
    } else if (role === 'learner') {
      setActivePortal('learner');
    } else {
      setActivePortal('applicant');
    }
    addToast({
      title: `Switched to ${targetUser.name}`,
      message: `Now operating with ${((role as string) || '').replace('_', ' ').toUpperCase()} credentials.`,
      type: 'info',
    });
  };

  // ==========================================
  // MODULE 10: COMMUNICATIONS & NOTIFICATIONS
  // ==========================================
  const sendMessage = (msgData: Omit<CommunicationMessage, 'id' | 'sentAt' | 'status'>) => {
    const newId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    const newMsg: CommunicationMessage = {
      ...msgData,
      id: newId,
      sentAt: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      status: 'delivered',
    };
    setMessages(prev => [newMsg, ...prev.filter(m => m.id !== newMsg.id)]);
    syncDocToFirestore('messages', newId, newMsg);
  };

  const triggerNotification = async (
    type: CommunicationType,
    context: NotificationContext,
    options?: {
      forceSend?: boolean;
      customSubject?: string;
      customBody?: string;
      channelsOverride?: { email: boolean; inApp: boolean; sms: boolean };
      sender?: { id: string; name: string; role: UserRole };
    }
  ): Promise<{ dispatched: boolean; reason?: string; log?: CommunicationLogEntry }> => {
    const result = await dispatchNotificationEvent({
      type,
      templates,
      context,
      forceSend: options?.forceSend,
      customSubject: options?.customSubject,
      customBody: options?.customBody,
      channelsOverride: options?.channelsOverride,
      sender: options?.sender || {
        id: currentUser.id,
        name: currentUser.name || 'NextGen Admissions Desk',
        role: currentUser.role,
      },
    });

    if (result.log) {
      setCommunicationLogs(prev => [result.log!, ...prev]);
    }
    if (result.inAppMessage) {
      setMessages(prev => [result.inAppMessage!, ...prev.filter(m => m.id !== result.inAppMessage!.id)]);
      syncDocToFirestore('messages', result.inAppMessage!.id, result.inAppMessage!);
    }

    return result;
  };

  const toggleTemplateAutomation = (templateIdOrType: string, enabled?: boolean) => {
    setTemplates(prev => prev.map(t => {
      if (t.id === templateIdOrType || t.type === templateIdOrType) {
        const newEnabled = enabled !== undefined ? enabled : !t.enabled;
        return {
          ...t,
          enabled: newEnabled,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.name,
        };
      }
      return t;
    }));

    const target = templates.find(t => t.id === templateIdOrType || t.type === templateIdOrType);
    const willBeEnabled = enabled !== undefined ? enabled : !target?.enabled;
    addToast({
      title: willBeEnabled ? 'Automation Enabled ⚡' : 'Automation Paused ⏸️',
      message: `Automated messaging for "${target?.name || templateIdOrType}" is now ${willBeEnabled ? 'ACTIVE' : 'MUTED'}.`,
      type: willBeEnabled ? 'success' : 'info',
    });
  };

  const saveTemplate = (template: CommunicationTemplate) => {
    setTemplates(prev => {
      const idx = prev.findIndex(t => t.id === template.id || t.type === template.type);
      const updatedTemplate: CommunicationTemplate = {
        ...template,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name,
      };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedTemplate;
        return next;
      }
      return [...prev, updatedTemplate];
    });
    addToast({
      title: 'Template Saved ✉️',
      message: `"${template.name}" updated successfully.`,
      type: 'success',
    });
  };

  const resetTemplatesToDefault = () => {
    setTemplates(DEFAULT_COMMUNICATION_TEMPLATES);
    addToast({
      title: 'Templates Restored',
      message: 'Restored all 9 standard communication templates to baseline configuration.',
      type: 'info',
    });
  };

  const clearCommunicationLogs = () => {
    setCommunicationLogs([]);
    addToast({
      title: 'Audit Logs Cleared',
      message: 'Notification event dispatch history has been cleared.',
      type: 'info',
    });
  };

  const resendCommunication = async (logId: string): Promise<boolean> => {
    const targetLog = communicationLogs.find(l => l.id === logId);
    if (!targetLog) return false;

    const res = await triggerNotification(
      targetLog.messageType as CommunicationType,
      {
        applicant: {
          id: targetLog.recipientId,
          fullName: targetLog.recipientName,
          email: targetLog.recipient,
        },
        application: targetLog.applicationId ? applications.find(a => a.id === targetLog.applicationId) : undefined,
        cohort: targetLog.cohortId ? cohorts.find(c => c.id === targetLog.cohortId) : undefined,
        programme: targetLog.programId ? programs.find(p => p.id === targetLog.programId) : undefined,
        assessment: targetLog.assessmentId ? assessments.find(a => a.id === targetLog.assessmentId) : undefined,
      },
      {
        forceSend: true,
        customSubject: targetLog.subject,
        customBody: targetLog.content,
      }
    );

    if (res.dispatched) {
      addToast({
        title: 'Notification Re-dispatched 🚀',
        message: `Successfully re-sent "${targetLog.subject}" to ${targetLog.recipient}.`,
        type: 'success',
      });
      return true;
    }
    return false;
  };

  const broadcastToCohort = (cohortId: string, subject: string, content: string, tags?: string[]) => {
    const targetCohort = cohorts.find(c => c.id === cohortId);
    const targetProgram = programs.find(p => p.id === targetCohort?.programId);

    const newBroadcast: CommunicationMessage = {
      id: 'msg-bc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      cohortId,
      programId: targetProgram?.id,
      type: 'broadcast',
      templateType: 'MANUAL_BROADCAST',
      subject,
      content,
      sentAt: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      status: 'sent',
      tags: tags || ['Cohort Broadcast'],
    };

    setMessages(prev => [newBroadcast, ...prev.filter(m => m.id !== newBroadcast.id)]);
    addToast({
      title: 'Cohort Broadcast Dispatched 📣',
      message: `Delivered to candidates in ${targetCohort?.name || 'cohort'}.`,
      type: 'success',
    });
  };

  const broadcastManualMessage = async (params: {
    targetAudience: 'all' | 'cohort' | 'status' | 'individual';
    cohortId?: string;
    statusFilter?: string;
    individualApplicantId?: string;
    templateId?: string;
    subject: string;
    content: string;
    channels: { email: boolean; inApp: boolean; sms: boolean };
    tags?: string[];
  }): Promise<{ success: boolean; dispatchedCount: number }> => {
    const { targetAudience, cohortId, statusFilter, individualApplicantId, subject, content, channels, tags } = params;

    let eligibleApps = applications.filter(a => a.status !== 'draft');

    if (targetAudience === 'individual' && individualApplicantId) {
      eligibleApps = applications.filter(a => a.applicantId === individualApplicantId || a.id === individualApplicantId);
    } else {
      if (cohortId && cohortId !== 'all') {
        eligibleApps = eligibleApps.filter(a => a.cohortId === cohortId);
      }
      if (statusFilter && statusFilter !== 'all') {
        eligibleApps = eligibleApps.filter(a => a.status === statusFilter);
      }
    }

    if (eligibleApps.length === 0) {
      addToast({
        title: 'No Recipients Found',
        message: 'No candidates matched the specified audience filter.',
        type: 'warning',
      });
      return { success: false, dispatchedCount: 0 };
    }

    let count = 0;
    for (const app of eligibleApps) {
      const coh = cohorts.find(c => c.id === app.cohortId);
      const prog = programs.find(p => p.id === app.programId);
      const targetAsm = assessments.find(a => a.cohortId === app.cohortId);

      const ctx: NotificationContext = {
        applicant: {
          id: app.applicantId,
          fullName: app.fullName,
          email: app.email,
          phone: app.phone,
        },
        application: app,
        cohort: coh,
        programme: prog,
        assessment: targetAsm,
        deadline: coh?.applicationDeadline || 'September 15, 2026',
      };

      await triggerNotification('MANUAL_BROADCAST', ctx, {
        forceSend: true,
        customSubject: subject,
        customBody: content,
        channelsOverride: channels,
      });
      count++;
    }

    const targetCohort = cohortId && cohortId !== 'all' ? cohorts.find(c => c.id === cohortId) : undefined;
    const targetProg = targetCohort ? programs.find(p => p.id === targetCohort.programId) : undefined;

    const newBroadcastMsg: CommunicationMessage = {
      id: 'msg-bc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      cohortId: cohortId === 'all' ? undefined : cohortId,
      programId: targetProg?.id,
      type: 'broadcast',
      templateType: 'MANUAL_BROADCAST',
      subject: interpolateVariables(subject, {
        applicant: { fullName: eligibleApps[0]?.fullName },
        cohort: targetCohort,
        programme: targetProg,
      }),
      content: interpolateVariables(content, {
        applicant: { fullName: eligibleApps[0]?.fullName },
        cohort: targetCohort,
        programme: targetProg,
      }),
      sentAt: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      status: 'sent',
      tags: tags || ['Broadcast', `${count} Recipients`],
    };
    setMessages(prev => [newBroadcastMsg, ...prev.filter(m => m.id !== newBroadcastMsg.id)]);

    const activeChannels = Object.entries(channels)
      .filter(([_, v]) => v)
      .map(([k]) => k.toUpperCase())
      .join(' & ');

    addToast({
      title: 'Broadcast Dispatched 🚀',
      message: `Delivered to ${count} candidate(s) via ${activeChannels || 'Inbox'}.`,
      type: 'success',
    });

    return { success: true, dispatchedCount: count };
  };

  // Programme operations
  const addProgram = (progData: Omit<Program, 'id'>): Program => {
    const newId = 'prog-' + Date.now().toString(36);
    const now = new Date().toISOString();
    const newProg: Program = {
      ...progData,
      id: newId,
      status: progData.status || 'active',
      createdAt: now,
      updatedAt: now,
    };
    setPrograms(prev => [newProg, ...prev.filter(p => p.id !== newId)]);
    syncDocToFirestore('programmes', newId, newProg);
    syncDocToFirestore('programs', newId, newProg);

    addToast({
      title: 'Programme Created',
      message: `"${newProg.name}" has been configured successfully.`,
      type: 'success',
    });
    return newProg;
  };

  const updateProgram = (id: string, updates: Partial<Program>) => {
    const now = new Date().toISOString();
    setPrograms(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates, updatedAt: now };
      syncDocToFirestore('programmes', id, updated);
      syncDocToFirestore('programs', id, updated);
      return updated;
    }));
    addToast({
      title: 'Programme Updated',
      message: 'Programme details have been saved.',
      type: 'success',
    });
  };

  const archiveProgram = (id: string) => {
    const now = new Date().toISOString();
    setPrograms(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, status: 'archived' as const, updatedAt: now };
      syncDocToFirestore('programmes', id, updated);
      syncDocToFirestore('programs', id, updated);
      return updated;
    }));
    addToast({
      title: 'Programme Archived',
      message: 'Programme status updated to ARCHIVED.',
      type: 'info',
    });
  };

  const toggleProgramStatus = (id: string) => {
    const now = new Date().toISOString();
    setPrograms(prev => prev.map(p => {
      if (p.id !== id) return p;
      const nextStatus = p.status === 'active' ? 'draft' : 'active';
      const updated = { ...p, status: nextStatus as any, updatedAt: now };
      syncDocToFirestore('programmes', id, updated);
      syncDocToFirestore('programs', id, updated);
      addToast({
        title: nextStatus === 'active' ? 'Programme Activated' : 'Programme Deactivated',
        message: `Programme is now ${(nextStatus || '').toUpperCase()}.`,
        type: nextStatus === 'active' ? 'success' : 'warning',
      });
      return updated;
    }));
  };

  const deleteProgram = (id: string) => {
    setPrograms(prev => prev.filter(p => p.id !== id));
    deleteDocFromFirestore('programmes', id);
    deleteDocFromFirestore('programs', id);
    addToast({
      title: 'Programme Removed',
      message: 'Programme has been removed from catalog.',
      type: 'info',
    });
  };

  // Cohort operations
  const addCohort = (cohortData: Omit<Cohort, 'id' | 'admittedCount' | 'enrolledCount'>): Cohort => {
    const newId = 'cohort-' + Date.now().toString(36);
    const now = new Date().toISOString();
    const targetProgramId = cohortData.programId || (cohortData as any).programmeId || '';
    const newCohort: Cohort = {
      ...cohortData,
      programId: targetProgramId,
      programmeId: targetProgramId,
      id: newId,
      admittedCount: 0,
      enrolledCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    setCohorts(prev => [newCohort, ...prev.filter(c => c.id !== newId)]);
    syncDocToFirestore('cohorts', newId, newCohort);

    addToast({
      title: 'Cohort Launched',
      message: `"${newCohort.name}" is now configured and ready.`,
      type: 'success',
    });
    return newCohort;
  };

  const updateCohort = (id: string, updates: Partial<Cohort>) => {
    const now = new Date().toISOString();
    setCohorts(prev => prev.map(c => {
      if (c.id !== id) return c;
      const targetProgramId = updates.programId || (updates as any).programmeId || c.programId || (c as any).programmeId;
      const updated = { 
        ...c, 
        ...updates, 
        programId: targetProgramId,
        programmeId: targetProgramId,
        updatedAt: now 
      };
      syncDocToFirestore('cohorts', id, updated);
      return updated;
    }));
    addToast({
      title: 'Cohort Updated',
      message: 'Cohort parameters updated successfully.',
      type: 'success',
    });
  };

  const archiveCohort = (id: string) => {
    const now = new Date().toISOString();
    setCohorts(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, status: 'archived' as const, updatedAt: now };
      syncDocToFirestore('cohorts', id, updated);
      return updated;
    }));
    addToast({
      title: 'Cohort Archived',
      message: 'Cohort status set to ARCHIVED.',
      type: 'info',
    });
  };

  const openCohortApplications = (id: string) => {
    const now = new Date().toISOString();
    setCohorts(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, status: 'applications_open' as const, updatedAt: now };
      syncDocToFirestore('cohorts', id, updated);
      return updated;
    }));
    addToast({
      title: 'Applications Opened',
      message: 'Applications are now officially OPEN for candidate submissions.',
      type: 'success',
    });
  };

  const closeCohortApplications = (id: string) => {
    const now = new Date().toISOString();
    setCohorts(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, status: 'applications_closed' as const, updatedAt: now };
      syncDocToFirestore('cohorts', id, updated);
      return updated;
    }));
    addToast({
      title: 'Applications Closed',
      message: 'Applications are now CLOSED for this cohort.',
      type: 'warning',
    });
  };

  const updateCohortStatus = (id: string, status: CohortStatus) => {
    const now = new Date().toISOString();
    setCohorts(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, status, updatedAt: now };
      syncDocToFirestore('cohorts', id, updated);
      return updated;
    }));
    addToast({
      title: 'Cohort Status Updated',
      message: `Cohort status is now ${((status as string) || '').replace('_', ' ').toUpperCase()}.`,
      type: 'info',
    });
  };

  const deleteCohort = (id: string) => {
    setCohorts(prev => prev.filter(c => c.id !== id));
    deleteDocFromFirestore('cohorts', id);
    addToast({
      title: 'Cohort Removed',
      message: 'Cohort record has been deleted.',
      type: 'info',
    });
  };

  // ==========================================
  // MODULE 4: APPLICATION FORM BUILDER METHODS
  // ==========================================

  const addForm = (formInput: Omit<ApplicationForm, 'id' | 'createdAt' | 'updatedAt' | 'version'>): ApplicationForm => {
    const now = new Date().toISOString();
    const targetProgramId = (formInput as any).programmeId || (formInput as any).programId || '';
    const newForm: ApplicationForm = {
      ...formInput,
      programmeId: targetProgramId,
      programId: targetProgramId,
      id: 'form-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      version: 1,
      status: formInput.status || 'draft',
      sections: formInput.sections || [
        {
          id: 'sec-' + Date.now() + '-1',
          formId: '',
          title: 'General Information',
          description: 'Basic applicant identifiers and demographic background.',
          displayOrder: 1,
          fields: [],
        },
      ],
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.id,
    };

    // Ensure section formId references match
    newForm.sections = newForm.sections.map(s => ({
      ...s,
      formId: newForm.id,
      fields: s.fields.map(f => ({ ...f, formId: newForm.id, sectionId: s.id })),
    }));

    setForms(prev => [newForm, ...prev.filter(f => f.id !== newForm.id)]);
    setActiveFormId(newForm.id);
    syncDocToFirestore('forms', newForm.id, newForm);

    addToast({
      title: 'Application Form Created',
      message: `Form "${newForm.title}" initialized as draft.`,
      type: 'success',
    });
    return newForm;
  };

  const updateForm = (id: string, updates: Partial<ApplicationForm>) => {
    const now = new Date().toISOString();
    const targetProgramId = (updates as any).programmeId || (updates as any).programId;
    setForms(prev => prev.map(f => {
      if (f.id !== id) return f;
      const updated = {
        ...f,
        ...updates,
        ...(targetProgramId !== undefined ? { programmeId: targetProgramId, programId: targetProgramId } : {}),
        updatedAt: now,
      };
      syncDocToFirestore('forms', id, updated);
      return updated;
    }));
  };

  const deleteForm = (id: string) => {
    setForms(prev => {
      const remaining = prev.filter(f => f.id !== id);
      if (activeFormId === id) {
        setActiveFormId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
    deleteDocFromFirestore('forms', id);
    addToast({
      title: 'Form Deleted',
      message: 'Application form has been removed.',
      type: 'info',
    });
  };

  const publishForm = (id: string): { success: boolean; errors?: string[] } => {
    const target = forms.find(f => f.id === id);
    if (!target) return { success: false, errors: ['Form not found.'] };

    const targetProgramId = target.programmeId || (target as any).programId;
    const errors: string[] = [];
    if (!target.title.trim()) errors.push('Form title cannot be empty.');
    if (!targetProgramId) errors.push('Form must be associated with a target Programme.');
    if (target.sections.length === 0) errors.push('Form must contain at least 1 section.');
    
    const totalFields = target.sections.reduce((acc, s) => acc + s.fields.length, 0);
    if (totalFields === 0) errors.push('Form must contain at least 1 input field before publishing.');

    // Check choice fields have valid options
    target.sections.forEach(s => {
      s.fields.forEach(f => {
        if (['dropdown', 'radio', 'checkbox', 'multiple_choice'].includes(f.fieldType)) {
          if (!f.options || f.options.length < 2) {
            errors.push(`Field "${f.label}" in section "${s.title}" requires at least 2 choices/options.`);
          }
        }
      });
    });

    if (errors.length > 0) {
      addToast({
        title: 'Cannot Publish Form',
        message: errors[0],
        type: 'error',
      });
      return { success: false, errors };
    }

    const now = new Date().toISOString();
    setForms(prev => prev.map(f => {
      if (f.id === id) {
        const updated = {
          ...f,
          programmeId: targetProgramId,
          programId: targetProgramId,
          status: 'published' as const,
          publishedAt: now,
          updatedAt: now,
        };
        syncDocToFirestore('forms', id, updated);
        return updated;
      }
      return f;
    }));

    addToast({
      title: 'Form Published! 🚀',
      message: `"${target.title}" is now LIVE for candidate applications.`,
      type: 'success',
    });

    return { success: true };
  };

  const unpublishForm = (id: string) => {
    const now = new Date().toISOString();
    setForms(prev => prev.map(f => {
      if (f.id !== id) return f;
      const updated = {
        ...f,
        status: 'draft' as const,
        updatedAt: now,
      };
      syncDocToFirestore('forms', id, updated);
      return updated;
    }));
    addToast({
      title: 'Form Unpublished',
      message: 'Form status returned to Draft (hidden from applicants).',
      type: 'info',
    });
  };

  const createFormVersion = (id: string): ApplicationForm => {
    const original = forms.find(f => f.id === id);
    if (!original) throw new Error('Original form not found.');

    const now = new Date().toISOString();
    const newVersionNumber = original.version + 1;
    const newFormId = 'form-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);

    const clonedSections: ApplicationFormSection[] = original.sections.map(s => {
      const newSecId = 'sec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
      return {
        ...s,
        id: newSecId,
        formId: newFormId,
        fields: s.fields.map(f => ({
          ...f,
          id: 'fld-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          formId: newFormId,
          sectionId: newSecId,
        })),
      };
    });

    const newVersion: ApplicationForm = {
      ...original,
      id: newFormId,
      title: `${original.title.replace(/\s*\(v\d+\)$/i, '')} (v${newVersionNumber})`,
      version: newVersionNumber,
      status: 'draft',
      publishedAt: undefined,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.id,
      sections: clonedSections,
    };

    setForms(prev => [newVersion, ...prev]);
    setActiveFormId(newVersion.id);
    syncDocToFirestore('forms', newVersion.id, newVersion);

    addToast({
      title: `Form Version ${newVersionNumber} Created`,
      message: `Cloned from v${original.version}. You can make edits safely before publishing.`,
      type: 'success',
    });

    return newVersion;
  };

  const addSectionToForm = (formId: string, sectionInput: Omit<ApplicationFormSection, 'id' | 'formId' | 'fields'>): ApplicationFormSection => {
    const newSecId = 'sec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const newSection: ApplicationFormSection = {
      ...sectionInput,
      id: newSecId,
      formId,
      fields: [],
    };

    setForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      const updated = {
        ...f,
        updatedAt: new Date().toISOString(),
        sections: [...f.sections, newSection],
      };
      syncDocToFirestore('forms', formId, updated);
      return updated;
    }));

    addToast({
      title: 'Section Added',
      message: `Section "${newSection.title}" created.`,
      type: 'info',
    });

    return newSection;
  };

  const updateSectionInForm = (formId: string, sectionId: string, updates: Partial<ApplicationFormSection>) => {
    setForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      const updated = {
        ...f,
        updatedAt: new Date().toISOString(),
        sections: f.sections.map(s => s.id === sectionId ? { ...s, ...updates } : s),
      };
      syncDocToFirestore('forms', formId, updated);
      return updated;
    }));
  };

  const deleteSectionFromForm = (formId: string, sectionId: string) => {
    setForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      const updated = {
        ...f,
        updatedAt: new Date().toISOString(),
        sections: f.sections.filter(s => s.id !== sectionId),
      };
      syncDocToFirestore('forms', formId, updated);
      return updated;
    }));
    addToast({
      title: 'Section Deleted',
      message: 'Section and its constituent fields removed.',
      type: 'info',
    });
  };

  const reorderSectionsInForm = (formId: string, sourceIndexOrIds: number | string[], destIndex?: number) => {
    setForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      
      let updatedSections: ApplicationFormSection[] = [];
      if (Array.isArray(sourceIndexOrIds)) {
        // Reorder by list of IDs
        const idMap = new Map<string, ApplicationFormSection>(f.sections.map(s => [s.id, s]));
        const orderedFromIds: ApplicationFormSection[] = [];
        sourceIndexOrIds.forEach(id => {
          const s = idMap.get(id);
          if (s) {
            orderedFromIds.push(s);
            idMap.delete(id);
          }
        });
        // append any remaining
        idMap.forEach(s => orderedFromIds.push(s));
        updatedSections = orderedFromIds.map((sec, idx) => ({ ...sec, displayOrder: idx + 1 }));
      } else if (typeof sourceIndexOrIds === 'number' && typeof destIndex === 'number') {
        const reordered: ApplicationFormSection[] = [...f.sections];
        const [moved] = reordered.splice(sourceIndexOrIds, 1);
        if (!moved) return f;
        reordered.splice(destIndex, 0, moved);
        updatedSections = reordered.map((sec, idx) => ({ ...sec, displayOrder: idx + 1 }));
      } else {
        return f;
      }

      const updatedForm = {
        ...f,
        updatedAt: new Date().toISOString(),
        sections: updatedSections,
      };
      syncDocToFirestore('forms', formId, updatedForm);
      return updatedForm;
    }));
  };

  const addFieldToSection = (formId: string, sectionId: string, fieldInput: Omit<ApplicationFormField, 'id' | 'formId' | 'sectionId'>): ApplicationFormField => {
    const newFieldId = 'fld-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const newField: ApplicationFormField = {
      ...fieldInput,
      id: newFieldId,
      formId,
      sectionId,
    };

    setForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      const updated = {
        ...f,
        updatedAt: new Date().toISOString(),
        sections: f.sections.map(s => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            fields: [...s.fields, newField],
          };
        }),
      };
      syncDocToFirestore('forms', formId, updated);
      return updated;
    }));

    addToast({
      title: 'Field Added',
      message: `"${newField.label}" added to form section.`,
      type: 'success',
    });

    return newField;
  };

  const updateFieldInSection = (formId: string, sectionId: string, fieldId: string, updates: Partial<ApplicationFormField>) => {
    setForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      const updated = {
        ...f,
        updatedAt: new Date().toISOString(),
        sections: f.sections.map(s => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            fields: s.fields.map(fld => fld.id === fieldId ? { ...fld, ...updates } : fld),
          };
        }),
      };
      syncDocToFirestore('forms', formId, updated);
      return updated;
    }));
  };

  const deleteFieldFromSection = (formId: string, sectionId: string, fieldId: string) => {
    setForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      const updated = {
        ...f,
        updatedAt: new Date().toISOString(),
        sections: f.sections.map(s => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            fields: s.fields.filter(fld => fld.id !== fieldId),
          };
        }),
      };
      syncDocToFirestore('forms', formId, updated);
      return updated;
    }));
    addToast({
      title: 'Field Removed',
      message: 'Field removed from section.',
      type: 'info',
    });
  };

  const reorderFieldsInSection = (formId: string, sectionId: string, sourceIndexOrIds: number | string[], destIndex?: number) => {
    setForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      
      let updatedSections = f.sections.map(s => {
        if (s.id !== sectionId) return s;
        
        let updated: ApplicationFormField[] = [];
        if (Array.isArray(sourceIndexOrIds)) {
          // Reorder by list of field IDs
          const idMap = new Map<string, ApplicationFormField>(s.fields.map(fld => [fld.id, fld]));
          const orderedFromIds: ApplicationFormField[] = [];
          sourceIndexOrIds.forEach(id => {
            const fld = idMap.get(id);
            if (fld) {
              orderedFromIds.push(fld);
              idMap.delete(id);
            }
          });
          idMap.forEach(fld => orderedFromIds.push(fld));
          updated = orderedFromIds.map((fld, idx) => ({ ...fld, displayOrder: idx + 1 }));
        } else if (typeof sourceIndexOrIds === 'number' && typeof destIndex === 'number') {
          const reordered: ApplicationFormField[] = [...s.fields];
          const [moved] = reordered.splice(sourceIndexOrIds, 1);
          if (!moved) return s;
          reordered.splice(destIndex, 0, moved);
          updated = reordered.map((fld, idx) => ({ ...fld, displayOrder: idx + 1 }));
        } else {
          return s;
        }

        return {
          ...s,
          fields: updated,
        };
      });

      const updatedForm = {
        ...f,
        updatedAt: new Date().toISOString(),
        sections: updatedSections,
      };
      syncDocToFirestore('forms', formId, updatedForm);
      return updatedForm;
    }));
  };

  const bulkImportFieldsToForm = (
    formId: string, 
    csvData: string, 
    mode: 'replace' | 'append' = 'append'
  ): { success: boolean; importedCount: number; errors: BulkUploadValidationError[] } => {
    const parseResult = validateAndParseFormCsv(csvData, formId);

    if (parseResult.errors.length > 0) {
      addToast({
        title: 'Validation Failed',
        message: `Found ${parseResult.errors.length} validation errors. Upload halted.`,
        type: 'error',
      });
      return {
        success: false,
        importedCount: 0,
        errors: parseResult.errors,
      };
    }

    // Convert parsed sections and fields into form structure
    setForms(prev => prev.map(f => {
      if (f.id !== formId) return f;

      const existingSections = mode === 'replace' ? [] : [...f.sections];
      let runningTotal = 0;

      parseResult.sectionsMap.forEach((fields, sectionTitle) => {
        let targetSection = existingSections.find(s => s.title.toLowerCase().trim() === sectionTitle.toLowerCase().trim());
        if (!targetSection) {
          targetSection = {
            id: 'sec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            formId: f.id,
            title: sectionTitle,
            description: `Imported section for ${sectionTitle}`,
            displayOrder: existingSections.length + 1,
            fields: [],
          };
          existingSections.push(targetSection);
        }

        const formattedFields = fields.map((fld, idx) => ({
          ...fld,
          sectionId: targetSection!.id,
          displayOrder: targetSection!.fields.length + idx + 1,
        }));

        targetSection.fields = [...targetSection.fields, ...formattedFields];
        runningTotal += formattedFields.length;
      });

      const updatedForm = {
        ...f,
        updatedAt: new Date().toISOString(),
        sections: existingSections,
      };
      syncDocToFirestore('forms', formId, updatedForm);
      return updatedForm;
    }));

    addToast({
      title: 'Bulk Import Successful 🎉',
      message: `Successfully imported ${parseResult.validRows.length} questions into form.`,
      type: 'success',
    });

    return {
      success: true,
      importedCount: parseResult.validRows.length,
      errors: [],
    };
  };

  const getPublishedFormForProgramme = (programmeId?: string, cohortId?: string): ApplicationForm | undefined => {
    // 1. If cohortId provided, find the cohort to resolve attached form or programId
    let targetProgId = programmeId;
    let cohortLinkedFormId: string | undefined;
    let targetProgName: string | undefined;

    if (cohortId) {
      const coh = cohorts.find(c => c.id === cohortId);
      if (coh) {
        targetProgId = targetProgId || coh.programId || (coh as any).programmeId;
        cohortLinkedFormId = coh.formId || coh.applicationFormId;
      }
    }

    if (targetProgId) {
      const prog = programs.find(p => p.id === targetProgId);
      if (prog) {
        targetProgName = prog.name;
      }
    }

    // 2. Direct cohort linked form (e.g. configured in Cohort Settings)
    if (cohortLinkedFormId) {
      const directForm = forms.find(f => f.id === cohortLinkedFormId && f.status === 'published');
      if (directForm && directForm.sections.length > 0) return directForm;
    }

    // 3. Cohort specific published form (form explicitly tagged with cohortId)
    if (cohortId) {
      const cohortForm = forms.find(f => f.status === 'published' && f.cohortId === cohortId);
      if (cohortForm && cohortForm.sections.length > 0) return cohortForm;
    }

    // 4. Programme specific published form
    if (targetProgId) {
      const progGenericForm = forms.find(f => 
        f.status === 'published' && 
        (f.programmeId === targetProgId || f.programId === targetProgId) && 
        (!f.cohortId || (cohortId && f.cohortId === cohortId))
      );
      if (progGenericForm && progGenericForm.sections.length > 0) return progGenericForm;

      const anyProgPublishedForm = forms.find(f => 
        f.status === 'published' && 
        (f.programmeId === targetProgId || f.programId === targetProgId)
      );
      if (anyProgPublishedForm && anyProgPublishedForm.sections.length > 0) return anyProgPublishedForm;
    }

    // 5. Fallback: Return any available published form with sections
    const anyPublished = forms.find(f => f.status === 'published' && f.sections.length > 0);
    if (anyPublished) return anyPublished;

    // 6. Guaranteed Standard Admissions Questionnaire Template for this programme
    return createDefaultProgrammeApplicationForm(targetProgId || 'default', targetProgName);
  };

  // Application operations
  const saveDraftApplication = (appData: Partial<Application>): Application => {
    const existingIndex = applications.findIndex(
      a => (appData.id && a.id === appData.id) || 
           (a.applicantId === currentUser.id && a.status === 'draft' && a.programId === appData.programId && a.cohortId === appData.cohortId)
    );

    const now = new Date().toISOString().split('T')[0];
    const timestampStr = new Date().toLocaleString();
    const draftId = existingIndex >= 0 ? applications[existingIndex].id : (appData.id || 'draft-' + Date.now().toString(36));

    // Calculate progress percentage
    let completedCount = 0;
    const totalChecks = 6;
    if (appData.fullName && appData.email && appData.phone) completedCount++;
    if (appData.educationLevel && appData.fieldOfStudy) completedCount++;
    if (appData.motivationStatement && appData.motivationStatement.length > 20) completedCount++;
    if (appData.goalsStatement && appData.goalsStatement.length > 20) completedCount++;
    if (appData.customAnswers && Object.keys(appData.customAnswers).length > 0) completedCount++;
    if (appData.linkedinUrl || appData.githubUrl || appData.cvUrl || (appData.uploadedFiles && Object.keys(appData.uploadedFiles).length > 0)) completedCount++;

    const calculatedProgress = Math.round((completedCount / totalChecks) * 100);

    const draftApp: Application = {
      ...(existingIndex >= 0 ? applications[existingIndex] : {}),
      ...appData,
      id: draftId,
      programId: appData.programId || (existingIndex >= 0 ? applications[existingIndex].programId : 'prog-genai'),
      cohortId: appData.cohortId || (existingIndex >= 0 ? applications[existingIndex].cohortId : 'cohort-genai-2'),
      applicantId: currentUser.id,
      fullName: appData.fullName || currentUser.name,
      email: appData.email || currentUser.email,
      phone: appData.phone || currentUser.phone || '',
      country: appData.country || 'Nigeria',
      city: appData.city || 'Lagos',
      gender: appData.gender || 'Not Specified',
      ageRange: appData.ageRange || '18-24',
      educationLevel: appData.educationLevel || '',
      fieldOfStudy: appData.fieldOfStudy || '',
      employmentStatus: appData.employmentStatus || '',
      yearsExperience: appData.yearsExperience || '',
      programmingBackground: appData.programmingBackground || '',
      linkedinUrl: appData.linkedinUrl,
      githubUrl: appData.githubUrl,
      portfolioUrl: appData.portfolioUrl,
      cvUrl: appData.cvUrl,
      motivationStatement: appData.motivationStatement || '',
      goalsStatement: appData.goalsStatement || '',
      customAnswers: appData.customAnswers || {},
      uploadedFiles: appData.uploadedFiles || {},
      status: 'draft',
      appliedDate: existingIndex >= 0 ? applications[existingIndex].appliedDate : now,
      updatedDate: now,
      draftSavedAt: new Date().toISOString(),
      lastSavedStep: appData.lastSavedStep || 1,
      progressPercentage: Math.max(20, calculatedProgress),
      timeline: existingIndex >= 0 && applications[existingIndex].timeline ? applications[existingIndex].timeline : [
        {
          id: 't-draft-' + Date.now(),
          title: 'Application Draft Saved',
          description: 'Candidate started and saved application progress.',
          timestamp: timestampStr,
          actor: currentUser.name,
          type: 'note',
        }
      ],
      starred: false,
      internalTags: ['Draft in Progress'],
    };

    if (existingIndex >= 0) {
      setApplications(prev => {
        const next = [...prev];
        next[existingIndex] = draftApp;
        return next;
      });

      // Dispatch automated APPLICATION_UPDATED notification
      const prog = programs.find(p => p.id === draftApp.programId);
      const coh = cohorts.find(c => c.id === draftApp.cohortId);
      triggerNotification('APPLICATION_UPDATED', {
        applicant: {
          id: currentUser.id,
          fullName: draftApp.fullName,
          email: draftApp.email,
        },
        application: draftApp,
        cohort: coh,
        programme: prog,
      });
    } else {
      setApplications(prev => [draftApp, ...prev.filter(a => a.id !== draftApp.id)]);
    }

    syncDocToFirestore('applications', draftApp.id, draftApp);

    addToast({
      title: 'Draft Saved Successfully 💾',
      message: `Progress recorded (${draftApp.progressPercentage}%). You can safely return anytime.`,
      type: 'success',
    });

    return draftApp;
  };

  const deleteDraftApplication = (appId: string) => {
    setApplications(prev => prev.filter(a => a.id !== appId));
    deleteDocFromFirestore('applications', appId);
    addToast({
      title: 'Draft Discarded',
      message: 'Application draft has been removed.',
      type: 'info',
    });
  };

  const submitApplication = (appData: Partial<Application>): Application => {
    const targetCohortId = appData.cohortId || (appData as any).selectedCohId || 'cohort-genai-2';
    const targetProgramId = appData.programId || (appData as any).selectedProgId || 'prog-genai';

    // Duplicate Check: Enforce strictly ONE submitted application per cohort per applicant
    const existingSubmitted = applications.find(
      a => (a.applicantId === currentUser.id || (a.email && currentUser.email && a.email.toLowerCase() === currentUser.email.toLowerCase())) &&
           a.cohortId === targetCohortId &&
           a.status !== 'draft' &&
           a.id !== appData.id
    );

    if (existingSubmitted) {
      addToast({
        title: 'Application Already Submitted',
        message: `You have already submitted an application for this cohort (${existingSubmitted.id}). Only one application is permitted per cohort.`,
        type: 'error',
      });
      return existingSubmitted;
    }

    const existingDraftIndex = applications.findIndex(
      a => (appData.id && a.id === appData.id) ||
           ((a.applicantId === currentUser.id || (a.email && currentUser.email && a.email.toLowerCase() === currentUser.email.toLowerCase())) && 
            a.status === 'draft' && 
            a.cohortId === targetCohortId)
    );

    const oldDraftDocId = existingDraftIndex >= 0 
      ? applications[existingDraftIndex].id 
      : (appData.id && appData.id.startsWith('draft-') ? appData.id : null);

    const submissionId = existingDraftIndex >= 0 && !applications[existingDraftIndex].id.startsWith('draft-')
      ? applications[existingDraftIndex].id 
      : ('app-' + Math.floor(1000 + Math.random() * 9000));

    const now = new Date().toISOString().split('T')[0];
    const timestampStr = new Date().toLocaleString();

    const newApp: Application = {
      ...(existingDraftIndex >= 0 ? applications[existingDraftIndex] : {}),
      ...appData,
      id: submissionId,
      programId: targetProgramId,
      cohortId: targetCohortId,
      applicantId: currentUser.id,
      fullName: appData.fullName || currentUser.name,
      email: appData.email || currentUser.email,
      phone: appData.phone || currentUser.phone || '',
      country: appData.country || 'Nigeria',
      city: appData.city || '',
      gender: appData.gender || 'Not Specified',
      ageRange: appData.ageRange || '18-24',
      educationLevel: appData.educationLevel || '',
      fieldOfStudy: appData.fieldOfStudy || '',
      employmentStatus: appData.employmentStatus || '',
      yearsExperience: appData.yearsExperience || '',
      programmingBackground: appData.programmingBackground || '',
      linkedinUrl: appData.linkedinUrl,
      githubUrl: appData.githubUrl,
      portfolioUrl: appData.portfolioUrl,
      cvUrl: appData.cvUrl,
      motivationStatement: appData.motivationStatement || '',
      goalsStatement: appData.goalsStatement || '',
      customAnswers: appData.customAnswers || {},
      uploadedFiles: appData.uploadedFiles || {},
      status: 'submitted',
      appliedDate: now,
      submittedAt: new Date().toISOString(),
      updatedDate: now,
      progressPercentage: 100,
      timeline: [
        ...(existingDraftIndex >= 0 && applications[existingDraftIndex].timeline ? applications[existingDraftIndex].timeline : []),
        {
          id: 't-' + Date.now(),
          title: 'Application Dossier Submitted',
          description: 'Candidate verified and locked all application requirements.',
          timestamp: timestampStr,
          actor: currentUser.name,
          type: 'status_change',
        },
      ],
      starred: false,
      internalTags: ['New Submission'],
    };

    // Clean up previous draft document if ID changed
    if (oldDraftDocId && oldDraftDocId !== submissionId) {
      deleteDocFromFirestore('applications', oldDraftDocId);
    }

    setApplications(prev => [newApp, ...prev.filter(a => a.id !== newApp.id && a.id !== oldDraftDocId)]);

    syncDocToFirestore('applications', newApp.id, newApp);

    const prog = programs.find(p => p.id === newApp.programId);
    const coh = cohorts.find(c => c.id === newApp.cohortId);
    const targetAsm = assessments.find(a => a.cohortId === newApp.cohortId);

    // Automated Trigger: APPLICATION_SUBMITTED
    triggerNotification('APPLICATION_SUBMITTED', {
      applicant: {
        id: currentUser.id,
        fullName: newApp.fullName,
        email: newApp.email,
        phone: newApp.phone,
      },
      application: newApp,
      cohort: coh,
      programme: prog,
      assessment: targetAsm,
      deadline: coh?.applicationDeadline || 'September 15, 2026',
    });

    // 1. Send confirmation system message to applicant
    sendMessage({
      senderId: 'system',
      senderName: 'NextGen Admissions Desk',
      senderRole: 'program_manager',
      recipientId: currentUser.id,
      recipientName: currentUser.name,
      programId: newApp.programId,
      cohortId: newApp.cohortId,
      type: 'direct',
      subject: `Application Confirmed: Reference #${newApp.id}`,
      content: `Hello ${newApp.fullName}, your application for NextGen Academy has been successfully submitted and registered under Reference ID #${newApp.id}. Our faculty review committee is screening dossiers on a rolling basis.`,
    });

    // 2. Send notification message to Program Manager
    sendMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: 'applicant',
      recipientId: 'admin-user-1',
      recipientName: 'Dr. Sarah Chen',
      programId: newApp.programId,
      cohortId: newApp.cohortId,
      type: 'direct',
      subject: `New Application Submitted: ${newApp.fullName}`,
      content: `Candidate ${newApp.fullName} (${newApp.email}) has officially submitted an application for ${prog?.name || 'Programme'} (${coh?.name || 'Cohort'}). Dossier Ref #${newApp.id}.`,
    });

    // Confetti celebration
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (_) {}

    addToast({
      title: 'Application Submitted Successfully! 🚀',
      message: 'Your dossier has been officially submitted and locked for review.',
      type: 'success',
    });

    return newApp;
  };

  const updateApplicationStatus = (appId: string, status: ApplicationStatus, note?: string) => {
    const now = new Date().toLocaleString();
    
    setApplications(prev => prev.map(app => {
      if (app.id !== appId) return app;

      const newTimeline = [...app.timeline, {
        id: 't-' + Date.now(),
        title: `Status Changed to ${((status as string) || '').replace('_', ' ').toUpperCase()}`,
        description: note || `Status updated by ${currentUser.name}.`,
        timestamp: now,
        actor: currentUser.name,
        type: 'status_change' as const,
      }];

      // If admitted, set offer date
      const offerUpdates = status === 'admitted' ? {
        offerLetterSentDate: new Date().toISOString().split('T')[0],
        scholarshipAwarded: app.scholarshipAwarded ?? true,
        scholarshipPercentage: app.scholarshipPercentage ?? 100,
      } : {};

      const updatedApp = {
        ...app,
        status,
        updatedDate: new Date().toISOString().split('T')[0],
        timeline: newTimeline,
        ...offerUpdates,
      };
      syncDocToFirestore('applications', appId, updatedApp);
      return updatedApp;
    }));

    // Update cohort counts if admitted or enrolled
    const targetApp = applications.find(a => a.id === appId);
    if (targetApp && (status === 'admitted' || status === 'enrolled')) {
      setCohorts(prev => prev.map(c => {
        if (c.id !== targetApp.cohortId) return c;
        return {
          ...c,
          admittedCount: status === 'admitted' ? c.admittedCount + 1 : c.admittedCount,
          enrolledCount: status === 'enrolled' ? c.enrolledCount + 1 : c.enrolledCount,
        };
      }));
    }

    addToast({
      title: 'Status Updated',
      message: `Applicant #${appId} moved to ${((status as string) || '').replace('_', ' ').toUpperCase()}.`,
      type: 'info',
    });
  };

  const updateRubricEvaluation = (appId: string, rubric: RubricEvaluation) => {
    const now = new Date().toLocaleString();
    setApplications(prev => prev.map(app => {
      if (app.id !== appId) return app;

      const updatedApp = {
        ...app,
        rubricEvaluation: rubric,
        updatedDate: new Date().toISOString().split('T')[0],
        timeline: [
          ...app.timeline,
          {
            id: 't-' + Date.now(),
            title: 'Faculty Rubric Evaluation Logged',
            description: `Evaluator: ${rubric.evaluatedBy} (Recommendation: ${(rubric.overallRecommendation || '').toUpperCase()})`,
            timestamp: now,
            actor: rubric.evaluatedBy,
            type: 'note' as const,
          },
        ],
      };
      syncDocToFirestore('applications', appId, updatedApp);
      return updatedApp;
    }));

    addToast({
      title: 'Rubric Saved',
      message: 'Scoring scorecard has been attached to applicant dossier.',
      type: 'success',
    });
  };

  const addInternalNote = (appId: string, content: string, category: InternalNote['category'] = 'general') => {
    if (!content.trim()) return;
    const now = new Date().toLocaleString();
    const newNote: InternalNote = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role === 'program_manager' ? 'Admissions Committee' : 'Faculty Reviewer',
      content: content.trim(),
      createdAt: now,
      category,
    };

    setApplications(prev => prev.map(app => {
      if (app.id !== appId) return app;
      const existingNotes = app.internalNotes || [];
      const updatedApp = {
        ...app,
        internalNotes: [newNote, ...existingNotes],
        updatedDate: new Date().toISOString().split('T')[0],
        timeline: [
          ...app.timeline,
          {
            id: 't-note-' + Date.now(),
            title: `Internal Note Added (${category ? category.toUpperCase() : 'GENERAL'})`,
            description: `"${content.length > 60 ? content.slice(0, 57) + '...' : content}"`,
            timestamp: now,
            actor: currentUser.name,
            type: 'note' as const,
          },
        ],
      };
      syncDocToFirestore('applications', appId, updatedApp);
      return updatedApp;
    }));

    addToast({
      title: 'Internal Note Recorded',
      message: 'Note attached to candidate dossier and logged in audit history.',
      type: 'success',
    });
  };

  const updateDocumentVerification = (
    appId: string,
    fieldId: string,
    status: 'verified' | 'pending' | 'rejected',
    note?: string
  ) => {
    const now = new Date().toLocaleString();
    setApplications(prev => prev.map(app => {
      if (app.id !== appId) return app;
      const files = app.uploadedFiles || {};
      const fileRecord = files[fieldId];
      if (!fileRecord) return app;

      const updatedFile: UploadedFileRecord = {
        ...fileRecord,
        verificationStatus: status,
        verificationNote: note || '',
        verifiedBy: currentUser.name,
        verifiedAt: now,
      };

      const updatedApp = {
        ...app,
        uploadedFiles: {
          ...files,
          [fieldId]: updatedFile,
        },
        updatedDate: new Date().toISOString().split('T')[0],
        timeline: [
          ...app.timeline,
          {
            id: 't-doc-' + Date.now(),
            title: `Document ${(status || '').toUpperCase()}: ${fileRecord.fileName}`,
            description: note ? `Reviewer note: ${note}` : `Verification marked as ${status} by ${currentUser.name}.`,
            timestamp: now,
            actor: currentUser.name,
            type: 'note' as const,
          },
        ],
      };
      syncDocToFirestore('applications', appId, updatedApp);
      return updatedApp;
    }));

    addToast({
      title: `Document ${status === 'verified' ? 'Verified' : status === 'rejected' ? 'Rejected' : 'Marked Pending'}`,
      message: `Document status updated and logged in timeline.`,
      type: status === 'verified' ? 'success' : status === 'rejected' ? 'error' : 'info',
    });
  };

  const createTestApplication = (customData?: Partial<Application>): Application => {
    const randomId = 'app-test-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString().split('T')[0];
    const timestampStr = new Date().toLocaleString();

    const firstProgram = programs[0] || { id: 'prog-genai', name: 'AI Engineering' };
    const matchingCohort = cohorts.find(c => c.programId === (customData?.programId || firstProgram.id)) || cohorts[0] || { id: 'cohort-genai-2', name: 'Cohort 2' };

    const firstNames = ['Amara', 'Emeka', 'Chinedu', 'Kofi', 'Nia', 'Zuberi', 'Yara', 'Farouk', 'Dalia', 'Ayotunde'];
    const lastNames = ['Okonkwo', 'Adeyemi', 'Appiah', 'Bello', 'Eze', 'Traore', 'Kamau', 'Diallo', 'El-Sayed', 'Nwosu'];
    const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullTestName = `${randomFirst} ${randomLast}`;
    const testEmail = `${randomFirst.toLowerCase()}.${randomLast.toLowerCase()}@testcandidate.org`;

    const statusChoice: ApplicationStatus = customData?.status || 'submitted';

    const testApp: Application = {
      id: randomId,
      programId: customData?.programId || firstProgram.id,
      cohortId: customData?.cohortId || matchingCohort.id,
      applicantId: 'test-user-' + Date.now(),
      fullName: customData?.fullName || fullTestName,
      email: customData?.email || testEmail,
      phone: customData?.phone || '+234 812 000 ' + Math.floor(1000 + Math.random() * 9000),
      country: customData?.country || 'Nigeria',
      city: customData?.city || 'Lagos',
      gender: 'Female',
      ageRange: '25-34',
      educationLevel: 'Bachelor Degree',
      fieldOfStudy: 'Software Systems',
      employmentStatus: 'Employed full-time',
      yearsExperience: '2 years',
      programmingBackground: 'Intermediate (1-2 years)',
      linkedinUrl: 'https://linkedin.com/in/test-candidate',
      githubUrl: 'https://github.com/test-candidate',
      portfolioUrl: 'https://test-candidate.dev',
      motivationStatement: 'I am excited to participate in NextGen Academy to enhance my technical foundation in artificial intelligence and scalable architectures.',
      goalsStatement: 'Within 6 months, build production-grade agent workflows and collaborative software products.',
      customAnswers: {
        'Specialization Track': 'Core Systems & AI Orchestration',
        'Weekly Commitment': '15-20 hours / week',
      },
      uploadedFiles: {
        'cv_resume': {
          id: 'f-cv-' + Date.now(),
          fieldId: 'cv_resume',
          fileName: `${randomFirst}_${randomLast}_Curriculum_Vitae.pdf`,
          fileSizeMb: 1.8,
          fileType: 'application/pdf',
          uploadedAt: now,
          status: 'completed',
          fileUrl: 'https://nextgenacademy.edu/docs/sample_cv.pdf',
          verificationStatus: 'verified',
        },
        'id_document': {
          id: 'f-id-' + Date.now(),
          fieldId: 'id_document',
          fileName: `National_ID_${randomLast}.png`,
          fileSizeMb: 0.9,
          fileType: 'image/png',
          uploadedAt: now,
          status: 'completed',
          verificationStatus: 'pending',
        }
      },
      status: statusChoice,
      appliedDate: now,
      updatedDate: now,
      submittedAt: statusChoice !== 'draft' ? new Date().toISOString() : undefined,
      progressPercentage: statusChoice === 'draft' ? 65 : 100,
      assessmentScore: statusChoice === 'assessment_completed' || statusChoice === 'admitted' || statusChoice === 'accepted' ? 88 : undefined,
      scholarshipAwarded: statusChoice === 'admitted' || statusChoice === 'accepted',
      scholarshipPercentage: statusChoice === 'admitted' || statusChoice === 'accepted' ? 100 : undefined,
      internalNotes: [
        {
          id: 'note-init-' + Date.now(),
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorRole: 'Admissions Desk',
          content: `Test candidate initialized in ${(statusChoice || '').toUpperCase()} state for verification and testing.`,
          createdAt: timestampStr,
          category: 'general',
        }
      ],
      timeline: [
        {
          id: 't-test-1',
          title: statusChoice === 'draft' ? 'Draft Initialized' : 'Application Dossier Submitted',
          description: `Test application initialized with status ${(statusChoice || '').toUpperCase()}.`,
          timestamp: timestampStr,
          actor: currentUser.name,
          type: 'status_change',
        },
      ],
      starred: false,
      internalTags: ['Test Application', (statusChoice || '').replace('_', ' ')],
      ...customData,
    };

    setApplications(prev => [testApp, ...prev]);

    addToast({
      title: 'Test Application Created 🎯',
      message: `Created candidate "${testApp.fullName}" with status ${(testApp.status || '').toUpperCase()}.`,
      type: 'success',
    });

    return testApp;
  };

  const toggleStarApplication = (appId: string) => {
    setApplications(prev => prev.map(app => {
      if (app.id !== appId) return app;
      return { ...app, starred: !app.starred };
    }));
  };

  const bulkUpdateStatus = (appIds: string[], status: ApplicationStatus) => {
    appIds.forEach(id => updateApplicationStatus(id, status, `Batch action by ${currentUser.name}`));
    addToast({
      title: 'Batch Action Complete',
      message: `${appIds.length} candidate dossiers updated to ${status}.`,
      type: 'success',
    });
  };

  // Assessment operations
  const createAssessment = (initialData?: Partial<Assessment>): Assessment => {
    const newId = 'assess-' + Date.now().toString(36);
    const newAssessment: Assessment = {
      id: newId,
      programId: initialData?.programId || programs[0]?.id || 'prog-genai',
      cohortId: initialData?.cohortId,
      title: initialData?.title || 'New Candidate Screening Evaluation',
      description: initialData?.description || 'Applicant technical and aptitude screening test.',
      durationMinutes: initialData?.durationMinutes || 30,
      timeLimitMinutes: initialData?.durationMinutes || 30,
      openDate: initialData?.openDate || new Date().toISOString().split('T')[0],
      openTime: initialData?.openTime || '09:00',
      closeDate: initialData?.closeDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      closeTime: initialData?.closeTime || '23:59',
      passingScore: initialData?.passingScore || 70,
      maxAttempts: initialData?.maxAttempts || 1,
      status: initialData?.status || 'draft',
      instructions: initialData?.instructions || [
        'Complete all questions within the allocated duration limit.',
        'Review your answers before final submission.',
        'Ensure you have a reliable internet connection.'
      ],
      questions: initialData?.questions || [],
      resources: initialData?.resources || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAssessments(prev => [newAssessment, ...prev.filter(a => a.id !== newId)]);
    syncDocToFirestore('assessments', newId, newAssessment);
    addToast({
      title: 'Assessment Created ✨',
      message: `Created "${newAssessment.title}" in draft status.`,
      type: 'success',
    });

    return newAssessment;
  };

  const saveAssessment = (assessment: Assessment) => {
    const updatedWithTime: Assessment = {
      ...assessment,
      timeLimitMinutes: assessment.durationMinutes || assessment.timeLimitMinutes || 30,
      updatedAt: new Date().toISOString(),
    };

    setAssessments(prev => {
      const exists = prev.some(a => a.id === updatedWithTime.id);
      if (exists) {
        return prev.map(a => a.id === updatedWithTime.id ? updatedWithTime : a);
      }
      return [updatedWithTime, ...prev];
    });
    syncDocToFirestore('assessments', updatedWithTime.id, updatedWithTime);

    addToast({
      title: 'Assessment Saved',
      message: `"${assessment.title}" updated successfully.`,
      type: 'success',
    });
  };

  const deleteAssessment = (assessmentId: string) => {
    const target = assessments.find(a => a.id === assessmentId);
    setAssessments(prev => prev.filter(a => a.id !== assessmentId));
    deleteDocFromFirestore('assessments', assessmentId);
    addToast({
      title: 'Assessment Deleted',
      message: target ? `"${target.title}" was removed.` : 'Assessment removed.',
      type: 'info',
    });
  };

  const duplicateAssessment = (assessmentId: string): Assessment => {
    const target = assessments.find(a => a.id === assessmentId);
    if (!target) {
      return createAssessment();
    }

    const clonedId = 'assess-copy-' + Date.now().toString(36);
    const cloned: Assessment = {
      ...target,
      id: clonedId,
      title: `${target.title} (Clone)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: target.questions.map((q, idx) => ({
        ...q,
        id: `Q${idx + 1}_copy_${Date.now().toString(36).slice(-3)}`,
      })),
      resources: target.resources ? target.resources.map(r => ({
        ...r,
        id: 'res-copy-' + Date.now().toString(36),
      })) : [],
    };

    setAssessments(prev => [cloned, ...prev]);
    addToast({
      title: 'Assessment Duplicated 📋',
      message: `Cloned "${target.title}" as draft.`,
      type: 'success',
    });

    return cloned;
  };

  const updateAssessmentStatus = (assessmentId: string, status: AssessmentStatus) => {
    const targetAssessment = assessments.find(a => a.id === assessmentId);

    setAssessments(prev => prev.map(a => {
      if (a.id !== assessmentId) return a;
      return {
        ...a,
        status,
        publishedAt: (status === 'published' || status === 'open') ? (a.publishedAt || new Date().toISOString()) : a.publishedAt,
        updatedAt: new Date().toISOString(),
      };
    }));

    // If assessment is opened or published, trigger automated ASSESSMENT_OPENED for applicants in the cohort
    if ((status === 'open' || status === 'published') && targetAssessment) {
      const cohortApplicants = applications.filter(a => a.cohortId === targetAssessment.cohortId && a.status !== 'draft');
      const coh = cohorts.find(c => c.id === targetAssessment.cohortId);
      const prog = programs.find(p => p.id === coh?.programId);

      cohortApplicants.forEach(app => {
        triggerNotification('ASSESSMENT_OPENED', {
          applicant: {
            id: app.applicantId,
            fullName: app.fullName,
            email: app.email,
          },
          application: app,
          cohort: coh,
          programme: prog,
          assessment: targetAssessment,
          deadline: targetAssessment.closeDate || coh?.assessmentDeadline || 'September 10, 2026',
        });
      });
    }

    const statusLabels: Record<AssessmentStatus, string> = {
      draft: 'saved as Draft',
      scheduled: 'Scheduled',
      published: 'Published & Live',
      open: 'Opened for Applicants',
      closed: 'Closed',
      archived: 'Archived',
    };

    addToast({
      title: 'Assessment Status Updated',
      message: `Assessment is now ${statusLabels[status] || status}.`,
      type: 'success',
    });
  };

  const addAssessmentResource = (assessmentId: string, resource: Omit<AssessmentResource, 'id' | 'uploadedAt'>) => {
    const newRes: AssessmentResource = {
      ...resource,
      id: 'res-' + Date.now().toString(36),
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    setAssessments(prev => prev.map(a => {
      if (a.id !== assessmentId) return a;
      const currentResources = a.resources || [];
      return {
        ...a,
        resources: [...currentResources, newRes],
        updatedAt: new Date().toISOString(),
      };
    }));

    addToast({
      title: 'Resource Attached 📎',
      message: `"${newRes.name}" linked to assessment.`,
      type: 'success',
    });
  };

  const removeAssessmentResource = (assessmentId: string, resourceId: string) => {
    setAssessments(prev => prev.map(a => {
      if (a.id !== assessmentId) return a;
      return {
        ...a,
        resources: (a.resources || []).filter(r => r.id !== resourceId),
        updatedAt: new Date().toISOString(),
      };
    }));

    addToast({
      title: 'Resource Removed',
      message: 'Attached file has been unlinked from assessment.',
      type: 'info',
    });
  };

  const submitAssessment = (submissionData: Omit<AssessmentSubmission, 'id' | 'submittedAt'>): AssessmentSubmission => {
    const newId = 'sub-' + Date.now();
    const submission: AssessmentSubmission = {
      ...submissionData,
      id: newId,
      submittedAt: new Date().toISOString(),
    };

    setAssessmentSubmissions(prev => [submission, ...prev.filter(s => s.id !== newId)]);
    syncDocToFirestore('submissions', newId, submission);

    // Update target application score & status
    setApplications(prev => prev.map(app => {
      if (app.id !== submission.applicationId) return app;
      const newStatus = submission.passed ? 'assessment_completed' : 'under_review';
      const updatedApp = {
        ...app,
        assessmentScore: Math.round(submission.percentageScore),
        assessmentSubmissionId: newId,
        status: newStatus as any,
        timeline: [
          ...app.timeline,
          {
            id: 't-' + Date.now(),
            title: 'Technical Assessment Completed',
            description: `Score: ${Math.round(submission.percentageScore)}% (${submission.score}/${submission.maxScore} pts). Outcome: ${submission.passed ? 'PASSED' : 'NEEDS REVIEW'}.`,
            timestamp: new Date().toLocaleString(),
            actor: 'Assessment System',
            type: 'assessment' as const,
          },
        ],
      };
      syncDocToFirestore('applications', app.id, updatedApp);
      return updatedApp;
    }));

    // Trigger automated ASSESSMENT_SUBMITTED notification event
    const targetApp = applications.find(a => a.id === submission.applicationId);
    const targetAsm = assessments.find(a => a.id === submission.assessmentId);
    const coh = cohorts.find(c => c.id === targetApp?.cohortId);
    const prog = programs.find(p => p.id === targetApp?.programId);

    triggerNotification('ASSESSMENT_SUBMITTED', {
      applicant: {
        id: targetApp?.applicantId || currentUser.id,
        fullName: targetApp?.fullName || currentUser.name,
        email: targetApp?.email || currentUser.email,
      },
      application: targetApp,
      cohort: coh,
      programme: prog,
      assessment: targetAsm,
      customData: {
        assessment_score: Math.round(submission.percentageScore),
      }
    });

    addToast({
      title: 'Assessment Graded',
      message: `Your score: ${Math.round(submission.percentageScore)}%. Results recorded!`,
      type: submission.passed ? 'success' : 'info',
    });

    return submission;
  };

  const gradeAssessmentSubmission = (params: {
    submissionId?: string;
    applicationId: string;
    assessmentId: string;
    questionScores: Record<string, number>;
    evaluatorFeedback?: string;
    passed?: boolean;
  }) => {
    const { submissionId, applicationId, assessmentId, questionScores, evaluatorFeedback, passed } = params;
    const targetAssessment = assessments.find(a => a.id === assessmentId);
    const targetApp = applications.find(a => a.id === applicationId);

    // Compute raw, max, and percentage scores
    const rawScore = Object.values(questionScores).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const maxScore = targetAssessment?.questions.reduce((sum, q) => sum + (q.points || 0), 0) || 100;
    const percentage = Math.min(100, Math.max(0, Math.round((rawScore / maxScore) * 100)));
    const passingBenchmark = targetAssessment?.passingScore || 70;
    const isPassed = passed !== undefined ? passed : percentage >= passingBenchmark;

    // 1. Update or insert assessment submission
    setAssessmentSubmissions(prev => {
      const existingIdx = prev.findIndex(s => 
        (submissionId && s.id === submissionId) || 
        (s.applicationId === applicationId && s.assessmentId === assessmentId)
      );

      const updatedSub: AssessmentSubmission = {
        id: submissionId || (existingIdx >= 0 ? prev[existingIdx].id : 'sub-' + Date.now()),
        assessmentId,
        applicationId,
        applicantId: targetApp?.applicantId || 'applicant',
        answers: existingIdx >= 0 ? prev[existingIdx].answers : {},
        score: rawScore,
        maxScore,
        percentageScore: percentage,
        passed: isPassed,
        submittedAt: existingIdx >= 0 ? prev[existingIdx].submittedAt : new Date().toISOString(),
        timeTakenMinutes: existingIdx >= 0 ? prev[existingIdx].timeTakenMinutes : 25,
        evaluatorFeedback,
      };

      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = updatedSub;
        return next;
      }
      return [updatedSub, ...prev];
    });

    // 2. Update application assessment score and audit timeline
    setApplications(prev => prev.map(app => {
      if (app.id !== applicationId) return app;

      const timelineEvent: ApplicationTimelineEvent = {
        id: 't-grade-' + Date.now(),
        title: 'Assessment Graded & Evaluated',
        description: `Assessment score: ${rawScore}/${maxScore} pts (${percentage}%). Result: ${isPassed ? 'PASSED' : 'NEEDS REVIEW'}.${evaluatorFeedback ? ` Evaluator Feedback: "${evaluatorFeedback}"` : ''}`,
        timestamp: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' }),
        actor: currentUser.name,
        type: 'assessment',
      };

      const updatedApp = {
        ...app,
        assessmentScore: percentage,
        status: app.status === 'admitted' || app.status === 'accepted' || app.status === 'rejected' || app.status === 'enrolled' 
          ? app.status 
          : 'assessment_completed',
        timeline: [timelineEvent, ...app.timeline],
      };
      syncDocToFirestore('applications', applicationId, updatedApp);
      return updatedApp;
    }));
  };

  // Admissions & Decisions
  const makeAdmissionDecision = (params: {
    applicationId: string;
    decision: 'ACCEPTED' | 'REJECTED' | 'WAITLISTED' | 'admitted' | 'rejected' | 'waitlisted';
    reason?: string;
    decidedBy?: string;
  }) => {
    const { applicationId, decision, reason, decidedBy } = params;
    const targetApp = applications.find(a => a.id === applicationId);
    if (!targetApp) return;

    const decUpper = String(decision).toUpperCase();
    const normalizedDecision: ApplicationStatus = 
      decUpper === 'ACCEPTED' || decUpper === 'ADMITTED'
        ? 'admitted'
        : decUpper === 'WAITLISTED'
        ? 'waitlisted'
        : 'rejected';

    const decisionMakerName = decidedBy || currentUser.name || 'Admissions Committee';
    const timestampStr = new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' });
    const today = new Date().toISOString().split('T')[0];

    // 1. Update Application Status & Timeline
    setApplications(prev => prev.map(app => {
      if (app.id !== applicationId) return app;

      const timelineEvent: ApplicationTimelineEvent = {
        id: 't-adm-' + Date.now(),
        title: `Admissions Decision: ${normalizedDecision.toUpperCase()}`,
        description: `${reason ? `Reason: ${reason} • ` : ''}Decision rendered by ${decisionMakerName} on ${timestampStr}.`,
        timestamp: timestampStr,
        actor: decisionMakerName,
        type: 'admissions',
      };

      const updatedApp = {
        ...app,
        status: normalizedDecision,
        offerLetterSentDate: normalizedDecision === 'admitted' ? today : app.offerLetterSentDate,
        scholarshipAwarded: normalizedDecision === 'admitted' ? true : app.scholarshipAwarded,
        scholarshipPercentage: normalizedDecision === 'admitted' ? 100 : app.scholarshipPercentage,
        timeline: [timelineEvent, ...app.timeline],
      };
      syncDocToFirestore('applications', applicationId, updatedApp);
      return updatedApp;
    }));

    // 2. When ACCEPTED: Prepare applicant for future learner enrolment & create learner record according to defined transition workflow
    if (normalizedDecision === 'admitted') {
      const newLearner: LearnerRecord = {
        id: 'lrn-' + Date.now(),
        applicantId: targetApp.applicantId,
        applicationId: targetApp.id,
        cohortId: targetApp.cohortId,
        programId: targetApp.programId,
        fullName: targetApp.fullName,
        email: targetApp.email,
        enrollmentDate: today,
        attendanceRate: 100,
        completedModules: 0,
        totalModules: 8,
        capstoneStatus: 'not_started',
        currentGrade: 100,
        certificateStatus: 'pending',
      };

      setLearners(prev => {
        const exists = prev.some(l => l.applicantId === targetApp.applicantId && l.cohortId === targetApp.cohortId);
        if (exists) return prev;
        return [newLearner, ...prev];
      });
      syncDocToFirestore('learners', newLearner.id, newLearner);

      // Update cohort admitted counts
      setCohorts(prev => prev.map(c => {
        if (c.id !== targetApp.cohortId) return c;
        const updatedCohort = {
          ...c,
          admittedCount: (c.admittedCount || 0) + 1,
        };
        syncDocToFirestore('cohorts', c.id, updatedCohort);
        return updatedCohort;
      }));

      const prog = programs.find(p => p.id === targetApp.programId);
      const coh = cohorts.find(c => c.id === targetApp.cohortId);
      const targetAsm = assessments.find(a => a.cohortId === targetApp.cohortId);

      // Automated Trigger: APPLICATION_ACCEPTED
      triggerNotification('APPLICATION_ACCEPTED', {
        applicant: {
          id: targetApp.applicantId,
          fullName: targetApp.fullName,
          email: targetApp.email,
          phone: targetApp.phone,
        },
        application: targetApp,
        cohort: coh,
        programme: prog,
        assessment: targetAsm,
        deadline: coh?.startDate || 'October 1, 2026',
        customData: {
          admissions_reason: reason,
        }
      });

      addToast({
        title: 'Candidate Accepted! 🎓',
        message: `${targetApp.fullName} is admitted. Learner profile initialized for enrolment.`,
        type: 'success',
      });
    } else if (normalizedDecision === 'waitlisted') {
      const prog = programs.find(p => p.id === targetApp.programId);
      const coh = cohorts.find(c => c.id === targetApp.cohortId);
      const targetAsm = assessments.find(a => a.cohortId === targetApp.cohortId);

      // Automated Trigger: APPLICATION_WAITLISTED
      triggerNotification('APPLICATION_WAITLISTED', {
        applicant: {
          id: targetApp.applicantId,
          fullName: targetApp.fullName,
          email: targetApp.email,
          phone: targetApp.phone,
        },
        application: targetApp,
        cohort: coh,
        programme: prog,
        assessment: targetAsm,
        customData: {
          admissions_reason: reason,
        }
      });

      addToast({
        title: 'Candidate Waitlisted ⏳',
        message: `${targetApp.fullName} has been placed on the priority waitlist.`,
        type: 'info',
      });
    } else {
      const prog = programs.find(p => p.id === targetApp.programId);
      const coh = cohorts.find(c => c.id === targetApp.cohortId);
      const targetAsm = assessments.find(a => a.cohortId === targetApp.cohortId);

      // Automated Trigger: APPLICATION_REJECTED
      triggerNotification('APPLICATION_REJECTED', {
        applicant: {
          id: targetApp.applicantId,
          fullName: targetApp.fullName,
          email: targetApp.email,
          phone: targetApp.phone,
        },
        application: targetApp,
        cohort: coh,
        programme: prog,
        assessment: targetAsm,
        customData: {
          admissions_reason: reason,
        }
      });

      addToast({
        title: 'Application Rejected',
        message: `Decision recorded for ${targetApp.fullName}.`,
        type: 'info',
      });
    }
  };

  // Admissions & Learner Transition
  const acceptAdmissionOffer = (applicationId: string) => {
    const targetApp = applications.find(a => a.id === applicationId);
    if (!targetApp) return;

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'],
      });
    } catch {
      // ignore in environments without canvas
    }

    const now = new Date().toLocaleString();
    const today = new Date().toISOString().split('T')[0];

    // Mark application as enrolled
    setApplications(prev => prev.map(app => {
      if (app.id !== applicationId) return app;
      const updatedApp = {
        ...app,
        status: 'enrolled' as const,
        offerAcceptedDate: today,
        timeline: [
          ...app.timeline,
          {
            id: 't-' + Date.now(),
            title: 'Offer Accepted & Seat Locked',
            description: 'Candidate signed NextGen Learner Code of Conduct and officially enrolled.',
            timestamp: now,
            actor: app.fullName,
            type: 'admissions' as const,
          },
        ],
      };
      syncDocToFirestore('applications', applicationId, updatedApp);
      return updatedApp;
    }));

    // Update cohort counts
    setCohorts(prev => prev.map(c => {
      if (c.id !== targetApp.cohortId) return c;
      const updatedCohort = {
        ...c,
        enrolledCount: c.enrolledCount + 1,
      };
      syncDocToFirestore('cohorts', c.id, updatedCohort);
      return updatedCohort;
    }));

    // Create Learner Record
    const newLearner: LearnerRecord = {
      id: 'lrn-' + Date.now(),
      applicantId: targetApp.applicantId,
      applicationId: targetApp.id,
      cohortId: targetApp.cohortId,
      programId: targetApp.programId,
      fullName: targetApp.fullName,
      email: targetApp.email,
      enrollmentDate: today,
      attendanceRate: 100,
      completedModules: 0,
      totalModules: 8,
      capstoneStatus: 'not_started',
      currentGrade: 100,
      certificateStatus: 'pending',
    };

    setLearners(prev => {
      const exists = prev.some(l => l.applicantId === targetApp.applicantId && l.cohortId === targetApp.cohortId);
      if (exists) return prev;
      return [newLearner, ...prev];
    });
    syncDocToFirestore('learners', newLearner.id, newLearner);

    // Send Welcome Message
    sendMessage({
      senderId: 'admin-user-1',
      senderName: 'Dr. Sarah Chen',
      senderRole: 'program_manager',
      recipientId: targetApp.applicantId,
      recipientName: targetApp.fullName,
      programId: targetApp.programId,
      cohortId: targetApp.cohortId,
      type: 'direct',
      subject: '🎓 Official Welcome to NextGen Class!',
      content: `Welcome to the academy family, ${targetApp.fullName}! Your learner account is now active. Check the Learner Portal to access your syllabus, lecture schedule, and meet your cohort peers.`,
    });

    addToast({
      title: 'Congratulations! 🎉',
      message: 'You are officially enrolled in NextGen Class.',
      type: 'success',
    });
  };

  const resetToDefaultSeed = () => {
    localStorage.clear();
    setPrograms(SEED_PROGRAMS);
    setCohorts(SEED_COHORTS);
    setApplications(SEED_APPLICATIONS);
    setAssessments(SEED_ASSESSMENTS);
    setAssessmentSubmissions([]);
    setMessages(SEED_MESSAGES);
    setTemplates(SEED_TEMPLATES);
    setCommunicationLogs(SEED_COMMUNICATION_LOGS);
    setLearners(SEED_LEARNERS);
    setForms(SEED_APPLICATION_FORMS);
    setCurrentUser(SEED_USERS[0]);
    setActivePortal('applicant');
    addToast({
      title: 'System Reset',
      message: 'Platform state refreshed with baseline NextGen Academy seed data.',
      type: 'info',
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        allUsers,
        activePortal,
        setActivePortal,
        managerTab,
        setManagerTab,
        applicantTab,
        setApplicantTab,
        selectedProgramId,
        setSelectedProgramId,
        selectedCohortId,
        setSelectedCohortId,
        targetApplicationForApply,
        setTargetApplicationForApply,
        programs,
        cohorts,
        addProgram,
        updateProgram,
        archiveProgram,
        toggleProgramStatus,
        deleteProgram,
        addCohort,
        updateCohort,
        archiveCohort,
        openCohortApplications,
        closeCohortApplications,
        updateCohortStatus,
        deleteCohort,
        forms,
        activeFormId,
        setActiveFormId,
        addForm,
        updateForm,
        deleteForm,
        publishForm,
        unpublishForm,
        createFormVersion,
        addSectionToForm,
        updateSectionInForm,
        deleteSectionFromForm,
        reorderSectionsInForm,
        addFieldToSection,
        updateFieldInSection,
        deleteFieldFromSection,
        reorderFieldsInSection,
        bulkImportFieldsToForm,
        getPublishedFormForProgramme,
        applications,
        saveDraftApplication,
        submitApplication,
        deleteDraftApplication,
        updateApplicationStatus,
        updateRubricEvaluation,
        addInternalNote,
        updateDocumentVerification,
        createTestApplication,
        toggleStarApplication,
        bulkUpdateStatus,
        assessments,
        assessmentSubmissions,
        createAssessment,
        saveAssessment,
        deleteAssessment,
        duplicateAssessment,
        updateAssessmentStatus,
        addAssessmentResource,
        removeAssessmentResource,
        submitAssessment,
        gradeAssessmentSubmission,
        messages,
        templates,
        communicationLogs,
        sendMessage,
        broadcastToCohort,
        saveTemplate,
        toggleTemplateAutomation,
        resetTemplatesToDefault,
        clearCommunicationLogs,
        resendCommunication,
        triggerNotification,
        broadcastManualMessage,
        broadcastMessage: broadcastManualMessage,
        makeAdmissionDecision,
        acceptAdmissionOffer,
        learners,
        toasts,
        addToast,
        removeToast,
        resetToDefaultSeed,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
