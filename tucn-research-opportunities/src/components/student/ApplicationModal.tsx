import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Upload, FileText, Trash2, CheckCircle2 } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { Opportunity, ApplicationAnswer, UploadedFile, UserProfile, ApplicationDocumentOptions } from '../../types';

interface Props {
  opportunity: Opportunity;
  profile: UserProfile | null;
  onProfileRefresh: () => Promise<UserProfile | null>;
  onSubmit: (
    message: string,
    answers: ApplicationAnswer[],
    cvFile: UploadedFile | undefined,
    transcriptFile: UploadedFile | undefined,
    documentOptions: ApplicationDocumentOptions,
  ) => void | Promise<void>;
  onClose: () => void;
}

type SourceMode = 'none' | 'profile' | 'upload';
const MAX_SIZE = 5 * 1024 * 1024;

function formatSize(bytes?: number) {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadBox({
  value,
  onChange,
}: {
  value: UploadedFile | undefined;
  onChange: (file: UploadedFile | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const processFile = (file: File) => {
    setError('');
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are accepted.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File must be smaller than 5 MB.');
      return;
    }
    onChange({ name: file.name, size: file.size, type: file.type, file });
  };

  return (
    <div>
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
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) processFile(file);
          }}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-5 px-4 cursor-pointer transition-colors ${
            dragOver ? 'border-utcn-primary bg-blue-50' : 'border-gray-200 hover:border-utcn-primary hover:bg-blue-50/50'
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

function DocumentSourceField({
  label,
  required,
  profileFile,
  mode,
  setMode,
  upload,
  setUpload,
  saveToProfile,
  setSaveToProfile,
}: {
  label: string;
  required: boolean;
  profileFile?: UploadedFile;
  mode: SourceMode;
  setMode: (mode: SourceMode) => void;
  upload: UploadedFile | undefined;
  setUpload: (file: UploadedFile | undefined) => void;
  saveToProfile: boolean;
  setSaveToProfile: (save: boolean) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-1.5">
        {label} {required ? <span className="text-red-400 font-normal text-xs">(required)</span> : <span className="text-gray-400 font-normal text-xs">(optional)</span>}
      </label>
      <div className="grid gap-2">
        <label className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer ${mode === 'profile' ? 'border-utcn-primary bg-blue-50' : 'border-gray-200 bg-white'}`}>
          <input
            type="radio"
            checked={mode === 'profile'}
            disabled={!profileFile}
            onChange={() => setMode('profile')}
            className="mt-1"
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-gray-800">Use my saved {label}</span>
            {profileFile ? (
              <span className="mt-1 text-xs text-gray-500 flex items-center gap-1.5 min-w-0">
                <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                <span className="truncate">{profileFile.name}</span>
                <span>{formatSize(profileFile.size)}</span>
              </span>
            ) : (
              <span className="block mt-1 text-xs text-gray-400">No saved {label.toLowerCase()} yet.</span>
            )}
          </span>
        </label>

        <label className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer ${mode === 'upload' ? 'border-utcn-primary bg-blue-50' : 'border-gray-200 bg-white'}`}>
          <input type="radio" checked={mode === 'upload'} onChange={() => setMode('upload')} className="mt-1" />
          <span className="text-sm font-medium text-gray-800">Upload a different {label.toLowerCase()} for this application</span>
        </label>

        {!required && (
          <label className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer ${mode === 'none' ? 'border-utcn-primary bg-blue-50' : 'border-gray-200 bg-white'}`}>
            <input type="radio" checked={mode === 'none'} onChange={() => setMode('none')} className="mt-1" />
            <span className="text-sm font-medium text-gray-800">No {label.toLowerCase()}</span>
          </label>
        )}
      </div>

      {mode === 'upload' && (
        <div className="mt-3 space-y-2">
          <UploadBox value={upload} onChange={setUpload} />
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={saveToProfile} onChange={e => setSaveToProfile(e.target.checked)} />
            Also save this {label.toLowerCase()} to my profile
          </label>
        </div>
      )}
    </div>
  );
}

export default function ApplicationModal({ opportunity, profile, onProfileRefresh, onSubmit, onClose }: Props) {
  const fields = opportunity.applicationFields ?? [];
  const [message, setMessage] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(fields.map(f => [f.id, '']))
  );
  const [cvMode, setCvMode] = useState<SourceMode>(profile?.cvFile ? 'profile' : opportunity.requireCv ? 'upload' : 'none');
  const [transcriptMode, setTranscriptMode] = useState<SourceMode>(profile?.transcriptFile ? 'profile' : opportunity.requireTranscript ? 'upload' : 'none');
  const [cvFile, setCvFile] = useState<UploadedFile | undefined>();
  const [transcriptFile, setTranscriptFile] = useState<UploadedFile | undefined>();
  const [saveCvToProfile, setSaveCvToProfile] = useState(false);
  const [saveTranscriptToProfile, setSaveTranscriptToProfile] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (opportunity.requireCv && cvMode === 'none') {
      setFormError('This opportunity requires a CV.');
      return;
    }
    if (cvMode === 'profile' && !profile?.cvFile) {
      setFormError('No saved CV is available. Upload a PDF instead.');
      return;
    }
    if (cvMode === 'upload' && !cvFile) {
      setFormError('Please upload a CV PDF.');
      return;
    }
    if (opportunity.requireTranscript && transcriptMode === 'none') {
      setFormError('This opportunity requires a transcript.');
      return;
    }
    if (transcriptMode === 'profile' && !profile?.transcriptFile) {
      setFormError('No saved transcript is available. Upload a PDF instead.');
      return;
    }
    if (transcriptMode === 'upload' && !transcriptFile) {
      setFormError('Please upload a transcript PDF.');
      return;
    }

    const result: ApplicationAnswer[] = fields.map(f => ({
      fieldId: f.id,
      question: f.question,
      answer: answers[f.id] ?? '',
    }));
    setSubmitting(true);
    try {
      await onSubmit(message, result, cvMode === 'upload' ? cvFile : undefined, transcriptMode === 'upload' ? transcriptFile : undefined, {
        useProfileCv: cvMode === 'profile',
        useProfileTranscript: transcriptMode === 'profile',
        saveUploadedCvToProfile: cvMode === 'upload' && saveCvToProfile,
        saveUploadedTranscriptToProfile: transcriptMode === 'upload' && saveTranscriptToProfile,
      });
      if (saveCvToProfile || saveTranscriptToProfile) await onProfileRefresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit — please try again.');
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
          <div className="flex items-start justify-between px-6 py-5 border-b bg-gradient-to-r from-utcn-navy to-utcn-primary text-white rounded-t-2xl flex-shrink-0">
            <div className="min-w-0 pr-4">
              <h2 className="text-base font-bold">Apply for Opportunity</h2>
              <p className="text-blue-200 text-xs mt-0.5 line-clamp-1">{opportunity.title}</p>
            </div>
            <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/20 transition-colors">
              <X size={18} />
            </button>
          </div>

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
                      placeholder="Your answer..."
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
                  placeholder="Introduce yourself and explain why you're a great fit for this project..."
                  className={textareaClass}
                />
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Supporting Documents
                </p>
                <DocumentSourceField
                  label="CV"
                  required={!!opportunity.requireCv}
                  profileFile={profile?.cvFile}
                  mode={cvMode}
                  setMode={setCvMode}
                  upload={cvFile}
                  setUpload={setCvFile}
                  saveToProfile={saveCvToProfile}
                  setSaveToProfile={setSaveCvToProfile}
                />
                <DocumentSourceField
                  label="Transcript"
                  required={!!opportunity.requireTranscript}
                  profileFile={profile?.transcriptFile}
                  mode={transcriptMode}
                  setMode={setTranscriptMode}
                  upload={transcriptFile}
                  setUpload={setTranscriptFile}
                  saveToProfile={saveTranscriptToProfile}
                  setSaveToProfile={setSaveTranscriptToProfile}
                />
                {formError && <p className="text-sm text-red-500 mt-1">{formError}</p>}
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-slate-50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-utcn-primary text-white rounded-xl text-sm font-semibold hover:bg-utcn-primary-dark transition-colors flex items-center gap-2 shadow-md shadow-blue-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send size={14} />
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
