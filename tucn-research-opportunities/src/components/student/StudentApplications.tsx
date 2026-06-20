import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bookmark, BookOpen, CheckCircle2, Clock, FileText, Trash2, XCircle } from 'lucide-react';
import { Application, MyOpportunities, MyOpportunityItem, Opportunity, User } from '../../types';
import { downloadApplicationFile } from '../../api';

interface Props {
  currentUser: User;
  applications: Application[];
  myOpportunities: MyOpportunities;
  setView: (view: 'list') => void;
  onViewOpportunity: (opportunity: Opportunity) => void;
  onApplyOpportunity: (opportunity: Opportunity) => void;
  onRemoveSavedOpportunity: (opportunity: Opportunity) => void;
}

type TabKey = keyof MyOpportunities;

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'saved', label: 'Saved' },
  { key: 'applied', label: 'Applied' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_CONFIG = {
  accepted: { icon: CheckCircle2, label: 'Accepted', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', bar: 'bg-green-500' },
  rejected: { icon: XCircle, label: 'Rejected', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', bar: 'bg-red-500' },
  pending: { icon: Clock, label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-400' },
};

function ApplicationDetails({ app }: { app?: Application }) {
  if (!app) return null;

  return (
    <>
      <div className="bg-slate-50 border-l-4 border-slate-200 rounded-r-xl px-4 py-3 text-sm text-gray-600 italic mb-4">
        "{app.message}"
      </div>

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

      {(app.cvFile || app.transcriptFile) && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-dashed border-gray-100">
          <p className="w-full text-[10px] font-bold uppercase tracking-widest text-gray-400">Uploaded Documents</p>
          {app.cvFile && (
            app.cvFile.dataUrl ? (
              <a
                href={app.cvFile.dataUrl}
                download={app.cvFile.name}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-utcn-primary hover:bg-blue-100 transition-colors font-medium"
              >
                <FileText size={12} />
                CV - {app.cvFile.name}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => downloadApplicationFile(app.id, 'cv', app.cvFile?.name || 'cv.pdf').catch(err => alert(err.message))}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-utcn-primary hover:bg-blue-100 transition-colors font-medium"
              >
                <FileText size={12} />
                CV - {app.cvFile.name}
              </button>
            )
          )}
          {app.transcriptFile && (
            app.transcriptFile.dataUrl ? (
              <a
                href={app.transcriptFile.dataUrl}
                download={app.transcriptFile.name}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-utcn-primary hover:bg-blue-100 transition-colors font-medium"
              >
                <FileText size={12} />
                Transcript - {app.transcriptFile.name}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => downloadApplicationFile(app.id, 'transcript', app.transcriptFile?.name || 'transcript.pdf').catch(err => alert(err.message))}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-utcn-primary hover:bg-blue-100 transition-colors font-medium"
              >
                <FileText size={12} />
                Transcript - {app.transcriptFile.name}
              </button>
            )
          )}
        </div>
      )}
    </>
  );
}

export default function StudentApplications({
  currentUser,
  applications,
  myOpportunities,
  setView,
  onViewOpportunity,
  onApplyOpportunity,
  onRemoveSavedOpportunity,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('saved');
  const activeItems = myOpportunities[activeTab] || [];
  const studentApps = applications.filter(a => a.studentId === currentUser.id);
  const total = TABS.reduce((sum, tab) => sum + (myOpportunities[tab.key]?.length || 0), 0);

  const renderSavedCard = (item: MyOpportunityItem) => (
    <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {item.opportunity.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-utcn-primary border border-blue-100">
                {tag}
              </span>
            ))}
          </div>
          <button className="font-bold text-gray-900 hover:text-utcn-primary transition-colors text-left leading-snug" onClick={() => onViewOpportunity(item.opportunity)}>
            {item.opportunity.title}
          </button>
          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{item.opportunity.description}</p>
          <p className="text-xs text-gray-400 mt-2">
            {item.opportunity.author.name} · Deadline {item.opportunity.deadline}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:flex-shrink-0">
          <button type="button" onClick={() => onViewOpportunity(item.opportunity)} className="px-3 py-2 rounded-lg bg-slate-50 text-gray-700 text-xs font-semibold hover:bg-slate-100">
            View
          </button>
          <button type="button" onClick={() => onApplyOpportunity(item.opportunity)} className="px-3 py-2 rounded-lg bg-utcn-primary text-white text-xs font-semibold hover:bg-utcn-primary-dark">
            Apply
          </button>
          <button type="button" onClick={() => onRemoveSavedOpportunity(item.opportunity)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100">
            <Trash2 size={13} /> Remove
          </button>
        </div>
      </div>
    </div>
  );

  const renderApplicationCard = (item: MyOpportunityItem) => {
    const app = item.application;
    const fullApp = app ? studentApps.find(candidate => candidate.id === app.id) : undefined;
    const status = app?.status || 'pending';
    const cfg = STATUS_CONFIG[status];
    const StatusIcon = cfg.icon;

    return (
      <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className={`h-1 ${cfg.bar}`} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <button className="font-bold text-gray-900 hover:text-utcn-primary transition-colors text-left leading-snug" onClick={() => onViewOpportunity(item.opportunity)}>
                {item.opportunity.title}
              </button>
              <p className="text-xs text-gray-400 mt-0.5">
                {item.opportunity.author.name} · Applied {app?.date || fullApp?.date || 'recently'}
              </p>
            </div>
            <span className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              <StatusIcon size={12} />
              {cfg.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button type="button" onClick={() => onViewOpportunity(item.opportunity)} className="px-3 py-2 rounded-lg bg-slate-50 text-gray-700 text-xs font-semibold hover:bg-slate-100">
              View Opportunity
            </button>
          </div>

          <ApplicationDetails app={fullApp} />
        </div>

        {app?.professorReply ? (
          <div className={`border-t px-6 py-4 ${cfg.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <img
                src={item.opportunity.author.avatar}
                alt={item.opportunity.author.name}
                className="w-6 h-6 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-semibold text-gray-700">{item.opportunity.author.name}</span>
              {app.replyDate && <span className="text-xs text-gray-400 ml-auto">{app.replyDate}</span>}
            </div>
            <p className="text-sm text-gray-700">{app.professorReply}</p>
          </div>
        ) : status === 'pending' ? (
          <div className="border-t px-6 py-3">
            <p className="text-xs text-gray-400 italic">Waiting for a reply from the professor...</p>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <motion.div
      key="applications"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Opportunities</h1>
        <p className="text-gray-500 text-sm mt-1">
          Saved opportunities and application decisions in one place.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-utcn-primary text-white'
                : 'text-gray-600 hover:bg-slate-50'
            }`}
          >
            {tab.label} ({myOpportunities[tab.key]?.length || 0})
          </button>
        ))}
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <BookOpen size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">You have not saved or applied to any opportunities yet.</p>
          <button onClick={() => setView('list')} className="mt-5 text-sm text-utcn-primary hover:underline font-medium">
            Browse Opportunities
          </button>
        </div>
      ) : activeItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Bookmark size={34} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No opportunities in {TABS.find(tab => tab.key === activeTab)?.label.toLowerCase()}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'saved'
            ? activeItems.map(renderSavedCard)
            : activeItems.map(renderApplicationCard)}
        </div>
      )}
    </motion.div>
  );
}
