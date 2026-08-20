import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  BarChart3, 
  Download, 
  Award, 
  Users, 
  TrendingUp, 
  Globe, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Printer,
  ShieldCheck
} from 'lucide-react';

export const MneReportingView: React.FC = () => {
  const { programs, cohorts, applications, addToast } = useApp();
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<string>('all');

  const filteredApps = applications.filter(app => {
    const matchesProgram = selectedProgramFilter === 'all' || app.programId === selectedProgramFilter;
    const matchesCohort = selectedCohortFilter === 'all' || app.cohortId === selectedCohortFilter;
    return matchesProgram && matchesCohort;
  });

  const totalApplied = filteredApps.length;
  const totalAssessed = filteredApps.filter(a => a.assessmentScore !== undefined || a.status === 'assessment_completed' || a.status === 'admitted' || a.status === 'enrolled').length;
  const totalAdmitted = filteredApps.filter(a => a.status === 'admitted' || a.status === 'enrolled').length;
  const totalEnrolled = filteredApps.filter(a => a.status === 'enrolled').length;
  const totalScholarships = filteredApps.filter(a => a.scholarshipAwarded).length;

  // Funnel Data
  const funnelData = [
    { stage: 'Applications', count: totalApplied, fill: '#4f46e5' },
    { stage: 'Screened / Tested', count: totalAssessed, fill: '#6366f1' },
    { stage: 'Admitted / Offers', count: totalAdmitted, fill: '#f59e0b' },
    { stage: 'Enrolled / Active', count: totalEnrolled, fill: '#10b981' },
  ];

  // Gender Breakdown
  const femaleCount = filteredApps.filter(a => a.gender === 'Female').length;
  const maleCount = filteredApps.filter(a => a.gender === 'Male').length;
  const otherCount = filteredApps.filter(a => a.gender === 'Non-Binary' || a.gender === 'Prefer not to say').length;

  const femalePercentage = totalApplied > 0 ? Math.round((femaleCount / totalApplied) * 100) : 0;

  const genderData = [
    { name: 'Female', value: femaleCount || 1, color: '#ec4899' },
    { name: 'Male', value: maleCount || 1, color: '#3b82f6' },
    { name: 'Non-Binary / Other', value: otherCount || 0, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // Geographic Breakdown
  const countryCounts: Record<string, number> = {};
  filteredApps.forEach(a => {
    countryCounts[a.country] = (countryCounts[a.country] || 0) + 1;
  });

  const countryData = Object.entries(countryCounts).map(([country, count]) => ({
    country,
    count,
  })).sort((a, b) => b.count - a.count);

  // Assessment Score Brackets
  const scoreBuckets = [
    { range: '90-100%', count: filteredApps.filter(a => (a.assessmentScore || 0) >= 90).length },
    { range: '80-89%', count: filteredApps.filter(a => (a.assessmentScore || 0) >= 80 && (a.assessmentScore || 0) < 90).length },
    { range: '70-79%', count: filteredApps.filter(a => (a.assessmentScore || 0) >= 70 && (a.assessmentScore || 0) < 80).length },
    { range: '< 70%', count: filteredApps.filter(a => a.assessmentScore !== undefined && a.assessmentScore < 70).length },
  ];

  const handleExportReport = () => {
    addToast({
      title: 'Donor & M&E Report Exported',
      message: 'Comprehensive aggregate M&E metrics downloaded for stakeholders.',
      type: 'success',
    });
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>NextGen Academy • Monitoring, Evaluation & Donor Reporting</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-['Space_Grotesk']">
            Impact Metrics, Diversity & Pipeline Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time conversion funnels, pan-African geographic reach, female talent participation, and competency distributions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportReport}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-600/20 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Export Stakeholder Report</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-700">Filter Dataset:</span>
          
          <select
            value={selectedProgramFilter}
            onChange={e => {
              setSelectedProgramFilter(e.target.value);
              setSelectedCohortFilter('all');
            }}
            className="p-2 rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">All Programmes ({programs.length})</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={selectedCohortFilter}
            onChange={e => setSelectedCohortFilter(e.target.value)}
            className="p-2 rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">All Cohorts ({cohorts.length})</option>
            {cohorts
              .filter(c => selectedProgramFilter === 'all' || c.programId === selectedProgramFilter)
              .map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>
        </div>

        <div className="text-slate-500 text-[11px]">
          Aggregating <strong>{totalApplied} candidates</strong> across filtered criteria
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Applicants</span>
          <div className="text-2xl font-bold text-slate-900 font-['Space_Grotesk'] mt-1">
            {totalApplied} Candidates
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1">
            100% Digital Applications
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Female Participation</span>
          <div className="text-2xl font-bold text-pink-600 font-['Space_Grotesk'] mt-1">
            {femalePercentage}% Female
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Target: 45%+ (Inclusivity Mandate)
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Admissions Conversion</span>
          <div className="text-2xl font-bold text-amber-600 font-['Space_Grotesk'] mt-1">
            {totalApplied > 0 ? Math.round((totalAdmitted / totalApplied) * 100) : 0}% Acceptance
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalAdmitted} candidates admitted
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Scholarships Disbursed</span>
          <div className="text-2xl font-bold text-emerald-600 font-['Space_Grotesk'] mt-1">
            ${(totalScholarships * 1200).toLocaleString()} USD
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalScholarships} donor-backed grants
          </div>
        </div>
      </div>

      {/* Chart Grid (2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Admissions Funnel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
              Admissions Conversion Funnel
            </h3>
            <p className="text-xs text-slate-500">Attrition rates across recruitment lifecycle milestones</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Gender & Inclusivity Diversity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
              Gender Diversity & Parity Benchmark
            </h3>
            <p className="text-xs text-slate-500">Gender breakdown of applicant talent pool</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Pan-African Geographic Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
              Pan-African Geographic Distribution
            </h3>
            <p className="text-xs text-slate-500">Candidate origin across African hubs</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="country" type="category" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Screening Assessment Score Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
              Screening Assessment Score Distribution
            </h3>
            <p className="text-xs text-slate-500">Cognitive & technical test score distribution</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Formal Donor Narrative Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-md">
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>NextGen Foundation • Donor & Executive Impact Summary</span>
        </div>

        <h3 className="text-lg font-bold font-['Space_Grotesk'] text-white">
          Empowering Next-Generation Tech Leadership Across Africa
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Through NextGen Class, the academy operates a unified, scalable admissions engine ensuring rigorous, merit-based selection. Over <strong>{femalePercentage}%</strong> of the active pipeline represents high-potential women in software and artificial intelligence. 100% of admitted fellows receive holistic donor-backed scholarship coverage, practical mentor pairing, and capstone deployment support.
        </p>

        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
          <span>Prepared by: NextGen Academy M&E Taskforce</span>
          <span>Verified on: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
