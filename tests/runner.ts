import { runSchemaTests } from './schema.test';
import { runAuthTests } from './auth.test';
import { runRbacTests } from './rbac.test';
import { runOwnershipTests } from './ownership.test';
import { runValidationTests } from './validation.test';
import { runProgrammeCohortTests } from './programme_cohort.test';
import { runModule3AuthAccessControlTests } from './module3_auth_access_control.test';
import { runModule11DashboardMneTests } from './module11_dashboard_mne.test';

async function runAllTests() {
  console.log('===============================================================');
  console.log('    NEXTGEN CLASS — APPLICATION & M&E VERIFICATION SUITE       ');
  console.log('===============================================================\n');

  const testSuites = [
    { name: 'Database Schema & Relational Integrity', fn: runSchemaTests },
    { name: 'Cryptographic Authentication & Session Tokens', fn: runAuthTests },
    { name: 'Role-Based Access Control (RBAC) Matrices', fn: runRbacTests },
    { name: 'Resource Ownership & Data Isolation Policies', fn: runOwnershipTests },
    { name: 'Input Sanitization & Schema Validation (Zod)', fn: runValidationTests },
    { name: 'Module 2: Programme & Cohort Lifecycle Management (CRUD)', fn: runProgrammeCohortTests },
    { name: 'Module 3: Authentication, Protected Routes & RBAC Access Control', fn: runModule3AuthAccessControlTests },
    { name: 'Module 11: Application Dashboard & M&E Calculation Engine', fn: runModule11DashboardMneTests },
  ];

  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of testSuites) {
    console.log(`[SUITE] Running: ${suite.name}...`);
    try {
      const results = await suite.fn();
      for (const res of results) {
        if (res.passed) {
          console.log(`  ✓ [PASS] ${res.name}`);
          if (res.details) {
            console.log(`     ↳ ${res.details}`);
          }
          totalPassed++;
        } else {
          console.error(`  ✗ [FAIL] ${res.name}`);
          if (res.details) {
            console.error(`     ↳ ${res.details}`);
          }
          totalFailed++;
        }
      }
    } catch (err: any) {
      console.error(`  ✗ [ERROR] Suite '${suite.name}' threw an unexpected exception:`, err.message);
      totalFailed++;
    }
    console.log('');
  }

  console.log('===============================================================');
  console.log(`SUMMARY: ${totalPassed} PASSED | ${totalFailed} FAILED | TOTAL: ${totalPassed + totalFailed}`);
  console.log('===============================================================');

  if (totalFailed > 0) {
    console.error('\nVerification tests FAILED. Please review the output above.');
    process.exit(1);
  } else {
    console.log('\nAll architectural verification tests PASSED with 100% success rate.');
  }
}

runAllTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
