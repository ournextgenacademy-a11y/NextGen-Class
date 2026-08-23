import { Program, Cohort, Application, Assessment, CommunicationMessage, CommunicationTemplate, CommunicationLogEntry, User, LearnerRecord, ApplicationForm } from '../types';
import { DEFAULT_COMMUNICATION_TEMPLATES } from '../notifications/notificationService';

export const SEED_USERS: User[] = [
  {
    id: 'admin-user-0',
    name: 'NextGen Administrator',
    email: 'ournextgenacademy@gmail.com',
    role: 'program_manager',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    title: 'Platform Administrator & Director',
    location: 'NextGen Academy Global Hub',
  },
  {
    id: 'admin-user-1',
    name: 'Dr. Sarah Chen',
    email: 'admin@nextgenacademy.org',
    role: 'program_manager',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    title: 'Director of Programmes & Admissions',
    location: 'London / Global Hub',
  },
  {
    id: 'app-user-1',
    name: 'Amina Yusuf',
    email: 'amina.yusuf@example.com',
    role: 'applicant',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    title: 'Junior Software Developer & AI Enthusiast',
    phone: '+234 802 345 6789',
    location: 'Lagos, Nigeria',
  },
  {
    id: 'app-user-2',
    name: 'Kwame Mensah',
    email: 'kwame.mensah@example.com',
    role: 'applicant',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    title: 'Aspiring Full-Stack Developer',
    phone: '+233 24 567 8901',
    location: 'Accra, Ghana',
  },
  {
    id: 'app-user-3',
    name: 'Fatima Al-Mansoor',
    email: 'fatima.mansoor@example.com',
    role: 'applicant',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    title: 'Data Analyst & ML Explorer',
    phone: '+254 712 345 678',
    location: 'Nairobi, Kenya',
  },
  {
    id: 'reviewer-user-1',
    name: 'Marcus Vance',
    email: 'marcus.vance@nextgenacademy.edu',
    role: 'reviewer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    title: 'Lead AI Technical Assessor',
    location: 'NextGen Academy Tech Faculty',
  },
];

export const SEED_PROGRAMS: Program[] = [];

export const SEED_COHORTS: Cohort[] = [];

export const SEED_ASSESSMENTS: Assessment[] = [];

export const SEED_APPLICATIONS: Application[] = [];

export const SEED_TEMPLATES: CommunicationTemplate[] = DEFAULT_COMMUNICATION_TEMPLATES;

export const SEED_COMMUNICATION_LOGS: CommunicationLogEntry[] = [];

export const SEED_MESSAGES: CommunicationMessage[] = [];

export const SEED_LEARNERS: LearnerRecord[] = [];

