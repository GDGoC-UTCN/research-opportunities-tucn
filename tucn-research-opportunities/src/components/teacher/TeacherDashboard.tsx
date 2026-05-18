import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ChevronDown, Users, FileText } from 'lucide-react';
import { Opportunity, Application, User } from '../../types';

interface Props {
  currentUser: User;
  opportunities: Opportunity[];
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  setView: (view: 'create' | 'detail') => void;
}

export default function TeacherDashboard({ currentUser, opportunities, applications, setApplications, setView }: Props) {
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [replyMessages, setReplyMessages] = useState<Record<string, string>>({});

  const myOpps = opportunities.filter(o => o.author.id === currentUser.id);
  const totalApplicants = applications.filter(a => myOpps.some(o => o.id === a.opportunityId)).length;

  const statusStyle: Record<string, string> = {
    accepted: 'bg-green-100 text-green-700 border border-green-200',
    rejected:  'bg-red-100 text-red-600 border border-red-200',
    pending:   'bg-amber-100 text-amber-700 border border-amber-200',
  };

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      {/* Page header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {myOpps.length} project{myOpps.length !== 1 ? 's' : ''} posted · {totalApplicants} total applicant{totalApplicants !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setView('create')}
          className="bg-utcn-primary text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-1.5 shadow-md shadow-blue-100 hover:bg-utcn-primary-dark transition-colors text-sm"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {myOpps.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <FileText size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">You haven't posted any projects yet.</p>
          <button onClick={() => setView('create')} className="mt-4 text-utcn-primary hover:underline text-sm font-medium">
            Post your first project →
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {myOpps.map(opp => {
            const oppApps = applications.filter(a => a.opportunityId === opp.id);
            return (
              <div key={opp.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Project header */}
                <div className="p-6 border-b border-gray-50">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-base leading-snug truncate">{opp.title}</h3>
                      <p className="text-gray-500 text-sm mt-1 line-clamp-1">{opp.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="bg-blue-50 text-utcn-primary border border-blue-100 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <Users size={11} />
                        {oppApps.length} Applicant{oppApps.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Applicants */}
                {oppApps.length > 0 && (
                  <div className="p-4 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3 px-1">Applications</p>
                    <div className="space-y-2">
                      {oppApps.map(app => (
                        <div key={app.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                          <button
                            className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
                            onClick={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-sm text-gray-800">{app.studentName}</span>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusStyle[app.status]}`}>
                                {app.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <span className="text-xs">{app.date}</span>
                              <ChevronDown size={14} className={`transition-transform ${expandedAppId === app.id ? 'rotate-180' : ''}`} />
                            </div>
                          </button>

                          <AnimatePresence>
                            {expandedAppId === app.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t overflow-hidden"
                              >
                                <div className="p-4 space-y-4 bg-slate-50">
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Message</p>
                                    <p className="text-sm text-gray-700 italic">"{app.message}"</p>
                                  </div>

                                  {app.answers && app.answers.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Questionnaire Answers</p>
                                      <div className="space-y-2.5">
                                        {app.answers.map(ans => (
                                          <div key={ans.fieldId} className="bg-white rounded-lg border border-gray-100 p-3">
                                            <div className="font-medium text-sm text-gray-800">{ans.question}</div>
                                            <div className="text-sm text-gray-500 mt-0.5">{ans.answer}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {app.status === 'pending' && (
                                    <div className="pt-3 border-t border-gray-200">
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Professor Decision</p>
                                      <textarea
                                        rows={2}
                                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-utcn-primary focus:border-transparent mb-3 resize-none outline-none"
                                        placeholder="Optional reply message to the student…"
                                        value={replyMessages[app.id] ?? ''}
                                        onChange={e => setReplyMessages({ ...replyMessages, [app.id]: e.target.value })}
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => setApplications(applications.map(a => a.id === app.id ? { ...a, status: 'accepted' as const, professorReply: replyMessages[app.id], replyDate: new Date().toLocaleDateString() } : a))}
                                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                        >
                                          Accept
                                        </button>
                                        <button
                                          onClick={() => setApplications(applications.map(a => a.id === app.id ? { ...a, status: 'rejected' as const, professorReply: replyMessages[app.id], replyDate: new Date().toLocaleDateString() } : a))}
                                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
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
