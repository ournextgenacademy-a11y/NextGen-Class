export type UserRole = 'applicant' | 'program_manager' | 'reviewer' | 'facilitator' | 'learner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title?: string;
  phone?: string;
  location?: string;
}

export type ProgramCategory = 'Artificial Intelligence' | 'Software Engineering' | 'Data & Analytics' | 'Cloud & DevOps' | 'Product & Design';

export type ProgramStatus = 'active' | 'draft' | 'archived';

export interface Program {
  id: string;
  name: string;
  code: string;
  category: ProgramCategory;
  description: string;
  summary: string;
  durationWeeks: number;
  format: '100% Online' | 'Hybrid' | 'In-Person Intensive';
  targetAudience: string;
  skillsTaught: string[];
  prerequisites: string[];
  status: ProgramStatus;
  icon: string;
  color: string;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CohortStatus = 
  | 'draft' 
  | 'applications_open' 
  | 'applications_closed'
  | 'active'
  | 'assessment_phase' 
  | 'review_phase' 
  | 'admissions_open' 
  | 'in_session' 
  | 'completed' 
  | 'archived';

export type FormFieldType = 
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'multiple_choice'
  | 'file_upload'
  | 'url';

export interface FormFieldValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customErrorMessage?: string;
  allowedFileExtensions?: string[];
  maxFileSizeMb?: number;
}

export interface ApplicationFormField {
  id: string;
  formId: string;
  sectionId: string;
  fieldType: FormFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for dropdown, radio, checkbox, multiple_choice
  validationRules?: FormFieldValidationRules;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationFormSection {
  id: string;
  formId: string;
  title: string;
  description?: string;
  displayOrder: number;
  fields: ApplicationFormField[];
}

export type FormStatus = 'draft' | 'published' | 'archived';

export interface ApplicationForm {
  id: string;
  programmeId: string;
  cohortId?: string | null;
  title: string;
  description?: string;
  version: number;
  status: FormStatus;
  publishedAt?: string;
  createdBy?: string;
  sections: ApplicationFormSection[];
  createdAt: string;
  updatedAt: string;
}

export interface BulkUploadRow {
  section: string;
  question: string;
  type: string;
  required: boolean;
  options: string[];
  description?: string;
  rowNumber: number;
}

export interface BulkUploadValidationError {
  row: number;
  column: string;
  message: string;
}

export interface CustomFormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'url';
  placeholder?: string;
  options?: string[];
  required: boolean;
  helpText?: string;
}

export interface Cohort {
  id: string;
  programId: string;
  name: string;
  code: string;
  description?: string;
  applicationOpenDate?: string;
  applicationDeadline: string; // Closing date
  startDate: string; // Programme start date
  endDate: string; // Programme end date
  status: CohortStatus;
  capacity: number;
  admittedCount: number;
  enrolledCount: number;
  tuitionFee: number;
  scholarshipAvailable: boolean;
  assessmentId?: string;
  assessmentDeadline?: string;
  schedule: string;
  customFields?: CustomFormField[];
  createdAt?: string;
  updatedAt?: string;
}

export type ApplicationStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'assessment_pending'
  | 'assessment_invited'
  | 'assessment_completed'
  | 'interview_scheduled'
  | 'admitted'
  | 'accepted'
  | 'waitlisted'
  | 'rejected'
  | 'enrolled';

export interface UploadedFileRecord {
  id: string;
  fieldId: string;
  fileName: string;
  fileSizeMb: number;
  fileType: string;
  uploadedAt: string;
  status: 'uploading' | 'completed' | 'error';
  fileUrl?: string;
  dataUrl?: string;
  errorMessage?: string;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
  verificationNote?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface InternalNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
  category?: 'general' | 'eligibility' | 'interview' | 'scholarship' | 'background_check';
}

export interface ApplicationTimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  type: 'status_change' | 'assessment' | 'note' | 'communication' | 'admissions';
}

export interface RubricEvaluation {
  technicalAptitude: number; // 1-5
  problemSolving: number; // 1-5
  motivationAndCommitment: number; // 1-5
  communicationSkills: number; // 1-5
  overallRecommendation: 'strong_hire' | 'admit' | 'borderline' | 'reject';
  reviewerNotes: string;
  evaluatedBy: string;
  evaluatedAt: string;
}

export interface Application {
  id: string;
  programId: string;
  cohortId: string;
  applicantId: string;
  
  // Personal Info
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  gender: 'Female' | 'Male' | 'Non-Binary' | 'Prefer not to say';
  ageRange: '18-24' | '25-34' | '35-44' | '45+';
  
  // Background & Tech
  educationLevel: 'High School' | 'Bachelor Degree' | 'Master / PhD' | 'Self-Taught' | 'Bootcamp Graduate' | string;
  fieldOfStudy: string;
  employmentStatus: 'Employed full-time' | 'Employed part-time' | 'Student' | 'Freelance' | 'Unemployed/Seeking' | string;
  yearsExperience: string;
  programmingBackground: 'None / Beginner' | 'Familiar (Basic scripts)' | 'Intermediate (1-2 years)' | 'Advanced (3+ years)' | string;
  
