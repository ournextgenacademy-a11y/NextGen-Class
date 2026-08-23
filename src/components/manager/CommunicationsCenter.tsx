import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CommunicationTemplate, CommunicationType, CommunicationLogEntry, DeliveryStatus } from '../../types';
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
  Layers,
  Settings,
  ToggleLeft,
  ToggleRight,
  Edit3,
  Eye,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  XCircle,
  ArrowUpRight,
  RotateCcw,
  Trash2,
  Inbox,
  Check,
  Code,
  Zap,
  Info,
  ShieldCheck,
  Globe,
  ExternalLink,
  Lock,
  X
} from 'lucide-react';
import { interpolateVariables } from '../../notifications/notificationService';
import { 
  connectGmailAccount, 
  disconnectGmailAccount, 
  getCachedGmailAccount, 
  getInMemoryGmailToken, 
  sendEmailViaGmail,
  ConnectedGmailAccount 
} from '../../notifications/gmailService';


export const CommunicationsCenter: React.FC = () => {
  const { 
    programs, 
    cohorts, 
    applications, 
    assessments,
    templates, 
    messages, 
    communicationLogs,
    saveTemplate,
    toggleTemplateAutomation,
    resetTemplatesToDefault,
    clearCommunicationLogs,
    resendCommunication,
    broadcastManualMessage,
    currentUser 
  } = useApp();

  // Active top sub-tab
  const [activeView, setActiveView] = useState<'templates' | 'broadcast' | 'logs'>('templates');

  // ==========================================
  // TEMPLATES VIEW STATE
  // ==========================================
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CommunicationTemplate | null>(null);
  const [templateFilterType, setTemplateFilterType] = useState<string>('all');
  const [previewApplicantId, setPreviewApplicantId] = useState<string>(applications[0]?.id || '');

  // ==========================================
  // MANUAL BROADCAST VIEW STATE
  // ==========================================
  const [targetAudience, setTargetAudience] = useState<'all' | 'cohort' | 'status' | 'individual'>('cohort');
  const [selectedCohortId, setSelectedCohortId] = useState<string>(cohorts[0]?.id || 'all');
  const [targetStatusFilter, setTargetStatusFilter] = useState<string>('all');
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [selectedTemplateForBroadcast, setSelectedTemplateForBroadcast] = useState<string>('');
  const [broadcastChannels, setBroadcastChannels] = useState<{ email: boolean; inApp: boolean; sms: boolean }>({
    email: true,
    inApp: true,
    sms: false,
  });
  const [isSending, setIsSending] = useState(false);

  // ==========================================
  // AUDIT LOGS VIEW STATE
  // ==========================================
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all');
  const [selectedLogDetail, setSelectedLogDetail] = useState<CommunicationLogEntry | null>(null);
  const [resendingLogId, setResendingLogId] = useState<string | null>(null);

  // ==========================================
  // GMAIL WORKSPACE INTEGRATION STATE
  // ==========================================
  const [gmailAccount, setGmailAccount] = useState<ConnectedGmailAccount | null>(getCachedGmailAccount());
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState(applications[0]?.email || 'learner@nextgenacademy.org');
  const [testEmailSubject, setTestEmailSubject] = useState('Welcome to NextGen Academy - Testing Gmail Delivery');
  const [testEmailBody, setTestEmailBody] = useState('This is a verified test notification dispatched via the NextGen Google Workspace Gmail API integration to confirm learner email delivery.');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; messageId?: string; error?: string } | null>(null);
  const [showBroadcastConfirmModal, setShowBroadcastConfirmModal] = useState(false);

  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    const result = await connectGmailAccount();
    setIsConnectingGmail(false);
    if (result.success && result.account) {
      setGmailAccount(result.account);
    }
  };

  const handleDisconnectGmail = () => {
    disconnectGmailAccount();
    setGmailAccount(null);
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailTo.trim() || !testEmailSubject.trim()) return;

    setIsSendingTestEmail(true);
    setTestEmailResult(null);

    const result = await sendEmailViaGmail({
      to: testEmailTo.trim(),
      subject: testEmailSubject.trim(),
      html: testEmailBody.replace(/\n/g, '<br />'),
      text: testEmailBody,
      fromName: 'NextGen Academy Admissions',
    });

    setIsSendingTestEmail(false);
    setTestEmailResult({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    });
  };


  // Available Merge Tag Chips
  const TEMPLATE_VARIABLES = [
    { tag: '{{applicant_name}}', desc: 'Full Name of the Applicant' },
    { tag: '{{programme_name}}', desc: 'Assigned Academic Programme' },
    { tag: '{{cohort_name}}', desc: 'Enrolled Cohort Title' },
    { tag: '{{assessment_name}}', desc: 'Assessment Name' },
    { tag: '{{application_status}}', desc: 'Current Stage of Application' },
    { tag: '{{deadline}}', desc: 'Application or Assessment Deadline' },
  ];

  // Candidates resolution for preview
  const activePreviewCandidate = applications.find(a => a.id === previewApplicantId) || applications[0];
  const activePreviewCohort = cohorts.find(c => c.id === activePreviewCandidate?.cohortId);
  const activePreviewProg = programs.find(p => p.id === activePreviewCandidate?.programId);
  const activePreviewAsm = assessments.find(a => a.cohortId === activePreviewCandidate?.cohortId);

  // Filtered Templates
  const filteredTemplates = templates.filter(t => {
    if (templateFilterType === 'all') return true;
    if (templateFilterType === 'automated') return t.enabled;
    if (templateFilterType === 'paused') return !t.enabled;
    return t.type === templateFilterType;
  });

  // Calculate target audience size for broadcast
  const targetRecipients = applications.filter(app => {
    if (app.status === 'draft') return false;
    if (targetAudience === 'individual') {
      return app.id === selectedApplicantId || app.applicantId === selectedApplicantId;
    }
    if (targetAudience === 'cohort') {
      return selectedCohortId === 'all' || app.cohortId === selectedCohortId;
    }
    if (targetAudience === 'status') {
      const matchCoh = selectedCohortId === 'all' || app.cohortId === selectedCohortId;
      const matchStat = targetStatusFilter === 'all' || app.status === targetStatusFilter;
      return matchCoh && matchStat;
    }
    return true;
  });

  // Handle template selection in composer
  const handleSelectTemplateForBroadcast = (tmplId: string) => {
    setSelectedTemplateForBroadcast(tmplId);
    const tmpl = templates.find(t => t.id === tmplId);
    if (tmpl) {
      setBroadcastSubject(tmpl.subject);
      setBroadcastContent(tmpl.body);
      setBroadcastChannels({
        email: tmpl.channels.email,
        inApp: tmpl.channels.inApp,
        sms: tmpl.channels.sms,
      });
    }
  };

  // Insert variable tag into focused element
  const insertVariableIntoBroadcast = (tag: string, field: 'subject' | 'body') => {
    if (field === 'subject') {
      setBroadcastSubject(prev => prev + ' ' + tag);
    } else {
      setBroadcastContent(prev => prev + ' ' + tag);
    }
  };

  const insertVariableIntoTemplateEdit = (tag: string, field: 'subject' | 'body') => {
    if (!editingTemplate) return;
    if (field === 'subject') {
      setEditingTemplate({ ...editingTemplate, subject: editingTemplate.subject + ' ' + tag });
    } else {
      setEditingTemplate({ ...editingTemplate, body: editingTemplate.body + ' ' + tag });
    }
  };

  // Trigger confirmation modal for broadcast
  const handleDispatchBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastContent.trim() || targetRecipients.length === 0) return;
    setShowBroadcastConfirmModal(true);
  };

  // Submit manual broadcast after confirmation
  const handleConfirmAndSendBroadcast = async () => {
    setShowBroadcastConfirmModal(false);
    setIsSending(true);
    await broadcastManualMessage({
      targetAudience,
      cohortId: selectedCohortId,
      statusFilter: targetStatusFilter,
      individualApplicantId: selectedApplicantId,
      templateId: selectedTemplateForBroadcast || undefined,
      subject: broadcastSubject,
      content: broadcastContent,
      channels: broadcastChannels,
      tags: ['Manual Broadcast', `${targetRecipients.length} Recipients`, 'Gmail Dispatched'],
    });

    setIsSending(false);
    setBroadcastSubject('');
    setBroadcastContent('');
    setSelectedTemplateForBroadcast('');
  };


  // Filtered Logs
  const filteredLogs = communicationLogs.filter(log => {
    const matchesSearch = 
      log.recipient.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.recipientName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.subject.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.messageType.toLowerCase().includes(logSearchQuery.toLowerCase());

    const matchesStatus = logStatusFilter === 'all' || log.status === logStatusFilter;
    const matchesType = logTypeFilter === 'all' || log.messageType === logTypeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3 h-3 text-blue-600" />
            <span>Sent</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pending</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Failed</span>
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            <span>Muted</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              <span>Module 10 • Applicant Communications & Notifications</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 font-['Space_Grotesk']">
              Communications Center & Multi-Channel Dispatch
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Automated lifecycle emails, template configuration with merge variables, audience broadcasting, and auditable delivery logging.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-2 text-center">
              <div className="text-xs text-indigo-600 font-semibold">Templates</div>
              <div className="text-lg font-bold text-indigo-900">{templates.length}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2 text-center">
              <div className="text-xs text-emerald-600 font-semibold">Automated</div>
              <div className="text-lg font-bold text-emerald-900">{templates.filter(t => t.enabled).length} Active</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-center">
              <div className="text-xs text-slate-500 font-semibold">Dispatched</div>
              <div className="text-lg font-bold text-slate-800">{communicationLogs.length} Events</div>
            </div>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveView('templates')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeView === 'templates'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Templates & Automations ({templates.length})</span>
          </button>

          <button
            onClick={() => setActiveView('broadcast')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeView === 'broadcast'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send Manual Message / Broadcast</span>
          </button>

          <button
            onClick={() => setActiveView('logs')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeView === 'logs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Delivery & Audit Logs ({communicationLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Google Workspace Gmail Integration Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-slate-900 to-zinc-900 border border-zinc-700/80 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.8 7.3 9.2 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2.1-1.9 3.3-4.7 3.3-8.1z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.8 14.1c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1V7.1H2.2C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.6-2.8z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8C4 20.5 7.7 23 12 23z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm font-['Space_Grotesk']">Google Workspace Gmail Service</span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Active OAuth Pipeline</span>
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1">
                Automated applicant emails and manager communications are dispatched via Google Workspace Gmail (<span className="text-orange-400 font-mono font-medium">{gmailAccount?.email || 'ournextgenacademy@gmail.com'}</span>).
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded-md font-mono">
                  Scope: mail.google.com
                </span>
                <span className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded-md font-mono">
                  Scope: gmail.send
                </span>
                <span className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded-md font-mono">
                  Scope: gmail.compose
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setTestEmailResult(null);
                setShowTestEmailModal(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 transition cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-orange-400" />
              <span>Send Test Learner Email</span>
            </button>

            <button
              type="button"
              onClick={handleConnectGmail}
              disabled={isConnectingGmail}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConnectingGmail ? 'animate-spin' : ''}`} />
              <span>{isConnectingGmail ? 'Authorizing...' : (getInMemoryGmailToken() ? 'Re-authenticate Gmail' : 'Link Gmail Account')}</span>
            </button>
          </div>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* 1. TEMPLATES & AUTOMATION MANAGEMENT VIEW                                 */}
      {/* ========================================================================= */}
      {activeView === 'templates' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700">Filter Templates:</span>
              <select
                value={templateFilterType}
                onChange={e => setTemplateFilterType(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium outline-none"
              >
                <option value="all">All Templates ({templates.length})</option>
                <option value="automated">⚡ Automated / Active Only</option>
                <option value="paused">⏸️ Muted / Paused Only</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={resetTemplatesToDefault}
                className="flex items-center space-x-1 text-xs text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset 9 Templates to Baseline</span>
              </button>
            </div>
          </div>

          {/* Merge Variables Reference Panel */}
          <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 font-bold text-indigo-300">
                <Code className="w-4 h-4" />
                <span>Dynamic Merge Tag Variables Supported</span>
              </div>
              <span className="text-[11px] text-slate-400">Available across all subjects and message bodies</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {TEMPLATE_VARIABLES.map(v => (
                <div key={v.tag} className="bg-slate-800 p-2 rounded-xl border border-slate-700/60">
                  <div className="font-mono font-bold text-indigo-400 text-[11px] truncate">{v.tag}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{v.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map(tmpl => {
              const isAuto = tmpl.enabled;
              return (
                <div 
                  key={tmpl.id} 
                  className={`bg-white rounded-2xl border transition-all flex flex-col justify-between ${
                    isAuto ? 'border-slate-200 shadow-sm' : 'border-slate-200/80 bg-slate-50/50 opacity-90'
                  }`}
                >
                  <div className="p-5 space-y-3">
                    {/* Header: Title & Auto Toggle */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {tmpl.type}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mt-1 font-['Space_Grotesk']">
                          {tmpl.name}
                        </h3>
                      </div>

                      {/* Automation Switch */}
                      <button
                        onClick={() => toggleTemplateAutomation(tmpl.id)}
                        title={isAuto ? 'Click to pause automatic dispatch' : 'Click to activate automatic dispatch'}
                        className={`flex items-center space-x-1 text-[11px] font-bold px-2.5 py-1 rounded-full transition cursor-pointer ${
                          isAuto 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <Zap className={`w-3 h-3 ${isAuto ? 'text-emerald-600 fill-emerald-600' : 'text-slate-400'}`} />
                        <span>{isAuto ? 'Active' : 'Muted'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {tmpl.description}
                    </p>

                    {/* Subject snippet */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject</div>
                      <div className="font-semibold text-slate-800 text-xs truncate">
                        {tmpl.subject}
                      </div>
                    </div>

                    {/* Body snippet */}
                    <div className="text-slate-600 text-xs line-clamp-3 bg-white p-2.5 rounded-xl border border-slate-100 font-mono text-[11px]">
                      {tmpl.body}
                    </div>

                    {/* Channel Indicators */}
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Channels:</span>
                      {tmpl.channels.email && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          <Mail className="w-2.5 h-2.5" />
                          <span>Email</span>
                        </span>
                      )}
                      {tmpl.channels.inApp && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          <Inbox className="w-2.5 h-2.5" />
                          <span>Portal Inbox</span>
                        </span>
                      )}
                      {tmpl.channels.sms && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          <Smartphone className="w-2.5 h-2.5" />
                          <span>SMS</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setPreviewTemplate(tmpl)}
                      className="flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-white transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Preview</span>
                    </button>

                    <button
                      onClick={() => setEditingTemplate({ ...tmpl })}
                      className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Template</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SEND MANUAL BROADCAST / CANDIDATE MESSAGE VIEW                         */}
      {/* ========================================================================= */}
      {activeView === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Audience Selector & Pre-built Templates */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  1. Recipient Audience
                </span>
                <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">
                  {targetRecipients.length} Selected
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetAudience('cohort')}
                    className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                      targetAudience === 'cohort'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    By Cohort
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetAudience('status')}
                    className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                      targetAudience === 'status'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    By Status
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetAudience('individual')}
                    className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                      targetAudience === 'individual'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Single Applicant
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetAudience('all')}
                    className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                      targetAudience === 'all'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    All Candidates
                  </button>
                </div>
              </div>

              {/* Cohort Selector */}
              {(targetAudience === 'cohort' || targetAudience === 'status') && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Cohort</label>
                  <select
                    value={selectedCohortId}
                    onChange={e => setSelectedCohortId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium outline-none text-xs"
                  >
                    <option value="all">All Cohorts ({applications.filter(a => a.status !== 'draft').length} Candidates)</option>
                    {cohorts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Segment */}
              {targetAudience === 'status' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Application Status</label>
                  <select
                    value={targetStatusFilter}
                    onChange={e => setTargetStatusFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium outline-none text-xs"
                  >
                    <option value="all">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="assessment_invited">Assessment Invited</option>
                    <option value="assessment_completed">Assessment Completed</option>
                    <option value="admitted">Accepted / Admitted</option>
                    <option value="waitlisted">Waitlisted</option>
                    <option value="rejected">Rejected</option>
                    <option value="enrolled">Enrolled</option>
                  </select>
                </div>
              )}

              {/* Individual Candidate Selector */}
              {targetAudience === 'individual' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Choose Candidate</label>
                  <select
                    value={selectedApplicantId}
                    onChange={e => setSelectedApplicantId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium outline-none text-xs"
                  >
                    <option value="">-- Choose Candidate --</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.fullName} ({app.email}) — Status: {app.status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Delivery Channels Override */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="block font-semibold text-slate-700">Dispatch Channels</label>
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={broadcastChannels.email}
                      onChange={e => setBroadcastChannels({ ...broadcastChannels, email: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Email Dispatch (Notification Abstraction)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={broadcastChannels.inApp}
                      onChange={e => setBroadcastChannels({ ...broadcastChannels, inApp: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Applicant Portal Inbox & Alerts</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-400">
                    <input
                      type="checkbox"
                      checked={broadcastChannels.sms}
                      onChange={e => setBroadcastChannels({ ...broadcastChannels, sms: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>SMS Urgent Notification</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Quick Template Picker */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3 text-xs">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                2. Load from Template
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {templates.map(tmpl => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplateForBroadcast(tmpl.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer ${
                      selectedTemplateForBroadcast === tmpl.id
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold">{tmpl.name}</div>
                    <div className="text-[10px] text-slate-500 font-normal truncate mt-0.5">
                      {tmpl.subject}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Composer & Live Merged Preview */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleDispatchBroadcast} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                    Message Composer
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Draft manual communications with variable tag interpolation.
                  </p>
                </div>

                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-semibold text-emerald-700">Provider Protected</span>
                </div>
              </div>

              {/* Tag Quick Inserters */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Insert Variable Tag:</span>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_VARIABLES.map(v => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertVariableIntoBroadcast(v.tag, 'body')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-[10px] font-mono border border-slate-200 transition cursor-pointer"
                    >
                      + {v.tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Line *</label>
                <input
                  type="text"
                  required
                  value={broadcastSubject}
                  onChange={e => setBroadcastSubject(e.target.value)}
                  placeholder="e.g. Next Steps: Assessment Screening for {{programme_name}}"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none text-xs"
                />
              </div>

              {/* Body Content */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Message Body *</label>
                <textarea
                  rows={8}
                  required
                  value={broadcastContent}
                  onChange={e => setBroadcastContent(e.target.value)}
                  placeholder="Dear {{applicant_name}},\n\nWe are writing to give you an update regarding your application..."
                  className="w-full p-3 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none text-xs leading-relaxed font-mono"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center space-x-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Real-time Merged Preview (Sample Recipient: {activePreviewCandidate?.fullName || 'Candidate'})</span>
                  </span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                    Interpolation Active
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-xs">
                    {interpolateVariables(broadcastSubject, {
                      applicant: { fullName: activePreviewCandidate?.fullName, email: activePreviewCandidate?.email },
                      programme: activePreviewProg,
                      cohort: activePreviewCohort,
                      assessment: activePreviewAsm,
                      application: activePreviewCandidate,
                      deadline: activePreviewCohort?.applicationDeadline || 'September 15, 2026',
                    }) || 'Subject preview will appear here...'}
                  </div>
                  <div className="text-slate-700 text-xs whitespace-pre-line leading-relaxed pt-2 border-t border-slate-100">
                    {interpolateVariables(broadcastContent, {
                      applicant: { fullName: activePreviewCandidate?.fullName, email: activePreviewCandidate?.email },
                      programme: activePreviewProg,
                      cohort: activePreviewCohort,
                      assessment: activePreviewAsm,
                      application: activePreviewCandidate,
                      deadline: activePreviewCohort?.applicationDeadline || 'September 15, 2026',
                    }) || 'Body content with merged variables will appear here...'}
                  </div>
                </div>
              </div>

              {/* Dispatch Action */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">
                  Will be dispatched to <strong>{targetRecipients.length} candidate(s)</strong>.
                </span>

                <button
                  type="submit"
                  disabled={isSending || targetRecipients.length === 0}
                  className={`flex items-center space-x-2 font-bold px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer ${
                    isSending || targetRecipients.length === 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Dispatching...' : 'Dispatch Communication Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DISPATCH & AUDIT DELIVERY LOGS VIEW                                     */}
      {/* ========================================================================= */}
      {activeView === 'logs' && (
        <div className="space-y-6">
          {/* Logs Search & Filter Bar */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={e => setLogSearchQuery(e.target.value)}
                  placeholder="Search recipient, email, subject..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-medium outline-none text-xs"
                />
              </div>

              {/* Status Filter */}
              <select
                value={logStatusFilter}
                onChange={e => setLogStatusFilter(e.target.value)}
                className="p-2 rounded-xl border border-slate-300 bg-white font-medium outline-none text-xs"
              >
                <option value="all">All Delivery Statuses</option>
                <option value="delivered">Delivered</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="skipped">Muted / Skipped</option>
              </select>

              {/* Type Filter */}
              <select
                value={logTypeFilter}
                onChange={e => setLogTypeFilter(e.target.value)}
                className="p-2 rounded-xl border border-slate-300 bg-white font-medium outline-none text-xs"
              >
                <option value="all">All Communication Types</option>
                <option value="ACCOUNT_CREATED">ACCOUNT_CREATED</option>
                <option value="APPLICATION_SUBMITTED">APPLICATION_SUBMITTED</option>
                <option value="APPLICATION_UPDATED">APPLICATION_UPDATED</option>
                <option value="ASSESSMENT_OPENED">ASSESSMENT_OPENED</option>
                <option value="ASSESSMENT_REMINDER">ASSESSMENT_REMINDER</option>
                <option value="ASSESSMENT_SUBMITTED">ASSESSMENT_SUBMITTED</option>
                <option value="APPLICATION_ACCEPTED">APPLICATION_ACCEPTED</option>
                <option value="APPLICATION_REJECTED">APPLICATION_REJECTED</option>
                <option value="APPLICATION_WAITLISTED">APPLICATION_WAITLISTED</option>
                <option value="MANUAL_BROADCAST">MANUAL_BROADCAST</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={clearCommunicationLogs}
                className="flex items-center space-x-1 text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Logs</span>
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Recipient</th>
                    <th className="p-4">Message Type</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Channels</th>
                    <th className="p-4">Delivery Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold">No dispatch logs found matching criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, idx) => (
                      <tr key={`${log.id || 'log'}-${idx}`} className="hover:bg-slate-50/70 transition">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{log.recipientName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{log.recipient}</div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {log.messageType}
                          </span>
                        </td>
                        <td className="p-4 max-w-xs">
                          <div className="font-semibold text-slate-800 truncate">{log.subject}</div>
                          <div className="text-[10px] text-slate-400 truncate">{log.content}</div>
                        </td>
                        <td className="p-4 text-slate-500 whitespace-nowrap text-[11px]">
                          {log.timestamp}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            {log.channels.email && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                                Email
                              </span>
                            )}
                            {log.channels.inApp && (
                              <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                                In-App
                              </span>
                            )}
                            {log.channels.sms && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                                SMS
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {getStatusBadge(log.status)}
                          {log.deliveryResult?.reason && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {log.deliveryResult.reason}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => setSelectedLogDetail(log)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            onClick={async () => {
                              setResendingLogId(log.id);
                              await resendCommunication(log.id);
                              setResendingLogId(null);
                            }}
                            disabled={resendingLogId === log.id}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            {resendingLogId === log.id ? 'Resending...' : 'Resend'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT TEMPLATE                                                      */}
      {/* ========================================================================= */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600">
                  {editingTemplate.type}
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">
                  Edit Template: {editingTemplate.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingTemplate(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium outline-none text-xs"
                />
              </div>

              {/* Tag Quick Inserters */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Insert Variable Tag:</span>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_VARIABLES.map(v => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertVariableIntoTemplateEdit(v.tag, 'body')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-[10px] font-mono border border-slate-200 transition cursor-pointer"
                    >
                      + {v.tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Body Text</label>
                <textarea
                  rows={8}
                  value={editingTemplate.body}
                  onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs leading-relaxed outline-none"
                />
              </div>

              {/* Automation Toggle & Channels */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTemplate.enabled}
                    onChange={e => setEditingTemplate({ ...editingTemplate, enabled: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Enable Automated Dispatch for this Event</span>
                </label>

                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-1.5 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingTemplate.channels.email}
                      onChange={e => setEditingTemplate({
                        ...editingTemplate,
                        channels: { ...editingTemplate.channels, email: e.target.checked }
                      })}
                      className="rounded text-indigo-600"
                    />
                    <span>Email</span>
                  </label>
                  <label className="flex items-center space-x-1.5 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingTemplate.channels.inApp}
                      onChange={e => setEditingTemplate({
                        ...editingTemplate,
                        channels: { ...editingTemplate.channels, inApp: e.target.checked }
                      })}
                      className="rounded text-indigo-600"
                    />
                    <span>In-App</span>
                  </label>
                  <label className="flex items-center space-x-1.5 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingTemplate.channels.sms}
                      onChange={e => setEditingTemplate({
                        ...editingTemplate,
                        channels: { ...editingTemplate.channels, sms: e.target.checked }
                      })}
                      className="rounded text-indigo-600"
                    />
                    <span>SMS</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  saveTemplate(editingTemplate);
                  setEditingTemplate(null);
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LIVE PREVIEW TEMPLATE                                              */}
      {/* ========================================================================= */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600">
                  {previewTemplate.type}
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">
                  Live Preview: {previewTemplate.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Candidate Selector for Preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Preview Candidate Context:</span>
              <select
                value={previewApplicantId}
                onChange={e => setPreviewApplicantId(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-300 bg-white font-medium outline-none text-xs"
              >
                {applications.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.fullName} ({app.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Email Preview Card */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 space-y-3 shadow-inner">
              <div className="border-b border-slate-800 pb-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">From: NextGen Admissions Desk &lt;admissions@nextgenacademy.edu&gt;</span>
                  <span className="text-[10px] bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded font-mono">Rendered Simulation</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  To: {activePreviewCandidate?.fullName} &lt;{activePreviewCandidate?.email}&gt;
                </div>
                <div className="font-bold text-white text-sm pt-1">
                  {interpolateVariables(previewTemplate.subject, {
                    applicant: { fullName: activePreviewCandidate?.fullName, email: activePreviewCandidate?.email },
                    programme: activePreviewProg,
                    cohort: activePreviewCohort,
                    assessment: activePreviewAsm,
                    application: activePreviewCandidate,
                    deadline: activePreviewCohort?.applicationDeadline || 'September 15, 2026',
                  })}
                </div>
              </div>

              <div className="text-slate-200 text-xs whitespace-pre-line leading-relaxed font-sans bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                {interpolateVariables(previewTemplate.body, {
                  applicant: { fullName: activePreviewCandidate?.fullName, email: activePreviewCandidate?.email },
                  programme: activePreviewProg,
                  cohort: activePreviewCohort,
                  assessment: activePreviewAsm,
                  application: activePreviewCandidate,
                  deadline: activePreviewCohort?.applicationDeadline || 'September 15, 2026',
                })}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG DETAILS                                                        */}
      {/* ========================================================================= */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600">
                  {selectedLogDetail.messageType}
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">
                  Audit Dispatch Record
                </h3>
              </div>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Recipient Name</span>
                <div className="font-bold text-slate-900">{selectedLogDetail.recipientName}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Recipient Address</span>
                <div className="font-mono text-slate-700">{selectedLogDetail.recipient}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Timestamp</span>
                <div className="text-slate-700">{selectedLogDetail.timestamp}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Delivery Status</span>
                <div>{getStatusBadge(selectedLogDetail.status)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Subject</span>
                <div className="font-bold text-slate-900 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {selectedLogDetail.subject}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Rendered Payload Body</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed font-mono text-[11px]">
                  {selectedLogDetail.content}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Delivery Channels Dispatched</span>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                  {selectedLogDetail.deliveryResult?.channelsSent?.join(' • ') || 'Email, In-App Portal Inbox'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  await resendCommunication(selectedLogDetail.id);
                  setSelectedLogDetail(null);
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition cursor-pointer"
              >
                Resend Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BROADCAST CONFIRMATION (Workspace Safety Requirement)              */}
      {/* ========================================================================= */}
      {showBroadcastConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                    Confirm Broadcast Dispatch
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verify recipient volume and delivery channels before sending.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Target Audience:</span>
                <span className="font-bold text-slate-900 capitalize">{targetAudience} Mode</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Total Recipients:</span>
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {targetRecipients.length} Candidates
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Email Pipeline:</span>
                <span className="font-bold text-slate-900 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Gmail API ({gmailAccount?.email || 'ournextgenacademy@gmail.com'})</span>
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-700">Subject Preview:</div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-900 text-xs">
                {broadcastSubject}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-700">Body Preview:</div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-[11px] max-h-36 overflow-y-auto whitespace-pre-line leading-relaxed">
                {broadcastContent}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBroadcastConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSendBroadcast}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition cursor-pointer shadow-md shadow-orange-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Send via Gmail</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TEST LEARNER EMAIL (Gmail REST API Verification)                    */}
      {/* ========================================================================= */}
      {showTestEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                    Send Test Email via Gmail API
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verify live Gmail REST API deliverability to any learner address.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestEmailModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {testEmailResult && (
              <div className={`p-3.5 rounded-2xl border ${
                testEmailResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center space-x-2 font-bold text-xs">
                  {testEmailResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{testEmailResult.success ? 'Email Dispatched Successfully!' : 'Gmail Dispatch Error'}</span>
                </div>
                <div className="text-[11px] mt-1">
                  {testEmailResult.success 
                    ? `Message ID: ${testEmailResult.messageId} • Successfully delivered to ${testEmailTo}.` 
                    : testEmailResult.error || 'Please re-authenticate your Google account to grant live Gmail sending permissions.'}
                </div>
              </div>
            )}

            <form onSubmit={handleSendTestEmail} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Recipient Email</label>
                <input
                  type="email"
                  value={testEmailTo}
                  onChange={e => setTestEmailTo(e.target.value)}
                  required
                  placeholder="learner@example.com"
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Subject</label>
                <input
                  type="text"
                  value={testEmailSubject}
                  onChange={e => setTestEmailSubject(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Message Body</label>
                <textarea
                  rows={4}
                  value={testEmailBody}
                  onChange={e => setTestEmailBody(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium outline-none focus:border-orange-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTestEmailModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSendingTestEmail}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition cursor-pointer shadow-md shadow-orange-500/20 disabled:opacity-50"
                >
                  {isSendingTestEmail ? (
                    <span>Sending via Gmail API...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send via Gmail API</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

