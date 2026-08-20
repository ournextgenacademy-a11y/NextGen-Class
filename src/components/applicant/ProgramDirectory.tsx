import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Program, Cohort } from '../../types';
import { 
  Sparkles, 
  Code, 
  TrendingUp, 
  Cloud, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  Layers, 
  BookOpen,
  Award
} from 'lucide-react';

interface ProgramDirectoryProps {
  onSelectProgramForApply: (progId: string, cohortId: string) => void;
}

export const ProgramDirectory: React.FC<ProgramDirectoryProps> = ({
  onSelectProgramForApply,
}) => {
  const { programs, cohorts } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProgramModal, setSelectedProgramModal] = useState<Program | null>(null);

  const categories = ['All', 'Artificial Intelligence', 'Software Engineering', 'Data & Analytics', 'Cloud & DevOps'];

  const filteredPrograms = programs.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.skillsTaught.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getProgramIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Code': return <Code className="w-5 h-5" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5" />;
      case 'Cloud': return <Cloud className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-400/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NextGen Academy • Global Tech Flagships</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk'] tracking-tight">
            Explore Academy Programmes & Cohorts
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Rigorous technical training designed to accelerate African engineers and innovators into global technology leaders. Fully configured through the NextGen Class management system.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-3 relative z-10">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search programmes by skill (e.g. LLMs, React, PyTorch, Docker)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 text-xs pl-10 pr-4 py-2.5 rounded-xl focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-2 rounded-xl whitespace-nowrap font-medium transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Program Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPrograms.map(program => {
          const progCohorts = cohorts.filter(c => c.programId === program.id && c.status !== 'archived');
          const activeOpenCohort = progCohorts.find(c => c.status === 'applications_open' || c.status === 'admissions_open' || c.status === 'assessment_phase');

          return (
            <div
              key={program.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6">
                {/* Category & Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {program.category}
                  </span>
                  <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{program.durationWeeks} Weeks • {program.format}</span>
                  </span>
                </div>

                {/* Title & Icon */}
                <div className="flex items-start space-x-3 mb-2">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${program.color || 'from-indigo-600 to-purple-600'} text-white shadow-sm shrink-0`}>
                    {getProgramIcon(program.icon)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">{program.name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono font-semibold">{program.code}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                  {program.summary || program.description}
                </p>

                {/* Skills Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {program.skillsTaught.slice(0, 4).map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                  {program.skillsTaught.length > 4 && (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                      +{program.skillsTaught.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Cohorts Footer */}
              <div className="bg-slate-50 p-4 px-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                {activeOpenCohort ? (
                  <div>
                    <div className="text-[11px] font-bold text-slate-800 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{activeOpenCohort.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Deadline: <strong className="text-slate-700">{activeOpenCohort.applicationDeadline}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic">
                    Next cohort dates announcing soon
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedProgramModal(program)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                  >
                    Curriculum Details
                  </button>

                  {activeOpenCohort && (
                    <button
                      onClick={() => onSelectProgramForApply(program.id, activeOpenCohort.id)}
                      className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-sm transition cursor-pointer"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Program Detail Modal */}
      {selectedProgramModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {selectedProgramModal.category}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2 font-['Space_Grotesk']">
                  {selectedProgramModal.name}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  {selectedProgramModal.durationWeeks} Weeks • {selectedProgramModal.format} • {selectedProgramModal.code}
                </div>
              </div>
              <button
                onClick={() => setSelectedProgramModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
              <p>{selectedProgramModal.description}</p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Target Audience & Prerequisites:</div>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  {selectedProgramModal.prerequisites.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-800 mb-2">Core Skills & Frameworks Covered:</div>
              <div className="flex flex-wrap gap-2">
                {selectedProgramModal.skillsTaught.map((skill, i) => (
                  <span key={i} className="text-xs bg-indigo-50 text-indigo-900 font-medium px-3 py-1 rounded-lg border border-indigo-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedProgramModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
              {cohorts.find(c => c.programId === selectedProgramModal.id) && (
                <button
                  onClick={() => {
                    const c = cohorts.find(ch => ch.programId === selectedProgramModal.id);
                    if (c) {
                      onSelectProgramForApply(selectedProgramModal.id, c.id);
                      setSelectedProgramModal(null);
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl shadow transition"
                >
                  Start Application
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
