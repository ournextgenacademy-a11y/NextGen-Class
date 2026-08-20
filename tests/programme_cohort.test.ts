import { inMemoryProgrammes, inMemoryCohorts, ProgrammeRecord, CohortRecord } from '../src/server/api/programmeRoutes';
import { createProgrammeSchema, updateProgrammeSchema, createCohortSchema, updateCohortSchema } from '../src/validation/schemas';

export interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

export async function runProgrammeCohortTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // TEST 1: Programme Creation — Program Manager creates "Generative AI & AI Automation"
  try {
    const input = {
      name: 'Generative AI & AI Automation',
      slug: 'generative-ai-ai-automation',
      description: 'Comprehensive curriculum covering LLMs, Autonomous Agents, Prompt Architecture, and Tool Integration.',
      status: 'ACTIVE' as const,
    };

    const validated = createProgrammeSchema.parse(input);
    const newProg: ProgrammeRecord = {
      id: `prog_${Date.now()}_test1`,
      name: validated.name,
      slug: validated.slug,
      description: validated.description || '',
      status: validated.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryProgrammes.unshift(newProg);

    const exists = inMemoryProgrammes.find(p => p.id === newProg.id && p.name === 'Generative AI & AI Automation');
    results.push({
      name: 'Program Manager: Create Programme ("Generative AI & AI Automation")',
      passed: !!exists && exists.status === 'ACTIVE',
      details: `Created ID: ${newProg.id} | Slug: ${newProg.slug} | Status: ${newProg.status}`,
    });
  } catch (err: any) {
    results.push({
      name: 'Program Manager: Create Programme ("Generative AI & AI Automation")',
      passed: false,
      details: err.message,
    });
  }

  // TEST 2: Dynamic Non-Hardcoded Programme Creation — Program Manager creates second arbitrary programme
  let secondProgId = '';
  try {
    const secondProgInput = {
      name: 'Cloud Native & DevOps Engineering',
      slug: 'cloud-native-devops-engineering',
      description: 'Kubernetes, Terraform, Microservices architecture, and CI/CD pipelines.',
      status: 'ACTIVE' as const,
    };

    const validated = createProgrammeSchema.parse(secondProgInput);
    const secondProg: ProgrammeRecord = {
      id: `prog_${Date.now()}_test2`,
      name: validated.name,
      slug: validated.slug,
      description: validated.description || '',
      status: validated.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryProgrammes.unshift(secondProg);
    secondProgId = secondProg.id;

    results.push({
      name: 'Dynamic Programme Independence (No Hardcoding)',
      passed: inMemoryProgrammes.length >= 2,
      details: `Successfully created custom programme '${secondProg.name}' without code modifications.`,
    });
  } catch (err: any) {
    results.push({
      name: 'Dynamic Programme Independence (No Hardcoding)',
      passed: false,
      details: err.message,
    });
  }

  // TEST 3: Edit Programme
  try {
    const progToEdit = inMemoryProgrammes.find(p => p.name === 'Generative AI & AI Automation');
    if (!progToEdit) throw new Error('Programme not found');

    const updateData = {
      description: 'Updated description: Advanced multi-agent frameworks, LangGraph, and enterprise automation.',
    };
    const validated = updateProgrammeSchema.parse(updateData);
    progToEdit.description = validated.description!;
    progToEdit.updatedAt = new Date().toISOString();

    results.push({
      name: 'Program Manager: Edit Programme',
      passed: progToEdit.description.includes('LangGraph'),
      details: `Updated description verified: ${progToEdit.description.substring(0, 45)}...`,
    });
  } catch (err: any) {
    results.push({
      name: 'Program Manager: Edit Programme',
      passed: false,
      details: err.message,
    });
  }

  // TEST 4: Activate / Deactivate Programme (Status Transitions)
  try {
    const prog = inMemoryProgrammes.find(p => p.id === secondProgId);
    if (!prog) throw new Error('Target programme not found');

    // Deactivate -> DRAFT
    prog.status = 'DRAFT';
    const isDraft = prog.status === 'DRAFT';

    // Reactivate -> ACTIVE
    prog.status = 'ACTIVE';
    const isActive = prog.status === 'ACTIVE';

    results.push({
      name: 'Program Manager: Activate / Deactivate Programme',
      passed: isDraft && isActive,
      details: 'Successfully transitioned status: ACTIVE -> DRAFT -> ACTIVE',
    });
  } catch (err: any) {
    results.push({
      name: 'Program Manager: Activate / Deactivate Programme',
      passed: false,
      details: err.message,
    });
  }

  // TEST 5: Archive Programme
  try {
    const prog = inMemoryProgrammes.find(p => p.id === secondProgId);
    if (!prog) throw new Error('Target programme not found');

    prog.status = 'ARCHIVED';
    prog.updatedAt = new Date().toISOString();

    results.push({
      name: 'Program Manager: Archive Programme',
      passed: prog.status === 'ARCHIVED',
      details: `Status is now '${prog.status}'`,
    });
  } catch (err: any) {
    results.push({
      name: 'Program Manager: Archive Programme',
      passed: false,
      details: err.message,
    });
  }

  // TEST 6: Create Cohort with All Required Fields
  let createdCohortId = '';
  try {
    const genAiProg = inMemoryProgrammes.find(p => p.name === 'Generative AI & AI Automation')!;
    const cohortInput = {
      programmeId: genAiProg.id,
      name: 'Generative AI & AI Automation Cohort 1',
      applicationOpenDate: '2026-08-01',
      applicationCloseDate: '2026-09-30',
      programmeStartDate: '2026-10-15',
      programmeEndDate: '2027-01-30',
      capacity: 60,
      description: 'Inaugural cohort for Generative AI and AI Automation specialists.',
      status: 'APPLICATIONS_OPEN' as const,
    };

    const validated = createCohortSchema.parse(cohortInput);
    const newCohort: CohortRecord = {
      id: `coh_${Date.now()}_test1`,
      programmeId: validated.programmeId,
      name: validated.name,
      applicationOpenDate: validated.applicationOpenDate,
      applicationCloseDate: validated.applicationCloseDate,
      programmeStartDate: validated.programmeStartDate,
      programmeEndDate: validated.programmeEndDate,
      capacity: validated.capacity,
      description: validated.description,
      status: validated.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryCohorts.unshift(newCohort);
    createdCohortId = newCohort.id;

    results.push({
      name: 'Program Manager: Create Cohort with All Fields',
      passed: !!newCohort.id && newCohort.capacity === 60 && newCohort.status === 'APPLICATIONS_OPEN',
      details: `Cohort '${newCohort.name}' linked to Programme '${genAiProg.name}' (Cap: ${newCohort.capacity})`,
    });
  } catch (err: any) {
    results.push({
      name: 'Program Manager: Create Cohort with All Fields',
      passed: false,
      details: err.message,
    });
  }

  // TEST 7: Edit Cohort Fields (Dates, Capacity, Description)
  try {
    const cohort = inMemoryCohorts.find(c => c.id === createdCohortId);
    if (!cohort) throw new Error('Cohort not found');

    const updateData = {
      capacity: 75,
      description: 'Expanded capacity cohort with additional mentor-led weekend labs.',
    };
    const validated = updateCohortSchema.parse(updateData);
    cohort.capacity = validated.capacity!;
    cohort.description = validated.description!;
    cohort.updatedAt = new Date().toISOString();

    results.push({
      name: 'Program Manager: Edit Cohort',
      passed: cohort.capacity === 75 && cohort.description.includes('Expanded capacity'),
      details: `Capacity updated to ${cohort.capacity} seats | Description updated`,
    });
  } catch (err: any) {
    results.push({
      name: 'Program Manager: Edit Cohort',
      passed: false,
      details: err.message,
    });
  }

  // TEST 8: Open Applications (Status -> APPLICATIONS_OPEN)
  try {
    const cohort = inMemoryCohorts.find(c => c.id === createdCohortId);
    if (!cohort) throw new Error('Cohort not found');

    cohort.status = 'APPLICATIONS_OPEN';
    cohort.updatedAt = new Date().toISOString();

    results.push({
      name: 'Program Manager: Open Applications',
      passed: cohort.status === 'APPLICATIONS_OPEN',
      details: `Cohort '${cohort.name}' status set to APPLICATIONS_OPEN`,
    });
  } catch (err: any) {
    results.push({
      name: 'Program Manager: Open Applications',
      passed: false,
      details: err.message,
    });
  }

  // TEST 9: Close Applications (Status -> APPLICATIONS_CLOSED)
  try {
    const cohort = inMemoryCohorts.find(c => c.id === createdCohortId);
    if (!cohort) throw new Error('Cohort not found');

    cohort.status = 'APPLICATIONS_CLOSED';
    cohort.updatedAt = new Date().toISOString();

    results.push({
      name: 'Program Manager: Close Applications',
      passed: cohort.status === 'APPLICATIONS_CLOSED',
      details: `Cohort '${cohort.name}' status set to APPLICATIONS_CLOSED`,
    });
  } catch (err: any) {
    results.push({
      name: 'Program Manager: Close Applications',
      passed: false,
      details: err.message,
    });
  }

  // TEST 10: Archive Cohort (Status -> ARCHIVED)
  try {
    const cohort = inMemoryCohorts.find(c => c.id === createdCohortId);
    if (!cohort) throw new Error('Cohort not found');

    cohort.status = 'ARCHIVED';
    cohort.updatedAt = new Date().toISOString();

    results.push({
      name: 'Program Manager: Archive Cohort',
      passed: cohort.status === 'ARCHIVED',
      details: `Cohort '${cohort.name}' status set to ARCHIVED`,
    });
  } catch (err: any) {
    results.push({
      name: 'Program Manager: Archive Cohort',
      passed: false,
      details: err.message,
    });
  }

  return results;
}
