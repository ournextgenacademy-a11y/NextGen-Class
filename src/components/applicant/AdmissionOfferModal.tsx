import React, { useState } from 'react';
import { Application, Cohort, Program } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  Award, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  FileCheck, 
  Lock 
} from 'lucide-react';

interface AdmissionOfferModalProps {
  application: Application;
  cohort: Cohort;
  program: Program;
  onClose: () => void;
}

export const AdmissionOfferModal: React.FC<AdmissionOfferModalProps> = ({
  application,
  cohort,
  program,
  onClose,
}) => {
  const { acceptAdmissionOffer, setActivePortal } = useApp();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = () => {
    if (!acceptedTerms) return;
    setSubmitting(true);
    setTimeout(() => {
      acceptAdmissionOffer(application.id);
      setSubmitting(false);
      onClose();
      // Route user to Learner Portal to see their active syllabus and cohort schedule
      setActivePortal('learner');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Official Letter of Admission</span>
          </div>

          <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">
            Congratulations, {application.fullName}!
          </h2>
          <p className="text-sm text-indigo-100 mt-1">
            You have been granted admission to NextGen Academy's <strong className="text-white">{program.name}</strong>.
          </p>

          {/* Scholarship Ribbon */}
          {application.scholarshipAwarded && (
            <div className="mt-4 inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md">
              <Award className="w-4 h-4" />
              <span>Awarded {application.scholarshipPercentage || 100}% NextGen Diversity & Excellence Scholarship</span>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Key Cohort Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <div className="text-slate-500 font-medium">Assigned Cohort</div>
              <div className="font-bold text-slate-800 mt-0.5">{cohort.name}</div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Cohort Kickoff Date</div>
              <div className="font-bold text-slate-800 mt-0.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>{cohort.startDate}</span>
              </div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Schedule & Format</div>
              <div className="font-bold text-slate-800 mt-0.5">{program.format}</div>
            </div>
          </div>

          {/* Official Letter Body */}
          <div className="text-xs text-slate-700 space-y-3 leading-relaxed border-l-2 border-indigo-500 pl-4 py-1">
            <p>
              The NextGen Admissions Board was deeply impressed by your background, application dossier, and outstanding screening score of <strong>{application.assessmentScore || 90}%</strong>.
            </p>
            <p>
              As a NextGen Class learner, you will gain hands-on mastery in production-grade technical skills, collaborate with high-caliber peers across Africa and globally, and build real-world capstone projects evaluated by industry mentors.
            </p>
            <p className="font-medium text-slate-900">
              Please review the terms of admission below and confirm your enrollment within 7 calendar days to lock your allocated seat.
            </p>
          </div>

          {/* Terms & Code of Conduct */}
          <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-950">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Learner Commitment & Code of Conduct</span>
            </div>
            <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Commit to at least 15 hours weekly for live masterclasses, lab assignments, and peer reviews.</li>
              <li>Maintain a minimum of 85% attendance across all live sessions and workshops.</li>
              <li>Uphold academic integrity: all submitted assignments and capstones must reflect original work.</li>
              <li>Foster an inclusive, respectful, and supportive community environment.</li>
            </ul>

            <label className="flex items-start space-x-2.5 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                I accept the offer of admission and agree to the NextGen Academy Code of Conduct.
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition"
          >
            Decide Later
          </button>

          <button
            onClick={handleAccept}
            disabled={!acceptedTerms || submitting}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-lg ${
              acceptedTerms && !submitting
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20 cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Locking Your Seat...' : 'Accept Offer & Lock Seat'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
