import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LearnerRecord } from '../../types';
import { 
  GraduationCap, 
  Users, 
  Award, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Search, 
  FileText, 
  Sparkles, 
  BookOpen,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const LearnerManagerView: React.FC = () => {
  const { learners, programs, cohorts, addToast } = useApp();
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLearner, setSelectedLearner] = useState<LearnerRecord | null>(null);

  const filteredLearners = learners.filter(l => {
    const matchesCohort = selectedCohortFilter === 'all' || l.cohortId === selectedCohortFilter;
    const matchesSearch = 
      l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.country.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCohort && matchesSearch;
  });

  const averageAttendance = learners.length > 0
    ? Math.round(learners.reduce((acc, l) => acc + l.attendanceRate, 0) / learners.length)
    : 95;

  const averageProgress = learners.length > 0
    ? Math.round(learners.reduce((acc, l) => acc + l.progressPercentage, 0) / learners.length)
    : 80;

  const handleIssueCertificate = (learner: LearnerRecord) => {
    addToast({
      title: 'Certificate Issued & Dispatched',
      message: `Verified completion certificate generated for ${learner.fullName}.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>NextGen Academy • Enrolled Learner & Capstone Management</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-['Space_Grotesk']">
            Enrolled Fellows, Attendance & Capstone Tracking
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor admitted fellows who locked enrollment, track lecture attendance, assignments, and capstones.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-semibold text-slate-700 bg-slate-100 p-2 px-3 rounded-xl">
          <Users className="w-4 h-4 text-emerald-600" />
          <span>{learners.length} Enrolled Fellows Active</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Enrolled Trainees</span>
            <div className="text-2xl font-bold text-slate-900 font-['Space_Grotesk'] mt-0.5">
              {learners.length} Fellows
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              100% Scholarship Backed
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Avg Lecture Attendance</span>
            <div className="text-2xl font-bold text-indigo-600 font-['Space_Grotesk'] mt-0.5">
              {averageAttendance}% Rate
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Live virtual sessions & labs
            </div>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Curriculum Completion</span>
            <div className="text-2xl font-bold text-purple-600 font-['Space_Grotesk'] mt-0.5">
              {averageProgress}% Complete
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Module checkpoints & sprints
            </div>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search enrolled learner..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-500 outline-none"
            />
          </div>

          <select
            value={selectedCohortFilter}
            onChange={e => setSelectedCohortFilter(e.target.value)}
            className="p-2 rounded-xl border border-slate-300 bg-white text-xs"
          >
            <option value="all">All Cohorts ({cohorts.length})</option>
            {cohorts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="text-slate-500 text-[11px]">
          Showing <strong>{filteredLearners.length}</strong> enrolled fellows
        </div>
      </div>

      {/* Learners Roster Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5 px-5">Fellow Name</th>
                <th className="p-3.5">Cohort & Programme</th>
                <th className="p-3.5">Attendance</th>
                <th className="p-3.5">Progress</th>
                <th className="p-3.5">Capstone Title</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLearners.map(learner => {
                const prog = programs.find(p => p.id === learner.programId);
                const coh = cohorts.find(c => c.id === learner.cohortId);

                return (
                  <tr key={learner.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 px-5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={learner.avatar}
                          alt={learner.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{learner.fullName}</div>
                          <div className="text-[11px] text-slate-400">{learner.email} • {learner.country}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{coh?.name}</div>
                      <div className="text-[11px] text-slate-400">{prog?.name}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900">{learner.attendanceRate}%</span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${learner.progressPercentage}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-800 text-[11px]">{learner.progressPercentage}%</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800 max-w-[200px] truncate">
                        {learner.capstoneTitle || 'Autonomous Supply Chain Optimizer'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                        {learner.status}
                      </span>
                    </td>
                    <td className="p-3.5 px-5 text-right">
                      <button
                        onClick={() => handleIssueCertificate(learner)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 transition cursor-pointer"
                      >
                        Issue Certificate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
