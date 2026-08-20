import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  GraduationCap, 
  UserCheck, 
  ShieldCheck, 
  Layers, 
  Bell, 
  RotateCcw, 
  Sparkles, 
  ChevronDown, 
  BookOpen, 
  Inbox, 
  FileText, 
  Compass, 
  BarChart3, 
  Users, 
  Sliders, 
  Send,
  LogOut,
  ShieldAlert,
  Lock
} from 'lucide-react';

interface HeaderProps {
  onLogout?: () => void;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, currentPath = '/apply', onNavigate }) => {
  const { 
    currentUser, 
    setCurrentUser, 
    allUsers, 
    activePortal, 
    setActivePortal, 
    managerTab, 
    setManagerTab, 
    applicantTab, 
    setApplicantTab,
    messages,
    resetToDefaultSeed,
    addToast
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Unread messages for current user
  const unreadMessages = messages.filter(
    m => m.recipientId === currentUser.id || (m.type === 'broadcast' && currentUser.role === 'applicant')
  );

  const isApplicant = currentUser.role === 'applicant';
  const isManager = currentUser.role === 'program_manager' || currentUser.role === 'reviewer';
  const isFacilitator = currentUser.role === 'facilitator';
  const isLearner = currentUser.role === 'learner';

  const handlePortalSwitch = (portal: 'applicant' | 'manager' | 'learner' | 'facilitator') => {
    // Enforce RBAC guard
    if (portal === 'manager' && isApplicant) {
      addToast({
        title: 'Access Denied (403 Forbidden)',
        message: 'Applicant accounts are not permitted to access the Program Manager portal.',
        type: 'error',
      });
      return;
    }
    if (portal === 'manager' && isLearner) {
      addToast({
        title: 'Access Denied (403 Forbidden)',
        message: 'Learner accounts are not permitted to access administrative portals.',
        type: 'error',
      });
      return;
    }
    if (portal === 'manager' && isFacilitator) {
      addToast({
        title: 'Access Denied (403 Forbidden)',
        message: 'Facilitator accounts are restricted from core Program Manager operations.',
        type: 'error',
      });
      return;
    }

    if (portal === 'facilitator' || portal === 'manager' || portal === 'learner' || portal === 'applicant') {
      setActivePortal(portal as any);
      if (onNavigate) {
        if (portal === 'manager') onNavigate('/admin');
        else if (portal === 'learner') onNavigate('/learn');
        else if (portal === 'facilitator') onNavigate('/facilitator');
        else onNavigate('/apply');
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      {/* Top Banner: Role & Platform Architecture Notice */}
      <div className="bg-slate-900 text-slate-200 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2 font-medium">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300">NextGen Class Architecture:</span>
          <span className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-mono text-[11px]">
            RBAC Guard Active • Access Enforced
          </span>
          <span className="text-slate-400 hidden md:inline text-[11px]">
            (Role-based routing: {(currentUser.role || 'applicant').toUpperCase()} → {isManager ? '/admin' : isFacilitator ? '/facilitator' : isLearner ? '/learn' : '/apply'})
          </span>
        </div>

        {/* Quick Role & Persona Switcher for Verified Testing */}
        <div className="flex items-center space-x-3 mt-1 sm:mt-0">
          <div className="relative">
            <button
              id="role-switch-btn"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-xs transition cursor-pointer border border-slate-700"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Acting as: <strong className="text-white">{currentUser.name}</strong> ({((currentUser.role as string) || '').replace('_', ' ').toUpperCase()})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-slate-800">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Switch Active Persona / Role (Testing)
                </div>
                {allUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user);
                      if (user.role === 'program_manager' || user.role === 'reviewer') {
                        setActivePortal('manager');
                        if (onNavigate) onNavigate('/admin');
                      } else if (user.role === 'learner') {
                        setActivePortal('learner');
                        if (onNavigate) onNavigate('/learn');
                      } else if (user.role === 'facilitator') {
                        setActivePortal('facilitator' as any);
                        if (onNavigate) onNavigate('/facilitator');
                      } else {
                        setActivePortal('applicant');
                        if (onNavigate) onNavigate('/apply');
                      }
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2.5 hover:bg-slate-50 transition ${
                      currentUser.id === user.id ? 'bg-indigo-50/80 font-semibold text-indigo-900' : 'text-slate-700'
                    }`}
                  >
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-6 h-6 rounded-full object-cover border border-slate-200" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs">{user.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{user.role.replace('_', ' ')} • {user.title || user.email}</div>
                    </div>
                    {currentUser.id === user.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            id="reset-demo-btn"
            onClick={resetToDefaultSeed}
            title="Reset to baseline seed data"
            className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded hover:bg-slate-800 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset Data</span>
          </button>

          {onLogout && (
            <button
              id="signout-btn"
              onClick={onLogout}
              title="Sign Out to Auth Gateway"
              className="flex items-center space-x-1 text-rose-400 hover:text-rose-300 text-xs px-2.5 py-1 rounded bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/50 transition cursor-pointer font-medium"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 font-['Space_Grotesk']">
                  NextGen <span className="text-indigo-600">Class</span>
                </span>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wide">
                  Academy Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Programme & Admissions Management System
              </p>
            </div>
          </div>

          {/* Role-Aware Portal Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {/* Applicant Portal: Available to Applicants and Program Managers */}
            {(isApplicant || isManager) && (
              <button
                id="nav-portal-applicant"
                onClick={() => handlePortalSwitch('applicant')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activePortal === 'applicant'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Applicant Portal</span>
              </button>
            )}

            {/* Program Manager Portal: Available ONLY to Program Managers */}
            {isManager && (
              <button
                id="nav-portal-manager"
                onClick={() => handlePortalSwitch('manager')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activePortal === 'manager'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Program Manager Portal</span>
              </button>
            )}

            {/* Facilitator Portal: Available to Facilitator role */}
            {isFacilitator && (
              <button
                id="nav-portal-facilitator"
                onClick={() => handlePortalSwitch('facilitator')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  (activePortal as string) === 'facilitator'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Facilitator Workspace</span>
              </button>
            )}

            {/* Learner Portal: Available to Learners */}
            {isLearner && (
              <button
                id="nav-portal-learner"
                onClick={() => handlePortalSwitch('learner')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activePortal === 'learner'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                <span>Learner Hub</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Active</span>
              </button>
            )}
          </div>

          {/* User Profile & Notifications */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                id="notif-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition relative cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadMessages.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Academy Notices & Messages</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.5 rounded">
                      {unreadMessages.length} New
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {unreadMessages.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No new notifications at this time.
                      </div>
                    ) : (
                      unreadMessages.slice(0, 4).map(msg => (
                        <div key={msg.id} className="p-3 hover:bg-slate-50 transition text-xs">
                          <div className="font-semibold text-slate-800 truncate">{msg.subject}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{msg.content}</div>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                            <span>{msg.senderName}</span>
                            <span>{msg.sentAt}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Card */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center space-x-1">
                  <span>{currentUser.role.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