export const createDefaultProgrammeApplicationForm = (programmeId: string, progName?: string): ApplicationForm => {
  const formId = `form-std-${programmeId || 'default'}`;
  return {
    id: formId,
    programmeId: programmeId || '',
    programId: programmeId || '',
    title: `${progName || 'NextGen Academy'} Official Application Form`,
    description: `Comprehensive candidate application and admissions background questionnaire for ${progName || 'this programme'}.`,
    version: 1,
    status: 'published',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'system',
    sections: [
      {
        id: `sec-personal-${programmeId || 'default'}`,
        formId: formId,
        title: 'Personal & Contact Details',
        description: 'Your identity and primary contact channels.',
        displayOrder: 1,
        fields: [
          {
            id: 'fullName',
            formId: formId,
            sectionId: `sec-personal-${programmeId || 'default'}`,
            fieldType: 'short_text',
            label: 'Full Legal Name',
            placeholder: 'e.g. Amina Yusuf',
            required: true,
            displayOrder: 1,
          },
          {
            id: 'email',
            formId: formId,
            sectionId: `sec-personal-${programmeId || 'default'}`,
            fieldType: 'email',
            label: 'Primary Contact Email',
            placeholder: 'you@domain.com',
            required: true,
            displayOrder: 2,
          },
          {
            id: 'phone',
            formId: formId,
            sectionId: `sec-personal-${programmeId || 'default'}`,
            fieldType: 'phone',
            label: 'Phone Number (with Country Code)',
            placeholder: '+234 800 000 0000',
            required: true,
            displayOrder: 3,
          },
          {
            id: 'country',
            formId: formId,
            sectionId: `sec-personal-${programmeId || 'default'}`,
            fieldType: 'dropdown',
            label: 'Country of Residence',
            placeholder: '-- Select Country --',
            options: ['Nigeria', 'Ghana', 'Kenya', 'Rwanda', 'South Africa', 'Uganda', 'Egypt', 'United Kingdom', 'United States', 'Canada', 'Other'],
            required: true,
            displayOrder: 4,
          },
          {
            id: 'city',
            formId: formId,
            sectionId: `sec-personal-${programmeId || 'default'}`,
            fieldType: 'short_text',
            label: 'City / State of Residence',
            placeholder: 'e.g. Lagos, Accra, Nairobi',
            required: true,
            displayOrder: 5,
          },
          {
            id: 'gender',
            formId: formId,
            sectionId: `sec-personal-${programmeId || 'default'}`,
            fieldType: 'radio',
            label: 'Gender Identification',
            options: ['Female', 'Male', 'Non-Binary', 'Prefer not to say'],
            required: true,
            displayOrder: 6,
          },
          {
            id: 'ageRange',
            formId: formId,
            sectionId: `sec-personal-${programmeId || 'default'}`,
            fieldType: 'radio',
            label: 'Age Group',
            options: ['18-24', '25-34', '35-44', '45+'],
            required: true,
            displayOrder: 7,
          },
        ],
      },
      {
        id: `sec-background-${programmeId || 'default'}`,
        formId: formId,
        title: 'Educational & Professional Background',
        description: 'Your academic degree, technical experience, and career profile.',
        displayOrder: 2,
        fields: [
          {
            id: 'educationLevel',
            formId: formId,
            sectionId: `sec-background-${programmeId || 'default'}`,
            fieldType: 'dropdown',
            label: 'Highest Completed Education Level',
            placeholder: '-- Select Education Level --',
            options: ['High School Diploma', 'Associate Degree', 'Bachelor Degree', 'Master / PhD', 'Bootcamp Graduate', 'Self-Taught'],
            required: true,
            displayOrder: 1,
          },
          {
            id: 'fieldOfStudy',
            formId: formId,
            sectionId: `sec-background-${programmeId || 'default'}`,
            fieldType: 'short_text',
            label: 'Field of Study / Academic Discipline',
            placeholder: 'e.g. Computer Science, Electrical Engineering, Business',
            required: false,
            displayOrder: 2,
          },
          {
            id: 'employmentStatus',
            formId: formId,
            sectionId: `sec-background-${programmeId || 'default'}`,
            fieldType: 'dropdown',
            label: 'Current Employment Status',
            placeholder: '-- Select Employment Status --',
            options: ['Employed full-time', 'Employed part-time', 'Self-Employed / Freelancer', 'Student', 'Unemployed / Seeking Role'],
            required: true,
            displayOrder: 3,
          },
          {
            id: 'yearsExperience',
            formId: formId,
            sectionId: `sec-background-${programmeId || 'default'}`,
            fieldType: 'dropdown',
            label: 'Technical / Programming Experience',
            placeholder: '-- Select Experience Level --',
            options: ['None (Complete Beginner)', 'Less than 1 year', '1-2 years', '2-3 years', '4+ years'],
            required: true,
            displayOrder: 4,
          },
          {
            id: 'programmingBackground',
            formId: formId,
            sectionId: `sec-background-${programmeId || 'default'}`,
            fieldType: 'short_text',
            label: 'Programming Languages & Tools Familiarity',
            placeholder: 'e.g. JavaScript, Python, React, SQL, None',
            required: false,
            displayOrder: 5,
          },
          {
            id: 'linkedinUrl',
            formId: formId,
            sectionId: `sec-background-${programmeId || 'default'}`,
            fieldType: 'url',
            label: 'LinkedIn Profile URL',
            placeholder: 'https://linkedin.com/in/yourprofile',
            required: false,
            displayOrder: 6,
          },
          {
            id: 'githubUrl',
            formId: formId,
            sectionId: `sec-background-${programmeId || 'default'}`,
            fieldType: 'url',
            label: 'GitHub / Portfolio URL',
            placeholder: 'https://github.com/yourusername',
            required: false,
            displayOrder: 7,
          },
        ],
      },
      {
        id: `sec-motivation-${programmeId || 'default'}`,
        formId: formId,
        title: 'Motivation & Career Goals',
        description: 'Your drive, commitment, and post-graduation vision.',
        displayOrder: 3,
        fields: [
          {
            id: 'motivationStatement',
            formId: formId,
            sectionId: `sec-motivation-${programmeId || 'default'}`,
            fieldType: 'long_text',
            label: 'Why do you want to join NextGen Academy?',
            placeholder: 'Describe what motivates you to join this intensive track and what you hope to master...',
            required: true,
            displayOrder: 1,
            validationRules: { minLength: 15 },
          },
          {
            id: 'goalsStatement',
            formId: formId,
            sectionId: `sec-motivation-${programmeId || 'default'}`,
            fieldType: 'long_text',
            label: 'What are your career goals after completing this programme?',
            placeholder: 'Share your short-term and long-term career aspirations post-graduation...',
            required: true,
            displayOrder: 2,
            validationRules: { minLength: 15 },
          },
        ],
      },
      {
        id: `sec-documents-${programmeId || 'default'}`,
        formId: formId,
        title: 'Supporting Documents & Resume',
        description: 'Upload your latest resume or CV to complete your dossier.',
        displayOrder: 4,
        fields: [
          {
            id: 'cvUrl',
            formId: formId,
            sectionId: `sec-documents-${programmeId || 'default'}`,
            fieldType: 'file_upload',
            label: 'Resume / Curriculum Vitae (PDF or DOCX)',
            description: 'Upload your up-to-date resume or professional bio (Max 5MB).',
            required: true,
            displayOrder: 1,
            validationRules: {
              allowedFileExtensions: ['.pdf', '.doc', '.docx'],
              maxFileSizeMb: 5,
            },
          },
        ],
      },
    ],
  };
};

export const SEED_APPLICATION_FORMS: ApplicationForm[] = [
  createDefaultProgrammeApplicationForm('prog-swe-101', 'Full-Stack Software Engineering'),
  createDefaultProgrammeApplicationForm('prog-ai-201', 'Applied AI & Machine Learning Systems'),
  createDefaultProgrammeApplicationForm('prog-cloud-301', 'Cloud Native DevOps & SRE'),
];
