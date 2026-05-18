import { motion, AnimatePresence } from 'motion/react';
import { X, Send } from 'lucide-react';
import React, { useState } from 'react';
import { Opportunity, ApplicationAnswer } from '../../types';

interface Props {
  opportunity: Opportunity;
  onSubmit: (message: string, answers: ApplicationAnswer[]) => void;
  onClose: () => void;
}

export default function ApplicationModal({ opportunity, onSubmit, onClose }: Props) {
  const fields = opportunity.applicationFields ?? [];
  const [message, setMessage] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(fields.map(f => [f.id, '']))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result: ApplicationAnswer[] = fields.map(f => ({
      fieldId:  f.id,
      question: f.question,
      answer:   answers[f.id] ?? '',
    }));
    onSubmit(message, result);
  };

  const textareaClass = 'w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-utcn-primary focus:border-transparent resize-none outline-none transition bg-white placeholder:text-gray-300';

  return (
    <AnimatePresence>
      <motion.div
        key="apply-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="apply-panel"
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-5 border-b bg-gradient-to-r from-utcn-navy to-utcn-primary text-white rounded-t-2xl flex-shrink-0">
            <div className="min-w-0 pr-4">
              <h2 className="text-base font-bold">Apply for Opportunity</h2>
              <p className="text-blue-200 text-xs mt-0.5 line-clamp-1">{opportunity.title}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {fields.length === 0 ? (
                <p className="text-sm text-gray-400 italic bg-slate-50 rounded-xl p-4 text-center">
                  No specific questions — just write a message below and submit!
                </p>
              ) : (
                fields.map((field, idx) => (
                  <div key={field.id}>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                      <span className="text-utcn-primary mr-1.5 font-bold">{idx + 1}.</span>
                      {field.question}
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={answers[field.id]}
                      onChange={e => setAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                      placeholder="Your answer…"
                      className={textareaClass}
                    />
                  </div>
                ))
              )}

              <div className={fields.length > 0 ? 'pt-4 border-t border-gray-100' : ''}>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Cover Message <span className="text-red-400 font-normal">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Introduce yourself and explain why you're a great fit for this project…"
                  className={textareaClass}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-slate-50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-utcn-primary text-white rounded-xl text-sm font-semibold hover:bg-utcn-primary-dark transition-colors flex items-center gap-2 shadow-md shadow-blue-100"
              >
                <Send size={14} />
                Submit Application
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface Props {
  opportunity: Opportunity;
  onSubmit: (message: string, answers: ApplicationAnswer[]) => void;
  onClose: () => void;
}
