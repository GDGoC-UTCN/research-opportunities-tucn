import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bookmark, BookOpen, CalendarClock, CalendarPlus, CheckCircle2, Clock, Download, ExternalLink, Eye, FileText, Star, Trash2, XCircle } from 'lucide-react';
import { Application, InterviewSlot, MyOpportunities, MyOpportunityItem, Opportunity, StudentInterview, User } from '../../types';
import { downloadApplicationFile, apiFetch, downloadProtectedFile } from '../../api';
import { interviewBadge, interviewLabel } from '../../lib/applicationStatus';

function formatDateTime(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

// Student interview panel: schedule when invited, show details when scheduled.
function InterviewPanel({ interview, onChanged }: { interview: StudentInterview; onChanged: () => void }) {
  const [slots, setSlots] = useState<InterviewSlot[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadSlots = async () => {
    setPicking(true);
    try {
      const res = await apiFetch(`/api/opportunities/${encodeURIComponent(interview.opportunityId)}/interview-slots`);
      if (res.ok) { const json = await res.json(); setSlots(Array.isArray(json.slots) ? json.slots : []); }
    } catch { setSlots([]); }
  };

  const choose = async (slotId: string) => {
    setBusy(true);
    try {
      const res = await apiFetch(`/api/student/interviews/${encodeURIComponent(interview.id)}/schedule`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slotId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to schedule');
      setPicking(false);
      onChanged();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to schedule'); }
    finally { setBusy(false); }
  };

  if (interview.status === 'completed' || interview.status === 'cancelled') {
    return (
      <div className="border-t border-zinc-100 px-6 py-3 flex items-center gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${interviewBadge(interview.status)}`}>{interviewLabel(interview.status)}</span>
      </div>
    );
  }

  if (interview.status === 'scheduled') {
    return (
      <div className="border-t border-zinc-100 px-6 py-4 bg-zinc-50">
        <div className="flex items-center gap-2 mb-1.5">
          <CalendarClock size={14} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-800">Interview scheduled</span>
        </div>
        <p className="text-sm text-zinc-700">{formatDateTime(interview.startTime)}</p>
        {interview.location && <p className="text-xs text-zinc-500 mt-0.5">{interview.location}</p>}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {interview.meetingLink && <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:underline"><ExternalLink size={12} /> Join meeting</a>}
          <button onClick={() => downloadProtectedFile(`/api/interviews/${encodeURIComponent(interview.id)}/calendar.ics`, 'interview.ics').catch(e => alert(e.message))} className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:underline"><Download size={12} /> Add to calendar</button>
        </div>
      </div>
    );
  }

  // invited
  return (
    <div className="border-t border-zinc-100 px-6 py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700"><CalendarPlus size={14} /> You're invited to an interview</span>
        {!picking && <button onClick={loadSlots} className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition-colors">Schedule interview</button>}
      </div>
      {picking && (
        <div className="mt-3 space-y-2">
          {slots === null ? <p className="text-xs text-zinc-400">Loading slots…</p>
            : slots.length === 0 ? <p className="text-xs text-zinc-400">No available slots yet. Check back soon.</p>
            : slots.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-800">{formatDateTime(s.startTime)}</p>
                  {(s.location || s.meetingLink) && <p className="text-xs text-zinc-500 truncate">{s.location || 'Online meeting'}</p>}
                </div>
                <button onClick={() => choose(s.id)} disabled={busy} className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-black disabled:opacity-50 flex-shrink-0">Choose</button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

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

type StatusCfg = { icon: typeof Clock; label: string; bg: string; text: string; border: string; bar: string };

const STATUS_CONFIG: Record<string, StatusCfg> = {
  new: { icon: Clock, label: 'Submitted', bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-200', bar: 'bg-zinc-300' },
  pending: { icon: Clock, label: 'Submitted', bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-200', bar: 'bg-zinc-300' },
  under_review: { icon: Eye, label: 'Under review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-400' },
  shortlisted: { icon: Star, label: 'Shortlisted', bg: 'bg-zinc-900', text: 'text-white', border: 'border-zinc-900', bar: 'bg-zinc-900' },
  accepted: { icon: CheckCircle2, label: 'Accepted', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  rejected: { icon: XCircle, label: 'Rejected', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', bar: 'bg-red-500' },
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 hover:border-zinc-900 transition-colors font-medium"
              >
                <FileText size={12} />
                CV - {app.cvFile.name}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => downloadApplicationFile(app.id, 'cv', app.cvFile?.name || 'cv.pdf').catch(err => alert(err.message))}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 hover:border-zinc-900 transition-colors font-medium"
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 hover:border-zinc-900 transition-colors font-medium"
              >
                <FileText size={12} />
                Transcript - {app.transcriptFile.name}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => downloadApplicationFile(app.id, 'transcript', app.transcriptFile?.name || 'transcript.pdf').catch(err => alert(err.message))}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 hover:border-zinc-900 transition-colors font-medium"
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
  const [interviews, setInterviews] = useState<StudentInterview[]>([]);
  const activeItems = myOpportunities[activeTab] || [];
  const studentApps = applications.filter(a => a.studentId === currentUser.id);
  const total = TABS.reduce((sum, tab) => sum + (myOpportunities[tab.key]?.length || 0), 0);

  const loadInterviews = async () => {
    try {
      const res = await apiFetch('/api/student/interviews');
      if (res.ok) {
        const json = await res.json();
        setInterviews(Array.isArray(json.interviews) ? json.interviews : []);
      }
    } catch { /* ignore */ }
  };
  useEffect(() => { loadInterviews(); }, []);
  const interviewForOpp = (oppId: string) => interviews.find(i => i.opportunityId === oppId);

  const renderSavedCard = (item: MyOpportunityItem) => (
    <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {item.opportunity.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
                {tag}
              </span>
            ))}
          </div>
          <button className="font-display text-[1.05rem] text-zinc-900 hover:underline decoration-zinc-300 underline-offset-4 transition-colors text-left leading-snug" onClick={() => onViewOpportunity(item.opportunity)}>
            {item.opportunity.title}
          </button>
          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{item.opportunity.description}</p>
          <p className="text-xs text-gray-400 mt-2">
            {item.opportunity.author.name} · Deadline {item.opportunity.deadline}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:flex-shrink-0">
          <button type="button" onClick={() => onViewOpportunity(item.opportunity)} className="px-3 py-2 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-semibold hover:bg-zinc-200 transition-colors">
            View
          </button>
          <button type="button" onClick={() => onApplyOpportunity(item.opportunity)} className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition-colors">
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
    const status = app?.status || 'new';
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
    const StatusIcon = cfg.icon;

    return (
      <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className={`h-1 ${cfg.bar}`} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <button className="font-display text-[1.05rem] text-zinc-900 hover:underline decoration-zinc-300 underline-offset-4 transition-colors text-left leading-snug" onClick={() => onViewOpportunity(item.opportunity)}>
                {item.opportunity.title}
              </button>
              <p className="text-xs text-zinc-400 mt-0.5">
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
        ) : status === 'shortlisted' ? (
          <div className="border-t border-zinc-100 px-6 py-3 bg-zinc-50">
            <p className="text-xs text-zinc-700 font-medium">Your application has been shortlisted.</p>
          </div>
        ) : status === 'under_review' ? (
          <div className="border-t px-6 py-3">
            <p className="text-xs text-gray-400 italic">Your application is under review.</p>
          </div>
        ) : (status === 'new' || status === 'pending') ? (
          <div className="border-t px-6 py-3">
            <p className="text-xs text-gray-400 italic">Submitted — waiting for the professor to review.</p>
          </div>
        ) : null}

        {(() => {
          const iv = interviewForOpp(item.opportunity.id);
          return iv && iv.status !== 'none' ? <InterviewPanel interview={iv} onChanged={loadInterviews} /> : null;
        })()}
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
        <div className="flex items-center gap-2 mb-1.5">
          <span className="signal-dot" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Your activity</span>
        </div>
        <h1 className="font-display text-[2rem] leading-tight text-zinc-900">My Opportunities</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Saved opportunities and application decisions in one place.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-1.5 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            {tab.label} <span className={activeTab === tab.key ? 'text-white/60' : 'text-zinc-400'}>({myOpportunities[tab.key]?.length || 0})</span>
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
