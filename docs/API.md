# NextGen Class — API Specifications & Endpoint Directory

## 1. Authentication & Security Headers
All non-auth API requests must include a valid Bearer token in the `Authorization` header:
```http
Authorization: Bearer <jwt_access_token>
Content-Type: application/json
```

## 2. Standard Error Response Schema
```json
{
  "error": {
    "code": "UNAUTHENTICATED | FORBIDDEN_ROLE | INVALID_INPUT | NOT_FOUND | RATE_LIMIT_EXCEEDED",
    "message": "Human readable explanation of the error",
    "details": {}
  }
}
```

## 3. Core API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account (`email`, `password`, `firstName`, `lastName`, `role`).
- `POST /api/auth/login` — Sign in with email and password, returning user object and JWT.
- `GET /api/auth/me` — Retrieve the currently authenticated user profile.
- `POST /api/auth/logout` — Invalidate session and record audit event.

### Programmes & Cohorts (`/api/programmes`)
- `GET /api/programmes` — List all active programmes (Authenticated users).
- `POST /api/programmes` — Create a new programme (`PROGRAM_MANAGER` only).
- `GET /api/programmes/cohorts` — List all active cohorts across programmes.
- `POST /api/programmes/cohorts` — Schedule a new cohort (`PROGRAM_MANAGER` only).

### Applications (`/api/applications`)
- `GET /api/applications` — Get user's own applications (Applicant) or all applications (Program Manager).
- `GET /api/applications/:id` — Retrieve application details (Enforces ownership or Staff role).
- `POST /api/applications` — Submit application with responses to dynamic fields.

### Assessments (`/api/assessments`)
- `GET /api/assessments` — List available screening assessments.
- `POST /api/assessments` — Create assessment test (`PROGRAM_MANAGER` only).

### Admissions & Decisions (`/api/admissions`)
- `POST /api/admissions/decision` — Issue admission acceptance, rejection, or waitlist (`PROGRAM_MANAGER` only).

### Audit Trail (`/api/audit-logs`)
- `GET /api/audit-logs` — Retrieve immutable system event logs (`PROGRAM_MANAGER` only).
