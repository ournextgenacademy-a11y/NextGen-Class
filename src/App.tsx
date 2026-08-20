import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthScreen } from './components/auth/AuthScreen';
import { UserRole } from './types';

// Applicant Portal Components
import { ApplicantDashboard } from './components/applicant/ApplicantDashboard';
import { ProgramDirectory } from './components/applicant/ProgramDirectory';
import { ApplicationWizard } from './components/applicant/ApplicationWizard';
import { ApplicantAssessmentsTab } from './components/applicant/ApplicantAssessmentsTab';
import { ApplicantInbox } from './components/applicant/ApplicantInbox';
import { AdmissionOfferModal } from './components/applicant/AdmissionOfferModal';
import { AssessmentRunner } from './components/applicant/AssessmentRunner';

// Manager Portal Components
import { ManagerDashboard } from './components/manager/ManagerDashboard';
import { ProgramCohortManager } from './components/manager/ProgramCohortManager';
import { FormBuilder } from './components/manager/FormBuilder';
import { ApplicationPipeline } from './components/manager/ApplicationPipeline';
import { AssessmentStudio } from './components/manager/AssessmentStudio';
import { CommunicationsCenter } from './components/manager/CommunicationsCenter';
import { MneReportingView } from './components/manager/MneReportingView';
import { LearnerManagerView } from './components/manager/LearnerManagerView';

// Facilitator & Learner Portal Components
import { FacilitatorWorkspace } from './components/facilitator/FacilitatorWorkspace';
import { LearnerDashboard } from './components/learner/LearnerDashboard';

