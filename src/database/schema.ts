import { 
  pgTable, 
  text, 
  timestamp, 
  uuid, 
  boolean, 
  integer, 
  jsonb, 
  pgEnum, 
  varchar, 
  index, 
  uniqueIndex 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'APPLICANT',
  'PROGRAM_MANAGER',
  'FACILITATOR',
  'LEARNER'
]);

export const userStatusEnum = pgEnum('user_status', [
  'ACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION',
  'DEACTIVATED'
]);

export const programmeStatusEnum = pgEnum('programme_status', [
  'DRAFT',
  'ACTIVE',
  'ARCHIVED'
]);

export const cohortStatusEnum = pgEnum('cohort_status', [
  'UPCOMING',
  'APPLICATIONS_OPEN',
  'APPLICATIONS_CLOSED',
  'IN_PROGRESS',
  'COMPLETED',
  'ARCHIVED'
]);

export const formStatusEnum = pgEnum('form_status', [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED'
]);

export const fieldTypeEnum = pgEnum('field_type', [
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'SELECT',
  'MULTI_SELECT',
  'RADIO',
  'CHECKBOX',
  'FILE_UPLOAD',
  'DATE',
  'EMAIL',
  'PHONE',
  'URL'
]);

export const applicationStatusEnum = pgEnum('application_status', [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'ASSESSMENT_PENDING',
  'ASSESSMENT_COMPLETED',
  'SHORTLISTED',
  'DECISION_PENDING',
  'ADMITTED',
  'REJECTED',
  'WAITLISTED',
  'ENROLLED',
  'WITHDRAWN'
]);

export const admissionDecisionEnum = pgEnum('admission_decision', [
  'ACCEPTED',
  'REJECTED',
  'WAITLISTED'
]);

export const assessmentStatusEnum = pgEnum('assessment_status', [
  'DRAFT',
  'PUBLISHED',
  'OPEN',
  'CLOSED',
  'ARCHIVED'
]);

export const questionTypeEnum = pgEnum('question_type', [
  'MULTIPLE_CHOICE',
  'MULTIPLE_SELECT',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'ESSAY',
  'CODE_CHALLENGE'
]);

export const attemptStatusEnum = pgEnum('attempt_status', [
  'IN_PROGRESS',
  'SUBMITTED',
  'TIMED_OUT',
  'EVALUATED'
]);

export const enrolmentStatusEnum = pgEnum('enrolment_status', [
  'CONFIRMED',
  'ACTIVE',
  'DEFERRED',
  'GRADUATED',
  'DROPPED_OUT'
]);

export const notificationStatusEnum = pgEnum('notification_status', [
  'PENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'READ'
]);

// 1. Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').default('APPLICANT').notNull(),
  status: userStatusEnum('status').default('ACTIVE').notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
  statusIdx: index('users_status_idx').on(table.status),
}));

// 2. Applicant Profiles Table
export const applicantProfiles = pgTable('applicant_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  dateOfBirth: timestamp('date_of_birth', { mode: 'date' }),
  gender: varchar('gender', { length: 50 }),
  country: varchar('country', { length: 100 }),
  state: varchar('state', { length: 100 }),
  city: varchar('city', { length: 100 }),
  profilePhoto: text('profile_photo'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: uniqueIndex('applicant_profiles_user_id_idx').on(table.userId),
  countryIdx: index('applicant_profiles_country_idx').on(table.country),
}));

// 3. Programmes Table
export const programmes = pgTable('programmes', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  status: programmeStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('programmes_slug_idx').on(table.slug),
  statusIdx: index('programmes_status_idx').on(table.status),
}));

// 4. Cohorts Table
export const cohorts = pgTable('cohorts', {
  id: uuid('id').defaultRandom().primaryKey(),
  programmeId: uuid('programme_id').notNull().references(() => programmes.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  applicationOpenDate: timestamp('application_open_date', { withTimezone: true }).notNull(),
  applicationCloseDate: timestamp('application_close_date', { withTimezone: true }).notNull(),
  programmeStartDate: timestamp('programme_start_date', { withTimezone: true }).notNull(),
  programmeEndDate: timestamp('programme_end_date', { withTimezone: true }).notNull(),
  status: cohortStatusEnum('status').default('UPCOMING').notNull(),
  capacity: integer('capacity').default(50).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  programmeIdIdx: index('cohorts_programme_id_idx').on(table.programmeId),
  statusIdx: index('cohorts_status_idx').on(table.status),
}));

