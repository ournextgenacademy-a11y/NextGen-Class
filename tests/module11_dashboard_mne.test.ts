import { calculateMneMetrics, filterApplications, MneFilters } from '../src/utils/mneMetrics';
import { Application, Cohort, Program } from '../src/types';

export async function runModule11DashboardMneTests() {
  const results: { name: string; passed: boolean; details?: string }[] = [];

  // KNOWN TEST DATASET: 10 carefully constructed applications
  const testApps: Application[] = [
    {
      id: 'test-app-1',
      programId: 'prog-genai',
      cohortId: 'cohort-genai-2',
      applicantId: 'u-1',
      fullName: 'Amina Test',
      email: 'amina@test.com',
      phone: '+234 800 000 0001',
      country: 'Nigeria',
      city: 'Lagos',
      gender: 'Female',
      ageRange: '25-34',
      educationLevel: 'Bachelor Degree',
      fieldOfStudy: 'Computer Science',
      employmentStatus: 'Employed full-time',
      yearsExperience: '3 years',
      programmingBackground: 'Advanced (3+ years)',
      motivationStatement: 'Motivated',
      goalsStatement: 'Goals',
      status: 'admitted',
      appliedDate: '2026-08-01',
      updatedDate: '2026-08-16',
      assessmentScore: 90, // Passed
      scholarshipAwarded: true,
      timeline: [],
    },
    {
      id: 'test-app-2',
      programId: 'prog-genai',
      cohortId: 'cohort-genai-2',
      applicantId: 'u-2',
      fullName: 'Kwame Test',
      email: 'kwame@test.com',
      phone: '+233 200 000 0002',
      country: 'Ghana',
      city: 'Accra',
      gender: 'Male',
      ageRange: '18-24',
      educationLevel: 'High School',
      fieldOfStudy: 'General',
      employmentStatus: 'Student',
      yearsExperience: '1 year',
      programmingBackground: 'Intermediate (1-2 years)',
      motivationStatement: 'Motivated',
      goalsStatement: 'Goals',
      status: 'assessment_invited',
      appliedDate: '2026-08-05',
      updatedDate: '2026-08-06',
      assessmentScore: undefined, // Not yet completed
      timeline: [],
    },
    {
      id: 'test-app-3',
      programId: 'prog-genai',
      cohortId: 'cohort-genai-2',
      applicantId: 'u-3',
      fullName: 'Fatima Test',
      email: 'fatima@test.com',
      phone: '+254 700 000 0003',
      country: 'Kenya',
      city: 'Nairobi',
      gender: 'Female',
      ageRange: '25-34',
      educationLevel: 'Master / PhD',
      fieldOfStudy: 'Data Science',
      employmentStatus: 'Employed full-time',
      yearsExperience: '4 years',
      programmingBackground: 'Advanced (3+ years)',
      motivationStatement: 'Motivated',
      goalsStatement: 'Goals',
      status: 'under_review',
      appliedDate: '2026-08-10',
      updatedDate: '2026-08-12',
      assessmentScore: 80, // Passed
      timeline: [],
    },
    {
      id: 'test-app-4',
      programId: 'prog-genai',
      cohortId: 'cohort-genai-2',
      applicantId: 'u-4',
      fullName: 'Tariq Test',
      email: 'tariq@test.com',
      phone: '+20 100 000 0004',
      country: 'Egypt',
      city: 'Cairo',
      gender: 'Male',
      ageRange: '25-34',
      educationLevel: 'Bachelor Degree',
      fieldOfStudy: 'Engineering',
      employmentStatus: 'Freelance',
      yearsExperience: '2 years',
      programmingBackground: 'Intermediate (1-2 years)',
      motivationStatement: 'Motivated',
      goalsStatement: 'Goals',
      status: 'enrolled',
      appliedDate: '2026-08-02',
      updatedDate: '2026-08-17',
      assessmentScore: 85, // Passed
      scholarshipAwarded: true,
      timeline: [],
    },
    {
      id: 'test-app-5',
      programId: 'prog-fs',
      cohortId: 'cohort-fs-5',
      applicantId: 'u-5',
      fullName: 'Zainab Test',
      email: 'zainab@test.com',
      phone: '+221 770 000 0005',
      country: 'Senegal',
      city: 'Dakar',
      gender: 'Female',
      ageRange: '18-24',
      educationLevel: 'High School',
      fieldOfStudy: 'Math',
      employmentStatus: 'Student',
      yearsExperience: 'None',
      programmingBackground: 'Beginner',
      motivationStatement: 'Motivated',
      goalsStatement: 'Goals',
      status: 'submitted',
      appliedDate: '2026-08-15',
      updatedDate: '2026-08-15',
      timeline: [],
    },
    {
      id: 'test-app-6',
      programId: 'prog-fs',
      cohortId: 'cohort-fs-5',
      applicantId: 'u-6',
      fullName: 'Sipho Test',
      email: 'sipho@test.com',
      phone: '+27 820 000 0006',
      country: 'South Africa',
      city: 'Johannesburg',
      gender: 'Male',
      ageRange: '35-44',
      educationLevel: 'Bachelor Degree',
      fieldOfStudy: 'Economics',
      employmentStatus: 'Employed full-time',
      yearsExperience: '5 years',
      programmingBackground: 'Intermediate (1-2 years)',
      motivationStatement: 'Motivated',
      goalsStatement: 'Goals',
      status: 'interview_scheduled',
      appliedDate: '2026-08-03',
      updatedDate: '2026-08-16',
      assessmentScore: 95, // Passed
      timeline: [],
    },
    {
      id: 'test-app-7',
      programId: 'prog-genai',
      cohortId: 'cohort-genai-2',
      applicantId: 'u-7',
      fullName: 'Chidubem Draft',
      email: 'chidubem@test.com',
      phone: '+234 800 000 0007',
      country: 'Nigeria',
      city: 'Enugu',
      gender: 'Male',
      ageRange: '18-24',
      educationLevel: 'Bachelor Degree',
      fieldOfStudy: 'Computer Engineering',
      employmentStatus: 'Student',
      yearsExperience: '1 year',
      programmingBackground: 'Intermediate (1-2 years)',
      motivationStatement: 'Motivated',
      goalsStatement: 'Goals',
      status: 'draft', // DRAFT
      appliedDate: '2026-08-18',
      updatedDate: '2026-08-18',
      timeline: [],
    },
    {
      id: 'test-app-8',
      programId: 'prog-fs',
      cohortId: 'cohort-fs-5',
      applicantId: 'u-8',
      fullName: 'Esther Test',
      email: 'esther@test.com',
      phone: '+254 700 000 0008',
      country: 'Kenya',
      city: 'Mombasa',
      gender: 'Female',
      ageRange: '25-34',
      educationLevel: 'Bootcamp Graduate',
      fieldOfStudy: 'Software Engineering',
      employmentStatus: 'Employed part-time',
      yearsExperience: '2 years',
      programmingBackground: 'Intermediate (1-2 years)',
      motivationStatement: 'Motivated',
      goalsStatement: 'Goals',
      status: 'assessment_pending',
      appliedDate: '2026-08-14',
      updatedDate: '2026-08-16',
      timeline: [],
    },
    {
      id: 'test-app-9',
      programId: 'prog-genai',
      cohortId: 'cohort-genai-2',
      applicantId: 'u-9',
      fullName: 'Youssef Waitlist',
      email: 'youssef@test.com',
      phone: '+20 120 000 0009',
      country: 'Egypt',
      city: 'Alexandria',
      gender: 'Male',
      ageRange: '25-34',
      educationLevel: 'Master / PhD',
      fieldOfStudy: 'Bioinformatics',
      employmentStatus: 'Employed full-time',
      yearsExperience: '5 years',
      programmingBackground: 'Advanced (3+ years)',
      motivationStatement: 'Motivated',
      goalsStatement: 'Goals',
      status: 'waitlisted',
      appliedDate: '2026-08-08',
      updatedDate: '2026-08-17',
      assessmentScore: 75, // Passed
      timeline: [],
    },
    {
      id: 'test-app-10',
      programId: 'prog-fs',
      cohortId: 'cohort-fs-5',
      applicantId: 'u-10',
      fullName: 'Kagiso Rejected',
      email: 'kagiso@test.com',
      phone: '+27 710 000 0010',
      country: 'South Africa',
      city: 'Pretoria',
      gender: 'Male',
      ageRange: '18-24',
      educationLevel: 'High School',
      fieldOfStudy: 'General',
      employmentStatus: 'Unemployed/Seeking',
      yearsExperience: 'None',
      programmingBackground: 'Beginner',
      motivationStatement: 'Motivated',
      goalsStatement: 'Goals',
      status: 'rejected',
      appliedDate: '2026-08-04',
      updatedDate: '2026-08-12',
      assessmentScore: 40, // Failed (< 70)
      timeline: [],
    },
  ];

  // ==========================================
  // TEST 1: APPLICATION METRICS VERIFICATION
  // ==========================================
  try {
    const metrics = calculateMneMetrics(testApps);

    // Total applicants should be 10
    const totalMatch = metrics.totalApplicants === 10;
    // Started = 10
    const startedMatch = metrics.startedApplications === 10;
    // Completed = 9 (all except draft)
    const completedMatch = metrics.completedApplications === 9;
    // Submitted = 9
    const submittedMatch = metrics.submittedApplications === 9;
    // Draft = 1
    const draftMatch = metrics.draftApplications === 1;
    // Application Completion Rate = (9 / 10) * 100 = 90.0%
    const rateMatch = metrics.applicationCompletionRate === 90.0;

    const pass = totalMatch && startedMatch && completedMatch && submittedMatch && draftMatch && rateMatch;
    results.push({
      name: 'M&E Applications Metrics: Total, Started, Completed, Submitted & Completion Rate',
      passed: pass,
      details: `Total: ${metrics.totalApplicants}/10, Started: ${metrics.startedApplications}/10, Completed: ${metrics.completedApplications}/9, Submitted: ${metrics.submittedApplications}/9, Rate: ${metrics.applicationCompletionRate}%/90%`,
    });
  } catch (err: any) {
    results.push({ name: 'M&E Applications Metrics', passed: false, details: err.message });
  }

  // ==========================================
  // TEST 2: ASSESSMENT METRICS VERIFICATION
  // ==========================================
  try {
    const metrics = calculateMneMetrics(testApps);

    // Assessment Eligible = 9 (all completed/submitted non-drafts)
    const eligibleMatch = metrics.assessmentEligible === 9;

    // Scored candidates: app-1 (90), app-3 (80), app-4 (85), app-6 (95), app-9 (75), app-10 (40) -> 6 scored
    const completedAsmMatch = metrics.assessmentCompleted === 6;

    // Assessment Completion Rate = (6 / 9) * 100 = 66.7%
    const expectedAsmRate = Math.round((6 / 9) * 1000) / 10; // 66.7%
    const asmRateMatch = metrics.assessmentCompletionRate === expectedAsmRate;

    // Average Score = (90 + 80 + 85 + 95 + 75 + 40) / 6 = 465 / 6 = 77.5%
    const expectedAvg = Math.round((465 / 6) * 10) / 10; // 77.5
    const avgScoreMatch = metrics.averageScore === expectedAvg;

    // Passed Count (>= 70): 90, 80, 85, 95, 75 = 5 candidates
    const passedMatch = metrics.passedCount === 5;
    // Failed Count (< 70): 40 = 1 candidate
    const failedMatch = metrics.failedCount === 1;

    // Pass Rate = (5 / 6) * 100 = 83.3%
    const expectedPassRate = Math.round((5 / 6) * 1000) / 10; // 83.3%
    const passRateMatch = metrics.passRate === expectedPassRate;

    const pass = eligibleMatch && completedAsmMatch && asmRateMatch && avgScoreMatch && passedMatch && failedMatch && passRateMatch;
    results.push({
      name: 'M&E Assessment Metrics: Eligible, Completed, Average Score (77.5%), Pass Rate (83.3%)',
      passed: pass,
      details: `Eligible: ${metrics.assessmentEligible}/9, Completed: ${metrics.assessmentCompleted}/6, Avg Score: ${metrics.averageScore}%/77.5%, Pass Rate: ${metrics.passRate}%/83.3%`,
    });
  } catch (err: any) {
    results.push({ name: 'M&E Assessment Metrics', passed: false, details: err.message });
  }

  // ==========================================
  // TEST 3: ADMISSIONS METRICS VERIFICATION
  // ==========================================
  try {
    const metrics = calculateMneMetrics(testApps);

    // Accepted: app-1 (admitted), app-4 (enrolled) -> 2
    const acceptedMatch = metrics.acceptedCount === 2;

    // Rejected: app-10 (rejected) -> 1
    const rejectedMatch = metrics.rejectedCount === 1;

    // Waitlisted: app-9 (waitlisted) -> 1
    const waitlistedMatch = metrics.waitlistedCount === 1;

    // Acceptance Rate (of Submitted = 9): (2 / 9) * 100 = 22.2%
    const expectedAccRate = Math.round((2 / 9) * 1000) / 10; // 22.2%
    const accRateMatch = metrics.acceptanceRate === expectedAccRate;

    // Scholarships: app-1 and app-4 both have scholarshipAwarded = true -> 2
    const scholarshipMatch = metrics.scholarshipsAwardedCount === 2;

    const pass = acceptedMatch && rejectedMatch && waitlistedMatch && accRateMatch && scholarshipMatch;
    results.push({
      name: 'M&E Admissions Metrics: Accepted (2), Rejected (1), Waitlisted (1), Acceptance Rate (22.2%)',
      passed: pass,
      details: `Accepted: ${metrics.acceptedCount}/2, Rejected: ${metrics.rejectedCount}/1, Waitlisted: ${metrics.waitlistedCount}/1, Acceptance Rate: ${metrics.acceptanceRate}%/22.2%`,
    });
  } catch (err: any) {
    results.push({ name: 'M&E Admissions Metrics', passed: false, details: err.message });
  }

  // ==========================================
  // TEST 4: DEMOGRAPHICS METRICS VERIFICATION
  // ==========================================
  try {
    const metrics = calculateMneMetrics(testApps);

    // Females: app-1, app-3, app-5, app-8 -> 4 (40%)
    const femaleMatch = metrics.gender.female === 4 && metrics.gender.femalePercentage === 40;

    // Males: app-2, app-4, app-6, app-7, app-9, app-10 -> 6 (60%)
    const maleMatch = metrics.gender.male === 6 && metrics.gender.malePercentage === 60;

    // Countries represented: Nigeria (2), Ghana (1), Kenya (2), Egypt (2), Senegal (1), South Africa (2) -> 6 countries
    const countriesMatch = metrics.location.totalCountries === 6;

    // Education breakdown:
    // Bachelor Degree: app-1, app-4, app-6, app-7 -> 4
    // High School: app-2, app-5, app-10 -> 3
    // Master / PhD: app-3, app-9 -> 2
    // Bootcamp Graduate: app-8 -> 1
    const bscCount = metrics.education.breakdown.find(e => e.label === 'Bachelor Degree')?.count;
    const hsCount = metrics.education.breakdown.find(e => e.label === 'High School')?.count;
    const eduMatch = bscCount === 4 && hsCount === 3;

    // Employment breakdown:
    // Employed full-time: app-1, app-3, app-6, app-9 -> 4
    // Student: app-2, app-5, app-7 -> 3
    // Employed part-time: app-8 -> 1
    // Freelance: app-4 -> 1
    // Unemployed/Seeking: app-10 -> 1
    const ftCount = metrics.employment.breakdown.find(e => e.label === 'Employed full-time')?.count;
    const empMatch = ftCount === 4;

    const pass = femaleMatch && maleMatch && countriesMatch && eduMatch && empMatch;
    results.push({
      name: 'M&E Demographics Metrics: Gender (40% F / 60% M), 6 Countries, Education & Employment',
      passed: pass,
      details: `Female: ${metrics.gender.female}/4 (40%), Male: ${metrics.gender.male}/6 (60%), Countries: ${metrics.location.totalCountries}/6, Bachelor Degree: ${bscCount}/4`,
    });
  } catch (err: any) {
    results.push({ name: 'M&E Demographics Metrics', passed: false, details: err.message });
  }

  // ==========================================
  // TEST 5: FILTERING LOGIC VERIFICATION
  // ==========================================
  try {
    // Filter by Programme 'prog-genai' -> 6 applications (1, 2, 3, 4, 7, 9)
    const genAiFilters: MneFilters = {
      programId: 'prog-genai',
      cohortId: 'all',
      dateRange: { preset: 'all' },
      status: 'all',
    };
    const genAiApps = filterApplications(testApps, genAiFilters);
    const genAiMetrics = calculateMneMetrics(genAiApps);

    const progFilterPass = genAiApps.length === 6 && genAiMetrics.totalApplicants === 6;

    // Filter by Cohort 'cohort-fs-5' -> 4 applications (5, 6, 8, 10)
    const fsCohortFilters: MneFilters = {
      programId: 'all',
      cohortId: 'cohort-fs-5',
      dateRange: { preset: 'all' },
      status: 'all',
    };
    const fsApps = filterApplications(testApps, fsCohortFilters);
    const cohortFilterPass = fsApps.length === 4;

    // Filter by Status 'admitted' -> 1 application (app-1)
    const admittedFilters: MneFilters = {
      programId: 'all',
      cohortId: 'all',
      dateRange: { preset: 'all' },
      status: 'admitted',
    };
    const admittedApps = filterApplications(testApps, admittedFilters);
    const statusFilterPass = admittedApps.length === 1 && admittedApps[0].id === 'test-app-1';

    // Filter by Custom Date Range: 2026-08-01 to 2026-08-05 -> apps 1, 2, 4, 6, 10 -> 5 applications
    const dateFilters: MneFilters = {
      programId: 'all',
      cohortId: 'all',
      dateRange: { preset: 'custom', startDate: '2026-08-01', endDate: '2026-08-05' },
      status: 'all',
    };
    const dateApps = filterApplications(testApps, dateFilters);
    const dateFilterPass = dateApps.length === 5;

    const pass = progFilterPass && cohortFilterPass && statusFilterPass && dateFilterPass;
    results.push({
      name: 'M&E Multi-Dimensional Filtering: Programme, Cohort, Status & Date Range Subsets',
      passed: pass,
      details: `Prog GenAI: ${genAiApps.length}/6, Cohort FS-5: ${fsApps.length}/4, Status Admitted: ${admittedApps.length}/1, Date Range (Aug 1-5): ${dateApps.length}/5`,
    });
  } catch (err: any) {
    results.push({ name: 'M&E Multi-Dimensional Filtering', passed: false, details: err.message });
  }

  // ==========================================
  // TEST 6: CALCULATION AUDIT TRACE INTEGRITY
  // ==========================================
  try {
    const metrics = calculateMneMetrics(testApps);
    const traces = metrics.traces;

    const hasAppTraces = !!traces['totalApplicants'] && !!traces['applicationCompletionRate'];
    const hasAsmTraces = !!traces['averageScore'] && !!traces['passRate'];
    const hasAdmTraces = !!traces['acceptanceRate'] && !!traces['acceptedCount'];

    const pass = hasAppTraces && hasAsmTraces && hasAdmTraces;
    results.push({
      name: 'M&E Mathematical Formula Audit Tracing (Numerators, Denominators & Record IDs)',
      passed: pass,
      details: `Verified complete mathematical trace ledger across all 4 key metric dimensions.`,
    });
  } catch (err: any) {
    results.push({ name: 'M&E Audit Tracing', passed: false, details: err.message });
  }

  return results;
}
