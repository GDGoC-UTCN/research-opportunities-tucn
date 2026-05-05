import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { Opportunity, Application, User } from '../../types';

interface Props {
  currentUser: User;
  opportunities: Opportunity[];
  applications: Application[];
  setView: (view: 'list' | 'detail') => void;
  setSelectedOpportunity: React.Dispatch<React.SetStateAction<Opportunity | null>>;
}

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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Applications</h2>
      {studentApps.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CheckCircle2 size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">You haven't applied to any opportunities yet.</p>
          <button onClick={() => setView('list')} className="mt-4 text-utcn-red hover:underline font-medium">Browse Opportunities</button>
        </div>
      ) : (
        <div className="space-y-5">
          {studentApps.map(app => {
            const opp = opportunities.find(o => o.id === app.opportunityId);
            const statusStyles: Record<string, string> = {
              accepted: 'bg-green-100 text-green-700',
              rejected: 'bg-red-100 text-red-600',
              pending:  'bg-yellow-100 text-yellow-700',
            };
            const statusLabel: Record<string, string> = {
              accepted: '✓ Accepted',
              rejected: '✗ Rejected',
              pending:  '⏳ Pending',
            };
            return (
              <div key={app.id} className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3
                        className="font-bold text-gray-900 hover:text-utcn-red cursor-pointer"
                        onClick={() => { const o = opportunities.find(x => x.id === app.opportunityId); if (o) { setSelectedOpportunity(o); setView('detail'); } }}
                      >
                        {opp?.title ?? 'Unknown Opportunity'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">{opp?.author.name} · Applied {app.date}</p>
                    </div>
                    <span className={`flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${statusStyles[app.status]}`}>
                      {statusLabel[app.status]}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700 italic border-l-4 border-gray-200 mb-3">
                    "{app.message}"
                  </div>
                  {app.answers && app.answers.length > 0 && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-dashed">
                      <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Your Answers</h4>
                      {app.answers.map(ans => (
                        <div key={ans.fieldId}>
                          <div className="text-sm font-medium text-gray-700">{ans.question}</div>
                          <div className="text-sm text-gray-500 mt-0.5">{ans.answer}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {app.professorReply && (
                  <div className="border-t bg-red-50 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={opp?.author.avatar} alt={opp?.author.name} className="w-6 h-6 rounded-full" />
                      <span className="text-xs font-semibold text-gray-700">{opp?.author.name}</span>
                      {app.replyDate && <span className="text-xs text-gray-400 ml-auto">{app.replyDate}</span>}
                    </div>
                    <p className="text-sm text-gray-800">{app.professorReply}</p>
                  </div>
                )}
                {!app.professorReply && (
                  <div className="border-t px-5 py-3 text-xs text-gray-400 italic">No reply yet from the professor.</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