// 5. Application Forms Table
export const applicationForms = pgTable('application_forms', {
  id: uuid('id').defaultRandom().primaryKey(),
  programmeId: uuid('programme_id').notNull().references(() => programmes.id, { onDelete: 'cascade' }),
  cohortId: uuid('cohort_id').references(() => cohorts.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  version: integer('version').default(1).notNull(),
  status: formStatusEnum('status').default('DRAFT').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  programmeCohortIdx: index('app_forms_prog_cohort_idx').on(table.programmeId, table.cohortId),
}));

// 6. Application Form Sections Table
export const applicationFormSections = pgTable('application_form_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  formId: uuid('form_id').notNull().references(() => applicationForms.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  displayOrder: integer('display_order').default(0).notNull(),
}, (table) => ({
  formIdIdx: index('app_form_sections_form_id_idx').on(table.formId),
}));

// 7. Application Form Fields Table
export const applicationFormFields = pgTable('application_form_fields', {
  id: uuid('id').defaultRandom().primaryKey(),
  formId: uuid('form_id').notNull().references(() => applicationForms.id, { onDelete: 'cascade' }),
  sectionId: uuid('section_id').notNull().references(() => applicationFormSections.id, { onDelete: 'cascade' }),
  fieldType: fieldTypeEnum('field_type').notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  description: text('description'),
  required: boolean('required').default(false).notNull(),
  options: jsonb('options'), // For SELECT, RADIO, CHECKBOX items
  validationRules: jsonb('validation_rules'), // Min/max length, regex, file size limits
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  formSectionIdx: index('app_form_fields_form_section_idx').on(table.formId, table.sectionId),
}));

// 8. Applications Table
export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicantId: uuid('applicant_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  programmeId: uuid('programme_id').notNull().references(() => programmes.id, { onDelete: 'cascade' }),
  cohortId: uuid('cohort_id').notNull().references(() => cohorts.id, { onDelete: 'cascade' }),
  formId: uuid('form_id').notNull().references(() => applicationForms.id, { onDelete: 'restrict' }),
  status: applicationStatusEnum('status').default('DRAFT').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  decision: admissionDecisionEnum('decision'),
  decisionReason: text('decision_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  applicantIdx: index('applications_applicant_idx').on(table.applicantId),
  programmeCohortIdx: index('applications_prog_cohort_idx').on(table.programmeId, table.cohortId),
  statusIdx: index('applications_status_idx').on(table.status),
}));

// 9. Application Responses Table
export const applicationResponses = pgTable('application_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  fieldId: uuid('field_id').notNull().references(() => applicationFormFields.id, { onDelete: 'cascade' }),
  value: text('value'),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  applicationIdx: index('app_responses_app_idx').on(table.applicationId),
  fieldIdx: index('app_responses_field_idx').on(table.fieldId),
}));

// 10. Assessments Table
export const assessments = pgTable('assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  programmeId: uuid('programme_id').notNull().references(() => programmes.id, { onDelete: 'cascade' }),
  cohortId: uuid('cohort_id').references(() => cohorts.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  instructions: text('instructions'),
  durationMinutes: integer('duration_minutes').default(30).notNull(),
  openAt: timestamp('open_at', { withTimezone: true }),
  closeAt: timestamp('close_at', { withTimezone: true }),
  status: assessmentStatusEnum('status').default('DRAFT').notNull(),
  passingScore: integer('passing_score').default(70).notNull(),
  maxAttempts: integer('max_attempts').default(1).notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  programmeCohortIdx: index('assessments_prog_cohort_idx').on(table.programmeId, table.cohortId),
  statusIdx: index('assessments_status_idx').on(table.status),
}));

// 11. Assessment Questions Table
export const assessmentQuestions = pgTable('assessment_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  assessmentId: uuid('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  questionText: text('question_text').notNull(),
  questionType: questionTypeEnum('question_type').default('MULTIPLE_CHOICE').notNull(),
  options: jsonb('options'), // Array of options { id, label, isCorrect? (hidden on client) }
  correctAnswer: text('correct_answer'),
  marks: integer('marks').default(10).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  assessmentIdx: index('assessment_questions_assessment_idx').on(table.assessmentId),
}));

