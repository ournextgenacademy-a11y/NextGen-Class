import React from 'react';
import { Application, ApplicationForm, UploadedFileRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  getApplicantFieldValue, 
  getUploadedFileForField, 
  getAdditionalCustomAnswers 
} from '../../utils/dossierUtils';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Download, 
  Eye, 
  User, 
  GraduationCap, 
  Briefcase, 
  FileCode, 
  Check 
} from 'lucide-react';

interface SubmittedApplicationFormViewProps {
  application: Application;
  publishedForm?: ApplicationForm;
  isManager?: boolean;
  isManagerView?: boolean;
  onVerifyDocument?: (applicationIdOrFieldId: string, fieldIdOrStatus?: any, statusOrNote?: any, note?: any) => void;
}

export const SubmittedApplicationFormView: React.FC<SubmittedApplicationFormViewProps> = ({
  application,
  publishedForm,
  isManager = false,
  isManagerView = false,
  onVerifyDocument,
}) => {
  const { getPublishedFormForProgramme, programs, cohorts, currentUser } = useApp();
  const managerMode = isManager || isManagerView;

  const program = programs.find(p => p.id === application.programId);
  const cohort = cohorts.find(c => c.id === application.cohortId);
  const form: ApplicationForm | undefined = publishedForm || getPublishedFormForProgramme(application.programId, application.cohortId);

  const additionalAnswers = getAdditionalCustomAnswers(application, form);

  const handleVerify = (fieldId: string, status: 'verified' | 'rejected', note?: string) => {
    if (!onVerifyDocument) return;
    // Check if onVerifyDocument expects (applicationId, fieldId, status, note) or (fieldId, status, note)
    if (onVerifyDocument.length >= 3) {
      (onVerifyDocument as any)(application.id, fieldId, status, note);
    } else {
      (onVerifyDocument as any)(fieldId, status, note);
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-800">
      {/* Header Summary Card */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Target Programme & Cohort
          </div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {program?.name || 'Programme Track'} • <span className="text-indigo-600">{cohort?.name || 'Cohort'}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Submitted on: <strong>{application.appliedDate || application.submittedAt?.split('T')[0] || 'Recently'}</strong> • Reference ID: <strong className="font-mono">#{application.id}</strong>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {application.assessmentScore !== undefined && (
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5 shadow-2xs">
              <span>Assessment Score:</span>
              <span className="text-indigo-600 font-extrabold">{application.assessmentScore}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Render Published Form Sections and Fields */}
      {form && form.sections && form.sections.length > 0 ? (
        form.sections
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((section, sIdx) => {
            return (
              <div key={section.id || sIdx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                {/* Section Header */}
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                        {sIdx + 1}
                      </span>
                      <span>{section.title}</span>
                    </h3>
                    {section.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 ml-7">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Section Fields */}
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.fields
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((field) => {
                        const val = getApplicantFieldValue(application, field);
                        const isFileField = field.fieldType === 'file_upload';
                        const fileRecord: UploadedFileRecord | null = isFileField
                          ? getUploadedFileForField(application, field.id)
                          : null;

                        const isFullWidth =
                          field.fieldType === 'long_text' ||
                          field.fieldType === 'file_upload' ||
                          field.fieldType === 'checkbox' ||
                          field.fieldType === 'multiple_choice';

                        return (
                          <div
                            key={field.id}
                            className={`space-y-1.5 ${isFullWidth ? 'md:col-span-2' : 'col-span-1'}`}
                          >
                            <div className="flex items-center justify-between">
                              <label className="font-semibold text-slate-700 text-[11px]">
                                {field.label}
                                {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                              </label>
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
                                {field.fieldType.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Render Field Value based on Type */}
                            {isFileField ? (
                              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                                {fileRecord ? (
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center space-x-2">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                          <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <div className="font-bold text-slate-900 text-xs">
                                            {fileRecord.fileName}
                                          </div>
                                          <div className="text-[10px] text-slate-400">
                                            {fileRecord.fileSizeMb || 1.2} MB • Uploaded on {fileRecord.uploadedAt?.split('T')[0] || 'Submission'}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Verification Status Badge */}
                                      <span
                                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                          fileRecord.verificationStatus === 'verified'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : fileRecord.verificationStatus === 'rejected'
                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}
                                      >
                                        {fileRecord.verificationStatus === 'verified' && <Check className="w-3 h-3 text-emerald-600" />}
                                        {fileRecord.verificationStatus === 'rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                                        {(!fileRecord.verificationStatus || fileRecord.verificationStatus === 'pending') && (
                                          <Clock className="w-3 h-3 text-amber-600" />
                                        )}
                                        <span>
                                          {(fileRecord.verificationStatus || 'Pending Review').toUpperCase()}
                                        </span>
                                      </span>
                                    </div>

                                    {fileRecord.verificationNote && (
                                      <div className="text-[11px] bg-white p-2 rounded-lg border border-slate-200 text-slate-600">
                                        <strong className="text-slate-800">Verification note:</strong> {fileRecord.verificationNote}
                                      </div>
                                    )}

                                    {/* Action Bar */}
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                                      {fileRecord.fileUrl ? (
                                        <a
                                          href={fileRecord.fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>Preview / Download Document</span>
                                        </a>
                                      ) : (
                                        <span className="text-slate-400 italic">File uploaded with application</span>
                                      )}

                                      {/* Manager Verification Buttons */}
                                      {managerMode && onVerifyDocument && (
                                        <div className="flex items-center space-x-1.5">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleVerify(
                                                field.id,
                                                'verified',
                                                `Verified by ${currentUser?.name || 'Admissions Reviewer'}`
                                              )
                                            }
                                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                                              fileRecord.verificationStatus === 'verified'
                                                ? 'bg-emerald-600 text-white shadow-2xs'
                                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                            }`}
                                          >
                                            ✓ Verify
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleVerify(
                                                field.id,
                                                'rejected',
                                                'Document requires re-upload or verification clarification'
                                              )
                                            }
                                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                                              fileRecord.verificationStatus === 'rejected'
                                                ? 'bg-rose-600 text-white shadow-2xs'
                                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                            }`}
                                          >
                                            ✕ Reject
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-slate-400 italic py-1">
                                    No document uploaded for this field.
                                  </div>
                                )}
                              </div>
                            ) : field.fieldType === 'long_text' ? (
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {val !== null && val !== undefined && val !== '' ? (
                                  String(val)
                                ) : (
                                  <span className="text-slate-400 italic">Not provided</span>
                                )}
                              </div>
                            ) : field.fieldType === 'url' ? (
                              <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-slate-800 flex items-center justify-between">
                                {val ? (
                                  <>
                                    <span className="truncate max-w-sm">{String(val)}</span>
                                    <a
                                      href={String(val).startsWith('http') ? String(val) : `https://${val}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-indigo-600 hover:text-indigo-800 ml-2 shrink-0 flex items-center space-x-1 font-semibold"
                                    >
                                      <span>Open Link</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </>
                                ) : (
                                  <span className="text-slate-400 italic">Not provided</span>
                                )}
                              </div>
                            ) : Array.isArray(val) ? (
                              <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-slate-800 flex flex-wrap gap-1.5">
                                {val.length > 0 ? (
                                  val.map((item, i) => (
                                    <span
                                      key={i}
                                      className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium text-slate-700"
                                    >
                                      {item}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 italic">None selected</span>
                                )}
                              </div>
                            ) : (
                              <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-900">
                                {val !== null && val !== undefined && val !== '' ? (
                                  String(val)
                                ) : (
                                  <span className="text-slate-400 italic font-normal">Not provided</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            );
          })
      ) : (
        /* Fallback if no dynamic sections configured: clean structured form view */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              1. Personal & Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px]">Full Legal Name</span>
                <strong className="text-slate-800">{application.fullName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Email Address</span>
                <strong className="text-slate-800">{application.email}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Phone Number</span>
                <strong className="text-slate-800">{application.phone}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Location</span>
                <strong className="text-slate-800">{application.city}, {application.country}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Gender</span>
                <strong className="text-slate-800">{application.gender}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Age Range</span>
                <strong className="text-slate-800">{application.ageRange}</strong>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              2. Academic & Professional Background
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px]">Education Level</span>
                <strong className="text-slate-800">{application.educationLevel} ({application.fieldOfStudy})</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Employment Status</span>
                <strong className="text-slate-800">{application.employmentStatus}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Technical Experience</span>
                <strong className="text-slate-800">{application.yearsExperience}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Programming Languages</span>
                <strong className="text-slate-800">{application.programmingBackground}</strong>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              3. Motivation & Career Goals
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Why NextGen Academy:</span>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 mt-1">
                  {application.motivationStatement}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Career Goals:</span>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 mt-1">
                  {application.goalsStatement}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Supplementary Answers (if candidate submitted custom extra fields) */}
      {Object.keys(additionalAnswers).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Supplementary Application Questions
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(additionalAnswers).map(([k, v]) => (
              <div key={k} className="space-y-1">
                <label className="font-semibold text-slate-700 text-[11px]">{k}</label>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">
                  {Array.isArray(v) ? v.join(', ') : String(v)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