  // Profiles
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  cvUrl?: string;
  
  // Statements & Dynamic Form Answers
  motivationStatement: string;
  goalsStatement: string;
  customAnswers?: Record<string, any>;
  uploadedFiles?: Record<string, UploadedFileRecord>;
  
  // Application State & Metadata
  status: ApplicationStatus;
  appliedDate: string;
  updatedDate: string;
  submittedAt?: string;
  draftSavedAt?: string;
  lastSavedStep?: number;
  progressPercentage?: number;
  formId?: string;
  formVersion?: number;
  
  // Assessment & Review
  assessmentScore?: number;
  assessmentSubmissionId?: string;
  rubricEvaluation?: RubricEvaluation;
  assignedReviewer?: string;
  
  // Admission Details
  scholarshipAwarded?: boolean;
  scholarshipPercentage?: number;
  offerLetterSentDate?: string;
  offerAcceptedDate?: string;
  
  // Timeline audit log
  timeline: ApplicationTimelineEvent[];
  
  // Internal staff notes & flags
  internalNotes?: InternalNote[];
  starred?: boolean;
  internalTags?: string[];
}

export type AssessmentStatus = 'draft' | 'published' | 'scheduled' | 'open' | 'closed' | 'archived';

export type QuestionType = 
  | 'multiple_choice' 
  | 'single_choice' 
  | 'true_false' 
  | 'short_answer' 
  | 'long_answer' 
  | 'scenario' 
  | 'code' 
  | 'open_text';

export interface QuestionOption {
  id: string; // 'opt1', 'A', 'B', etc.
  label: string;
  isCorrect?: boolean;
}

export interface AssessmentResource {
  id: string;
  name: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'zip' | 'txt' | 'xlsx' | 'csv' | 'other';
  fileSizeMb: number;
  url?: string;
  dataUrl?: string;
  description?: string;
  uploadedAt: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  context?: string;
  codeSnippet?: string;
  options?: QuestionOption[];
  correctAnswer?: string | string[]; // Option ID(s), 'True'/'False', or exact keyword
  points: number;
  displayOrder?: number;
  category?: 'Logic & Reasoning' | 'Technical Fundamentals' | 'AI & Automation Concepts' | 'Communication & Ethics' | string;
  explanation?: string;
}

export interface Assessment {
  id: string;
  programId: string;
  cohortId?: string;
  title: string;
  description: string;
  durationMinutes: number; // duration in minutes
  timeLimitMinutes?: number; // backwards compatibility alias
  openDate?: string; // YYYY-MM-DD
  openTime?: string; // HH:mm
  closeDate?: string; // YYYY-MM-DD
  closeTime?: string; // HH:mm
  passingScore: number; // percentage (e.g. 70)
  maxAttempts: number; // e.g. 1, 2, 3
  status: AssessmentStatus;
  instructions: string[];
  questions: Question[];
  resources?: AssessmentResource[];
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  applicantId: string;
  applicationId: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'timed_out';
  startedAt: string;
  serverStartEpoch: number;
  durationMinutes: number;
  serverExpireEpoch: number;
  answers: Record<string, string | string[]>;
  flaggedQuestions: string[];
  lastSavedAt: string;
  submittedAt?: string;
  score?: number;
  maxScore?: number;
  percentageScore?: number;
  passed?: boolean;
}

export interface AssessmentSubmission {
  id: string;
  assessmentId: string;
  applicationId: string;
  applicantId: string;
  answers: Record<string, any>; // questionId -> answerId or text or array
  score: number;
  maxScore: number;
  percentageScore: number;
  passed: boolean;
  submittedAt: string;
  timeTakenMinutes: number;
  evaluatorFeedback?: string;
}

export interface CommunicationMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId?: string; // If direct message
  recipientName?: string;
  cohortId?: string; // If broadcast
  programId?: string;
  type: 'broadcast' | 'direct' | 'system_alert' | 'offer_letter';
  subject: string;
  content: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'read';
  tags?: string[];
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  category: 'Assessment' | 'Interview' | 'Admissions' | 'Rejection' | 'General';
  subject: string;
  body: string;
  variables: string[];
}

export interface LearnerRecord {
  id: string;
  applicantId: string;
  applicationId: string;
  cohortId: string;
  programId: string;
  fullName: string;
  email: string;
  enrollmentDate: string;
  attendanceRate: number;
  completedModules: number;
  totalModules: number;
  capstoneStatus: 'not_started' | 'proposal' | 'in_progress' | 'submitted' | 'approved';
  capstoneTitle?: string;
  currentGrade: number;
  certificateStatus: 'eligible' | 'issued' | 'pending';
}
