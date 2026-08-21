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

export const SEED_APPLICATION_FORMS: ApplicationForm[] = [];
