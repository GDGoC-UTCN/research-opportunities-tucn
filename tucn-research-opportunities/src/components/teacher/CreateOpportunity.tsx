import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Opportunity, ApplicationField, User } from '../../types';

interface Props {
  currentUser: User;
  opportunities: Opportunity[];
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
  setView: (view: 'dashboard' | 'list') => void;
}

export default function CreateOpportunity({ currentUser, opportunities, setOpportunities, setView }: Props) {
  const [newOppFields, setNewOppFields] = useState<ApplicationField[]>([]);
  const [newFieldQuestion, setNewFieldQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const abstract = formData.get('abstract') as string;
    const desc = formData.get('description') as string;
    const stipend = formData.get('stipend') as string;
    const dur = formData.get('duration') as string;
    
    const newOpp: Opportunity = {
      id: Date.now().toString(),
      title,
      abstract,
      description: desc,
      stipend,
      duration: dur,
      deadline: "December 31, 2026",
      postDate: "Today",
      tags: ["NEW", "RESEARCH"],
      requirements: { technical: ["To be specified"], eligibility: ["To be specified"] },
      applicationFields: newOppFields,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        department: currentUser.department || 'General',
        avatar: currentUser.avatar
      }
    };
    setOpportunities([newOpp, ...opportunities]);
    setNewOppFields([]);
    setView('dashboard');
  };

  return (
    <motion.div
      key="create"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg overflow-hidden p-6 sm:p-8 max-w-3xl mx-auto"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Post a New Opportunity</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input name="title" required type="text" className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-utcn-red focus:border-utcn-red" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
          <input name="description" required type="text" className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-utcn-red focus:border-utcn-red" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Abstract</label>
          <textarea name="abstract" required rows={4} className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-utcn-red focus:border-utcn-red" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <input name="duration" required type="text" placeholder="e.g. 6 Months" className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-utcn-red focus:border-utcn-red" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stipend / Funding</label>
            <input name="stipend" required type="text" placeholder="e.g. Unpaid or €1,000" className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-utcn-red focus:border-utcn-red" />
          </div>
        </div>

        {/* Question Builder */}
        <div className="pt-4 border-t mt-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Application Questions (Optional)</label>
            <span className="text-xs font-semibold text-gray-500">{newOppFields.length} / 20</span>
          </div>
          <div className="space-y-3 mb-3">
            {newOppFields.map((field, idx) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="flex-1 bg-gray-50 border p-2 text-sm rounded-md">{idx + 1}. {field.question}</div>
                <button type="button" onClick={() => setNewOppFields(prev => prev.filter(f => f.id !== field.id))} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newFieldQuestion} 
              onChange={e => setNewFieldQuestion(e.target.value)}
              placeholder="Add a question for applicants..." 
              className="flex-1 border-gray-300 rounded-md shadow-sm border p-2 text-sm focus:ring-utcn-red focus:border-utcn-red"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newFieldQuestion.trim() && newOppFields.length < 20) {
                    setNewOppFields([...newOppFields, { id: Date.now().toString(), question: newFieldQuestion.trim() }]);
                    setNewFieldQuestion('');
                  }
                }
              }}
            />
            <button 
              type="button" 
              onClick={() => {
                if (newFieldQuestion.trim() && newOppFields.length < 20) {
                  setNewOppFields([...newOppFields, { id: Date.now().toString(), question: newFieldQuestion.trim() }]);
                  setNewFieldQuestion('');
                }
              }}
              disabled={!newFieldQuestion.trim() || newOppFields.length >= 20}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        <div className="pt-4 flex gap-4 border-t mt-4">
          <button type="submit" className="bg-utcn-red text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700">
            Post Opportunity
          </button>
          <button type="button" onClick={() => setView('dashboard')} className="px-6 py-2 rounded-lg font-semibold text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}
