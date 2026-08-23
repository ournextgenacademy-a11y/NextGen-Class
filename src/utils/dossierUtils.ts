import { Application, ApplicationFormField, ApplicationForm, UploadedFileRecord } from '../types';

/**
 * Maps a dynamic field definition to a standard property on the Application model if applicable
 */
export function getStandardKeyForField(field: { id: string; label: string; fieldType: string }): string | null {
  const idLower = field.id.toLowerCase();
  const labelLower = field.label.toLowerCase();

  if (idLower === 'fullname' || labelLower.includes('full legal name') || (labelLower.includes('full name') && !labelLower.includes('kin'))) {
    return 'fullName';
  }
  if (idLower === 'email' || field.fieldType === 'email' || labelLower.includes('email')) {
    return 'email';
  }
  if (idLower === 'phone' || field.fieldType === 'phone' || labelLower.includes('phone') || labelLower.includes('contact number')) {
    return 'phone';
  }
  if (idLower === 'country' || labelLower.includes('country of residence') || labelLower === 'country') {
    return 'country';
  }
  if (idLower === 'city' || labelLower.includes('city') || labelLower.includes('state of residence')) {
    return 'city';
  }
  if (idLower === 'gender' || labelLower.includes('gender')) {
    return 'gender';
  }
  if (idLower === 'agerange' || labelLower.includes('age range') || labelLower.includes('age group')) {
    return 'ageRange';
  }
  if (idLower === 'educationlevel' || labelLower.includes('education') || labelLower.includes('highest educational')) {
    return 'educationLevel';
  }
  if (idLower === 'fieldofstudy' || labelLower.includes('field of study') || labelLower.includes('discipline') || labelLower.includes('major')) {
    return 'fieldOfStudy';
  }
  if (idLower === 'employmentstatus' || labelLower.includes('employment status') || labelLower.includes('current employment')) {
    return 'employmentStatus';
  }
  if (idLower === 'yearsexperience' || labelLower.includes('years of experience') || labelLower.includes('technical / programming experience') || labelLower.includes('programming experience')) {
    return 'yearsExperience';
  }
  if (idLower === 'programmingbackground' || labelLower.includes('programming background') || labelLower.includes('languages & tools') || labelLower.includes('languages / technologies')) {
    return 'programmingBackground';
  }
  if (idLower === 'linkedinurl' || labelLower.includes('linkedin')) {
    return 'linkedinUrl';
  }
  if (idLower === 'githuburl' || labelLower.includes('github') || labelLower.includes('portfolio url')) {
    return 'githubUrl';
  }
  if (idLower === 'portfoliourl' || labelLower.includes('portfolio website') || labelLower.includes('personal website')) {
    return 'portfolioUrl';
  }
  if (idLower === 'cvurl' || labelLower.includes('resume') || labelLower.includes('curriculum vitae') || labelLower.includes('cv')) {
    return 'cvUrl';
  }
  if (idLower === 'motivationstatement' || labelLower.includes('why do you want to join') || labelLower.includes('motivation')) {
    return 'motivationStatement';
  }
  if (idLower === 'goalsstatement' || labelLower.includes('career goals') || labelLower.includes('goals after completing')) {
    return 'goalsStatement';
  }

  return null;
}

/**
 * Extracts the exact submitted value for a given form field from the applicant's application.
 * Returns null/undefined if the applicant did not provide this field.
 */
export function getApplicantFieldValue(
  application: Application,
  field: { id: string; label: string; fieldType: string }
): any {
  // 1. Direct answer in customAnswers matching field ID
  if (application.customAnswers && application.customAnswers[field.id] !== undefined && application.customAnswers[field.id] !== '') {
    return application.customAnswers[field.id];
  }

  // 2. Direct uploaded file record in uploadedFiles
  if (application.uploadedFiles && application.uploadedFiles[field.id]) {
    return application.uploadedFiles[field.id];
  }

  // 3. Matched standard key
  const stdKey = getStandardKeyForField(field);
  if (stdKey) {
    if (application.customAnswers && application.customAnswers[stdKey] !== undefined && application.customAnswers[stdKey] !== '') {
      return application.customAnswers[stdKey];
    }
    if (stdKey === 'cvUrl' && application.cvUrl) {
      return application.cvUrl;
    }
    const val = (application as any)[stdKey];
    if (val !== undefined && val !== null && val !== '') {
      return val;
    }
  }

  // 4. Fallback direct property on application
  const directVal = (application as any)[field.id];
  if (directVal !== undefined && directVal !== null && directVal !== '') {
    return directVal;
  }

  return null;
}

/**
 * Extracts or constructs an UploadedFileRecord for a given field
 */
export function getUploadedFileForField(
  application: Application,
  fieldId: string
): UploadedFileRecord | null {
  if (application.uploadedFiles && application.uploadedFiles[fieldId]) {
    return application.uploadedFiles[fieldId];
  }
  if (fieldId === 'cvUrl' && application.cvUrl) {
    return {
      id: `file-cv-${application.id}`,
      fieldId: 'cvUrl',
      fileName: application.cvUrl.startsWith('http') ? 'Candidate_Resume.pdf' : application.cvUrl,
      fileSizeMb: 1.5,
      fileType: 'application/pdf',
      uploadedAt: application.appliedDate || new Date().toISOString(),
      status: 'completed',
      fileUrl: application.cvUrl,
      verificationStatus: 'verified',
    };
  }
  return null;
}

/**
 * Finds custom answers submitted by the applicant that were not part of the standard published form sections
 */
export function getAdditionalCustomAnswers(
  application: Application,
  publishedForm?: ApplicationForm
): Record<string, any> {
  if (!application.customAnswers || Object.keys(application.customAnswers).length === 0) {
    return {};
  }

  const knownFieldIds = new Set<string>();
  if (publishedForm) {
    publishedForm.sections.forEach(sec => {
      sec.fields.forEach(f => {
        knownFieldIds.add(f.id);
        const stdKey = getStandardKeyForField(f);
        if (stdKey) knownFieldIds.add(stdKey);
      });
    });
  }

  const additional: Record<string, any> = {};
  Object.entries(application.customAnswers).forEach(([key, val]) => {
    if (!knownFieldIds.has(key) && val !== undefined && val !== null && val !== '') {
      additional[key] = val;
    }
  });

  return additional;
}
