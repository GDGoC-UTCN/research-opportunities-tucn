import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar as CalendarIcon, Clock, DollarSign, Bookmark, Share2, CheckCircle2 } from 'lucide-react';
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
  const hasApplied = applications.some(
    a => a.opportunityId === selectedOpportunity.id && a.studentId === currentUser?.id
  );

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
    >
      {/* Back nav */}
      <nav className="mb-5">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-utcn-primary transition-colors group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Opportunities
        </button>
      </nav>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Hero band */}
        <div className="bg-gradient-to-br from-utcn-navy to-utcn-primary px-8 py-10 text-white">
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedOpportunity.tags.map((tag, idx) => (
              <span key={idx} className="text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md bg-white/15 text-white/90 border border-white/20">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold leading-snug mb-5 max-w-3xl">
            {selectedOpportunity.title}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-sm">
            <div className="flex items-center gap-2.5">
              <img
                src={selectedOpportunity.author.avatar}
                alt={selectedOpportunity.author.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="font-semibold text-white">{selectedOpportunity.author.name}</div>
                <div className="text-blue-200 text-xs">{selectedOpportunity.author.department}</div>
              </div>
            </div>
            <div className="flex items-center gap-5 text-blue-100 text-xs">
              <span className="flex items-center gap-1.5"><CalendarIcon size={13} /> Deadline: <strong className="text-white">{selectedOpportunity.deadline}</strong></span>
              <span className="flex items-center gap-1.5"><Clock size={13} /> {selectedOpportunity.duration}</span>
              <span className="flex items-center gap-1.5"><DollarSign size={13} /> {selectedOpportunity.stipend}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-7 md:p-10 space-y-8">

          {/* Abstract */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Abstract</h2>
            <p className="text-gray-700 leading-relaxed text-[15px]">{selectedOpportunity.abstract}</p>
          </section>

          {/* Requirements */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Requirements</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-utcn-primary rounded-full" />
                  Technical
                </h3>
                <ul className="space-y-2">
                  {selectedOpportunity.requirements.technical.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 size={14} className="text-utcn-primary flex-shrink-0 mt-0.5" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-utcn-navy rounded-full" />
                  Eligibility
                </h3>
                <ul className="space-y-2">
                  {selectedOpportunity.requirements.eligibility.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 size={14} className="text-utcn-navy flex-shrink-0 mt-0.5" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Details row */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Details</h2>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: CalendarIcon, label: 'Posted',   value: selectedOpportunity.postDate },
                { icon: Clock,        label: 'Duration', value: selectedOpportunity.duration },
                { icon: DollarSign,   label: 'Stipend',  value: selectedOpportunity.stipend },
                { icon: CalendarIcon, label: 'Deadline', value: selectedOpportunity.deadline },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl">
                  <Icon size={16} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
                    <div className="text-sm font-semibold text-gray-800">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Action footer */}
        <div className="px-7 md:px-10 pb-8 flex flex-col sm:flex-row gap-3 border-t pt-6">
          {currentUser?.role === 'student' && (
            <button
              onClick={() => {
                if (hasApplied) { alert("You've already applied for this opportunity!"); return; }
                setApplyModalOpen(true);
              }}
              disabled={hasApplied}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all ${
                hasApplied
                  ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                  : 'bg-utcn-primary text-white hover:bg-utcn-primary-dark shadow-md shadow-blue-100'
              }`}
            >
              {hasApplied ? <><CheckCircle2 size={16} /> Applied</> : 'Apply Now'}
            </button>
          )}
          {currentUser?.role === 'professor' && selectedOpportunity.author.id === currentUser.id && (
            <button
              onClick={() => setView('dashboard')}
              className="flex-1 bg-utcn-navy text-white py-3 px-6 rounded-xl font-semibold text-sm hover:bg-utcn-navy-light transition-colors"
            >
              View Applicants
            </button>
          )}
          <button className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
            <Bookmark size={15} /> Save
          </button>
          <button className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
            <Share2 size={15} /> Share
          </button>
        </div>
      </div>
    </motion.div>
  );
}
