import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ArrowLeft } from 'lucide-react';
import { Opportunity, ApplicationField, User } from '../../types';
import { apiFetch } from '../../api';

interface Props {
  currentUser: User;
  opportunities: Opportunity[];
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
  setView: (view: 'dashboard' | 'list') => void;
}

export default function CreateOpportunity({ currentUser, opportunities, setOpportunities, setView }: Props) {
  const [newOppFields, setNewOppFields] = useState<ApplicationField[]>([]);
  const [newFieldQuestion, setNewFieldQuestion] = useState('');
  const [requireCv, setRequireCv] = useState(false);
  const [requireTranscript, setRequireTranscript] = useState(false);

  const addField = () => {
    if (newFieldQuestion.trim() && newOppFields.length < 20) {
      setNewOppFields([...newOppFields, { id: Date.now().toString(), question: newFieldQuestion.trim() }]);
      setNewFieldQuestion('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newOpp: Opportunity = {
      id: Date.now().toString(),
      title:       formData.get('title') as string,
      abstract:    formData.get('abstract') as string,
      description: formData.get('description') as string,
      stipend:     formData.get('stipend') as string,
      duration:    formData.get('duration') as string,
      deadline:    'December 31, 2026',
      postDate:    'Today',
      tags:        ['NEW', 'RESEARCH'],
      requirements: { technical: ['To be specified'], eligibility: ['To be specified'] },
      applicationFields: newOppFields,
  requireCv,
  requireTranscript,
      author: {
        id:         currentUser.id,
        name:       currentUser.name,
        department: currentUser.department || 'General',
        avatar:     currentUser.avatar,
      },
    };

    try {
      const response = await apiFetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newOpp.title,
          description: newOpp.description,
          abstract: newOpp.abstract,
          stipend: newOpp.stipend,
          duration: newOpp.duration,
          deadline: newOpp.deadline,
          tags: newOpp.tags,
          applicationFields: newOpp.applicationFields,
          requireCv: newOpp.requireCv,
          requireTranscript: newOpp.requireTranscript,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || 'Failed to publish opportunity');
      if (json.id) newOpp.id = String(json.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to publish opportunity');
      return;
    }

    setOpportunities(prev => [newOpp, ...prev]);
    setNewOppFields([]);
    setView('dashboard');
  };

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-utcn-primary focus:border-transparent outline-none transition bg-white placeholder:text-gray-300';
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5';

  return (
    <motion.div
      key="create"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      {/* Back nav */}
      <button
        onClick={() => setView('dashboard')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-utcn-primary mb-5 transition-colors group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-utcn-navy to-utcn-primary px-8 py-7 text-white">
          <h1 className="text-xl font-bold">Post a New Research Opportunity</h1>
          <p className="text-blue-200 text-sm mt-1">Fill in the details below. Students will see this on the board.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-7 md:p-8 space-y-5">

          {/* Title */}
          <div>
            <label className={labelClass}>Title <span className="text-red-400">*</span></label>
            <input name="title" required type="text" placeholder="e.g. Deep Learning for Medical Imaging" className={inputClass} />
          </div>

          {/* Short Description */}
          <div>
            <label className={labelClass}>Short Description <span className="text-red-400">*</span></label>
            <input name="description" required type="text" placeholder="A one-line summary for the card view" className={inputClass} />
          </div>

          {/* Abstract */}
          <div>
            <label className={labelClass}>Full Abstract <span className="text-red-400">*</span></label>
            <textarea name="abstract" required rows={4} placeholder="Describe the research project in detail…" className={`${inputClass} resize-none`} />
          </div>

          {/* Duration + Stipend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Duration <span className="text-red-400">*</span></label>
              <input name="duration" required type="text" placeholder="e.g. 6 Months" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Stipend / Funding <span className="text-red-400">*</span></label>
              <input name="stipend" required type="text" placeholder="e.g. Unpaid or €1,000" className={inputClass} />
            </div>
          </div>

          {/* Application Questions */}
          <div className="pt-5 border-t border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Application Questions</label>
                <p className="text-xs text-gray-400 mt-0.5">Optional — students will answer these when applying</p>
              </div>
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{newOppFields.length}/20</span>
            </div>

            {newOppFields.length > 0 && (
              <div className="space-y-2 mb-3">
                {newOppFields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 items-center bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5">
                    <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">{idx + 1}.</span>
                    <span className="text-sm text-gray-700 flex-1">{field.question}</span>
                    <button
                      type="button"
                      onClick={() => setNewOppFields(prev => prev.filter(f => f.id !== field.id))}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newFieldQuestion}
                onChange={e => setNewFieldQuestion(e.target.value)}
                placeholder="Add a question for applicants…"
                className={`${inputClass} flex-1`}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addField(); } }}
              />
              <button
                type="button"
                onClick={addField}
                disabled={!newFieldQuestion.trim() || newOppFields.length >= 20}
                className="px-4 py-2.5 bg-slate-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-slate-200 disabled:opacity-40 transition-colors flex-shrink-0"
              >
                Add
              </button>
            </div>
          </div>

          {/* Document requirements */}
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-700">Application Documents</p>
            <p className="text-xs text-gray-400">Require these documents from applicants?</p>
            <div className="flex gap-4 items-center">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={requireCv} onChange={e => setRequireCv(e.target.checked)} className="form-checkbox h-4 w-4 text-utcn-primary" />
                <span>Require CV / Résumé</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={requireTranscript} onChange={e => setRequireTranscript(e.target.checked)} className="form-checkbox h-4 w-4 text-utcn-primary" />
                <span>Require Transcript of Notes</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-5 border-t border-gray-100 flex items-center gap-3">
            <button
              type="submit"
              className="bg-utcn-primary text-white px-7 py-3 rounded-xl font-semibold text-sm hover:bg-utcn-primary-dark transition-colors shadow-md shadow-blue-100"
            >
              Publish Opportunity
            </button>
            <button
              type="button"
              onClick={() => setView('dashboard')}
              className="px-5 py-3 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
