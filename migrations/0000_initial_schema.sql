-- NextGen Class Foundational PostgreSQL Schema
-- Migration: 0000_initial_schema.sql
-- Description: Complete initial schema covering all 18 core entities for multi-tenant, programme-agnostic operations.

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('APPLICANT', 'PROGRAM_MANAGER', 'FACILITATOR', 'LEARNER');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'DEACTIVATED');
CREATE TYPE programme_status AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE cohort_status AS ENUM ('UPCOMING', 'APPLICATIONS_OPEN', 'APPLICATIONS_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');
CREATE TYPE form_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE field_type AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'SELECT', 'MULTI_SELECT', 'RADIO', 'CHECKBOX', 'FILE_UPLOAD', 'DATE', 'EMAIL', 'PHONE', 'URL');
CREATE TYPE application_status AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ASSESSMENT_PENDING', 'ASSESSMENT_COMPLETED', 'SHORTLISTED', 'DECISION_PENDING', 'ADMITTED', 'REJECTED', 'WAITLISTED', 'ENROLLED', 'WITHDRAWN');
CREATE TYPE admission_decision AS ENUM ('ACCEPTED', 'REJECTED', 'WAITLISTED');
CREATE TYPE assessment_status AS ENUM ('DRAFT', 'PUBLISHED', 'OPEN', 'CLOSED', 'ARCHIVED');
CREATE TYPE question_type AS ENUM ('MULTIPLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'CODE_CHALLENGE');
CREATE TYPE attempt_status AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT', 'EVALUATED');
CREATE TYPE enrolment_status AS ENUM ('CONFIRMED', 'ACTIVE', 'DEFERRED', 'GRADUATED', 'DROPPED_OUT');
CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ');

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'APPLICANT',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);

-- 2. Applicant Profiles Table
CREATE TABLE IF NOT EXISTS applicant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(50),
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    profile_photo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS applicant_profiles_user_id_idx ON applicant_profiles(user_id);
CREATE INDEX IF NOT EXISTS applicant_profiles_country_idx ON applicant_profiles(country);

-- 3. Programmes Table
CREATE TABLE IF NOT EXISTS programmes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    status programme_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS programmes_slug_idx ON programmes(slug);
CREATE INDEX IF NOT EXISTS programmes_status_idx ON programmes(status);

-- 4. Cohorts Table
CREATE TABLE IF NOT EXISTS cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    application_open_date TIMESTAMPTZ NOT NULL,
    application_close_date TIMESTAMPTZ NOT NULL,
    programme_start_date TIMESTAMPTZ NOT NULL,
    programme_end_date TIMESTAMPTZ NOT NULL,
    status cohort_status NOT NULL DEFAULT 'UPCOMING',
    capacity INTEGER NOT NULL DEFAULT 50,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS cohorts_programme_id_idx ON cohorts(programme_id);
CREATE INDEX IF NOT EXISTS cohorts_status_idx ON cohorts(status);

-- 5. Application Forms Table
CREATE TABLE IF NOT EXISTS application_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    status form_status NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS app_forms_prog_cohort_idx ON application_forms(programme_id, cohort_id);

-- 6. Application Form Sections Table
CREATE TABLE IF NOT EXISTS application_form_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES application_forms(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS app_form_sections_form_id_idx ON application_form_sections(form_id);

-- 7. Application Form Fields Table
CREATE TABLE IF NOT EXISTS application_form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES application_forms(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES application_form_sections(id) ON DELETE CASCADE,
    field_type field_type NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    options JSONB,
    validation_rules JSONB,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS app_form_fields_form_section_idx ON application_form_fields(form_id, section_id);

-- 8. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    form_id UUID NOT NULL REFERENCES application_forms(id) ON DELETE RESTRICT,
    status application_status NOT NULL DEFAULT 'DRAFT',
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    decision admission_decision,
    decision_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS applications_applicant_idx ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS applications_prog_cohort_idx ON applications(programme_id, cohort_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status);

-- 9. Application Responses Table
CREATE TABLE IF NOT EXISTS application_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES application_form_fields(id) ON DELETE CASCADE,
    value TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS app_responses_app_idx ON application_responses(application_id);
CREATE INDEX IF NOT EXISTS app_responses_field_idx ON application_responses(field_id);

-- 10. Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    open_at TIMESTAMPTZ,
    close_at TIMESTAMPTZ,
    status assessment_status NOT NULL DEFAULT 'DRAFT',
    passing_score INTEGER NOT NULL DEFAULT 70,
    max_attempts INTEGER NOT NULL DEFAULT 1,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS assessments_prog_cohort_idx ON assessments(programme_id, cohort_id);
CREATE INDEX IF NOT EXISTS assessments_status_idx ON assessments(status);

-- 11. Assessment Questions Table
CREATE TABLE IF NOT EXISTS assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    options JSONB,
    correct_answer TEXT,
    marks INTEGER NOT NULL DEFAULT 10,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS assessment_questions_assessment_idx ON assessment_questions(assessment_id);

-- 12. Assessment Resources Table
CREATE TABLE IF NOT EXISTS assessment_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS assessment_resources_assessment_idx ON assessment_resources(assessment_id);

-- 13. Assessment Attempts Table
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    status attempt_status NOT NULL DEFAULT 'IN_PROGRESS',
    score INTEGER,
    percentage INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS assessment_attempts_assessment_applicant_idx ON assessment_attempts(assessment_id, applicant_id);

-- 14. Assessment Answers Table
CREATE TABLE IF NOT EXISTS assessment_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    answer TEXT,
    marks_awarded INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS assessment_answers_attempt_question_idx ON assessment_answers(attempt_id, question_id);

-- 15. Admission Decisions Table
CREATE TABLE IF NOT EXISTS admission_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
    decision admission_decision NOT NULL,
    reason TEXT,
    decided_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS admission_decisions_app_idx ON admission_decisions(application_id);

-- 16. Learner Profiles Table
CREATE TABLE IF NOT EXISTS learner_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES applicant_profiles(id) ON DELETE SET NULL,
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE RESTRICT,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE RESTRICT,
    enrolment_status enrolment_status NOT NULL DEFAULT 'CONFIRMED',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS learner_profiles_user_prog_cohort_idx ON learner_profiles(user_id, programme_id, cohort_id);

-- 17. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    metadata JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);

-- 18. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status notification_status NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS notifications_status_idx ON notifications(status);
