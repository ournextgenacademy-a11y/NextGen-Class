# NextGen Class — Technical Architecture Specification

## 1. System Overview
NextGen Class is a scalable, multi-tenant programme management and admissions engine built for NextGen Academy. The platform governs the complete lifecycle from admissions applications, multi-format assessments, rubric-based evaluation, offer letters, enrollment, through to learner management, cohort tracking, and M&E donor reporting.

## 2. Core Architectural Principles
1. **Authentication-First Gateway**: All application routes and API endpoints are strictly protected. No unauthenticated user can access internal application screens, program data, or dashboards.
2. **Unified Data & Service Core**: Applicant, Program Manager, Facilitator, and Learner portals share a single PostgreSQL database, unified authentication engine, centralized file storage, and transactional notification layer.
3. **Programme-Agnostic & Cohort-Agnostic**: Zero hard-coded programme names or static cohort assumptions. All programmes, cohorts, dynamic application form schemas, screening tests, and rubric definitions are dynamically configured in the database.
4. **Strict Role-Based Access Control (RBAC)**: Enforces least-privilege permissions across `APPLICANT`, `PROGRAM_MANAGER`, `FACILITATOR`, and `LEARNER` roles at the route and database query levels.
5. **Multi-Tenant Ownership Isolation**: Multi-tenant data segregation guarantees applicants can only access their own submissions and evaluations, while staff leads have consolidated administrative oversight.

## 3. Technology Stack
- **Backend Runtime**: Node.js with Express & TypeScript (`server.ts`)
- **Database & ORM**: PostgreSQL with Drizzle ORM (`drizzle-orm/pg-core`)
- **Authentication**: Cryptographic bcrypt password hashing with signed JWT bearer tokens
- **Object Storage**: S3-compatible cloud storage provider abstraction (`storageProvider.ts`)
- **Notifications**: Transactional email provider abstraction (`emailProvider.ts`)
- **Input Validation**: Zod schema validation (`schemas.ts`)
- **Frontend Framework**: React 19, TypeScript, Tailwind CSS, Lucide icons
