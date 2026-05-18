import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, XCircle, BookOpen, FileText } from 'lucide-react';
import { Opportunity, Application, User } from '../../types';

interface Props {
  currentUser: User;
  opportunities: Opportunity[];
  applications: Application[];
  setView: (view: 'list' | 'detail') => void;
  setSelectedOpportunity: React.Dispatch<React.SetStateAction<Opportunity | null>>;
}

const STATUS_CONFIG = {
  accepted: { icon: CheckCircle2, label: 'Accepted',  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  bar: 'bg-green-500' },
  rejected: { icon: XCircle,      label: 'Rejected',  bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200',    bar: 'bg-red-500'   },
  pending:  { icon: Clock,        label: 'Pending',   bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  bar: 'bg-amber-400' },
};

export default function StudentApplications({ currentUser, opportunities, applications, setView, setSelectedOpportunity }: Props) {
  const studentApps = applications.filter(a => a.studentId === currentUser.id);

  return (
    <motion.div
      key="applications"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-500 text-sm mt-1">{studentApps.length} application{studentApps.length !== 1 ? 's' : ''} submitted</p>
      </div>

      {studentApps.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <BookOpen size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">You haven't applied to any opportunities yet.</p>
          <button
            onClick={() => setView('list')}
            className="mt-5 text-sm text-utcn-primary hover:underline font-medium"
          >
            Browse Opportunities →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {studentApps.map(app => {
            const opp = opportunities.find(o => o.id === app.opportunityId);
            const cfg = STATUS_CONFIG[app.status];
            const StatusIcon = cfg.icon;

            return (
              <div key={app.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Status bar */}
                <div className={`h-1 ${cfg.bar}`} />

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <button
                        className="font-bold text-gray-900 hover:text-utcn-primary transition-colors text-left leading-snug"
                        onClick={() => {
                          const o = opportunities.find(x => x.id === app.opportunityId);
                          if (o) { setSelectedOpportunity(o); setView('detail'); }
                        }}
                      >
                        {opp?.title ?? 'Unknown Opportunity'}
                      </button>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {opp?.author.name} · Applied {app.date}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      <StatusIcon size={12} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Message */}
                  <div className="bg-slate-50 border-l-4 border-slate-200 rounded-r-xl px-4 py-3 text-sm text-gray-600 italic mb-4">
                    "{app.message}"
                  </div>

                  {/* Answers */}
                  {app.answers && app.answers.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-dashed border-gray-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Your Answers</p>
                      {app.answers.map(ans => (
                        <div key={ans.fieldId}>
                          <p className="text-xs font-semibold text-gray-700">{ans.question}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{ans.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Uploaded documents */}
                  {(app.cvFile || app.transcriptFile) && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-dashed border-gray-100">
                      <p className="w-full text-[10px] font-bold uppercase tracking-widest text-gray-400">Uploaded Documents</p>
                      {app.cvFile && (
                        <a
                          href={app.cvFile.dataUrl}
                          download={app.cvFile.name}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-utcn-primary hover:bg-blue-100 transition-colors font-medium"
                        >
                          <FileText size={12} />
                          CV — {app.cvFile.name}
                        </a>
                      )}
                      {app.transcriptFile && (
                        <a
                          href={app.transcriptFile.dataUrl}
                          download={app.transcriptFile.name}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-utcn-primary hover:bg-blue-100 transition-colors font-medium"
                        >
                          <FileText size={12} />
                          Transcript — {app.transcriptFile.name}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Professor reply */}
                {app.professorReply ? (
                  <div className={`border-t px-6 py-4 ${cfg.bg}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={opp?.author.avatar}
                        alt={opp?.author.name}
                        className="w-6 h-6 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs font-semibold text-gray-700">{opp?.author.name}</span>
                      {app.replyDate && <span className="text-xs text-gray-400 ml-auto">{app.replyDate}</span>}
                    </div>
                    <p className="text-sm text-gray-700">{app.professorReply}</p>
                  </div>
                ) : (
                  <div className="border-t px-6 py-3">
                    <p className="text-xs text-gray-400 italic">Waiting for a reply from the professor…</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

interface Props {
  currentUser: User;
  opportunities: Opportunity[];
  applications: Application[];
  setView: (view: 'list' | 'detail') => void;
  setSelectedOpportunity: React.Dispatch<React.SetStateAction<Opportunity | null>>;
}