// 12. Assessment Resources Table
export const assessmentResources = pgTable('assessment_resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  assessmentId: uuid('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  assessmentIdx: index('assessment_resources_assessment_idx').on(table.assessmentId),
}));

// 13. Assessment Attempts Table
export const assessmentAttempts = pgTable('assessment_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  assessmentId: uuid('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  applicantId: uuid('applicant_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  status: attemptStatusEnum('status').default('IN_PROGRESS').notNull(),
  score: integer('score'),
  percentage: integer('percentage'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  assessmentApplicantIdx: index('assessment_attempts_assessment_applicant_idx').on(table.assessmentId, table.applicantId),
}));

// 14. Assessment Answers Table
export const assessmentAnswers = pgTable('assessment_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  attemptId: uuid('attempt_id').notNull().references(() => assessmentAttempts.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => assessmentQuestions.id, { onDelete: 'cascade' }),
  answer: text('answer'),
  marksAwarded: integer('marks_awarded'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  attemptQuestionIdx: index('assessment_answers_attempt_question_idx').on(table.attemptId, table.questionId),
}));

// 15. Admission Decisions Table
export const admissionDecisions = pgTable('admission_decisions', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }).unique(),
  decision: admissionDecisionEnum('decision').notNull(),
  reason: text('reason'),
  decidedBy: uuid('decided_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  decidedAt: timestamp('decided_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  applicationIdx: uniqueIndex('admission_decisions_app_idx').on(table.applicationId),
}));

// 16. Learner Profiles Table
export const learnerProfiles = pgTable('learner_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  applicantId: uuid('applicant_id').references(() => applicantProfiles.id, { onDelete: 'set null' }),
  programmeId: uuid('programme_id').notNull().references(() => programmes.id, { onDelete: 'restrict' }),
  cohortId: uuid('cohort_id').notNull().references(() => cohorts.id, { onDelete: 'restrict' }),
  enrolmentStatus: enrolmentStatusEnum('enrolment_status').default('CONFIRMED').notNull(),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userProgCohortIdx: uniqueIndex('learner_profiles_user_prog_cohort_idx').on(table.userId, table.programmeId, table.cohortId),
}));

// 17. Audit Logs Table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}));

// 18. Notifications Table
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipientId: uuid('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 100 }).notNull(), // EMAIL, SMS, IN_APP
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  status: notificationStatusEnum('status').default('PENDING').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  recipientIdx: index('notifications_recipient_idx').on(table.recipientId),
  statusIdx: index('notifications_status_idx').on(table.status),
}));

// Relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  applicantProfile: one(applicantProfiles, {
    fields: [users.id],
    references: [applicantProfiles.userId],
  }),
  applications: many(applications),
  assessmentAttempts: many(assessmentAttempts),
  learnerProfiles: many(learnerProfiles),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}));

export const programmesRelations = relations(programmes, ({ many }) => ({
  cohorts: many(cohorts),
  applicationForms: many(applicationForms),
  applications: many(applications),
  assessments: many(assessments),
}));

export const cohortsRelations = relations(cohorts, ({ one, many }) => ({
  programme: one(programmes, {
    fields: [cohorts.programmeId],
    references: [programmes.id],
  }),
  applications: many(applications),
  applicationForms: many(applicationForms),
  assessments: many(assessments),
}));

export const applicationFormsRelations = relations(applicationForms, ({ one, many }) => ({
  programme: one(programmes, {
    fields: [applicationForms.programmeId],
    references: [programmes.id],
  }),
  cohort: one(cohorts, {
    fields: [applicationForms.cohortId],
    references: [cohorts.id],
  }),
  sections: many(applicationFormSections),
  fields: many(applicationFormFields),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  applicant: one(users, {
    fields: [applications.applicantId],
    references: [users.id],
  }),
  programme: one(programmes, {
    fields: [applications.programmeId],
    references: [programmes.id],
  }),
  cohort: one(cohorts, {
    fields: [applications.cohortId],
    references: [cohorts.id],
  }),
  form: one(applicationForms, {
    fields: [applications.formId],
    references: [applicationForms.id],
  }),
  responses: many(applicationResponses),
  admissionDecision: one(admissionDecisions, {
    fields: [applications.id],
    references: [admissionDecisions.applicationId],
  }),
}));
