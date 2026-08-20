import { hashPassword } from '../auth/passwords';

export interface SeedData {
  users: Array<{
    id: string;
    email: string;
    role: 'APPLICANT' | 'PROGRAM_MANAGER' | 'FACILITATOR' | 'LEARNER';
    status: 'ACTIVE';
    emailVerified: boolean;
    passwordHash: string;
  }>;
  applicantProfiles: Array<any>;
  programmes: Array<any>;
  cohorts: Array<any>;
  applicationForms: Array<any>;
  applicationFormSections: Array<any>;
  applicationFormFields: Array<any>;
  assessments: Array<any>;
  assessmentQuestions: Array<any>;
  applications: Array<any>;
  admissionDecisions: Array<any>;
  learnerProfiles: Array<any>;
}

export async function generateSeedData(): Promise<SeedData> {
  const defaultPasswordHash = await hashPassword('NextGenPass2026!');

  const users = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'applicant@nextgenacademy.org',
      role: 'APPLICANT' as const,
      status: 'ACTIVE' as const,
      emailVerified: true,
      passwordHash: defaultPasswordHash,
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'manager@nextgenacademy.org',
      role: 'PROGRAM_MANAGER' as const,
      status: 'ACTIVE' as const,
      emailVerified: true,
      passwordHash: defaultPasswordHash,
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'facilitator@nextgenacademy.org',
      role: 'FACILITATOR' as const,
      status: 'ACTIVE' as const,
      emailVerified: true,
      passwordHash: defaultPasswordHash,
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'learner@nextgenacademy.org',
      role: 'LEARNER' as const,
      status: 'ACTIVE' as const,
      emailVerified: true,
      passwordHash: defaultPasswordHash,
    },
  ];

  const applicantProfiles = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      userId: users[0].id,
      firstName: 'Amara',
      lastName: 'Okonkwo',
      phone: '+234 801 234 5678',
      gender: 'Female',
      country: 'Nigeria',
      state: 'Lagos',
      city: 'Ikeja',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  ];

  // Programme-agnostic seed programmes
  const programmes = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      name: 'Applied Machine Learning & Autonomous Systems',
      slug: 'applied-ml-autonomous-systems',
      description: 'Master practical LLM architectures, multi-agent frameworks, and vector search systems.',
      status: 'ACTIVE',
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      name: 'Full-Stack Cloud & Distributed Systems',
      slug: 'fullstack-cloud-distributed-systems',
      description: 'High-throughput microservices, Kubernetes orchestration, and event-driven architectures.',
      status: 'ACTIVE',
    },
  ];

  const cohorts = [
    {
      id: '30000000-0000-0000-0000-000000000001',
      programmeId: programmes[0].id,
      name: 'Fall 2026 Flagship Fellowship',
      applicationOpenDate: new Date('2026-08-01'),
      applicationCloseDate: new Date('2026-09-30'),
      programmeStartDate: new Date('2026-10-15'),
      programmeEndDate: new Date('2027-01-30'),
      status: 'APPLICATIONS_OPEN',
      capacity: 50,
      description: 'Fully sponsored scholarship cohort for high-potential engineering talent.',
    },
    {
      id: '30000000-0000-0000-0000-000000000002',
      programmeId: programmes[1].id,
      name: 'Spring 2027 Executive Track',
      applicationOpenDate: new Date('2026-11-01'),
      applicationCloseDate: new Date('2026-12-15'),
      programmeStartDate: new Date('2027-02-01'),
      programmeEndDate: new Date('2027-05-15'),
      status: 'UPCOMING',
      capacity: 40,
      description: 'Accelerated cloud systems and DevOps fellowship.',
    },
  ];

  const applicationForms = [
    {
      id: '40000000-0000-0000-0000-000000000001',
      programmeId: programmes[0].id,
      cohortId: cohorts[0].id,
      title: 'Standard Fellowship Admissions Application',
      description: 'Comprehensive evaluation form for fellowship consideration.',
      version: 1,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-08-01'),
      createdBy: users[1].id,
    },
  ];

  const applicationFormSections = [
    {
      id: '50000000-0000-0000-0000-000000000001',
      formId: applicationForms[0].id,
      title: 'Personal & Demographic Information',
      description: 'Essential contact and demographic details.',
      displayOrder: 1,
    },
    {
      id: '50000000-0000-0000-0000-000000000002',
      formId: applicationForms[0].id,
      title: 'Technical Background & Portfolio',
      description: 'Your coding experience, GitHub projects, and competencies.',
      displayOrder: 2,
    },
    {
      id: '50000000-0000-0000-0000-000000000003',
      formId: applicationForms[0].id,
      title: 'Motivation & Impact Statement',
      description: 'Why you want to join NextGen Academy.',
      displayOrder: 3,
    },
  ];

  const applicationFormFields = [
    {
      id: '60000000-0000-0000-0000-000000000001',
      formId: applicationForms[0].id,
      sectionId: applicationFormSections[1].id,
      fieldType: 'URL',
      label: 'GitHub Profile or Portfolio Link',
      description: 'Provide a link to your code repositories.',
      required: true,
      displayOrder: 1,
    },
    {
      id: '60000000-0000-0000-0000-000000000002',
      formId: applicationForms[0].id,
      sectionId: applicationFormSections[1].id,
      fieldType: 'SELECT',
      label: 'Primary Programming Language',
      description: 'Language you are most comfortable with.',
      required: true,
      options: ['Python', 'TypeScript / JavaScript', 'Go', 'Rust', 'Java', 'C++'],
      displayOrder: 2,
    },
    {
      id: '60000000-0000-0000-0000-000000000003',
      formId: applicationForms[0].id,
      sectionId: applicationFormSections[2].id,
      fieldType: 'TEXTAREA',
      label: 'Motivation Statement',
      description: 'What problem in your community or industry do you aim to solve using these skills?',
      required: true,
      displayOrder: 1,
    },
  ];

  const assessments = [
    {
      id: '70000000-0000-0000-0000-000000000001',
      programmeId: programmes[0].id,
      cohortId: cohorts[0].id,
      title: 'Foundational Technical & Algorithmic Screening',
      description: '30-minute screening test covering basic algorithms, Python syntax, and problem-solving.',
      durationMinutes: 30,
      passingScore: 70,
      status: 'PUBLISHED',
      maxAttempts: 1,
      createdBy: users[1].id,
    },
  ];

  const assessmentQuestions = [
    {
      id: '80000000-0000-0000-0000-000000000001',
      assessmentId: assessments[0].id,
      questionText: 'What is the time complexity of searching for a key in a balanced hash table on average?',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { id: 'opt_1', text: 'O(1)', isCorrect: true },
        { id: 'opt_2', text: 'O(log n)', isCorrect: false },
        { id: 'opt_3', text: 'O(n)', isCorrect: false },
        { id: 'opt_4', text: 'O(n log n)', isCorrect: false },
      ],
      correctAnswer: 'opt_1',
      marks: 10,
      displayOrder: 1,
    },
    {
      id: '80000000-0000-0000-0000-000000000002',
      assessmentId: assessments[0].id,
      questionText: 'In a Retrieval-Augmented Generation (RAG) system, what is the primary role of vector embeddings?',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { id: 'opt_a', text: 'To compress text into fixed semantic vector spaces for nearest-neighbor similarity search', isCorrect: true },
        { id: 'opt_b', text: 'To replace the need for an LLM entirely', isCorrect: false },
        { id: 'opt_c', text: 'To encrypt prompt data in transit', isCorrect: false },
      ],
      correctAnswer: 'opt_a',
      marks: 15,
      displayOrder: 2,
    },
  ];

  const applications = [
    {
      id: '90000000-0000-0000-0000-000000000001',
      applicantId: users[0].id,
      programmeId: programmes[0].id,
      cohortId: cohorts[0].id,
      formId: applicationForms[0].id,
      status: 'ADMITTED',
      submittedAt: new Date('2026-08-10'),
      reviewedAt: new Date('2026-08-12'),
      reviewedBy: users[1].id,
      decision: 'ACCEPTED',
      decisionReason: 'Strong technical baseline and compelling portfolio.',
    },
  ];

  const admissionDecisions = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      applicationId: applications[0].id,
      decision: 'ACCEPTED',
      reason: 'Admitted with 100% tuition scholarship.',
      decidedBy: users[1].id,
      decidedAt: new Date('2026-08-12'),
    },
  ];

  const learnerProfiles = [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      userId: users[3].id,
      applicantId: applicantProfiles[0].id,
      programmeId: programmes[0].id,
      cohortId: cohorts[0].id,
      enrolmentStatus: 'ACTIVE',
      enrolledAt: new Date('2026-08-15'),
    },
  ];

  return {
    users,
    applicantProfiles,
    programmes,
    cohorts,
    applicationForms,
    applicationFormSections,
    applicationFormFields,
    assessments,
    assessmentQuestions,
    applications,
    admissionDecisions,
    learnerProfiles,
  };
}
