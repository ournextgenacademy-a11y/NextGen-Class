import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  GraduationCap, 
  Video, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Award, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Download, 
  ExternalLink,
  Code2,
  Users
} from 'lucide-react';

export const LearnerDashboard: React.FC = () => {
  const { currentUser, programs, cohorts, learners, addToast } = useApp();
  const [checkedInToday, setCheckedInToday] = useState(false);

  // Find enrolled learner or fallback
  const learner = learners.find(l => l.applicantId === currentUser.id) || learners[0];
  const program = programs.find(p => p.id === learner?.programId) || programs[0];
  const cohort = cohorts.find(c => c.id === learner?.cohortId) || cohorts[0];

  const handleAttendanceCheckin = () => {
    setCheckedInToday(true);
    addToast({
      title: 'Attendance Confirmed!',
      message: 'You are marked present for today’s live workshop session.',
      type: 'success',
    });
  };

  const handleDownloadCertificate = () => {
    addToast({
      title: 'Certificate Downloaded',
      message: `NextGen Academy Fellowship Enrollment Certificate generated for ${currentUser.name}.`,
      type: 'success',
    });
  };

  const modules = [
    { num: 1, title: 'Foundations of Modern LLMs & Architecture', status: 'completed', score: '98%' },
    { num: 2, title: 'Multi-Agent Orchestration with LangGraph & CrewAI', status: 'completed', score: '94%' },
    { num: 3, title: 'Enterprise RAG & Hybrid Vector Retrieval Systems', status: 'in_progress', score: 'Active' },
    { num: 4, title: 'Autonomous Workflows & Production Fine-Tuning', status: 'upcoming', score: 'Starts Oct 12' },
    { num: 5, title: 'Capstone Defense & Industry Demo Day', status: 'upcoming', score: 'Final' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/30">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>NextGen Academy • Enrolled Fellow Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk'] text-white">
            Welcome, Fellow {currentUser.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Enrolled in <strong>{program.name}</strong> • <strong>{cohort.name}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!checkedInToday ? (
            <button
              onClick={handleAttendanceCheckin}
              className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Check-in to Today's Class</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-4 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Checked In (100% Present)</span>
            </div>
          )}

          <button
            onClick={handleDownloadCertificate}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Fellowship Letter</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Curriculum Progress</span>
          <div className="text-2xl font-bold text-slate-900 font-['Space_Grotesk'] mt-1">
            {learner?.progressPercentage || 65}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${learner?.progressPercentage || 65}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Attendance Rate</span>
          <div className="text-2xl font-bold text-emerald-600 font-['Space_Grotesk'] mt-1">
            {learner?.attendanceRate || 96}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">24 of 25 sessions attended</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Scholarship Award</span>
          <div className="text-2xl font-bold text-amber-600 font-['Space_Grotesk'] mt-1">
            100% Full Grant
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Donor-sponsored tuition</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Capstone Status</span>
          <div className="text-2xl font-bold text-indigo-600 font-['Space_Grotesk'] mt-1">
            Sprint 2 / 4
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Autonomous Agent Optimizer</div>
        </div>
      </div>

      {/* Live Classroom & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Live Session (1 col) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            <Video className="w-4 h-4" />
            <span>Upcoming Live Masterclass</span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-3">
            <div className="text-xs font-bold text-indigo-950">
              Module 3: Advanced Agentic Tool Use & Structured Outputs
            </div>
            <div className="text-[11px] text-indigo-800 space-y-1">
              <div>📅 <strong>Thursday, 18:00 - 20:30 GMT</strong></div>
              <div>👨‍🏫 Lead Faculty: Dr. Sarah Mensah (NextGen AI Fellow)</div>
            </div>

            <button
              onClick={() => {
                addToast({
                  title: 'Joining Virtual Classroom',
                  message: 'Connecting to NextGen Class live Zoom room...',
                  type: 'info',
                });
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Enter Live Class (Zoom)</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
            <div className="font-bold text-slate-800">Weekly Schedule Routine:</div>
            <div>• Tuesdays & Thursdays: 18:00 - 20:30 GMT</div>
            <div>• Saturday Labs: 10:00 - 14:00 GMT</div>
          </div>
        </div>

        {/* Course Modules Roadmap (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                Curriculum Modules & Checkpoints
              </h3>
              <p className="text-xs text-slate-500">Weekly technical projects and code reviews</p>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 font-semibold">
              3 of 5 Modules Completed
            </span>
          </div>

          <div className="space-y-3">
            {modules.map(mod => (
              <div
                key={mod.num}
                className={`p-4 rounded-xl border flex items-center justify-between text-xs transition ${
                  mod.status === 'completed'
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : mod.status === 'in_progress'
                    ? 'bg-indigo-50/50 border-indigo-200 font-semibold ring-1 ring-indigo-300'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    mod.status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : mod.status === 'in_progress'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {mod.status === 'completed' ? '✓' : mod.num}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900">{mod.title}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{mod.status.replace('_', ' ')}</div>
                  </div>
                </div>

                <div className="text-right font-bold text-slate-700">
                  {mod.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Capstone Project Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
              Industry Capstone Project
            </span>
            <h3 className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">
              Autonomous Supply Chain & Logistics Optimization Agent
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl">
              An agentic multi-model system built to automate inventory re-ordering, dynamic pricing, and route optimization for West African logistics hubs.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                addToast({
                  title: 'GitHub Repo Connected',
                  message: 'Workspace repository synchronized with faculty reviewers.',
                  type: 'info',
                });
              }}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
              <span>Submit Project Repository</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
