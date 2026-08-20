# NextGen Class — Database Schema & Data Dictionary

## 1. Schema Overview
The database architecture comprises 18 core normalized tables defined in `src/database/schema.ts` and managed via Drizzle ORM and SQL migration scripts (`migrations/0000_initial_schema.sql`).

## 2. Core Entities & Enums

### Custom Enums:
- `user_role`: `APPLICANT`, `PROGRAM_MANAGER`, `FACILITATOR`, `LEARNER`
- `user_status`: `ACTIVE`, `SUSPENDED`, `PENDING_VERIFICATION`, `DEACTIVATED`
- `programme_status`: `DRAFT`, `ACTIVE`, `ARCHIVED`
- `cohort_status`: `UPCOMING`, `APPLICATIONS_OPEN`, `APPLICATIONS_CLOSED`, `IN_PROGRESS`, `COMPLETED`, `ARCHIVED`
- `application_status`: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `SHORTLISTED`, `ASSESSMENT_PENDING`, `ASSESSMENT_COMPLETED`, `INTERVIEW_SCHEDULED`, `ADMITTED`, `WAITLISTED`, `REJECTED`, `ENROLLED`, `WITHDRAWN`
- `field_type`: `TEXT`, `TEXTAREA`, `NUMBER`, `SELECT`, `MULTI_SELECT`, `RADIO`, `CHECKBOX`, `FILE_UPLOAD`, `DATE`, `EMAIL`, `PHONE`, `URL`
- `question_type`: `MULTIPLE_CHOICE`, `SINGLE_CHOICE`, `TEXT_SHORT`, `TEXT_LONG`, `CODE`, `FILE_UPLOAD`, `TRUE_FALSE`
- `assessment_status`: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- `attempt_status`: `IN_PROGRESS`, `SUBMITTED`, `EXPIRED`, `GRADED`
- `admission_decision`: `ACCEPTED`, `REJECTED`, `WAITLISTED`
- `enrolment_status`: `ACTIVE`, `DEFERRED`, `COMPLETED`, `DROPPED`
- `attendance_status`: `PRESENT`, `ABSENT`, `EXCUSED`, `LATE`

### 18 Entity Tables:
1. `users` — Primary account credentials, email, password hash, role, status.
2. `applicant_profiles` — Personal, demographic, phone, country, and bio details.
3. `programmes` — Master programme catalog (name, slug, description, status).
4. `cohorts` — Time-bound cohort instances tied to programmes with open/close dates.
5. `application_forms` — Dynamic versioned application forms per programme/cohort.
6. `application_form_sections` — Ordered logical sections within an application form.
7. `application_form_fields` — Custom dynamic input fields, validation rules, choices.
8. `applications` — Application instances submitted by applicants for a cohort.
9. `application_responses` — Candidate responses mapped to specific dynamic fields.
10. `assessments` — Screening tests, algorithmic evaluations, time limits, rubrics.
11. `assessment_questions` — Questions, options, correct answers, points.
12. `assessment_attempts` — Candidate assessment sessions with score tracking.
13. `assessment_answers` — Candidate answers per question with evaluator grades.
14. `admission_decisions` — Formal admissions decisions (admit, reject, waitlist) with audit history.
15. `learner_profiles` — Enrolled fellow profiles linked to applicant history.
16. `classes` — Scheduled class sessions and lectures within a cohort.
17. `learner_class_enrollments` — Attendance tracking per learner per class.
18. `audit_logs` — Immutable event stream for security and audit trails.

## 3. Relational Foreign Key Integrity
- `applicant_profiles.user_id` -> `users.id` (ON DELETE CASCADE)
- `cohorts.programme_id` -> `programmes.id` (ON DELETE CASCADE)
- `application_forms.programme_id` -> `programmes.id`
- `application_forms.cohort_id` -> `cohorts.id`
- `applications.applicant_id` -> `users.id`
- `applications.programme_id` -> `programmes.id`
- `applications.cohort_id` -> `cohorts.id`
- `admission_decisions.application_id` -> `applications.id`
- `learner_profiles.user_id` -> `users.id`
- `learner_profiles.applicant_id` -> `applicant_profiles.id`
- `learner_profiles.cohort_id` -> `cohorts.id`
