import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CommunicationMessage } from '../../types';
import { 
  Inbox, 
  Send, 
  Sparkles, 
  Award, 
  FileText, 
  Calendar, 
  MessageSquare, 
  Clock, 
  User, 
  CheckCheck,
  ArrowRight
} from 'lucide-react';

interface ApplicantInboxProps {
  onOpenOfferModal?: () => void;
  onTakeAssessment?: () => void;
}

export const ApplicantInbox: React.FC<ApplicantInboxProps> = ({
  onOpenOfferModal,
  onTakeAssessment,
}) => {
  const { currentUser, messages, sendMessage, cohorts, programs, applications } = useApp();
  const [selectedMessage, setSelectedMessage] = useState<CommunicationMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'letters' | 'direct' | 'broadcast'>('all');

  const myAppIds = new Set(
    applications
      .filter(a => a.applicantId === currentUser.id || (a.email && currentUser.email && a.email.toLowerCase() === currentUser.email.toLowerCase()))
      .flatMap(a => [a.id, a.applicantId, a.email?.toLowerCase()])
      .filter(Boolean)
  );

  // Filter messages relevant to current applicant
  const userMessages = messages.filter(m => 
    m.recipientId === currentUser.id || 
    m.senderId === currentUser.id || 
    (currentUser.email && m.recipientId?.toLowerCase() === currentUser.email.toLowerCase()) ||
    myAppIds.has(m.recipientId) ||
    (m.recipientId && myAppIds.has(m.recipientId.toLowerCase())) ||
    m.type === 'broadcast'
  );

  const filtered = userMessages.filter(m => {
    if (filterType === 'letters') return m.type === 'offer_letter';
    if (filterType === 'direct') return m.type === 'direct';
    if (filterType === 'broadcast') return m.type === 'broadcast';
    return true;
  });

  const activeMsg = selectedMessage || filtered[0] || null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    sendMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: 'applicant',
      recipientId: 'admin-user-1',
      recipientName: 'NextGen Admissions Desk',
      type: 'direct',
      subject: activeMsg ? `Re: ${activeMsg.subject}` : 'Admissions Inquiry',
      content: replyText,
    });

    setReplyText('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-zinc-200">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 font-['Space_Grotesk'] flex items-center space-x-2">
            <Inbox className="w-5 h-5 text-orange-600" />
            <span>Admissions Communications & Inbox</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Official academy letters, screening notices, and direct messaging with NextGen admissions officers.
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-zinc-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'all' ? 'bg-white text-orange-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            All ({userMessages.length})
          </button>
          <button
            onClick={() => setFilterType('letters')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'letters' ? 'bg-white text-orange-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Offer Letters
          </button>
          <button
            onClick={() => setFilterType('direct')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'direct' ? 'bg-white text-orange-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Direct Messages
          </button>
          <button
            onClick={() => setFilterType('broadcast')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'broadcast' ? 'bg-white text-orange-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Broadcasts
          </button>
        </div>
      </div>

      {/* Main Inbox Layout (Two column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List (1 col) */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden divide-y divide-zinc-100 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              No messages found in this folder.
            </div>
          ) : (
            filtered.map((msg, idx) => {
              const isSelected = activeMsg?.id === msg.id;
              const isFromMe = msg.senderId === currentUser.id;

              return (
                <button
                  key={`${msg.id || 'msg'}-${idx}`}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full text-left p-4 transition flex items-start space-x-3 cursor-pointer ${
                    isSelected ? 'bg-orange-50/80 border-l-4 border-orange-600' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.type === 'offer_letter'
                      ? 'bg-amber-100 text-amber-800'
                      : msg.type === 'broadcast'
                      ? 'bg-zinc-200 text-zinc-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {msg.type === 'offer_letter' ? <Award className="w-4 h-4" /> : msg.senderName[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-zinc-900 truncate">
                        {isFromMe ? 'You (Outgoing)' : msg.senderName}
                      </span>
                      <span className="text-zinc-400 text-[10px] shrink-0 ml-1">{msg.sentAt}</span>
                    </div>

                    <div className="text-xs font-semibold text-zinc-800 truncate mt-0.5">
                      {msg.subject}
                    </div>

                    <div className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                      {msg.content}
                    </div>

                    {msg.type === 'offer_letter' && (
                      <span className="inline-block mt-1.5 text-[9px] bg-amber-100 text-amber-900 font-bold px-2 py-0.2 rounded-full">
                        Admissions Letter
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Message Detail & Reply Box (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 flex flex-col justify-between space-y-6">
          {activeMsg ? (
            <div className="space-y-6">
              {/* Message Header */}
              <div className="border-b border-zinc-100 pb-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    activeMsg.type === 'offer_letter'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : activeMsg.type === 'broadcast'
                      ? 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                      : 'bg-orange-50 text-orange-700 border border-orange-100'
                  }`}>
                    {activeMsg.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{activeMsg.sentAt}</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 font-['Space_Grotesk'] leading-snug">
                  {activeMsg.subject}
                </h3>

                <div className="flex items-center space-x-2 text-xs text-zinc-600">
                  <span className="font-semibold text-zinc-900">From: {activeMsg.senderName}</span>
                  <span>•</span>
                  <span>To: {activeMsg.recipientName || currentUser.name}</span>
                </div>
              </div>

              {/* Message Content Body */}
              <div className="text-xs text-zinc-800 leading-relaxed space-y-3 whitespace-pre-line bg-zinc-50/50 p-5 rounded-xl border border-zinc-100">
                {activeMsg.content}
              </div>

              {/* Action Callouts for Special Message Types */}
              {activeMsg.type === 'offer_letter' && onOpenOfferModal && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Award className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-amber-950">Official Admission Offer Document Ready</div>
                      <div className="text-[11px] text-amber-800">Review your scholarship award and confirm enrollment.</div>
                    </div>
                  </div>
                  <button
                    onClick={onOpenOfferModal}
                    className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition cursor-pointer"
                  >
                    <span>View & Sign Offer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {activeMsg.subject.toLowerCase().includes('assessment') && onTakeAssessment && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-6 h-6 text-orange-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-orange-950">Online Screening Assessment Ready</div>
                      <div className="text-[11px] text-orange-700">Timed logic and technical reasoning test.</div>
                    </div>
                  </div>
                  <button
                    onClick={onTakeAssessment}
                    className="flex items-center space-x-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition cursor-pointer"
                  >
                    <span>Start Test</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-zinc-100 space-y-3">
                <div className="text-xs font-bold text-zinc-800">Send Reply or Question to Admissions Staff</div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your message or inquiry..."
                    className="flex-1 text-xs p-3 rounded-xl border border-zinc-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-3 rounded-xl text-xs shadow-sm transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-zinc-400">
              Select a message from the left to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
