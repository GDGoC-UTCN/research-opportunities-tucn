import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Upload, FileText, Trash2 } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { Opportunity, ApplicationAnswer, UploadedFile } from '../../types';

interface Props {
  opportunity: Opportunity;
  onSubmit: (message: string, answers: ApplicationAnswer[], cvFile?: UploadedFile, transcriptFile?: UploadedFile) => void | Promise<void>;
  onClose: () => void;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function FileUploadField({
  label,
  hint,
  value,
  onChange,
  required,
}: {
  label: string;
  hint: string;
  value: UploadedFile | undefined;
  onChange: (file: UploadedFile | undefined) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const processFile = (file: File) => {
    setError('');
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File must be smaller than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-1.5">
        {label} {required ? <span className="text-red-400 font-normal text-xs">(required)</span> : <span className="text-gray-400 font-normal text-xs">(optional)</span>}
      </label>
      <p className="text-xs text-gray-500 mb-2">{hint}</p>

      {value ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <FileText size={20} className="text-utcn-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{value.name}</p>
            <p className="text-xs text-gray-500">{formatSize(value.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => { onChange(undefined); setError(''); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-5 px-4 cursor-pointer transition-colors ${
            dragOver
              ? 'border-utcn-primary bg-blue-50'
              : 'border-gray-200 hover:border-utcn-primary hover:bg-blue-50/50'
          }`}
        >
          <Upload size={20} className={dragOver ? 'text-utcn-primary' : 'text-gray-400'} />
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-utcn-primary">Click to upload</span> or drag & drop
          </p>
          <p className="text-xs text-gray-400">PDF only · max 5 MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) processFile(file);
          e.target.value = '';
        }}
      />
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}

export default function ApplicationModal({ opportunity, onSubmit, onClose }: Props) {
  const fields = opportunity.applicationFields ?? [];
  const [message, setMessage] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(fields.map(f => [f.id, '']))
  );
  const [cvFile, setCvFile] = useState<UploadedFile | undefined>();
  const [transcriptFile, setTranscriptFile] = useState<UploadedFile | undefined>();
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (opportunity.requireCv && !cvFile) {
      setFormError('This opportunity requires a CV. Please upload a PDF.');
      return;
    }
    if (opportunity.requireTranscript && !transcriptFile) {
      setFormError('This opportunity requires a Transcript of Notes. Please upload a PDF.');
      return;
    }
    const result: ApplicationAnswer[] = fields.map(f => ({
      fieldId: f.id,
      question: f.question,
      answer: answers[f.id] ?? '',
    }));
    setSubmitting(true);
    try {
      await onSubmit(message, result, cvFile, transcriptFile);
    } catch {
      setFormError('Failed to submit — please try again.');
      setSubmitting(false);
    }
  };

  const textareaClass =
    'w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-utcn-primary focus:border-transparent resize-none outline-none transition bg-white placeholder:text-gray-300';

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

              {/* Custom fields */}
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

              {/* Cover message */}
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

              {/* File uploads */}
              <div className="pt-4 border-t border-gray-100 space-y-5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Supporting Documents
                </p>
                <FileUploadField
                  label="CV / Résumé"
                  hint="Upload your current CV so the professor can learn more about your background."
                  value={cvFile}
                  onChange={setCvFile}
                  required={!!opportunity.requireCv}
                />
                <FileUploadField
                  label="Transcript of Notes"
                  hint="Upload your official academic transcript (grades overview)."
                  value={transcriptFile}
                  onChange={setTranscriptFile}
                  required={!!opportunity.requireTranscript}
                />
                {formError && <p className="text-sm text-red-500 mt-1">{formError}</p>}
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
                disabled={submitting}
                className="px-6 py-2.5 bg-utcn-primary text-white rounded-xl text-sm font-semibold hover:bg-utcn-primary-dark transition-colors flex items-center gap-2 shadow-md shadow-blue-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send size={14} />
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
