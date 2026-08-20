# NextGen Class — Testing Strategy & Verification Guide

## 1. Automated Verification Architecture
The test suite is structured around unit, integration, and security verification tests executed through `tests/runner.ts`:

- `tests/schema.test.ts` — Verifies all 18 database entity definitions, relationships, and programme-agnostic partitioning.
- `tests/auth.test.ts` — Verifies password hashing, JWT generation, claim parsing, and tamper rejection.
- `tests/rbac.test.ts` — Verifies role boundary isolation across Applicant, Program Manager, Facilitator, and Learner.
- `tests/ownership.test.ts` — Verifies that multi-tenant applicant isolation prevents horizontal privilege escalation.
- `tests/validation.test.ts` — Verifies Zod input schemas for registration, login, and dynamic form submissions.

## 2. Running the Verification Suite
Execute the automated test suite directly via npm:
```bash
npm test
```
Or execute the runner directly with tsx:
```bash
npx tsx tests/runner.ts
```

## 3. Build & Compilation Verification
To ensure full TypeScript type-checking and bundling compliance:
```bash
npm run build
```
