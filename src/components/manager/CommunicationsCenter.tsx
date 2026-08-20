import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CommunicationTemplate, CommunicationMessage } from '../../types';
import { 
  Send, 
  Sparkles, 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Award, 
  Mail, 
  MessageSquare, 
  Smartphone,
  ChevronRight,
  Layers
} from 'lucide-react';

export const CommunicationsCenter: React.FC = () => {
  const { 
    programs, 
    cohorts, 
    applications, 
    templates, 
    messages, 
    broadcastMessage,
    currentUser 
  } = useApp();

  const [selectedCohortId, setSelectedCohortId] = useState<string>('all');
  const [targetStatusFilter, setTargetStatusFilter] = useState<string>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  
  // Custom message state
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [channels, setChannels] = useState<{ email: boolean; inApp: boolean; sms: boolean }>({
    email: true,
    inApp: true,
    sms: false,
  });

  // Calculate target audience size
  const targetRecipients = applications.filter(app => {
    const matchesCohort = selectedCohortId === 'all' || app.cohortId === selectedCohortId;
    const matchesStatus = targetStatusFilter === 'all' || app.status === targetStatusFilter;
    return matchesCohort && matchesStatus;
  });

  const handleApplyTemplate = (tmplId: string) => {
    const tmpl = templates.find(t => t.id === tmplId);
    if (!tmpl) return;
    setSelectedTemplateId(tmplId);
    setSubject(tmpl.subject);
    setContent(tmpl.body);
  };

  // Preview replacement with sample candidate
  const sampleCandidate = targetRecipients[0] || applications[0];
  const sampleProg = programs.find(p => p.id === sampleCandidate?.programId);
  const sampleCohort = cohorts.find(c => c.id === sampleCandidate?.cohortId);

  const previewSubject = subject
    .replace(/{{applicant_name}}/g, sampleCandidate?.fullName || 'Amara Okafor')
    .replace(/{{program_name}}/g, sampleProg?.name || 'Autonomous AI Engineering')
    .replace(/{{cohort_name}}/g, sampleCohort?.name || 'Cohort 2');

  const previewContent = content
    .replace(/{{applicant_name}}/g, sampleCandidate?.fullName || 'Amara Okafor')
    .replace(/{{program_name}}/g, sampleProg?.name || 'Autonomous AI Engineering')
    .replace(/{{cohort_name}}/g, sampleCohort?.name || 'Cohort 2')
    .replace(/{{assessment_deadline}}/g, sampleCohort?.assessmentDeadline || 'August 24, 2026')
    .replace(/{{start_date}}/g, sampleCohort?.startDate || 'September 14, 2026');

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;

    broadcastMessage({
      senderId: currentUser.id,
      senderName: 'NextGen Academy Admissions',
      senderRole: 'program_manager',
      cohortId: selectedCohortId === 'all' ? undefined : selectedCohortId,
      type: 'broadcast',
      subject: subject,
      content: content,
    });

    setSubject('');
    setContent('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Send className="w-4 h-4" />
            <span>Applicant & Cohort Communications Center</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-['Space_Grotesk']">
            Broadcasts, Admissions Letters & Multi-Channel Messaging
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliver personalized assessment invites, interview schedules, admission offers, and onboarding instructions.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 p-2 rounded-xl">
          <Users className="w-4 h-4 text-indigo-600" />
          <span>{targetRecipients.length} Target Recipients Selected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Template Library & Audience Targeting (1 col) */}
        <div className="space-y-6">
          {/* Audience Filter Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4 text-xs">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              1. Audience Targeting
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Cohort</label>
              <select
                value={selectedCohortId}
                onChange={e => setSelectedCohortId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium outline-none"
              >
                <option value="all">All Cohorts ({applications.length} Candidates)</option>
                {cohorts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Applicant Status Segment</label>
              <select
                value={targetStatusFilter}
                onChange={e => setTargetStatusFilter(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium outline-none"
              >
                <option value="all">All Statuses in Cohort</option>
                <option value="submitted">Submitted Only</option>
                <option value="under_review">Under Review Only</option>
                <option value="assessment_invited">Assessment Invited</option>
                <option value="admitted">Admitted / Offers</option>
                <option value="enrolled">Enrolled Only</option>
              </select>
            </div>

            {/* Delivery Channels */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block font-semibold text-slate-700">Dispatch Channels</label>
              <div className="space-y-1.5">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={channels.inApp}
                    onChange={e => setChannels({ ...channels, inApp: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Applicant Portal Inbox & Notifications</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={e => setChannels({ ...channels, email: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Direct Email Dispatch</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-400">
                  <input
                    type="checkbox"
                    checked={channels.sms}
                    onChange={e => setChannels({ ...channels, sms: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>SMS Urgent Alert (Twilio Integration)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Template Selector Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3 text-xs">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              2. Smart Dynamic Templates
            </div>

            <div className="space-y-2">
              {templates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => handleApplyTemplate(tmpl.id)}
                  className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                    selectedTemplateId === tmpl.id
                      ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs">{tmpl.name}</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5 truncate">
                    {tmpl.subject}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Composer & Live Variable Preview (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSendBroadcast} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                Compose Message & Dynamic Merge Tags
              </h3>
              <div className="text-[11px] text-indigo-600 font-mono">
                Tags: {'{{applicant_name}}'}, {'{{program_name}}'}, {'{{cohort_name}}'}, {'{{start_date}}'}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject Line *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Next Steps: Assessment Screening Invitation for {{program_name}}"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Body Text *</label>
              <textarea
                rows={7}
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Dear {{applicant_name}},\n\nWe are pleased to inform you..."
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none text-xs leading-relaxed"
              />
            </div>

            {/* Live Rendered Preview */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>Sample Live Preview (Recipient: {sampleCandidate?.fullName || 'Candidate'}):</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Dynamic Merge Active
                </span>
              </div>
              <div className="font-bold text-slate-900 text-xs">
                {previewSubject || 'Subject preview will show here...'}
              </div>
              <div className="text-slate-600 text-[11px] whitespace-pre-line leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                {previewContent || 'Body content with merged variables will show here...'}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">
                Will be dispatched to <strong>{targetRecipients.length} applicants</strong> across selected channels.
              </span>

              <button
                type="submit"
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Broadcast Now</span>
              </button>
            </div>
          </form>

          {/* Recent Broadcasts History */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
              Recent Sent Broadcasts & Notices ({messages.filter(m => m.type === 'broadcast').length})
            </h3>

            <div className="divide-y divide-slate-100">
              {messages
                .filter(m => m.type === 'broadcast')
                .map(msg => (
                  <div key={msg.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{msg.subject}</span>
                      <span className="text-[10px] text-slate-400">{msg.sentAt}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{msg.content}</p>
                    <div className="text-[10px] text-indigo-600 font-medium">
                      By {msg.senderName} • Status: Delivered to all cohort applicants
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
