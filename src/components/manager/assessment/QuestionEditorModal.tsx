import React, { useState, useEffect } from 'react';
import { Question, QuestionType, QuestionOption } from '../../../types';
import { 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  HelpCircle, 
  Code2, 
  Layers, 
  CheckSquare, 
  Radio, 
  ToggleLeft, 
  FileText, 
  AlignLeft,
  Sparkles
} from 'lucide-react';

interface QuestionEditorModalProps {
  isOpen: boolean;
  question: Question | null;
  onClose: () => void;
  onSave: (question: Question) => void;
  nextDisplayOrder: number;
}

const CATEGORIES = [
  'Logic & Reasoning',
  'Technical Fundamentals',
  'AI & Automation Concepts',
  'Communication & Ethics',
  'System Design & Architecture',
  'Data Structures & Algorithms',
];

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  question,
  onClose,
  onSave,
  nextDisplayOrder,
}) => {
  const [qType, setQType] = useState<QuestionType>('single_choice');
  const [qId, setQId] = useState('');
  const [qPrompt, setQPrompt] = useState('');
  const [qCategory, setQCategory] = useState(CATEGORIES[0]);
  const [qPoints, setQPoints] = useState(10);
  const [qContext, setQContext] = useState('');
  const [qCodeSnippet, setQCodeSnippet] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [displayOrder, setDisplayOrder] = useState(nextDisplayOrder);

  // Options for single_choice & multiple_choice
  const [options, setOptions] = useState<QuestionOption[]>([
    { id: 'A', label: '', isCorrect: true },
    { id: 'B', label: '', isCorrect: false },
    { id: 'C', label: '', isCorrect: false },
    { id: 'D', label: '', isCorrect: false },
  ]);

  // For True/False
  const [tfCorrect, setTfCorrect] = useState<'True' | 'False'>('True');

  // For Short Answer
  const [shortAnswerKey, setShortAnswerKey] = useState('');

  // When editing existing question, populate state
  useEffect(() => {
    if (question) {
      setQType(question.type || 'single_choice');
      setQId(question.id);
      setQPrompt(question.prompt);
      setQCategory(question.category || CATEGORIES[0]);
      setQPoints(question.points || 10);
      setQContext(question.context || '');
      setQCodeSnippet(question.codeSnippet || '');
      setQExplanation(question.explanation || '');
      setDisplayOrder(question.displayOrder || nextDisplayOrder);

      if (question.type === 'true_false') {
        setTfCorrect(question.correctAnswer === 'False' ? 'False' : 'True');
      } else if (question.type === 'short_answer') {
        setShortAnswerKey(typeof question.correctAnswer === 'string' ? question.correctAnswer : '');
      } else if (question.options && question.options.length > 0) {
        setOptions(question.options);
      }
    } else {
      // New question defaults
      setQId('Q' + nextDisplayOrder);
      setQType('single_choice');
      setQPrompt('');
      setQCategory(CATEGORIES[0]);
      setQPoints(10);
      setQContext('');
      setQCodeSnippet('');
      setQExplanation('');
      setDisplayOrder(nextDisplayOrder);
      setOptions([
        { id: 'A', label: '', isCorrect: true },
        { id: 'B', label: '', isCorrect: false },
        { id: 'C', label: '', isCorrect: false },
        { id: 'D', label: '', isCorrect: false },
      ]);
      setTfCorrect('True');
      setShortAnswerKey('');
    }
  }, [question, isOpen, nextDisplayOrder]);

  if (!isOpen) return null;

  const handleOptionChange = (idx: number, text: string) => {
    setOptions(prev => prev.map((opt, i) => i === idx ? { ...opt, label: text } : opt));
  };

  const handleSelectCorrectSingle = (idx: number) => {
    setOptions(prev => prev.map((opt, i) => ({
      ...opt,
      isCorrect: i === idx,
    })));
  };

  const handleToggleCorrectMultiple = (idx: number) => {
    setOptions(prev => prev.map((opt, i) => ({
      ...opt,
      isCorrect: i === idx ? !opt.isCorrect : opt.isCorrect,
    })));
  };

  const handleAddOption = () => {
    const nextLetter = String.fromCharCode(65 + options.length);
    setOptions(prev => [...prev, { id: nextLetter, label: '', isCorrect: false }]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qPrompt.trim()) return;

    let finalCorrectAnswer: string | string[] | undefined = undefined;
    let finalOptions: QuestionOption[] | undefined = undefined;

    if (qType === 'single_choice') {
      finalOptions = options.filter(o => o.label.trim().length > 0);
      const correctOpt = finalOptions.find(o => o.isCorrect);
      finalCorrectAnswer = correctOpt ? correctOpt.id : finalOptions[0]?.id;
    } else if (qType === 'multiple_choice') {
      finalOptions = options.filter(o => o.label.trim().length > 0);
      const correctOpts = finalOptions.filter(o => o.isCorrect);
      finalCorrectAnswer = correctOpts.map(o => o.id);
    } else if (qType === 'true_false') {
      finalOptions = [
        { id: 'True', label: 'True', isCorrect: tfCorrect === 'True' },
        { id: 'False', label: 'False', isCorrect: tfCorrect === 'False' },
      ];
      finalCorrectAnswer = tfCorrect;
    } else if (qType === 'short_answer') {
      finalCorrectAnswer = shortAnswerKey.trim();
    } else if (qType === 'long_answer') {
      finalCorrectAnswer = 'Rubric / Evaluator Review';
    }

    const newQuestion: Question = {
      id: qId.trim() || `Q${Date.now().toString(36).slice(-3)}`,
      type: qType,
      prompt: qPrompt.trim(),
      context: qContext.trim() || undefined,
      codeSnippet: qCodeSnippet.trim() || undefined,
      options: finalOptions,
      correctAnswer: finalCorrectAnswer,
      points: Number(qPoints) || 10,
      category: qCategory,
      displayOrder: Number(displayOrder),
      explanation: qExplanation.trim() || undefined,
    };

    onSave(newQuestion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                {question ? 'Edit Assessment Question' : 'Add Assessment Question'}
              </h3>
              <p className="text-xs text-slate-500">
                Configure question prompt, response type, options, answer key, and marks.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Question Type Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-2">
              Question Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { type: 'single_choice', label: 'Single Choice', icon: Radio, desc: '1 correct radio option' },
                { type: 'multiple_choice', label: 'Multiple Choice', icon: CheckSquare, desc: 'Multi-select checkboxes' },
                { type: 'true_false', label: 'True / False', icon: ToggleLeft, desc: 'Binary decision' },
                { type: 'short_answer', label: 'Short Answer', icon: FileText, desc: 'Text keyword match' },
                { type: 'long_answer', label: 'Long Answer', icon: AlignLeft, desc: 'Paragraph / Essay' },
                { type: 'code', label: 'Code Snippet', icon: Code2, desc: 'Code inspection test' },
              ].map(item => {
                const Icon = item.icon;
                const isSelected = qType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setQType(item.type as QuestionType)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col space-y-1 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600 text-indigo-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="font-semibold text-xs">{item.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question ID, Category & Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Question ID / Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={qId}
                onChange={e => setQId(e.target.value)}
                placeholder="e.g. Q1, ALGO_04"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Category / Domain
              </label>
              <select
                value={qCategory}
                onChange={e => setQCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Marks / Points <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={qPoints}
                onChange={e => setQPoints(Math.max(1, parseInt(e.target.value) || 10))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-700"
              />
            </div>
          </div>

          {/* Question Prompt */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Question Prompt <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={qPrompt}
              onChange={e => setQPrompt(e.target.value)}
              placeholder="State the core question or algorithmic challenge clearly..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
            />
          </div>

          {/* Context / Scenario (Optional) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Context / Scenario Details (Optional)
            </label>
            <input
              type="text"
              value={qContext}
              onChange={e => setQContext(e.target.value)}
              placeholder="e.g., Examine the snippet below or assume a high-throughput microservice..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
            />
          </div>

          {/* Code Snippet for Code or Scenario */}
          {(qType === 'code' || qCodeSnippet) && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Code Snippet / Implementation Sample</span>
              </label>
              <textarea
                rows={4}
                value={qCodeSnippet}
                onChange={e => setQCodeSnippet(e.target.value)}
                placeholder="def solve_challenge(data): ... // paste code sample here"
                className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl border border-slate-700 outline-none"
              />
            </div>
          )}

          {/* Type-Specific Answer Options */}
          {(qType === 'single_choice' || qType === 'multiple_choice' || qType === 'code') && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">
                  Response Options & Correct Answer Key <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-500">
                  {qType === 'single_choice' || qType === 'code' 
                    ? 'Select the radio button for the single correct answer'
                    : 'Check all correct options for multi-select'}
                </span>
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => qType === 'multiple_choice' ? handleToggleCorrectMultiple(idx) : handleSelectCorrectSingle(idx)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition cursor-pointer ${
                        opt.isCorrect 
                          ? 'bg-emerald-500 text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title={opt.isCorrect ? 'Correct Answer' : 'Mark as Correct'}
                    >
                      {opt.id}
                    </button>

                    <input
                      type="text"
                      required={idx < 2}
                      value={opt.label}
                      onChange={e => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${opt.id} description...`}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                    />

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 transition cursor-pointer"
                        title="Remove Option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold pt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Option</span>
                </button>
              )}
            </div>
          )}

          {/* True / False Setup */}
          {qType === 'true_false' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-700">
                Correct Answer <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTfCorrect('True')}
                  className={`p-3 rounded-xl border font-bold text-xs transition cursor-pointer text-center ${
                    tfCorrect === 'True'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ✓ TRUE
                </button>
                <button
                  type="button"
                  onClick={() => setTfCorrect('False')}
                  className={`p-3 rounded-xl border font-bold text-xs transition cursor-pointer text-center ${
                    tfCorrect === 'False'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ✕ FALSE
                </button>
              </div>
            </div>
          )}

          {/* Short Answer Setup */}
          {qType === 'short_answer' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-700">
                Correct Keyword / Answer Key <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={shortAnswerKey}
                onChange={e => setShortAnswerKey(e.target.value)}
                placeholder="e.g. dict, 201, O(log n)"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono font-semibold"
              />
              <span className="text-[10px] text-slate-400 block">
                Evaluated case-insensitively and trimmed of whitespace.
              </span>
            </div>
          )}

          {/* Long Answer / Essay Setup */}
          {qType === 'long_answer' && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800 block">Long Answer / Essay Prompt</span>
              <p className="text-[11px] text-slate-500">
                Candidates will be provided with a rich text area to write detailed responses. Faculty can score open answers using the Admissions Rubric during candidate evaluation.
              </p>
            </div>
          )}

          {/* Explanation / Solution Note */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block font-semibold text-slate-700 mb-1">
              Explanation & Evaluation Note (Optional)
            </label>
            <input
              type="text"
              value={qExplanation}
              onChange={e => setQExplanation(e.target.value)}
              placeholder="Why this answer is correct or key points expected..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
            />
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
            <span>{question ? 'Update Question' : 'Save Question'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
