import { motion } from 'motion/react';
import { ArrowLeft, Calendar as CalendarIcon, Clock, DollarSign, Bookmark, Share2, CheckCircle2, HelpCircle } from 'lucide-react';
import { ApplicationStatus, Opportunity, User, Application } from '../../types';
import OpportunityQA from './OpportunityQA';
import { statusLabel, statusBadge } from '../../lib/applicationStatus';

interface Props {
  selectedOpportunity: Opportunity;
  currentUser: User | null;
  applications: Application[];
  setView: (view: 'dashboard' | 'list') => void;
  handleBack: () => void;
  handleApplyClick: (opportunity: Opportunity) => void;
  saved: boolean;
  applicationStatus?: ApplicationStatus;
  handleToggleSave: (opportunity: Opportunity) => void;
  handleShareOpportunity: (opportunity: Opportunity) => void;
  onSignInToAsk: () => void;
  onOpenProfessor: (professorId: string) => void;
}

export default function OpportunityDetail({
  selectedOpportunity,
  currentUser,
  applications,
  setView,
  handleBack,
  handleApplyClick,
  saved,
  applicationStatus,
  handleToggleSave,
  handleShareOpportunity,
  onSignInToAsk,
  onOpenProfessor
}: Props) {
  const hasApplied = applications.some(
    a => a.opportunityId === selectedOpportunity.id && a.studentId === currentUser?.id
  );
  const isOwner = currentUser?.role === 'professor' && selectedOpportunity.author.id === currentUser.id;
  const meta = [
    { icon: CalendarIcon, label: 'Deadline', value: selectedOpportunity.deadline },
    { icon: Clock, label: 'Duration', value: selectedOpportunity.duration },
    { icon: DollarSign, label: 'Funding', value: selectedOpportunity.stipend },
    { icon: CalendarIcon, label: 'Posted', value: selectedOpportunity.postDate },
  ];

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25 }}
    >
      {/* Back nav */}
      <nav className="mb-5">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Opportunities
        </button>
      </nav>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* ── Main column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-zinc-200/80 overflow-hidden">
          {/* Hero band */}
          <div className="relative bg-utcn-navy px-7 md:px-9 py-9 text-white overflow-hidden">
            <div className="absolute inset-0 research-grid-dark research-fade opacity-70" aria-hidden="true" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-utcn-red/70 to-transparent" aria-hidden="true" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="signal-dot" aria-hidden="true" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Research Brief</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedOpportunity.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-md bg-white/10 text-white/80 border border-white/15">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="font-display text-2xl md:text-[2rem] leading-snug max-w-3xl">
                {selectedOpportunity.title}
              </h1>
              <button
                type="button"
                onClick={() => onOpenProfessor(selectedOpportunity.author.id)}
                className="mt-5 flex items-center gap-3 text-left group/author"
              >
                <img
                  src={selectedOpportunity.author.avatar}
                  alt={selectedOpportunity.author.name}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-white/25 grayscale"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="font-semibold text-white text-sm group-hover/author:underline underline-offset-2 decoration-white/40">{selectedOpportunity.author.name}</div>
                  <div className="text-white/45 text-xs uppercase tracking-wide">{selectedOpportunity.author.department}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-7 md:p-9 space-y-8">
            {/* Abstract */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Abstract</h2>
              <p className="text-zinc-700 leading-relaxed text-[15px]">{selectedOpportunity.abstract}</p>
            </section>

            {selectedOpportunity.description && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Overview</h2>
                <p className="text-zinc-600 leading-relaxed text-sm">{selectedOpportunity.description}</p>
              </section>
            )}

            {/* Requirements */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Requirements</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-100">
                  <h3 className="font-semibold text-zinc-800 text-sm mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full" />
                    Technical
                  </h3>
                  <ul className="space-y-2">
                    {selectedOpportunity.requirements.technical.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-zinc-600">
                        <CheckCircle2 size={14} className="text-zinc-400 flex-shrink-0 mt-0.5" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-100">
                  <h3 className="font-semibold text-zinc-800 text-sm mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-utcn-red rounded-full" />
                    Eligibility
                  </h3>
                  <ul className="space-y-2">
                    {selectedOpportunity.requirements.eligibility.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-zinc-600">
                        <CheckCircle2 size={14} className="text-zinc-400 flex-shrink-0 mt-0.5" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Application questions */}
            {selectedOpportunity.applicationFields && selectedOpportunity.applicationFields.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Application Questions</h2>
                <ol className="space-y-2.5">
                  {selectedOpportunity.applicationFields.map((field, idx) => (
                    <li key={field.id} className="flex items-start gap-3 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3">
                      <span className="text-xs font-bold text-zinc-400 mt-0.5">{String(idx + 1).padStart(2, '0')}</span>
                      <span className="text-sm text-zinc-700 flex items-start gap-2">
                        <HelpCircle size={14} className="text-zinc-400 flex-shrink-0 mt-0.5" />
                        {field.question}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </div>

        {/* ── Sticky side panel ───────────────────────────────────── */}
        <aside className="lg:sticky lg:top-6 bg-white rounded-2xl shadow-sm border border-zinc-200/80 p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">At a glance</h2>
          <dl className="space-y-3 mb-6">
            {meta.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-zinc-500" />
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</dt>
                  <dd className="text-sm font-semibold text-zinc-800 truncate">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="border-t border-zinc-100 pt-5 space-y-2.5">
            {(!currentUser || currentUser.role === 'student') && (
              <button
                onClick={() => handleApplyClick(selectedOpportunity)}
                disabled={hasApplied}
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all ${
                  hasApplied
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                    : 'bg-zinc-900 text-white hover:bg-black'
                }`}
              >
                {hasApplied ? <><CheckCircle2 size={16} /> Applied</> : currentUser ? 'Apply Now' : 'Apply / Sign in'}
              </button>
            )}
            {currentUser && currentUser.role !== 'student' && !isOwner && (
              <div className="w-full bg-zinc-50 text-zinc-500 py-3 px-6 rounded-xl font-semibold text-sm text-center border border-zinc-100">
                Student applications only
              </div>
            )}
            {isOwner && (
              <button
                onClick={() => setView('dashboard')}
                className="w-full bg-zinc-900 text-white py-3 px-6 rounded-xl font-semibold text-sm hover:bg-black transition-colors"
              >
                View Applicants
              </button>
            )}

            <div className="flex gap-2.5">
              {applicationStatus ? (
                <span className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold ${statusBadge(applicationStatus)}`}>
                  <Bookmark size={15} fill="currentColor" /> {statusLabel(applicationStatus)}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleSave(selectedOpportunity)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors border ${
                    saved
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-900'
                  }`}
                  aria-label={saved ? 'Remove from saved opportunities' : 'Save opportunity'}
                >
                  <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleShareOpportunity(selectedOpportunity)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-900 transition-colors"
                aria-label="Share opportunity"
              >
                <Share2 size={15} /> Share
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Questions & answers */}
      <div className="mt-6">
        <OpportunityQA
          opportunityId={selectedOpportunity.id}
          currentUser={currentUser}
          onSignInToAsk={onSignInToAsk}
        />
      </div>
    </motion.div>
  );
}
