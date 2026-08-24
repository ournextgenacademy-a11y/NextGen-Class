import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// Helper to parse path into { isAuth, authMode, portal, managerTab, applicantTab }
function parseRoute(path: string) {
  const cleanPath = (path || '/').split('?')[0].split('#')[0];
  
  if (cleanPath === '/login' || cleanPath === '/register' || cleanPath === '/forgot-password' || cleanPath === '/reset-password' || cleanPath === '/verify-email') {
    return { isAuth: true, authMode: cleanPath.replace('/', '') as any, portal: null, managerTab: 'overview' as const, applicantTab: 'dashboard' as const };
  }

  if (cleanPath.startsWith('/admin')) {
    const sub = cleanPath.replace(/^\/admin\/?/, '');
    const validManagerTabs = ['overview', 'programs', 'forms', 'applications', 'assessments', 'communications', 'mne', 'learners'];
    const tab = (validManagerTabs.includes(sub) ? sub : 'overview') as 'overview' | 'programs' | 'forms' | 'applications' | 'assessments' | 'communications' | 'mne' | 'learners';
    return { isAuth: false, authMode: null, portal: 'manager' as const, managerTab: tab, applicantTab: 'dashboard' as const };
  }

  if (cleanPath.startsWith('/apply')) {
    const sub = cleanPath.replace(/^\/apply\/?/, '');
    let tab: 'dashboard' | 'explore' | 'assessments' | 'inbox' | 'apply' = 'dashboard';
    if (sub === 'explore') tab = 'explore';
    else if (sub === 'assessments') tab = 'assessments';
    else if (sub === 'apply' || sub === 'wizard' || sub === 'dossier') tab = 'apply';
    else if (sub === 'inbox') tab = 'inbox';
    return { isAuth: false, authMode: null, portal: 'applicant' as const, managerTab: 'overview' as const, applicantTab: tab };
  }

  if (cleanPath.startsWith('/facilitator')) {
    return { isAuth: false, authMode: null, portal: 'facilitator' as const, managerTab: 'overview' as const, applicantTab: 'dashboard' as const };
  }

  if (cleanPath.startsWith('/learn')) {
    return { isAuth: false, authMode: null, portal: 'learner' as const, managerTab: 'overview' as const, applicantTab: 'dashboard' as const };
  }

  return { isAuth: false, authMode: null, portal: null, managerTab: 'overview' as const, applicantTab: 'dashboard' as const };
}

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

  // Synchronize route and handle browser popstate (back/forward history)
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

  // Listen for browser Back and Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        setCurrentPath(window.location.pathname);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync state whenever currentPath changes (from Back/Forward or initial load)
  useEffect(() => {
    const route = parseRoute(currentPath);

    if (route.portal) {
      if (route.portal !== activePortal) {
        setActivePortal(route.portal);
      }
      if (route.portal === 'manager' && route.managerTab !== managerTab) {
        setManagerTab(route.managerTab);
      }
      if (route.portal === 'applicant' && route.applicantTab !== applicantTab) {
        setApplicantTab(route.applicantTab);
      }
    }
  }, [currentPath]);

  // Ensure that every page loads by showing the top of the page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [currentPath, activePortal, applicantTab, managerTab]);

  // ROUTE GUARD & RBAC DISPATCHER
  useEffect(() => {
    if (!isAuthenticated) {
      // Unauthenticated: lock path to auth routes
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register') && !currentPath.startsWith('/forgot-password') && !currentPath.startsWith('/reset-password') && !currentPath.startsWith('/verify-email')) {
        navigateTo('/login', true);
      }
      return;
    }

    // Authenticated: Enforce Role Boundaries and Role-Based Redirection
    const role = currentUser?.role || 'applicant';

    if (role === 'applicant') {
      // APPLICANT is restricted to /apply/*
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/facilitator') || currentPath.startsWith('/learn')) {
        addToast({
          title: 'Access Restricted',
          message: `Applicant accounts are routed to the candidate workspace.`,
          type: 'info',
        });
        setActivePortal('applicant');
        navigateTo('/apply', true);
      } else if (currentPath === '/' || currentPath === '/login') {
        setActivePortal('applicant');
        navigateTo('/apply', true);
      }
    } else if (role === 'program_manager' || role === 'reviewer') {
      // PROGRAM_MANAGER can access /admin, and can also preview /apply
      if (currentPath === '/' || currentPath === '/login') {
        setActivePortal('manager');
        navigateTo('/admin', true);
      }
    } else if (role === 'facilitator') {
      // FACILITATOR routes to /facilitator
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/learn')) {
        addToast({
          title: 'Facilitator Workspace',
          message: `Navigated to Facilitator Workspace.`,
          type: 'info',
        });
        setActivePortal('facilitator' as any);
        navigateTo('/facilitator', true);
      } else if (currentPath === '/' || currentPath === '/login' || currentPath === '/apply') {
        setActivePortal('facilitator' as any);
        navigateTo('/facilitator', true);
      }
    } else if (role === 'learner') {
      // LEARNER routes to /learn
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/facilitator')) {
        addToast({
          title: 'Learner Hub',
          message: `Navigated to Learner Hub.`,
          type: 'info',
        });
        setActivePortal('learner');
        navigateTo('/learn', true);
      } else if (currentPath === '/' || currentPath === '/login' || currentPath === '/apply') {
        setActivePortal('learner');
        navigateTo('/learn', true);
      }
    }
  }, [isAuthenticated, currentUser?.role, currentPath, navigateTo, setActivePortal, addToast]);

  const handleManagerTabChange = (tab: typeof managerTab) => {
    setManagerTab(tab);
    const newPath = tab === 'overview' ? '/admin' : `/admin/${tab}`;
    navigateTo(newPath);
  };

  const handleApplicantTabChange = (tab: typeof applicantTab) => {
    setApplicantTab(tab);
    const newPath = tab === 'dashboard' ? '/apply' : `/apply/${tab}`;
    navigateTo(newPath);
  };

  const myApp = applications.find(a => a.applicantId === currentUser.id) || applications[0];
  const myProg = programs.find(p => p.id === myApp?.programId) || programs[0];
  const myCohort = cohorts.find(c => c.id === myApp?.cohortId) || cohorts[0];
  const myAssessment = assessments.find(a => a.id === myCohort?.assessmentId) || assessments[0];

  const handleSelectProgramForApply = (progId: string, cohortId: string) => {
    setApplyProgramId(progId);
    setApplyCohortId(cohortId);
    handleApplicantTabChange('apply');
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
    localStorage.removeItem('nextgen_class_current_user');
    localStorage.removeItem('nextgen_class_current_user_id');

    setIsAuthenticated(false);
    navigateTo('/login', true);

    addToast({
      title: 'Signed Out',
      message: 'Session securely terminated.',
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
  if (!isAuthenticated) {
    let authMode: 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email' = 'login';
    if (currentPath === '/register') authMode = 'register';
    else if (currentPath === '/forgot-password') authMode = 'forgot-password';
    else if (currentPath === '/reset-password') authMode = 'reset-password';
    else if (currentPath === '/verify-email') authMode = 'verify-email';

    return (
      <div className="min-h-screen bg-zinc-950">
        <AuthScreen 
          onAuthenticated={handleAuthenticated} 
          initialMode={authMode}
        />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-['Plus_Jakarta_Sans'] antialiased text-zinc-900 selection:bg-orange-600 selection:text-white">
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
            <div className="bg-white rounded-2xl border border-zinc-200 p-1.5 shadow-sm overflow-x-auto">
              <div className="flex items-center space-x-1 min-w-max">
                {[
                  { id: 'dashboard', label: 'My Applications & Status' },
                  { id: 'explore', label: 'Explore Programmes' },
                  { id: 'assessments', label: 'Assessments & Resources' },
                  { id: 'apply', label: 'Application Form' },
                  { id: 'inbox', label: 'Notices & Messages' },
                ].map((item) => (
                  <button
                    key={item.id}
                    id={`applicant-tab-${item.id}`}
                    onClick={() => handleApplicantTabChange(item.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      applicantTab === item.id
                        ? 'bg-zinc-950 text-white shadow-sm ring-1 ring-zinc-900'
                        : 'text-zinc-600 hover:text-black hover:bg-zinc-50'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {applicantTab === 'dashboard' && (
              <ApplicantDashboard
                onStartNewApplication={() => handleApplicantTabChange('explore')}
                onResumeDraft={(draft) => {
                  setApplyProgramId(draft.programId);
                  setApplyCohortId(draft.cohortId);
                  handleApplicantTabChange('apply');
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
                onCancel={() => handleApplicantTabChange('dashboard')}
                onComplete={() => handleApplicantTabChange('dashboard')}
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
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto flex items-center justify-center">
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
            <div className="bg-white rounded-2xl border border-zinc-200 p-1.5 shadow-sm overflow-x-auto">
              <div className="flex items-center space-x-1 min-w-max">
                {[
                  { id: 'overview', label: 'Dashboard' },
                  { id: 'programs', label: 'Programmes & Cohorts' },
                  { id: 'forms', label: 'Application Forms' },
                  { id: 'applications', label: 'Admissions Pipeline' },
                  { id: 'assessments', label: 'Assessment Studio' },
                  { id: 'communications', label: 'Communications' },
                  { id: 'mne', label: 'M&E Telemetry' },
                  { id: 'learners', label: 'Learners' },
                ].map((item) => (
                  <button
                    key={item.id}
                    id={`manager-tab-${item.id}`}
                    onClick={() => handleManagerTabChange(item.id as any)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      managerTab === item.id
                        ? 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-700'
                        : 'text-zinc-600 hover:text-black hover:bg-zinc-50'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {managerTab === 'overview' && (
              <ManagerDashboard
                onNavigateTab={(tab) => handleManagerTabChange(tab)}
                onSelectApplication={(appId) => {
                  setSelectedAppIdForReview(appId);
                  handleManagerTabChange('applications');
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
      <footer className="bg-white border-t border-zinc-200 mt-12 py-6 px-4 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-zinc-900">NextGen Academy</span>
            <span>•</span>
            <span>Admissions, Assessments & Learning Platform</span>
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
