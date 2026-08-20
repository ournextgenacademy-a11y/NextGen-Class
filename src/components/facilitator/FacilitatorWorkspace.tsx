import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  Layers, 
  FileCheck,
  AlertCircle
} from 'lucide-react';

export const FacilitatorWorkspace: React.FC = () => {
  const { currentUser, programs, cohorts, learners, assessments } = useApp();

  const activeCohorts = cohorts.filter(c => c.status === 'active' || c.status === 'in_session' || c.status === 'assessment_phase');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-['Plus_Jakarta_Sans']">
      {/* Role Architecture Boundary Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-amber-900">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-amber-950 text-sm font-['Space_Grotesk']">
              Facilitator Workspace (Architectural Boundary)
            </h4>
            <p className="text-amber-800">
              You are logged in as <strong>{currentUser.name}</strong> (Role: <code className="font-mono font-semibold">FACILITATOR</code>). 
              Facilitators have authorized access to assigned cohort classes, learner attendance, and assessment evaluations.
            </p>
            <div className="pt-1.5 flex flex-wrap gap-2 text-[11px]">
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-medium">✓ Class & Module Delivery</span>
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-medium">✓ Assessment Grading</span>
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-medium">✓ Learner Cohort View</span>
              <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-medium">✗ Cannot Create Programmes</span>
              <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-medium">✗ Cannot Issue Final Admissions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Active Cohorts</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{activeCohorts.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Assigned facilitation tracks</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Active Learners</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{learners.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Enrolled across active tracks</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Grading</span>
            <FileCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">14</div>
          <div className="text-[11px] text-slate-500 mt-1">Assessment submissions in queue</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Next Live Session</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2 truncate">Today, 4:00 PM</div>
          <div className="text-[11px] text-slate-500 mt-1">GenAI Applied Lab Session</div>
        </div>
      </div>

      {/* Cohorts & Assigned Tracks */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
          Assigned Facilitation Cohorts
        </h3>

        <div className="divide-y divide-slate-100">
          {activeCohorts.map(cohort => {
            const prog = programs.find(p => p.id === cohort.programId);
            return (
              <div key={cohort.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{cohort.name}</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {cohort.code}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Programme: <strong>{prog?.name || 'Academy Track'}</strong> • Schedule: {cohort.schedule || 'Weekdays 4:00 PM'}
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-500">Capacity: <strong>{cohort.enrolledCount || 0} / {cohort.capacity}</strong> Enrolled</span>
                  <button className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl font-medium transition cursor-pointer">
                    Open Class Hub
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
