import { Application, Cohort, Program, Assessment, AssessmentSubmission } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface DateRangeFilter {
  preset: 'all' | '7d' | '30d' | '90d' | 'ytd' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface MneFilters {
  programId: string; // 'all' or specific program ID
  cohortId: string; // 'all' or specific cohort ID
  dateRange: DateRangeFilter;
  status: string; // 'all' or specific ApplicationStatus
  searchQuery?: string;
}

export interface MetricCalculationTrace {
  metricName: string;
  category: 'applications' | 'assessment' | 'admissions' | 'demographics';
  value: number | string;
  formattedValue: string;
  formula: string;
  numerator?: number;
  numeratorDescription?: string;
  denominator?: number;
  denominatorDescription?: string;
  matchingRecordIds: string[];
  notes?: string;
}

export interface DemographicsCategoryBreakdown {
  label: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface MneReportMetrics {
  // APPLICATIONS
  totalApplicants: number;
  startedApplications: number;
  completedApplications: number;
  submittedApplications: number;
  draftApplications: number;
  applicationCompletionRate: number; // (completed / started) * 100

  // ASSESSMENT
  assessmentEligible: number;
  assessmentStarted: number;
  assessmentCompleted: number;
  assessmentCompletionRate: number; // (completed / eligible) * 100
  averageScore: number; // mean score of assessed
  passingScoreThreshold: number;
  passedCount: number;
  failedCount: number;
  passRate: number; // (passed / completed) * 100
  scoreDistribution: { range: string; count: number; percentage: number }[];

  // ADMISSIONS
  acceptedCount: number;
  rejectedCount: number;
  waitlistedCount: number;
  underReviewCount: number;
  acceptanceRate: number; // (accepted / submitted) * 100
  acceptanceRateOfTotal: number; // (accepted / total) * 100
  enrolledCount: number;
  scholarshipsAwardedCount: number;
  scholarshipsTotalValue: number;

  // DEMOGRAPHICS
  gender: {
    female: number;
    male: number;
    nonBinary: number;
    preferNotToSay: number;
    unspecified: number;
    femalePercentage: number;
    malePercentage: number;
    otherPercentage: number;
    breakdown: DemographicsCategoryBreakdown[];
  };
  location: {
    countries: DemographicsCategoryBreakdown[];
    cities: DemographicsCategoryBreakdown[];
    totalCountries: number;
  };
  education: {
    breakdown: DemographicsCategoryBreakdown[];
  };
  employment: {
    breakdown: DemographicsCategoryBreakdown[];
  };

  // AUDIT & TRACEABILITY
  traces: Record<string, MetricCalculationTrace>;
  calculatedAt: string;
}

/**
 * Filter applications based on selected Programme, Cohort, Date Range, Status and Search
 */
export function filterApplications(
  applications: Application[],
  filters: MneFilters
): Application[] {
  return applications.filter(app => {
    // 1. Programme Filter
    if (filters.programId !== 'all' && app.programId !== filters.programId) {
      return false;
    }

    // 2. Cohort Filter
    if (filters.cohortId !== 'all' && app.cohortId !== filters.cohortId) {
      return false;
    }

    // 3. Status Filter
    if (filters.status !== 'all') {
      if (filters.status === 'completed') {
        if (app.status === 'draft') return false;
      } else if (filters.status === 'in_progress') {
        if (app.status !== 'draft' && app.status !== 'under_review' && app.status !== 'assessment_pending' && app.status !== 'assessment_invited') return false;
      } else if (app.status !== filters.status) {
        return false;
      }
    }

    // 4. Date Range Filter (checked against appliedDate, or submittedAt, or draftSavedAt)
    const appDateStr = app.appliedDate || app.submittedAt || app.updatedDate || '';
    if (appDateStr) {
      const appDate = new Date(appDateStr).getTime();
      const now = new Date().getTime();

      if (filters.dateRange.preset === '7d') {
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        if (appDate < sevenDaysAgo) return false;
      } else if (filters.dateRange.preset === '30d') {
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        if (appDate < thirtyDaysAgo) return false;
      } else if (filters.dateRange.preset === '90d') {
        const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
        if (appDate < ninetyDaysAgo) return false;
      } else if (filters.dateRange.preset === 'ytd') {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
        if (appDate < startOfYear) return false;
      } else if (filters.dateRange.preset === 'custom') {
        if (filters.dateRange.startDate) {
          const start = new Date(filters.dateRange.startDate).getTime();
          if (appDate < start) return false;
        }
        if (filters.dateRange.endDate) {
          // Set to end of day
          const end = new Date(filters.dateRange.endDate).getTime() + 24 * 60 * 60 * 1000 - 1;
          if (appDate > end) return false;
        }
      }
    }

    // 5. Search Query
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase();
      const matchName = app.fullName.toLowerCase().includes(q);
      const matchEmail = app.email.toLowerCase().includes(q);
      const matchCountry = (app.country || '').toLowerCase().includes(q);
      const matchCity = (app.city || '').toLowerCase().includes(q);
      const matchEdu = (app.educationLevel || '').toLowerCase().includes(q);
      const matchEmp = (app.employmentStatus || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCountry && !matchCity && !matchEdu && !matchEmp) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculates complete M&E and Application Dashboard metrics from actual database records
 */
export function calculateMneMetrics(
  filteredApps: Application[],
  cohorts: Cohort[] = [],
  assessments: Assessment[] = [],
  submissions: AssessmentSubmission[] = []
): MneReportMetrics {
  const traces: Record<string, MetricCalculationTrace> = {};

  // ----------------------------------------------------
  // 1. APPLICATIONS METRICS
  // ----------------------------------------------------
  const totalApplicants = filteredApps.length;
  traces['totalApplicants'] = {
    metricName: 'Total Applicants',
    category: 'applications',
    value: totalApplicants,
    formattedValue: `${totalApplicants}`,
    formula: 'COUNT(Applications matching active filters)',
    matchingRecordIds: filteredApps.map(a => a.id),
  };

  // Started applications: All applications that entered the pipeline (draft or submitted)
  const startedApps = filteredApps; // Every record is a started application
  const startedApplications = startedApps.length;
  traces['startedApplications'] = {
    metricName: 'Started Applications',
    category: 'applications',
    value: startedApplications,
    formattedValue: `${startedApplications}`,
    formula: 'COUNT(Applications initiated / draft or submitted)',
    matchingRecordIds: startedApps.map(a => a.id),
  };

  // Completed applications: Applications where the applicant completed the full dossier
  // (i.e. status !== 'draft', or progressPercentage === 100, or submittedAt / appliedDate is set)
  const completedApps = filteredApps.filter(a => a.status !== 'draft');
  const completedApplications = completedApps.length;
  traces['completedApplications'] = {
    metricName: 'Completed Applications',
    category: 'applications',
    value: completedApplications,
    formattedValue: `${completedApplications}`,
    formula: 'COUNT(Applications with status != "draft")',
    matchingRecordIds: completedApps.map(a => a.id),
  };

  // Submitted applications: Officially submitted into admissions review
  const submittedApps = filteredApps.filter(a => 
    a.status === 'submitted' ||
    a.status === 'under_review' ||
    a.status === 'assessment_pending' ||
    a.status === 'assessment_invited' ||
    a.status === 'assessment_completed' ||
    a.status === 'interview_scheduled' ||
    a.status === 'admitted' ||
    a.status === 'accepted' ||
    a.status === 'waitlisted' ||
    a.status === 'rejected' ||
    a.status === 'enrolled'
  );
  const submittedApplications = submittedApps.length;
  traces['submittedApplications'] = {
    metricName: 'Submitted Applications',
    category: 'applications',
    value: submittedApplications,
    formattedValue: `${submittedApplications}`,
    formula: 'COUNT(Applications submitted to review)',
    matchingRecordIds: submittedApps.map(a => a.id),
  };

  const draftApplications = filteredApps.filter(a => a.status === 'draft').length;

  // Application completion rate: (Completed Applications / Started Applications) * 100
  const appCompRateRaw = startedApplications > 0 ? (completedApplications / startedApplications) * 100 : 0;
  const applicationCompletionRate = Math.round(appCompRateRaw * 10) / 10;
  traces['applicationCompletionRate'] = {
    metricName: 'Application Completion Rate',
    category: 'applications',
    value: applicationCompletionRate,
    formattedValue: `${applicationCompletionRate.toFixed(1)}%`,
    formula: '(Completed Applications / Started Applications) * 100',
    numerator: completedApplications,
    numeratorDescription: 'Completed Applications (status != "draft")',
    denominator: startedApplications,
    denominatorDescription: 'Started Applications (all initiated)',
    matchingRecordIds: completedApps.map(a => a.id),
  };

  // ----------------------------------------------------
  // 2. ASSESSMENT METRICS
  // ----------------------------------------------------
  // Assessment eligible: Applicants whose status is past draft and eligible for testing
  const eligibleApps = filteredApps.filter(a => a.status !== 'draft');
  const assessmentEligible = eligibleApps.length;
  traces['assessmentEligible'] = {
    metricName: 'Assessment Eligible',
    category: 'assessment',
    value: assessmentEligible,
    formattedValue: `${assessmentEligible}`,
    formula: 'COUNT(Submitted Candidates Eligible for Assessment Screening)',
    matchingRecordIds: eligibleApps.map(a => a.id),
  };

  // Assessment started: Candidates who were invited or took part
  const startedAsmApps = filteredApps.filter(a => 
    a.status === 'assessment_invited' ||
    a.status === 'assessment_completed' ||
    a.status === 'interview_scheduled' ||
    a.status === 'admitted' ||
    a.status === 'accepted' ||
    a.status === 'waitlisted' ||
    a.status === 'rejected' ||
    a.status === 'enrolled' ||
    a.assessmentScore !== undefined ||
    !!a.assessmentSubmissionId
  );
  const assessmentStarted = startedAsmApps.length;
  traces['assessmentStarted'] = {
    metricName: 'Assessment Started / Invited',
    category: 'assessment',
    value: assessmentStarted,
    formattedValue: `${assessmentStarted}`,
    formula: 'COUNT(Candidates who initiated or were invited to assessment)',
    matchingRecordIds: startedAsmApps.map(a => a.id),
  };

  // Assessment completed: Candidates who have a recorded assessmentScore or status === 'assessment_completed'
  const completedAsmApps = filteredApps.filter(a => 
    a.assessmentScore !== undefined ||
    a.status === 'assessment_completed' ||
    ((a.status === 'admitted' || a.status === 'accepted' || a.status === 'enrolled' || a.status === 'waitlisted' || a.status === 'rejected') && a.assessmentScore !== undefined)
  );
  const assessmentCompleted = completedAsmApps.length;
  traces['assessmentCompleted'] = {
    metricName: 'Assessment Completed',
    category: 'assessment',
    value: assessmentCompleted,
    formattedValue: `${assessmentCompleted}`,
    formula: 'COUNT(Candidates with recorded assessment submission/score)',
    matchingRecordIds: completedAsmApps.map(a => a.id),
  };

  // Assessment completion rate: (Assessment Completed / Assessment Eligible) * 100
  const asmCompRateRaw = assessmentEligible > 0 ? (assessmentCompleted / assessmentEligible) * 100 : 0;
  const assessmentCompletionRate = Math.round(asmCompRateRaw * 10) / 10;
  traces['assessmentCompletionRate'] = {
    metricName: 'Assessment Completion Rate',
    category: 'assessment',
    value: assessmentCompletionRate,
    formattedValue: `${assessmentCompletionRate.toFixed(1)}%`,
    formula: '(Assessment Completed / Assessment Eligible) * 100',
    numerator: assessmentCompleted,
    numeratorDescription: 'Assessment Completed Candidates',
    denominator: assessmentEligible,
    denominatorDescription: 'Assessment Eligible Candidates',
    matchingRecordIds: completedAsmApps.map(a => a.id),
  };

  // Average score & Pass rate
  const scoredApps = completedAsmApps.filter(a => typeof a.assessmentScore === 'number');
  const passingScoreThreshold = 70; // Standard threshold percentage

  let averageScore = 0;
  if (scoredApps.length > 0) {
    const totalScoreSum = scoredApps.reduce((acc, a) => acc + (a.assessmentScore || 0), 0);
    averageScore = Math.round((totalScoreSum / scoredApps.length) * 10) / 10;
  }
  traces['averageScore'] = {
    metricName: 'Average Assessment Score',
    category: 'assessment',
    value: averageScore,
    formattedValue: `${averageScore.toFixed(1)}%`,
    formula: 'SUM(Assessment Scores) / COUNT(Scored Candidates)',
    numerator: scoredApps.reduce((acc, a) => acc + (a.assessmentScore || 0), 0),
    numeratorDescription: 'Sum of assessment percentage scores',
    denominator: scoredApps.length,
    denominatorDescription: 'Count of scored candidates',
    matchingRecordIds: scoredApps.map(a => a.id),
  };

  const passedApps = scoredApps.filter(a => (a.assessmentScore || 0) >= passingScoreThreshold);
  const failedApps = scoredApps.filter(a => (a.assessmentScore || 0) < passingScoreThreshold);
  const passedCount = passedApps.length;
  const failedCount = failedApps.length;

  const passRateRaw = scoredApps.length > 0 ? (passedCount / scoredApps.length) * 100 : 0;
  const passRate = Math.round(passRateRaw * 10) / 10;
  traces['passRate'] = {
    metricName: 'Assessment Pass Rate',
    category: 'assessment',
    value: passRate,
    formattedValue: `${passRate.toFixed(1)}%`,
    formula: `COUNT(Score >= ${passingScoreThreshold}%) / COUNT(Scored Candidates) * 100`,
    numerator: passedCount,
    numeratorDescription: `Candidates scoring >= ${passingScoreThreshold}%`,
    denominator: scoredApps.length,
    denominatorDescription: 'Total scored candidates',
    matchingRecordIds: passedApps.map(a => a.id),
  };

  // Score distribution brackets
  const b90_100 = scoredApps.filter(a => (a.assessmentScore || 0) >= 90).length;
  const b80_89 = scoredApps.filter(a => (a.assessmentScore || 0) >= 80 && (a.assessmentScore || 0) < 90).length;
  const b70_79 = scoredApps.filter(a => (a.assessmentScore || 0) >= 70 && (a.assessmentScore || 0) < 80).length;
  const b60_69 = scoredApps.filter(a => (a.assessmentScore || 0) >= 60 && (a.assessmentScore || 0) < 70).length;
  const bBelow60 = scoredApps.filter(a => (a.assessmentScore || 0) < 60).length;
  const totalScored = scoredApps.length || 1;

  const scoreDistribution = [
    { range: '90 - 100% (Distinction)', count: b90_100, percentage: Math.round((b90_100 / totalScored) * 100) },
    { range: '80 - 89% (Proficient)', count: b80_89, percentage: Math.round((b80_89 / totalScored) * 100) },
    { range: '70 - 79% (Passed)', count: b70_79, percentage: Math.round((b70_79 / totalScored) * 100) },
    { range: '60 - 69% (Borderline)', count: b60_69, percentage: Math.round((b60_69 / totalScored) * 100) },
    { range: '< 60% (Unsuccessful)', count: bBelow60, percentage: Math.round((bBelow60 / totalScored) * 100) },
  ];

  // ----------------------------------------------------
  // 3. ADMISSIONS METRICS
  // ----------------------------------------------------
  const acceptedApps = filteredApps.filter(a => a.status === 'admitted' || a.status === 'accepted' || a.status === 'enrolled');
  const acceptedCount = acceptedApps.length;
  traces['acceptedCount'] = {
    metricName: 'Accepted Candidates',
    category: 'admissions',
    value: acceptedCount,
    formattedValue: `${acceptedCount}`,
    formula: 'COUNT(Applications with status admitted, accepted, or enrolled)',
    matchingRecordIds: acceptedApps.map(a => a.id),
  };

  const rejectedApps = filteredApps.filter(a => a.status === 'rejected');
  const rejectedCount = rejectedApps.length;
  traces['rejectedCount'] = {
    metricName: 'Rejected Candidates',
    category: 'admissions',
    value: rejectedCount,
    formattedValue: `${rejectedCount}`,
    formula: 'COUNT(Applications with status rejected)',
    matchingRecordIds: rejectedApps.map(a => a.id),
  };

  const waitlistedApps = filteredApps.filter(a => a.status === 'waitlisted');
  const waitlistedCount = waitlistedApps.length;
  traces['waitlistedCount'] = {
    metricName: 'Waitlisted Candidates',
    category: 'admissions',
    value: waitlistedCount,
    formattedValue: `${waitlistedCount}`,
    formula: 'COUNT(Applications with status waitlisted)',
    matchingRecordIds: waitlistedApps.map(a => a.id),
  };

  const underReviewApps = filteredApps.filter(a => a.status === 'under_review' || a.status === 'interview_scheduled');
  const underReviewCount = underReviewApps.length;

  const enrolledApps = filteredApps.filter(a => a.status === 'enrolled');
  const enrolledCount = enrolledApps.length;

  // Acceptance rate: (Accepted / Submitted Applications) * 100
  const accRateRaw = submittedApplications > 0 ? (acceptedCount / submittedApplications) * 100 : 0;
  const acceptanceRate = Math.round(accRateRaw * 10) / 10;
  traces['acceptanceRate'] = {
    metricName: 'Admissions Acceptance Rate',
    category: 'admissions',
    value: acceptanceRate,
    formattedValue: `${acceptanceRate.toFixed(1)}%`,
    formula: '(Accepted Candidates / Submitted Applications) * 100',
    numerator: acceptedCount,
    numeratorDescription: 'Accepted / Admitted / Enrolled Candidates',
    denominator: submittedApplications,
    denominatorDescription: 'Total Submitted Applications',
    matchingRecordIds: acceptedApps.map(a => a.id),
  };

  const acceptanceRateOfTotal = totalApplicants > 0 ? Math.round((acceptedCount / totalApplicants) * 1000) / 10 : 0;

  // Scholarships
  const scholarshipApps = acceptedApps.filter(a => a.scholarshipAwarded);
  const scholarshipsAwardedCount = scholarshipApps.length;
  const scholarshipsTotalValue = scholarshipsAwardedCount * 1200; // $1,200 per standard grant

  // ----------------------------------------------------
  // 4. DEMOGRAPHICS METRICS
  // ----------------------------------------------------
  // Gender
  const femaleCount = filteredApps.filter(a => a.gender === 'Female').length;
  const maleCount = filteredApps.filter(a => a.gender === 'Male').length;
  const nonBinaryCount = filteredApps.filter(a => a.gender === 'Non-Binary').length;
  const preferNotSayCount = filteredApps.filter(a => a.gender === 'Prefer not to say').length;
  const unspecifiedGenderCount = filteredApps.filter(a => !a.gender).length;

  const validGenderTotal = totalApplicants > 0 ? totalApplicants : 1;
  const femalePercentage = Math.round((femaleCount / validGenderTotal) * 100);
  const malePercentage = Math.round((maleCount / validGenderTotal) * 100);
  const otherPercentage = Math.round(((nonBinaryCount + preferNotSayCount + unspecifiedGenderCount) / validGenderTotal) * 100);

  const genderBreakdown: DemographicsCategoryBreakdown[] = [
    { label: 'Female', count: femaleCount, percentage: femalePercentage, color: '#ec4899' },
    { label: 'Male', count: maleCount, percentage: malePercentage, color: '#3b82f6' },
    { label: 'Non-Binary', count: nonBinaryCount, percentage: Math.round((nonBinaryCount / validGenderTotal) * 100), color: '#8b5cf6' },
    { label: 'Prefer not to say', count: preferNotSayCount, percentage: Math.round((preferNotSayCount / validGenderTotal) * 100), color: '#94a3b8' },
  ].filter(g => g.count > 0);

  traces['femaleParticipationRate'] = {
    metricName: 'Female Participation Rate',
    category: 'demographics',
    value: femalePercentage,
    formattedValue: `${femalePercentage}%`,
    formula: '(Female Applicants / Total Applicants) * 100',
    numerator: femaleCount,
    numeratorDescription: 'Female candidates count',
    denominator: totalApplicants,
    denominatorDescription: 'Total applicants count',
    matchingRecordIds: filteredApps.filter(a => a.gender === 'Female').map(a => a.id),
  };

  // Location (Country & City)
  const countryCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};

  filteredApps.forEach(a => {
    const c = a.country || 'Unspecified Country';
    countryCounts[c] = (countryCounts[c] || 0) + 1;

    const city = a.city ? `${a.city}, ${a.country || ''}` : 'Unspecified City';
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });

  const countryBreakdown: DemographicsCategoryBreakdown[] = Object.entries(countryCounts)
    .map(([country, count]) => ({
      label: country,
      count,
      percentage: Math.round((count / validGenderTotal) * 100),
      color: '#6366f1',
    }))
    .sort((a, b) => b.count - a.count);

  const cityBreakdown: DemographicsCategoryBreakdown[] = Object.entries(cityCounts)
    .map(([city, count]) => ({
      label: city,
      count,
      percentage: Math.round((count / validGenderTotal) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Education Level
  const eduCounts: Record<string, number> = {};
  filteredApps.forEach(a => {
    const edu = a.educationLevel || 'Not Specified';
    eduCounts[edu] = (eduCounts[edu] || 0) + 1;
  });

  const educationBreakdown: DemographicsCategoryBreakdown[] = Object.entries(eduCounts)
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / validGenderTotal) * 100),
      color: '#06b6d4',
    }))
    .sort((a, b) => b.count - a.count);

  // Employment Status
  const empCounts: Record<string, number> = {};
  filteredApps.forEach(a => {
    const emp = a.employmentStatus || 'Not Specified';
    empCounts[emp] = (empCounts[emp] || 0) + 1;
  });

  const employmentBreakdown: DemographicsCategoryBreakdown[] = Object.entries(empCounts)
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / validGenderTotal) * 100),
      color: '#10b981',
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalApplicants,
    startedApplications,
    completedApplications,
    submittedApplications,
    draftApplications,
    applicationCompletionRate,

    assessmentEligible,
    assessmentStarted,
    assessmentCompleted,
    assessmentCompletionRate,
    averageScore,
    passingScoreThreshold,
    passedCount,
    failedCount,
    passRate,
    scoreDistribution,

    acceptedCount,
    rejectedCount,
    waitlistedCount,
    underReviewCount,
    acceptanceRate,
    acceptanceRateOfTotal,
    enrolledCount,
    scholarshipsAwardedCount,
    scholarshipsTotalValue,

    gender: {
      female: femaleCount,
      male: maleCount,
      nonBinary: nonBinaryCount,
      preferNotToSay: preferNotSayCount,
      unspecified: unspecifiedGenderCount,
      femalePercentage,
      malePercentage,
      otherPercentage,
      breakdown: genderBreakdown,
    },
    location: {
      countries: countryBreakdown,
      cities: cityBreakdown,
      totalCountries: Object.keys(countryCounts).length,
    },
    education: {
      breakdown: educationBreakdown,
    },
    employment: {
      breakdown: employmentBreakdown,
    },

    traces,
    calculatedAt: new Date().toISOString(),
  };
}

