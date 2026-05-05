import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar as CalendarIcon, Clock, DollarSign, Bookmark, Share2 } from 'lucide-react';
import { Opportunity, User, Application } from '../../types';

interface Props {
  selectedOpportunity: Opportunity;
  currentUser: User | null;
  applications: Application[];
  setView: (view: 'dashboard' | 'list') => void;
  handleBack: () => void;
  setApplyModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function OpportunityDetail({
  selectedOpportunity,
  currentUser,
  applications,
  setView,
  handleBack,
  setApplyModalOpen
}: Props) {
  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-lg overflow-hidden"
    >
      <div className="p-6 sm:p-8">
        {/* Back Nav */}
        <nav className="mb-6">
          <button onClick={handleBack} className="flex items-center space-x-2 text-sm font-medium text-utcn-primary hover:underline">
            <ArrowLeft size={16} />
            <span>Back to Opportunities</span>
          </button>
        </nav>

        {/* Hero */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedOpportunity.tags.map((tag, idx) => (
              <span key={idx} className="bg-blue-100 text-utcn-primary px-3 py-1 rounded-full text-xs font-semibold">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {selectedOpportunity.title}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 border-t pt-4">
            <div className="flex items-center gap-3 mb-2 sm:mb-0">
              <img
                src={selectedOpportunity.author.avatar}
                alt={selectedOpportunity.author.name}
                className="w-8 h-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="font-semibold">
                {selectedOpportunity.author.name}
              </span>
            </div>
            <div className="font-semibold">
              Deadline: <span className="text-blue-600">{selectedOpportunity.deadline}</span>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="text-gray-700 leading-relaxed space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Abstract</h2>
          <p>{selectedOpportunity.abstract}</p>
          
          <h2 className="text-xl font-semibold text-gray-800 mt-8">Requirements</h2>
          <div className="grid md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
            <div>
              <h3 className="font-semibold">Technical</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                {selectedOpportunity.requirements.technical.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Eligibility</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                {selectedOpportunity.requirements.eligibility.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 mt-8">Details</h2>
          <div className="flex flex-wrap gap-x-8 gap-y-4 text-base">
            <div className="flex items-center gap-2"><CalendarIcon size={16} /> <strong>Post Date:</strong> {selectedOpportunity.postDate}</div>
            <div className="flex items-center gap-2"><Clock size={16} /> <strong>Duration:</strong> {selectedOpportunity.duration}</div>
            <div className="flex items-center gap-2"><DollarSign size={16} /> <strong>Stipend:</strong> {selectedOpportunity.stipend}</div>
          </div>
        </div>

        {/* Actions */}
        <footer className="mt-10 pt-6 border-t flex flex-col sm:flex-row gap-3">
          {currentUser?.role === 'student' && (
            <button 
              onClick={() => {
                const hasApplied = applications.some(a => a.opportunityId === selectedOpportunity.id && a.studentId === currentUser.id);
                if (hasApplied) {
                  alert("You've already applied for this opportunity!");
                  return;
                }
                setApplyModalOpen(true);
              }}
              className="w-full sm:w-auto flex-grow bg-utcn-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {applications.some(a => a.opportunityId === selectedOpportunity.id && a.studentId === currentUser?.id) 
                ? 'Applied ✓' 
                : 'Apply Now'}
            </button>
          )}
          {currentUser?.role === 'professor' && selectedOpportunity.author.id === currentUser.id && (
            <button onClick={() => setView('dashboard')} className="w-full sm:w-auto flex-grow bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              View Applicants
            </button>
          )}
          <button className="w-full sm:w-auto bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
            <Bookmark size={18} />
            Save
          </button>
          <button className="w-full sm:w-auto bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
            <Share2 size={18} />
            Share
          </button>
        </footer>
      </div>
    </motion.div>
  );
}
