import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ChevronDown } from 'lucide-react';
import { Opportunity, Application, User } from '../../types';

interface Props {
  currentUser: User;
  opportunities: Opportunity[];
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  setView: (view: 'create' | 'detail') => void;
  // Though setSelectedOpportunity was in App.tsx, we don't strictly need to navigate if tracking teacher dashboard separately, or we can pass it down:
  // For simplicity we will skip opening opportunity inside the dashboard directly if not implemented
}

export default function TeacherDashboard({ currentUser, opportunities, applications, setApplications, setView }: Props) {
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [replyMessages, setReplyMessages] = useState<Record<string, string>>({});

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg overflow-hidden p-4 sm:p-8 max-w-4xl mx-auto"
    >
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">My Posted Projects</h2>
        <button onClick={() => setView('create')} className="bg-utcn-primary text-white px-4 py-2 rounded-lg font-semibold flex items-center shadow hover:bg-blue-700 text-sm">
          <Plus className="w-5 h-5 mr-1" /> New Project
        </button>
      </div>
      <div className="space-y-6">
        {opportunities.filter(o => o.author.id === currentUser.id).length === 0 ? (
          <p className="text-gray-500 text-center py-8">You haven't posted any projects yet.</p>
        ) : (
          opportunities.filter(o => o.author.id === currentUser.id).map(opp => {
            const oppApps = applications.filter(a => a.opportunityId === opp.id);
            return (
              <div key={opp.id} className="border border-gray-200 rounded-lg p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-800">{opp.title}</h3>
                  <span className="bg-blue-100 text-utcn-primary px-3 py-1 rounded-full text-xs font-semibold">
                    {oppApps.length} Applicants
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{opp.description}</p>
                
                {oppApps.length > 0 && (
                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-3">Recent Applications</h4>
                    <div className="space-y-3">
                      {oppApps.map(app => (
                        <div key={app.id} className="bg-white border rounded shadow-sm overflow-hidden">
                          <button 
                            className="w-full text-left p-3 flex justify-between items-center hover:bg-gray-50 focus:outline-none transition-colors"
                            onClick={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">{app.studentName}</span>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                app.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {app.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <span className="text-xs font-normal">{app.date}</span>
                              <ChevronDown className={`w-4 h-4 transition-transform ${expandedAppId === app.id ? 'rotate-180' : ''}`} />
                            </div>
                          </button>
                          
                          <AnimatePresence>
                            {expandedAppId === app.id && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t bg-gray-50 text-sm overflow-hidden"
                              >
                                <div className="p-4 space-y-4">
                                  <div>
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">General Message</h5>
                                    <p className="text-gray-700 italic">"{app.message}"</p>
                                  </div>
                                  
                                  {app.answers && app.answers.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Questionnaire Answers</h5>
                                      <div className="space-y-3">
                                        {app.answers.map(ans => (
                                          <div key={ans.fieldId}>
                                            <div className="font-medium text-gray-800">{ans.question}</div>
                                            <div className="text-gray-600 mt-0.5">{ans.answer}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {app.status === 'pending' && (
                                    <div className="pt-4 border-t mt-4 border-gray-200">
                                      <h5 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-2">Professor Decision</h5>
                                      <textarea
                                        rows={3}
                                        className="w-full border-gray-300 rounded-md shadow-sm border p-2 text-sm focus:ring-utcn-primary focus:border-utcn-primary mb-3"
                                        placeholder="Write a reply message to the student (optional)..."
                                        value={replyMessages[app.id] ?? ''}
                                        onChange={e => setReplyMessages({...replyMessages, [app.id]: e.target.value})}
                                      />
                                      <div className="flex gap-3">
                                        <button
                                          onClick={() => {
                                            const updatedApps = applications.map(a => {
                                              if (a.id === app.id) return { ...a, status: 'accepted' as const, professorReply: replyMessages[app.id], replyDate: new Date().toLocaleDateString() };
                                              return a;
                                            });
                                            setApplications(updatedApps);
                                          }}
                                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-semibold transition-colors flex-1"
                                        >
                                          Accept Candidate
                                        </button>
                                        <button
                                          onClick={() => {
                                            const updatedApps = applications.map(a => {
                                              if (a.id === app.id) return { ...a, status: 'rejected' as const, professorReply: replyMessages[app.id], replyDate: new Date().toLocaleDateString() };
                                              return a;
                                            });
                                            setApplications(updatedApps);
                                          }}
                                          className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors flex-1"
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
          })
        )}
      </div>
    </motion.div>
  );
}
