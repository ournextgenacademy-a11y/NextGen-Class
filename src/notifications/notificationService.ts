import { 
  CommunicationTemplate, 
  CommunicationType, 
  CommunicationLogEntry, 
  CommunicationMessage, 
  User, 
  Application, 
  Cohort, 
  Program, 
  Assessment 
} from '../types';
import { emailProvider } from './emailProvider';

export interface NotificationContext {
  applicant?: {
    id?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  programme?: {
    id?: string;
    name?: string;
    title?: string;
  };
  cohort?: {
    id?: string;
    name?: string;
    startDate?: string;
    endDate?: string;
    applicationDeadline?: string;
    assessmentDeadline?: string;
  };
  assessment?: {
    id?: string;
    title?: string;
    durationMinutes?: number;
    passingScore?: number;
    deadline?: string;
    closeDate?: string;
  };
  application?: {
    id?: string;
    status?: string;
    appliedDate?: string;
    assessmentScore?: number;
    scholarshipAwarded?: boolean;
    scholarshipPercentage?: number;
  };
  deadline?: string;
  customData?: Record<string, string | number | undefined>;
}

export const TEMPLATE_VARIABLES = [
  '{{applicant_name}}',
  '{{programme_name}}',
  '{{cohort_name}}',
  '{{assessment_name}}',
  '{{application_status}}',
  '{{deadline}}',
];

export const DEFAULT_COMMUNICATION_TEMPLATES: CommunicationTemplate[] = [
  {
    id: 'tmpl-account-created',
    type: 'ACCOUNT_CREATED',
    name: 'Account Registration Welcome',
    category: 'Account',
    subject: 'Welcome to NextGen Academy, {{applicant_name}}! 🚀',
    body: `Dear {{applicant_name}},

Welcome to NextGen Academy! Your applicant account has been successfully created and verified.

You can now explore our high-impact tech programmes, configure your applicant profile, and submit your cohort application.

Available Track Highlights:
- Programme: {{programme_name}}
- Cohort: {{cohort_name}}
- Application Deadline: {{deadline}}

Next Steps:
1. Complete your applicant background & portfolio links
2. Submit your application dossier before {{deadline}}
3. Check your portal inbox for technical screening invites

If you need any guidance, reach out to our admissions team directly via your applicant dashboard.

Warm regards,
Admissions Desk
NextGen Academy`,
    variables: ['{{applicant_name}}', '{{programme_name}}', '{{cohort_name}}', '{{deadline}}'],
    enabled: true,
    channels: {
      email: true,
      inApp: true,
      sms: false,
    },
    description: 'Triggered when a new user registers or signs up for an applicant account.',
  },
  {
    id: 'tmpl-application-submitted',
    type: 'APPLICATION_SUBMITTED',
    name: 'Application Submission Confirmation',
    category: 'Application',
    subject: 'Application Received: {{programme_name}} ({{cohort_name}})',
    body: `Dear {{applicant_name}},

Thank you for applying to NextGen Academy! We have successfully received and locked your application dossier for {{programme_name}} ({{cohort_name}}).

Application Summary:
- Candidate: {{applicant_name}}
- Programme: {{programme_name}}
- Cohort: {{cohort_name}}
- Current Status: {{application_status}}
- Cohort Deadline: {{deadline}}

Our admissions team and faculty review committee are evaluating dossiers on a rolling basis. You will receive an automated notification as soon as your technical screening assessment or interview stage is unlocked.

You can track your real-time review progress directly within your Applicant Portal.

Best regards,
NextGen Admissions Committee`,
    variables: ['{{applicant_name}}', '{{programme_name}}', '{{cohort_name}}', '{{application_status}}', '{{deadline}}'],
    enabled: true,
    channels: {
      email: true,
      inApp: true,
      sms: false,
    },
    description: 'Triggered when an applicant submits their complete application form.',
  },
  {
    id: 'tmpl-application-updated',
    type: 'APPLICATION_UPDATED',
    name: 'Application Dossier Updated',
    category: 'Application',
    subject: 'Update Recorded: {{programme_name}} Application',
    body: `Dear {{applicant_name}},

This notification confirms that recent changes or supplementary documents on your application for {{programme_name}} ({{cohort_name}}) have been securely updated and synchronized with our admissions records.

Current Status: {{application_status}}
Last Activity: Application dossier updated

No further action is required at this time unless requested by your assigned reviewer.

Sincerely,
NextGen Admissions Committee`,
    variables: ['{{applicant_name}}', '{{programme_name}}', '{{cohort_name}}', '{{application_status}}'],
    enabled: true,
    channels: {
      email: true,
      inApp: true,
      sms: false,
    },
    description: 'Triggered when an application draft is saved or supplementary fields are updated.',
  },
  {
    id: 'tmpl-assessment-opened',
    type: 'ASSESSMENT_OPENED',
    name: 'Assessment Screening Opened & Invitation',
    category: 'Assessment',
    subject: 'Action Required: {{assessment_name}} is now OPEN for {{programme_name}}',
    body: `Dear {{applicant_name}},

The official technical screening assessment "{{assessment_name}}" for {{programme_name}} ({{cohort_name}}) is now officially OPEN for completion!

Assessment Details:
- Assessment Title: {{assessment_name}}
- Target Cohort: {{cohort_name}}
- Submission Deadline: {{deadline}}
- Access Location: Available directly inside your NextGen Applicant Portal dashboard

Instructions:
1. Find a quiet testing environment with stable internet connectivity.
2. Review the linked prep resources and challenge guidelines.
3. Launch the timed assessment when you are ready.

We wish you the very best of luck!

Admissions & Evaluation Board
NextGen Academy`,
    variables: ['{{applicant_name}}', '{{programme_name}}', '{{cohort_name}}', '{{assessment_name}}', '{{deadline}}'],
    enabled: true,
    channels: {
      email: true,
      inApp: true,
      sms: false,
    },
    description: 'Triggered when an assessment is published/opened for cohort candidates or an invite is dispatched.',
  },
  {
    id: 'tmpl-assessment-reminder',
    type: 'ASSESSMENT_REMINDER',
    name: 'Assessment Deadline Urgent Reminder',
    category: 'Assessment',
    subject: '⏰ Urgent Reminder: Complete {{assessment_name}} by {{deadline}}',
    body: `Dear {{applicant_name}},

This is a high-priority reminder that your technical screening assessment "{{assessment_name}}" for {{programme_name}} ({{cohort_name}}) must be completed before the upcoming deadline.

Deadline: {{deadline}}
Current Application Status: {{application_status}}

Failure to submit your assessment before {{deadline}} may result in forfeiting your application for this cohort cycle.

Please log into your NextGen Applicant Portal immediately to take the test.

Warm regards,
NextGen Admissions Team`,
    variables: ['{{applicant_name}}', '{{programme_name}}', '{{cohort_name}}', '{{assessment_name}}', '{{application_status}}', '{{deadline}}'],
    enabled: true,
    channels: {
      email: true,
      inApp: true,
      sms: true,
    },
    description: 'Triggered manually or via scheduled reminder to prompt candidates to complete pending assessments.',
  },
  {
    id: 'tmpl-assessment-submitted',
    type: 'ASSESSMENT_SUBMITTED',
    name: 'Assessment Submission Confirmation',
    category: 'Assessment',
    subject: 'Assessment Submitted: {{assessment_name}} Received',
    body: `Dear {{applicant_name}},

Thank you for completing the technical screening assessment "{{assessment_name}}" for {{programme_name}} ({{cohort_name}}).

Your answers and code submissions have been securely recorded by our evaluation engine. Our admissions committee is compiling overall scores and faculty review recommendations.

You will receive an official notification regarding admission decisions or interview shortlists within 3-5 business days.

Best regards,
NextGen Assessment Engine`,
    variables: ['{{applicant_name}}', '{{programme_name}}', '{{cohort_name}}', '{{assessment_name}}'],
    enabled: true,
    channels: {
      email: true,
      inApp: true,
      sms: false,
    },
    description: 'Triggered when an applicant finishes and submits their online screening test.',
  },
  {
    id: 'tmpl-application-accepted',
    type: 'APPLICATION_ACCEPTED',
    name: 'Admissions Acceptance & Offer Letter',
    category: 'Admissions',
    subject: '🎉 Congratulations! You have been Admitted to {{programme_name}} ({{cohort_name}})',
    body: `Dear {{applicant_name}},

On behalf of NextGen Academy, we are thrilled to offer you official admission to {{programme_name}} ({{cohort_name}})!

Your outstanding application, motivation, and screening performance stood out remarkably across hundreds of competitive applicants.

Admission & Offer Highlights:
- Programme: {{programme_name}}
- Cohort: {{cohort_name}}
- Status: {{application_status}}
- Offer Response Deadline: {{deadline}}

Next Steps to Secure Your Seat:
1. Log into your NextGen Applicant Portal
2. Review and digitally accept your official Offer of Admission
3. Complete your initial learner onboarding profile before orientation

We are immensely proud to welcome you into our upcoming NextGen Class!

Warm regards,
Dr. Sarah Chen
Director of Programmes & Admissions
NextGen Academy`,
    variables: ['{{applicant_name}}', '{{programme_name}}', '{{cohort_name}}', '{{application_status}}', '{{deadline}}'],
    enabled: true,
    channels: {
      email: true,
      inApp: true,
      sms: false,
    },
    description: 'Triggered when a Program Manager marks an applicant as Accepted / Admitted.',
  },
  {
    id: 'tmpl-application-rejected',
    type: 'APPLICATION_REJECTED',
    name: 'Admissions Committee Decision - Regret',
    category: 'Rejection',
    subject: 'NextGen Academy Application Decision: {{programme_name}} ({{cohort_name}})',
    body: `Dear {{applicant_name}},

Thank you for your interest and the considerable effort you invested in applying to {{programme_name}} ({{cohort_name}}).

After careful review of all applications and assessment results, we regret to inform you that we are unable to offer you a seat in this cohort cycle due to extreme seat competition and limited cohort capacity.

We strongly encourage you to reapply for our future cohorts. You retain full access to open workshop materials and preparatory modules on your portal.

We wish you the very best in your continuing technology and professional journey.

Sincerely,
NextGen Admissions Board`,
    variables: ['{{applicant_name}}', '{{programme_name}}', '{{cohort_name}}', '{{application_status}}'],
    enabled: true,
    channels: {
      email: true,
      inApp: true,
      sms: false,
    },
    description: 'Triggered when an application decision is rendered as Rejected.',
  },
  {
    id: 'tmpl-application-waitlisted',
    type: 'APPLICATION_WAITLISTED',
    name: 'Priority Waitlist Placement',
    category: 'Admissions',
    subject: 'NextGen Academy Application Status: Placed on Priority Waitlist ({{cohort_name}})',
    body: `Dear {{applicant_name}},

Thank you for your patience while our admissions board reviewed your application for {{programme_name}} ({{cohort_name}}).

While your credentials and assessment performance met our qualifying criteria, our current cohort capacity has been reached. We have therefore placed your dossier on our Priority Waitlist.

Current Status: {{application_status}}
Programme: {{programme_name}}
Cohort: {{cohort_name}}

If admitted candidates forfeit their seats or additional capacity is unlocked, candidates on the priority waitlist will be extended admission offers in sequence. We will notify you promptly of any updates.

Warm regards,
NextGen Admissions Board`,
    variables: ['{{applicant_name}}', '{{programme_name}}', '{{cohort_name}}', '{{application_status}}'],
    enabled: true,
    channels: {
      email: true,
      inApp: true,
      sms: false,
    },
    description: 'Triggered when an applicant is placed on the waitlist for a cohort.',
  },
];

/**
 * Replace all merge tags {{tag_name}} with actual context data
 */
export function interpolateVariables(templateText: string, context: NotificationContext): string {
  if (!templateText) return '';

  const applicantName = context.applicant?.fullName || 'Candidate';
  const programmeName = context.programme?.name || context.programme?.title || 'NextGen Tech Fellowship';
  const cohortName = context.cohort?.name || 'Cohort 2026';
  const assessmentName = context.assessment?.title || 'Technical Screening Assessment';
  const rawStatus = context.application?.status || 'under_review';
  const formattedStatus = rawStatus.replace(/_/g, ' ').toUpperCase();
  const deadline = 
    context.deadline || 
    context.assessment?.deadline || 
    context.assessment?.closeDate || 
    context.cohort?.assessmentDeadline || 
    context.cohort?.applicationDeadline || 
    'September 15, 2026';

  let rendered = templateText
    .replace(/{{\s*applicant_name\s*}}/gi, applicantName)
    .replace(/{{\s*programme_name\s*}}/gi, programmeName)
    .replace(/{{\s*program_name\s*}}/gi, programmeName)
    .replace(/{{\s*cohort_name\s*}}/gi, cohortName)
    .replace(/{{\s*assessment_name\s*}}/gi, assessmentName)
    .replace(/{{\s*application_status\s*}}/gi, formattedStatus)
    .replace(/{{\s*deadline\s*}}/gi, deadline)
    .replace(/{{\s*assessment_deadline\s*}}/gi, deadline)
    .replace(/{{\s*start_date\s*}}/gi, context.cohort?.startDate || 'September 14, 2026')
    .replace(/{{\s*assessment_score\s*}}/gi, String(context.application?.assessmentScore || 85))
    .replace(/{{\s*scholarship_status\s*}}/gi, context.application?.scholarshipAwarded ? `${context.application.scholarshipPercentage || 100}% Tuition Scholarship` : 'General Admission');

  // Custom data replacements if any
  if (context.customData) {
    Object.entries(context.customData).forEach(([key, val]) => {
      const reg = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      rendered = rendered.replace(reg, String(val ?? ''));
    });
  }

  return rendered;
}

/**
 * Core Notification Engine Dispatcher
 * Handles variable interpolation, channel dispatch (email simulation, in-app inbox),
 * and generates verifiable audit logs.
 */
export async function dispatchNotificationEvent(params: {
  type: CommunicationType;
  templates: CommunicationTemplate[];
  context: NotificationContext;
  forceSend?: boolean; // bypass template.enabled check (e.g. for testing)
  customSubject?: string;
  customBody?: string;
  channelsOverride?: { email: boolean; inApp: boolean; sms: boolean };
  sender?: { id: string; name: string; role: any };
}): Promise<{
  dispatched: boolean;
  reason?: string;
  log?: CommunicationLogEntry;
  inAppMessage?: CommunicationMessage;
}> {
  const { type, templates, context, forceSend, customSubject, customBody, channelsOverride, sender } = params;

  // Find matching template
  const template = templates.find(t => t.type === type) || DEFAULT_COMMUNICATION_TEMPLATES.find(t => t.type === type);

  if (!template && !customSubject && !customBody) {
    return {
      dispatched: false,
      reason: `No template configured for notification type: ${type}`,
    };
  }

  // Check if automated messaging is enabled
  const isEnabled = forceSend || (template ? template.enabled : true);
  if (!isEnabled) {
    return {
      dispatched: false,
      reason: `Automated notifications for ${type} are currently disabled in template settings.`,
    };
  }

  const rawSubject = customSubject || template?.subject || `Update: ${type.replace(/_/g, ' ')}`;
  const rawBody = customBody || template?.body || 'Notification details.';

  const subject = interpolateVariables(rawSubject, context);
  const content = interpolateVariables(rawBody, context);

  const recipientEmail = context.applicant?.email || 'applicant@example.com';
  const recipientName = context.applicant?.fullName || 'Applicant';
  const recipientId = context.applicant?.id || 'applicant-user';
  const channels = channelsOverride || template?.channels || { email: true, inApp: true, sms: false };

  const nowIso = new Date().toISOString();
  const formattedDate = new Date().toLocaleString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // 1. Dispatch Email Abstraction
  let emailDeliveryNote = 'Email skipped (channel off)';
  let isEmailSuccessful = true;
  if (channels.email) {
    try {
      const emailRes = await emailProvider.sendEmail({
        to: recipientEmail,
        recipientName,
        subject,
        html: content,
        text: content,
      });
      if (emailRes.channel === 'gmail_api' && emailRes.success) {
        emailDeliveryNote = `Gmail API 200 OK (${emailRes.messageId})`;
      } else if (emailRes.success) {
        emailDeliveryNote = `Email Sent (${emailRes.messageId})`;
      } else {
        isEmailSuccessful = false;
        emailDeliveryNote = `Gmail Delivery Notice: ${emailRes.error || 'Pending OAuth reconnect'}`;
      }
    } catch (err: any) {
      isEmailSuccessful = false;
      emailDeliveryNote = `Email error: ${err?.message || 'Delivery error'}`;
    }
  }

  const inAppDeliveryNote = channels.inApp ? 'In-App Portal Inbox Delivered' : 'In-App skipped';
  const smsDeliveryNote = channels.sms ? 'SMS Gateway simulated (Twilio Queued)' : '';

  const activeChannelTypes = [
    channels.email && 'Email',
    channels.inApp && 'Portal Inbox',
    channels.sms && 'SMS'
  ].filter(Boolean).join(' + ') || 'System';

  const deliveryResultText = [emailDeliveryNote, inAppDeliveryNote, smsDeliveryNote].filter(Boolean).join(' • ');

  // 2. Create Log Entry
  const log: CommunicationLogEntry = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    recipient: recipientEmail,
    recipientName,
    recipientId,
    messageType: type,
    templateId: template?.id,
    subject,
    content,
    date: formattedDate,
    status: 'delivered',
    deliveryResult: deliveryResultText,
    channel: (channels.email && channels.inApp) ? 'multi_channel' : (channels.email ? 'email' : 'in_app'),
    applicationId: context.application?.id,
    cohortId: context.cohort?.id,
    programId: context.programme?.id,
    assessmentId: context.assessment?.id,
  };

  // 3. Create In-App Message if inApp is enabled
  let inAppMessage: CommunicationMessage | undefined;
  if (channels.inApp) {
    inAppMessage = {
      id: 'msg-ntf-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      senderId: sender?.id || 'system',
      senderName: sender?.name || 'NextGen Admissions Desk',
      senderRole: sender?.role || 'program_manager',
      recipientId,
      recipientName,
      programId: context.programme?.id,
      cohortId: context.cohort?.id,
      type: type,
      templateType: type,
      subject,
      content,
      sentAt: formattedDate,
      status: 'delivered',
      tags: [type.replace(/_/g, ' '), activeChannelTypes],
    };
  }

  return {
    dispatched: true,
    log,
    inAppMessage,
  };
}
