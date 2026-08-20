import React, { useState } from 'react';
import { Assessment, AssessmentStatus } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { 
  X, 
  Settings, 
  Clock, 
  Calendar, 
  Percent, 
  RotateCcw, 
  Layers, 
  Plus, 
  Trash2, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AssessmentSettingsModalProps {
  assessment: Assessment;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Assessment) => void;
}

export const AssessmentSettingsModal: React.FC<AssessmentSettingsModalProps> = ({
  assessment,
  isOpen,
  onClose,
  onSave,
}) => {
  const { programs, cohorts } = useApp();

  const [formData, setFormData] = useState<Assessment>({
    ...assessment,
    instructions: assessment.instructions && assessment.instructions.length > 0
      ? [...assessment.instructions]
      : [
          'Complete all questions within the allocated time limit.',
          'Review your answers before final submission.',
          'Ensure a stable internet connection before starting.'
        ],
  });

  const [newInstruction, setNewInstruction] = useState('');

  if (!isOpen) return null;

  const relevantCohorts = cohorts.filter(c => c.programId === formData.programId);

  const handleAddInstruction = () => {
    if (!newInstruction.trim()) return;
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, newInstruction.trim()],
    }));
    setNewInstruction('');
  };

  const handleRemoveInstruction = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      timeLimitMinutes: formData.durationMinutes,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                Assessment Configuration & Rules
              </h3>
              <p className="text-xs text-slate-500">
                Configure timing, scheduling dates, passing criteria, and candidate instructions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assessment Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Generative AI & Algorithmic Problem Solving Screening"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Description / Purpose
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of what this screening test evaluates..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Programme & Cohort Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target Programme <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.programId}
                onChange={e => setFormData({ ...formData, programId: e.target.value, cohortId: undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                {programs.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assigned Cohort (Optional)
              </label>
              <select
                value={formData.cohortId || ''}
                onChange={e => setFormData({ ...formData, cohortId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="">All Cohorts in Programme</option>
                {relevantCohorts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration, Passing Score, Max Attempts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Duration (Minutes)</span>
              </label>
              <input
                type="number"
                min="5"
                max="300"
                required
                value={formData.durationMinutes || formData.timeLimitMinutes || 30}
                onChange={e => setFormData({ 
                  ...formData, 
                  durationMinutes: Math.max(5, parseInt(e.target.value) || 30),
                  timeLimitMinutes: Math.max(5, parseInt(e.target.value) || 30)
                })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Default: 30 minutes</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                <span>Passing Score (%)</span>
              </label>
              <input
                type="number"
                min="10"
                max="100"
                required
                value={formData.passingScore}
                onChange={e => setFormData({ ...formData, passingScore: Math.min(100, Math.max(10, parseInt(e.target.value) || 70)) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Pass threshold benchmark</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Max Attempts</span>
              </label>
              <select
                value={formData.maxAttempts || 1}
                onChange={e => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white font-medium"
              >
                <option value="1">1 Attempt Only (Strict)</option>
                <option value="2">2 Attempts</option>
                <option value="3">3 Attempts</option>
                <option value="999">Unlimited Retries</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Per applicant candidate</span>
            </div>
          </div>

          {/* Schedule Window: Opening Date/Time & Closing Date/Time */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assessment Availability Schedule</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {/* Opening */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 block">Opening Window</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Date</label>
                    <input
                      type="date"
                      value={formData.openDate || ''}
                      onChange={e => setFormData({ ...formData, openDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Time (GMT)</label>
                    <input
                      type="time"
                      value={formData.openTime || '09:00'}
                      onChange={e => setFormData({ ...formData, openTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Closing */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 block">Closing Deadline</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Date</label>
                    <input
                      type="date"
                      value={formData.closeDate || ''}
                      onChange={e => setFormData({ ...formData, closeDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Time (GMT)</label>
                    <input
                      type="time"
                      value={formData.closeTime || '23:59'}
                      onChange={e => setFormData({ ...formData, closeTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions List Builder */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <label className="block font-semibold text-slate-700">
              Candidate Test Instructions
            </label>

            <div className="space-y-2">
              {formData.instructions.map((inst, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-slate-700 leading-tight">{inst}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInstruction(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add instruction */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={newInstruction}
                onChange={e => setNewInstruction(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInstruction();
                  }
                }}
                placeholder="Add another instruction bullet (press Enter)..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
              />
              <button
                type="button"
                onClick={handleAddInstruction}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition cursor-pointer flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Assessment Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
