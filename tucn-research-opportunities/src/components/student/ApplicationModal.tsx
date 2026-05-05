import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
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
      fieldId: f.id,
      question: f.question,
      answer: answers[f.id] ?? ''
    }));
    onSubmit(message, result);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="apply-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="apply-panel"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Apply for Opportunity</h2>
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{opportunity.title}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 flex-shrink-0 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable body */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {fields.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No application questions defined. Just submit to apply.</p>
              ) : (
                fields.map((field, idx) => (
                  <div key={field.id}>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                      <span className="text-utcn-red mr-1.5">{idx + 1}.</span>
                      {field.question}
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={answers[field.id]}
                      onChange={e => setAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                      placeholder="Your answer..."
                      className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-utcn-red focus:border-transparent resize-none"
                    />
                  </div>
                ))
              )}
              
              <div className="pt-4 border-t mt-2">
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  General Message <span className="text-gray-400 font-normal">(Required)</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Introduce yourself and explain why you're a good fit..."
                  className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-utcn-red focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-utcn-red text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Submit Application
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
