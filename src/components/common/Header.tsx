import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bell, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  Users, 
  LogOut
} from 'lucide-react';
import { Logo } from './Logo';

interface HeaderProps {
  onLogout?: () => void;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, currentPath = '/apply', onNavigate }) => {
  const { 
    currentUser, 
    activePortal, 
    setActivePortal, 
    messages,
    addToast
  } = useApp();

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-zinc-200">
      {/* Top Bar: Clean section with Sign Out button */}
      {onLogout && (
        <div className="bg-black text-white text-xs px-4 sm:px-6 lg:px-8 py-2 border-b border-zinc-800 flex justify-end items-center">
          <div className="max-w-7xl mx-auto w-full flex justify-end items-center">
            <button
              id="signout-btn"
              onClick={onLogout}
              title="Sign Out to Auth Gateway"
              className="flex items-center space-x-1.5 text-zinc-300 hover:text-white text-xs px-3 py-1 rounded-lg bg-zinc-900 hover:bg-orange-600 border border-zinc-700/80 hover:border-orange-500 transition cursor-pointer font-medium shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Logo size={40} showText={true} textVariant="light" />
          </div>

          {/* Role-Aware Portal Navigation Tabs */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
            {/* Applicant Portal: Available to Applicants and Program Managers */}
            {(isApplicant || isManager) && (
              <button
                id="nav-portal-applicant"
                onClick={() => handlePortalSwitch('applicant')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activePortal === 'applicant'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-zinc-600 hover:text-black'
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
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
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
                    ? 'bg-black text-white shadow-sm'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-orange-400" />
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
                    ? 'bg-black text-white shadow-sm'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                <span>Learner Hub</span>
                <span className="text-[9px] bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded font-bold">Active</span>
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
                className="p-2 text-zinc-600 hover:text-black rounded-lg hover:bg-zinc-100 transition relative cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadMessages.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-zinc-200 py-2 z-50">
                  <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900">Academy Notices & Messages</span>
                    <span className="text-[10px] bg-orange-50 text-orange-700 font-semibold px-1.5 py-0.5 rounded">
                      {unreadMessages.length} New
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
                    {unreadMessages.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-400">
                        No new notifications at this time.
                      </div>
                    ) : (
                      unreadMessages.slice(0, 4).map(msg => (
                        <div key={msg.id} className="p-3 hover:bg-zinc-50 transition text-xs">
                          <div className="font-semibold text-zinc-900 truncate">{msg.subject}</div>
                          <div className="text-[11px] text-zinc-600 line-clamp-2 mt-0.5">{msg.content}</div>
                          <div className="text-[10px] text-zinc-400 mt-1 flex items-center justify-between">
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
            <div className="flex items-center space-x-2 pl-2 border-l border-zinc-200">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-zinc-200 shadow-sm"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-zinc-900 leading-tight truncate max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-orange-600 font-semibold uppercase tracking-wider flex items-center space-x-1">
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