const MainLayout: React.FC = () => {
  const { 
    activePortal, 
    setActivePortal,
    applicantTab, 
    setApplicantTab, 
    managerTab, 
    setManagerTab,
    applications,
    programs,
    cohorts,
    assessments,
    currentUser,
    addToast
  } = useApp();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('nextgen_class_is_authenticated') === 'true';
  });

  // Current URL Path state
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });

  // Wizard parameters if applying to a specific programme & cohort
  const [applyProgramId, setApplyProgramId] = useState<string | undefined>();
  const [applyCohortId, setApplyCohortId] = useState<string | undefined>();

  // Manager application selection drilldown
  const [selectedAppIdForReview, setSelectedAppIdForReview] = useState<string | null>(null);

  // Applicant Modals triggered from inbox or shortcuts
  const [showDirectOfferModal, setShowDirectOfferModal] = useState(false);
  const [takingDirectAssessment, setTakingDirectAssessment] = useState(false);

  // Synchronize route and handle browser popstate (back/forward)
  const navigateTo = useCallback((path: string, replace = false) => {
    if (typeof window !== 'undefined') {
      if (replace) {
        window.history.replaceState(null, '', path);
      } else {
        window.history.pushState(null, '', path);
      }
      setCurrentPath(path);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ROUTE GUARD & RBAC DISPATCHER
  useEffect(() => {
    if (!isAuthenticated) {
      // Unauthenticated: lock path to auth routes
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/forgot-password') && !currentPath.startsWith('/reset-password') && !currentPath.startsWith('/verify-email')) {
        navigateTo('/login', true);
      }
      return;
    }

    // Authenticated: Enforce Role Boundaries and Role-Based Redirection
    const role = currentUser.role;

    if (role === 'applicant') {
      // APPLICANT is restricted to /apply/*
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/facilitator') || currentPath.startsWith('/learn')) {
        addToast({
          title: 'Access Denied (403 Forbidden)',
          message: `Role 'APPLICANT' is restricted from administrative portals. Redirected to /apply.`,
          type: 'error',
        });
        setActivePortal('applicant');
        navigateTo('/apply', true);
      } else if (currentPath === '/' || currentPath === '/login') {
        setActivePortal('applicant');
        navigateTo('/apply', true);
      } else {
        setActivePortal('applicant');
      }
    } else if (role === 'program_manager' || role === 'reviewer') {
      // PROGRAM_MANAGER routes to /admin by default, but can preview /apply
      if (currentPath === '/' || currentPath === '/login') {
        setActivePortal('manager');
        navigateTo('/admin', true);
      } else if (currentPath.startsWith('/admin')) {
        setActivePortal('manager');
      } else if (currentPath.startsWith('/apply')) {
        setActivePortal('applicant');
      }
    } else if (role === 'facilitator') {
      // FACILITATOR routes to /facilitator
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/learn')) {
        addToast({
          title: 'Access Denied (403 Forbidden)',
          message: `Facilitators do not have access to administrative management. Redirected to /facilitator.`,
          type: 'error',
        });
        setActivePortal('facilitator' as any);
        navigateTo('/facilitator', true);
      } else if (currentPath === '/' || currentPath === '/login' || currentPath === '/apply') {
        setActivePortal('facilitator' as any);
        navigateTo('/facilitator', true);
      } else {
        setActivePortal('facilitator' as any);
      }
    } else if (role === 'learner') {
      // LEARNER routes to /learn
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/facilitator')) {
        addToast({
          title: 'Access Denied (403 Forbidden)',
          message: `Learners are restricted from administrative views. Redirected to /learn.`,
          type: 'error',
        });
        setActivePortal('learner');
        navigateTo('/learn', true);
      } else if (currentPath === '/' || currentPath === '/login' || currentPath === '/apply') {
        setActivePortal('learner');
        navigateTo('/learn', true);
      } else {
        setActivePortal('learner');
      }
    }
  }, [isAuthenticated, currentUser?.role, currentPath, navigateTo, setActivePortal, addToast]);

  const myApp = applications.find(a => a.applicantId === currentUser.id) || applications[0];
  const myProg = programs.find(p => p.id === myApp?.programId) || programs[0];
  const myCohort = cohorts.find(c => c.id === myApp?.cohortId) || cohorts[0];
  const myAssessment = assessments.find(a => a.id === myCohort?.assessmentId) || assessments[0];

  const handleSelectProgramForApply = (progId: string, cohortId: string) => {
    setApplyProgramId(progId);
    setApplyCohortId(cohortId);
    setApplicantTab('apply');
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('nextgen_class_auth_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        console.warn('Logout notification note:', err);
      }
    }

    // Invalidate local storage tokens and flags
    localStorage.removeItem('nextgen_class_is_authenticated');
    localStorage.removeItem('nextgen_class_auth_token');
    localStorage.removeItem('nextgen_class_current_user_id');

    setIsAuthenticated(false);
    navigateTo('/login', true);

    addToast({
      title: 'Signed Out',
      message: 'Session invalidated and securely terminated.',
      type: 'info',
    });
  };

  const handleAuthenticated = (role: UserRole) => {
    localStorage.setItem('nextgen_class_is_authenticated', 'true');
    setIsAuthenticated(true);

    if (role === 'program_manager' || role === 'reviewer') {
      setActivePortal('manager');
      navigateTo('/admin', true);
    } else if (role === 'learner') {
      setActivePortal('learner');
      navigateTo('/learn', true);
    } else if (role === 'facilitator') {
      setActivePortal('facilitator' as any);
      navigateTo('/facilitator', true);
    } else {
      setActivePortal('applicant');
      navigateTo('/apply', true);
    }
  };

  // STRICT AUTHENTICATION-FIRST GATEWAY
  // If unauthenticated: Absolutely NO application screens, dashboards, or portals are rendered.
  if (!isAuthenticated) {
    let authMode: 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email' = 'login';
    if (currentPath === '/register') authMode = 'register';
    else if (currentPath === '/forgot-password') authMode = 'forgot-password';
    else if (currentPath === '/reset-password') authMode = 'reset-password';
    else if (currentPath === '/verify-email') authMode = 'verify-email';

    return (
      <div className="min-h-screen bg-slate-950">
        <AuthScreen 
          onAuthenticated={handleAuthenticated} 
          initialMode={authMode}
        />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] antialiased text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Universal Top Navigation Header with RBAC enforcement */}
      <Header 
        onLogout={handleLogout} 
        currentPath={currentPath}
        onNavigate={(path) => navigateTo(path)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* =========================================================================
            1. APPLICANT PORTAL VIEWS (/apply/*)
            ========================================================================= */}
        {activePortal === 'applicant' && (
          <div className="space-y-6">
            {/* Applicant Subnavigation Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm overflow-x-auto">
              <div className="flex items-center space-x-1 min-w-max">
                {[
                  { id: 'dashboard', label: 'My Applications & Status' },
                  { id: 'explore', label: 'Explore Programmes' },
                  { id: 'assessments', label: 'Assessments & Resources' },
                  { id: 'apply', label: 'Application Dossier' },
                  { id: 'inbox', label: 'Notices & Messages' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setApplicantTab(item.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      applicantTab === item.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {applicantTab === 'dashboard' && (
              <ApplicantDashboard
                onStartNewApplication={() => setApplicantTab('explore')}
                onResumeDraft={(draft) => {
                  setApplyProgramId(draft.programId);
                  setApplyCohortId(draft.cohortId);
                  setApplicantTab('apply');
                }}
              />
            )}

            {applicantTab === 'explore' && (
              <ProgramDirectory
                onSelectProgramForApply={handleSelectProgramForApply}
              />
            )}

            {applicantTab === 'assessments' && (
              <ApplicantAssessmentsTab />
            )}

            {applicantTab === 'apply' && (
              <ApplicationWizard
                preselectedProgramId={applyProgramId}
                preselectedCohortId={applyCohortId}
                onCancel={() => setApplicantTab('dashboard')}
                onComplete={() => setApplicantTab('dashboard')}
              />
            )}

            {applicantTab === 'inbox' && (
              <ApplicantInbox
                onOpenOfferModal={() => setShowDirectOfferModal(true)}
                onTakeAssessment={() => setTakingDirectAssessment(true)}
              />
            )}

            {/* Direct Offer Modal from inbox trigger */}
            {showDirectOfferModal && myApp && myProg && myCohort && (
              <AdmissionOfferModal
                application={myApp}
                program={myProg}
                cohort={myCohort}
                onClose={() => setShowDirectOfferModal(false)}
              />
            )}

            {/* Direct Assessment Modal */}
            {takingDirectAssessment && myApp && myAssessment && (
              <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto flex items-center justify-center">
                <div className="max-w-3xl w-full">
                  <AssessmentRunner
                    assessment={myAssessment}
                    application={myApp}
                    onComplete={() => setTakingDirectAssessment(false)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            2. PROGRAM MANAGER PORTAL VIEWS (/admin/*)
            ========================================================================= */}
        {activePortal === 'manager' && (
          <div className="space-y-6">
            {/* Manager Module Subnavigation Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm overflow-x-auto">
              <div className="flex items-center space-x-1 min-w-max">
                {[
                  { id: 'overview', label: 'Dashboard' },
                  { id: 'programs', label: 'Programmes & Cohorts' },
                  { id: 'forms', label: 'Application Forms', badge: 'Module 4' },
                  { id: 'applications', label: 'Admissions Pipeline' },
                  { id: 'assessments', label: 'Assessment Studio' },
                  { id: 'communications', label: 'Communications' },
                  { id: 'mne', label: 'M&E Telemetry' },
                  { id: 'learners', label: 'Learners' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setManagerTab(item.id as any)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      managerTab === item.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        managerTab === item.id 
                          ? 'bg-indigo-700/80 text-indigo-100' 
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {managerTab === 'overview' && (
              <ManagerDashboard
                onNavigateTab={(tab) => setManagerTab(tab)}
                onSelectApplication={(appId) => {
                  setSelectedAppIdForReview(appId);
                  setManagerTab('applications');
                }}
              />
            )}

            {managerTab === 'programs' && (
              <ProgramCohortManager />
            )}

            {managerTab === 'forms' && (
              <FormBuilder />
            )}

            {managerTab === 'applications' && (
              <ApplicationPipeline
                initialSelectedAppId={selectedAppIdForReview}
              />
            )}

            {managerTab === 'assessments' && (
              <AssessmentStudio />
            )}

            {managerTab === 'communications' && (
              <CommunicationsCenter />
            )}

            {managerTab === 'mne' && (
              <MneReportingView />
            )}

            {managerTab === 'learners' && (
              <LearnerManagerView />
            )}
          </div>
        )}

        {/* =========================================================================
            3. FACILITATOR WORKSPACE (/facilitator/*)
            ========================================================================= */}
        {(activePortal as string) === 'facilitator' && (
          <div>
            <FacilitatorWorkspace />
          </div>
        )}

        {/* =========================================================================
            4. LEARNER PORTAL VIEWS (/learn/*)
            ========================================================================= */}
        {activePortal === 'learner' && (
          <div>
            <LearnerDashboard />
          </div>
        )}

      </main>

      {/* System Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">NextGen Class</span>
            <span>•</span>
            <span>Authentication-First Security & Multi-Role Governance</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-semibold">
              Protected Endpoints & Resource Ownership
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-semibold">
              Strict RBAC Isolation
            </span>
            <span>Audit Trail Enabled</span>
          </div>
        </div>
      </footer>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