// ----------------------------------------------------
// EXPORT UTILITIES: CSV & XLSX
// ----------------------------------------------------

/**
 * Exports application dataset & summary metrics to a standard CSV
 */
export function exportApplicationsToCSV(
  applications: Application[],
  metrics: MneReportMetrics,
  programs: Program[] = [],
  cohorts: Cohort[] = []
): void {
  const getProgName = (id: string) => programs.find(p => p.id === id)?.name || id;
  const getCohName = (id: string) => cohorts.find(c => c.id === id)?.name || id;

  // Header row
  const headers = [
    'Application ID',
    'Full Name',
    'Email',
    'Phone',
    'Programme',
    'Cohort',
    'Status',
    'Applied Date',
    'Updated Date',
    'Gender',
    'Country',
    'City',
    'Age Range',
    'Education Level',
    'Field of Study',
    'Employment Status',
    'Years Experience',
    'Programming Background',
    'Assessment Score (%)',
    'Scholarship Awarded',
    'Scholarship %',
    'Starred',
  ];

  // Data rows
  const rows = applications.map(app => [
    `"${app.id}"`,
    `"${(app.fullName || '').replace(/"/g, '""')}"`,
    `"${(app.email || '').replace(/"/g, '""')}"`,
    `"${(app.phone || '').replace(/"/g, '""')}"`,
    `"${getProgName(app.programId).replace(/"/g, '""')}"`,
    `"${getCohName(app.cohortId).replace(/"/g, '""')}"`,
    `"${app.status}"`,
    `"${app.appliedDate || ''}"`,
    `"${app.updatedDate || ''}"`,
    `"${app.gender || ''}"`,
    `"${(app.country || '').replace(/"/g, '""')}"`,
    `"${(app.city || '').replace(/"/g, '""')}"`,
    `"${app.ageRange || ''}"`,
    `"${(app.educationLevel || '').replace(/"/g, '""')}"`,
    `"${(app.fieldOfStudy || '').replace(/"/g, '""')}"`,
    `"${(app.employmentStatus || '').replace(/"/g, '""')}"`,
    `"${(app.yearsExperience || '').replace(/"/g, '""')}"`,
    `"${(app.programmingBackground || '').replace(/"/g, '""')}"`,
    app.assessmentScore !== undefined ? app.assessmentScore : '',
    app.scholarshipAwarded ? 'YES' : 'NO',
    app.scholarshipPercentage || 0,
    app.starred ? 'YES' : 'NO',
  ]);

  const csvContent = [
    '# NEXTGEN CLASS - APPLICATION & M&E REPORT',
    `# Generated At: ${new Date().toLocaleString()}`,
    `# Total Applicants: ${metrics.totalApplicants} | Completion Rate: ${metrics.applicationCompletionRate}% | Assessment Pass Rate: ${metrics.passRate}% | Acceptance Rate: ${metrics.acceptanceRate}%`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `NextGen_Applications_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports application dataset & multi-tab M&E summary into an Excel (.xlsx) file
 */
export function exportApplicationsToXLSX(
  applications: Application[],
  metrics: MneReportMetrics,
  programs: Program[] = [],
  cohorts: Cohort[] = [],
  filtersSummary?: string
): void {
  const getProgName = (id: string) => programs.find(p => p.id === id)?.name || id;
  const getCohName = (id: string) => cohorts.find(c => c.id === id)?.name || id;

  const workbook = XLSX.utils.book_new();

  // ----------------------------------------------------
  // SHEET 1: Executive KPI Summary
  // ----------------------------------------------------
  const summaryData = [
    ['NEXTGEN CLASS — APPLICATION REPORTING & M&E DASHBOARD'],
    ['Generated Date', new Date().toLocaleString()],
    ['Applied Filters', filtersSummary || 'All Dataset'],
    [],
    ['=== APPLICATIONS METRICS ===', ''],
    ['Total Applicants', metrics.totalApplicants],
    ['Started Applications', metrics.startedApplications],
    ['Completed Applications', metrics.completedApplications],
    ['Submitted Applications', metrics.submittedApplications],
    ['Draft / Incomplete Applications', metrics.draftApplications],
    ['Application Completion Rate', `${metrics.applicationCompletionRate}%`],
    [],
    ['=== ASSESSMENT METRICS ===', ''],
    ['Assessment Eligible', metrics.assessmentEligible],
    ['Assessment Started / Invited', metrics.assessmentStarted],
    ['Assessment Completed', metrics.assessmentCompleted],
    ['Assessment Completion Rate', `${metrics.assessmentCompletionRate}%`],
    ['Average Assessment Score', `${metrics.averageScore}%`],
    ['Passing Score Threshold', `${metrics.passingScoreThreshold}%`],
    ['Candidates Passed', metrics.passedCount],
    ['Candidates Failed / Below Threshold', metrics.failedCount],
    ['Pass Rate', `${metrics.passRate}%`],
    [],
    ['=== ADMISSIONS METRICS ===', ''],
    ['Accepted / Admitted', metrics.acceptedCount],
    ['Rejected', metrics.rejectedCount],
    ['Waitlisted', metrics.waitlistedCount],
    ['Under Review / Interview Scheduled', metrics.underReviewCount],
    ['Enrolled in Programme', metrics.enrolledCount],
    ['Admissions Acceptance Rate (of Submitted)', `${metrics.acceptanceRate}%`],
    ['Admissions Acceptance Rate (of Total)', `${metrics.acceptanceRateOfTotal}%`],
    ['Scholarships Awarded', metrics.scholarshipsAwardedCount],
    ['Total Scholarship Value Disbursed', `$${metrics.scholarshipsTotalValue.toLocaleString()}`],
    [],
    ['=== DEMOGRAPHIC HIGHLIGHTS ===', ''],
    ['Female Participation Rate', `${metrics.gender.femalePercentage}%`],
    ['Female Applicants Count', metrics.gender.female],
    ['Male Applicants Count', metrics.gender.male],
    ['Non-Binary / Other Count', metrics.gender.nonBinary + metrics.gender.preferNotToSay],
    ['Total Pan-African Countries Represented', metrics.location.totalCountries],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'M&E Executive Summary');

  // ----------------------------------------------------
  // SHEET 2: Applications Detailed Records
  // ----------------------------------------------------
  const detailedRecords = applications.map(app => ({
    'Application ID': app.id,
    'Candidate Name': app.fullName,
    'Email Address': app.email,
    'Phone': app.phone,
    'Programme': getProgName(app.programId),
    'Cohort': getCohName(app.cohortId),
    'Status': app.status,
    'Applied Date': app.appliedDate || '',
    'Gender': app.gender || '',
    'Country': app.country || '',
    'City': app.city || '',
    'Age Range': app.ageRange || '',
    'Education Level': app.educationLevel || '',
    'Field of Study': app.fieldOfStudy || '',
    'Employment Status': app.employmentStatus || '',
    'Years Experience': app.yearsExperience || '',
    'Programming Background': app.programmingBackground || '',
    'Assessment Score (%)': app.assessmentScore !== undefined ? app.assessmentScore : 'N/A',
    'Scholarship Awarded': app.scholarshipAwarded ? 'Yes' : 'No',
    'Scholarship %': app.scholarshipPercentage || 0,
    'Starred': app.starred ? 'Yes' : 'No',
  }));

  const wsDetails = XLSX.utils.json_to_sheet(detailedRecords);
  XLSX.utils.book_append_sheet(workbook, wsDetails, 'Applications Raw Data');

  // ----------------------------------------------------
  // SHEET 3: Demographic Breakdowns
  // ----------------------------------------------------
  const genderRows = metrics.gender.breakdown.map(g => ({
    'Demographic Category': 'Gender',
    'Group / Label': g.label,
    'Applicant Count': g.count,
    'Share (%)': `${g.percentage}%`,
  }));

  const countryRows = metrics.location.countries.map(c => ({
    'Demographic Category': 'Country',
    'Group / Label': c.label,
    'Applicant Count': c.count,
    'Share (%)': `${c.percentage}%`,
  }));

  const eduRows = metrics.education.breakdown.map(e => ({
    'Demographic Category': 'Education Level',
    'Group / Label': e.label,
    'Applicant Count': e.count,
    'Share (%)': `${e.percentage}%`,
  }));

  const empRows = metrics.employment.breakdown.map(e => ({
    'Demographic Category': 'Employment Status',
    'Group / Label': e.label,
    'Applicant Count': e.count,
    'Share (%)': `${e.percentage}%`,
  }));

  const wsDemographics = XLSX.utils.json_to_sheet([
    ...genderRows,
    ...countryRows,
    ...eduRows,
    ...empRows,
  ]);
  XLSX.utils.book_append_sheet(workbook, wsDemographics, 'Demographics & Diversity');

  // Write file
  XLSX.writeFile(workbook, `NextGen_M&E_Application_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Generates and downloads a comprehensive, multi-page professional PDF report of the M&E telemetry data
 */
export function exportApplicationsToPDF(
  applications: Application[],
  metrics: MneReportMetrics,
  programs: Program[] = [],
  cohorts: Cohort[] = [],
  filtersSummary?: string
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const getProgName = (id: string) => programs.find(p => p.id === id)?.name || id;
  const getCohName = (id: string) => cohorts.find(c => c.id === id)?.name || id;
  const generatedAt = new Date().toLocaleString();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXTGEN ACADEMY', 14, 10);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(249, 115, 22); // orange-500
  doc.text('Monitoring, Evaluation & Admissions Telemetry Report', 14, 16);

  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Generated: ${generatedAt}  |  Scope: ${filtersSummary || 'All Applications Dataset'}`, 14, 22);

  let currentY = 32;

  // Section 1: Executive KPI & Funnel Summary
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Executive KPI & Funnel Summary', 14, currentY);
  currentY += 3.5;

  autoTable(doc, {
    startY: currentY,
    head: [['Category', 'Indicator / Metric', 'Value', 'Context / Benchmark']],
    body: [
      ['Applications Funnel', 'Total Candidates in Scope', `${metrics.totalApplicants}`, 'Total registered candidate records'],
      ['Applications Funnel', 'Completed / Submitted', `${metrics.submittedApplications}`, `${metrics.applicationCompletionRate}% completion rate`],
      ['Applications Funnel', 'Draft / Incomplete', `${metrics.draftApplications}`, 'Candidates in progress'],
      ['Assessment Screening', 'Assessment Eligible & Completed', `${metrics.assessmentCompleted} / ${metrics.assessmentEligible}`, `${metrics.assessmentCompletionRate}% completion rate`],
      ['Assessment Screening', 'Average Score', `${metrics.averageScore}%`, `Benchmark passing threshold: ${metrics.passingScoreThreshold}%`],
      ['Assessment Screening', 'Passed Candidates (>= Pass Mark)', `${metrics.passedCount}`, `${metrics.passRate}% pass rate`],
      ['Admissions & Enrollment', 'Accepted / Admitted', `${metrics.acceptedCount}`, `${metrics.acceptanceRate}% acceptance rate of submitted`],
      ['Admissions & Enrollment', 'Enrolled in Cohort', `${metrics.enrolledCount}`, 'Confirmed active learners'],
      ['Admissions & Enrollment', 'Scholarships Awarded', `${metrics.scholarshipsAwardedCount}`, `Total value: $${metrics.scholarshipsTotalValue.toLocaleString()}`],
      ['Demographics & Diversity', 'Female Participation Share', `${metrics.gender.femalePercentage}%`, `${metrics.gender.female} Female candidate records`],
      ['Demographics & Diversity', 'Pan-African Geographic Reach', `${metrics.location.totalCountries} Countries`, `Top country: ${metrics.location.countries[0]?.label || 'Pan-African'}`],
    ],
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.8, textColor: [51, 65, 85] },
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42 },
      1: { fontStyle: 'bold', cellWidth: 55 },
      2: { cellWidth: 32, fontStyle: 'bold', halign: 'center' },
      3: { cellWidth: 53 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // Section 2: Demographic & Diversity Breakdown
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Demographic & Diversity Analysis', 14, currentY);
  currentY += 3.5;

  const genderRows = metrics.gender.breakdown.map(g => ['Gender', g.label, `${g.count}`, `${g.percentage}%`]);
  const countryRows = metrics.location.countries.slice(0, 6).map(c => ['Country', c.label, `${c.count}`, `${c.percentage}%`]);
  const eduRows = metrics.education.breakdown.slice(0, 4).map(e => ['Education Level', e.label, `${e.count}`, `${e.percentage}%`]);
  const empRows = metrics.employment.breakdown.slice(0, 4).map(em => ['Employment Status', em.label, `${em.count}`, `${em.percentage}%`]);

  autoTable(doc, {
    startY: currentY,
    head: [['Category', 'Demographic Group / Segment', 'Count', 'Percentage Share']],
    body: [...genderRows, ...countryRows, ...eduRows, ...empRows],
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.6, textColor: [51, 65, 85] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 38 },
      1: { cellWidth: 78 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 36, fontStyle: 'bold', halign: 'center' },
    },
  });

  // Section 3: Evaluated Candidate Records
  doc.addPage();
  currentY = 16;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`3. Evaluated Candidate Roster (${applications.length} Records in Active Scope)`, 14, currentY);
  currentY += 3.5;

  const appRows = applications.slice(0, 50).map(app => [
    app.id,
    app.fullName || 'Unnamed',
    getProgName(app.programId),
    getCohName(app.cohortId),
    app.status.replace(/_/g, ' ').toUpperCase(),
    app.country || 'N/A',
    app.gender || 'N/A',
    app.assessmentScore !== undefined ? `${app.assessmentScore}%` : 'N/A',
    app.scholarshipAwarded ? 'Yes' : 'No',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['App ID', 'Candidate Name', 'Programme', 'Cohort', 'Status', 'Country', 'Gender', 'Score', 'Schol.']],
    body: appRows,
    theme: 'grid',
    styles: { fontSize: 6.5, cellPadding: 1.5, textColor: [51, 65, 85] },
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 32 },
      3: { cellWidth: 28 },
      4: { cellWidth: 24, fontStyle: 'bold' },
      5: { cellWidth: 16 },
      6: { cellWidth: 14 },
      7: { cellWidth: 12, halign: 'center' },
      8: { cellWidth: 10, halign: 'center' },
    },
  });

  // Page Numbers & Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `NextGen Academy Admissions & M&E Telemetry Report • Page ${i} of ${pageCount} • Confidential`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`NextGen_M&E_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
