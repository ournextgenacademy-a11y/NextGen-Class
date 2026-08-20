# NextGen Class — Security Architecture & Threat Model

## 1. Authentication-First Enforcement
- **Zero Unauthenticated Access**: The root router renders exclusively `AuthScreen` until a valid authenticated session is established.
- **Route Protection**: Deep links, bookmarks, and direct navigation attempts to internal URLs automatically redirect unauthenticated users to the login screen.
- **Server API Guard**: All `/api/*` endpoints except `/api/auth/login` and `/api/auth/register` mandate valid JWT tokens in the `Authorization` header.

## 2. Role-Based Access Control (RBAC)
- 4 Primary System Roles:
  - `APPLICANT`: Restricted strictly to submitting applications, taking assigned screening tests, viewing own status, and receiving admissions notifications.
  - `PROGRAM_MANAGER`: Full administrative authority over programmes, cohorts, application forms, assessments, applicant reviews, and admissions decisions.
  - `FACILITATOR`: Evaluation, grading, and learner class instruction permissions.
  - `LEARNER`: Access to enrolled cohort coursework, attendance, and materials.

## 3. Multi-Tenant Data Isolation & Ownership Policy
- Every applicant resource (application, assessment attempt, rubric score) is strictly tied to `user_id`.
- The `ownershipMiddleware` checks that non-staff users can never access or modify another applicant's data.

## 4. Cryptographic Standards
- **Passwords**: Salted bcrypt hashing with 12 computational rounds.
- **Tokens**: HMAC-SHA256 signed JSON Web Tokens with configurable expiration (`7d`).
- **Audit Logging**: Immutable logging for sensitive operations (login, logout, application decision, form publish, role modification).
