# NextGen Class — Firestore Security Specification & Threat Model

## 1. Data Invariants
1. **User Identity & PII Isolation**:
   - Every document in `/users/{userId}` is strictly keyed by `request.auth.uid`.
   - Normal users can only read and update their own profile document (`request.auth.uid == userId`).
   - Regular users cannot elevate their role to `program_manager` or modify their `status`.
2. **Dynamic Program & Cohort Immutability**:
   - Only administrative staff (`isAdmin()`) can create, update, or archive programmes and cohorts.
   - All authenticated users can read active programmes and cohorts.
3. **Application Ownership & Non-Tampering**:
   - An application document in `/applications/{applicationId}` MUST have `applicantId == request.auth.uid`.
   - Applicants can only create their own applications and read their own applications.
   - Status transitions to `ADMITTED`, `REJECTED`, or `UNDER_REVIEW` can only be performed by administrators (`isAdmin()`).
4. **Assessment & Attempt Integrity**:
   - Assessment definitions in `/assessments` can only be modified by admins.
   - Assessment attempts in `/assessmentAttempts` can be created by candidates with `applicantId == request.auth.uid`. Candidates can only submit their own answers and cannot modify final graded scores.
5. **Notification Confidentiality**:
   - Notifications in `/notifications` are readable and updateable (mark as read) only by the targeted recipient (`resource.data.userId == request.auth.uid`).
6. **Immutable Audit Trail**:
   - Audit logs in `/auditLogs` cannot be updated or deleted by any client (`allow update, delete: if false;`).

---

## 2. The "Dirty Dozen" Payloads (Threat Matrix)

1. **Payload 1: Cross-User Profile Hijack**
   - Attacker attempts to update `/users/victim_uid` with `{ displayName: "Attacker" }`.
   - *Expected*: `PERMISSION_DENIED`.
2. **Payload 2: Role Escalation via Registration**
   - Attacker attempts to create `/users/attacker_uid` with `{ role: "program_manager" }`.
   - *Expected*: `PERMISSION_DENIED` (client-side self-assignment of staff role is rejected).
3. **Payload 3: Status Elevation Bypass**
   - Attacker attempts to update own application status to `"ADMITTED"`.
   - *Expected*: `PERMISSION_DENIED` (only admins can mutate decision statuses).
4. **Payload 4: Shadow Field Injection**
   - Attacker attempts to create a document with extra unvetted fields (e.g. `{ isAdmin: true, bypassPayment: true }`).
   - *Expected*: `PERMISSION_DENIED` (strict schema keys enforcement).
5. **Payload 5: Denial of Wallet via ID Length Poisoning**
   - Attacker attempts to write to a document ID consisting of a 2KB junk string.
   - *Expected*: `PERMISSION_DENIED` (`isValidId` regex and length bounds).
6. **Payload 6: Denial of Wallet via Payload String Bloating**
   - Attacker attempts to write a 1MB string into `displayName` or `title`.
   - *Expected*: `PERMISSION_DENIED` (`.size() <= MAX` bounds).
7. **Payload 7: Unverified Email Write Attack**
   - Attacker with `email_verified == false` attempts write operation.
   - *Expected*: `PERMISSION_DENIED` (`request.auth.token.email_verified == true`).
8. **Payload 8: Blanket List Query Scraping**
   - Attacker attempts `getDocs(collection(db, 'applications'))` without `where("applicantId", "==", auth.uid)`.
   - *Expected*: `PERMISSION_DENIED` (rule checks `resource.data.applicantId == request.auth.uid`).
9. **Payload 9: Cross-User Notification Snooping**
   - Attacker attempts to read `/notifications/victim_notification_id`.
   - *Expected*: `PERMISSION_DENIED` (`resource.data.userId == request.auth.uid`).
10. **Payload 10: Audit Log Tampering / Deletion**
    - Attacker or rogue staff attempts `deleteDoc(doc(db, 'auditLogs', 'log_123'))`.
    - *Expected*: `PERMISSION_DENIED` (immutable audit log).
11. **Payload 11: Future Timestamp Forgery**
    - Attacker supplies client-side fabricated `createdAt` in 2030.
    - *Expected*: `PERMISSION_DENIED` (`incoming().createdAt == request.time`).
12. **Payload 12: Terminal State Overwrite**
    - Attacker attempts to modify an application after it reached terminal status `ENROLLED` or `WITHDRAWN`.
    - *Expected*: `PERMISSION_DENIED`.
