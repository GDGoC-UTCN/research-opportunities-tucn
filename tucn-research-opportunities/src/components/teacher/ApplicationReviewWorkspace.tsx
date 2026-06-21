import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, Download, X, FileText, Star, Eye, Clock, Check, ThumbsDown, ExternalLink, Users, CalendarPlus, CalendarClock, Trash2, Plus } from 'lucide-react';
import { GroupedOpportunity, ReviewApplication, InterviewSlot } from '../../types';
import { apiFetch, downloadApplicationFile, downloadProtectedFile } from '../../api';
import { statusLabel, statusBadge, interviewLabel, interviewBadge } from '../../lib/applicationStatus';

interface Props {
  onBack: () => void;
}

const STATUS_FILTERS = ['all', 'new', 'under_review', 'shortlisted', 'accepted', 'rejected'] as const;
type SortKey = 'newest' | 'status' | 'score';
const STATUS_ORDER: Record<string, number> = { new: 0, under_review: 1, shortlisted: 2, accepted: 3, rejected: 4 };

function formatDate(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}
function formatDateTime(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ApplicationReviewWorkspace({ onBack }: Props) {
  const [groups, setGroups] = useState<GroupedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [openOppId, setOpenOppId] = useState<string | null>(null);

  const loadGrouped = async () => {
    try {
      const res = await apiFetch('/api/professor/applications/grouped');
      if (res.ok) {
        const json = await res.json();
        setGroups(Array.isArray(json.opportunities) ? json.opportunities : []);
      }
    } catch { /* keep */ }
    setLoading(false);
  };

  useEffect(() => { setLoading(true); loadGrouped(); }, []);

  const openGroup = groups.find(g => g.id === openOppId) || null;

  return (
    <motion.div key="review-workspace" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto">
      <nav className="mb-5">
        <button onClick={openOppId ? () => setOpenOppId(null) : onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> {openOppId ? 'All opportunities' : 'Back to Dashboard'}
        </button>
      </nav>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="signal-dot" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Review workspace</span>
        </div>
        <h1 className="font-display text-[2rem] leading-tight text-zinc-900">{openGroup ? openGroup.title : 'Applications by opportunity'}</h1>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading applications…</p>
      ) : openGroup ? (
        <OpportunityReview group={openGroup} onChanged={loadGrouped} />
      ) : groups.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-zinc-200/80">
          <Users className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
          <h3 className="text-base font-semibold text-zinc-800">No opportunities yet</h3>
          <p className="mt-1 text-sm text-zinc-400">Publish an opportunity to start receiving applications.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map(g => (
            <div key={g.id} className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-5 flex flex-col">
              <h2 className="font-display text-lg text-zinc-900 leading-snug">{g.title}</h2>
              <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                {([['Total', g.stats.total], ['New', g.stats.new], ['Under review', g.stats.under_review], ['Shortlisted', g.stats.shortlisted], ['Accepted', g.stats.accepted], ['Rejected', g.stats.rejected], ['Interviews', g.stats.interviews_scheduled]] as const).map(([label, n]) => (
                  <span key={label} className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">{label} {n}</span>
                ))}
              </div>
              <button onClick={() => setOpenOppId(g.id)} className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-black transition-colors">
                Review applicants ({g.stats.total})
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Single-opportunity review (applicants + interview availability) ────────
function OpportunityReview({ group, onChanged }: { group: GroupedOpportunity; onChanged: () => void }) {
  const [applications, setApplications] = useState<ReviewApplication[]>(group.applications);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [feedbackDraft, setFeedbackDraft] = useState('');

  useEffect(() => { setApplications(group.applications); }, [group]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = applications.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (term && !(`${a.studentName} ${a.studentEmail}`.toLowerCase().includes(term))) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'score') return (b.score ?? -1) - (a.score ?? -1);
      if (sort === 'status') return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      return new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime();
    });
    return list;
  }, [applications, statusFilter, search, sort]);

  const selected = applications.find(a => a.id === selectedId) || null;

  const openDrawer = (app: ReviewApplication) => {
    setSelectedId(app.id);
    setNotesDraft(app.professorNotes || '');
    setFeedbackDraft(app.interview?.feedback || '');
  };

  const patchLocal = (id: string, partial: Partial<ReviewApplication>) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, ...partial } : a));
  };

  const saveReview = async (id: string, patch: Record<string, unknown>) => {
    setSavingId(id);
    try {
      const res = await apiFetch(`/api/professor/applications/${encodeURIComponent(id)}/review`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      patchLocal(id, json.application);
      onChanged();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to save'); }
    finally { setSavingId(null); }
  };

  const invite = async (app: ReviewApplication) => {
    setSavingId(app.id);
    try {
      const res = await apiFetch(`/api/professor/applications/${encodeURIComponent(app.id)}/interview-invite`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to invite');
      patchLocal(app.id, { interview: json.interview });
      onChanged();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to invite'); }
    finally { setSavingId(null); }
  };

  const updateInterview = async (app: ReviewApplication, patch: Record<string, unknown>) => {
    if (!app.interview?.id) return;
    setSavingId(app.id);
    try {
      const res = await apiFetch(`/api/professor/interviews/${encodeURIComponent(app.interview.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to update interview');
      patchLocal(app.id, { interview: { ...app.interview, ...json.interview } });
      onChanged();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to update interview'); }
    finally { setSavingId(null); }
  };

  const exportCsv = async () => {
    try { await downloadProtectedFile(`/api/professor/applications/export?opportunityId=${encodeURIComponent(group.id)}`, 'applications-export.csv'); }
    catch (err) { alert(err instanceof Error ? err.message : 'Export failed'); }
  };

  return (
    <div className="space-y-6">
      <InterviewAvailability opportunityId={group.id} />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Applicants ({applications.length})</h2>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-xs font-semibold hover:border-zinc-900 transition-colors">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…" aria-label="Search applicants" className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} aria-label="Filter by status" className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900">
          {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : statusLabel(s)}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as SortKey)} aria-label="Sort" className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900">
          <option value="newest">Newest</option>
          <option value="status">Status</option>
          <option value="score">Score</option>
        </select>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-zinc-200/80">
          <Users className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
          <p className="text-sm text-zinc-500">{applications.length === 0 ? 'No applicants yet.' : 'No applicants match your filters.'}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map(app => (
            <button key={app.id} onClick={() => openDrawer(app)} className="w-full text-left bg-white rounded-xl border border-zinc-200/80 shadow-sm hover:border-zinc-900/30 transition-colors p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-zinc-900 truncate">{app.studentName}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge(app.status)}`}>{statusLabel(app.status)}</span>
                  {app.interview && app.interview.status !== 'none' && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${interviewBadge(app.interview.status)}`}>{interviewLabel(app.interview.status)}</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{formatDate(app.submittedAt)}{app.interview?.status === 'scheduled' && app.interview.startTime ? ` · Interview ${formatDateTime(app.interview.startTime)}` : ''}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {app.score != null && <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700"><Star size={12} className="text-zinc-400" /> {app.score}/5</span>}
                <span className="text-xs font-semibold text-zinc-500">Review →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedId(null)} aria-hidden="true" />
          <div className="relative ml-auto w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="font-display text-lg text-zinc-900 truncate">{selected.studentName}</h2>
                <p className="text-xs text-zinc-500 truncate">{selected.studentEmail}</p>
              </div>
              <button onClick={() => setSelectedId(null)} aria-label="Close" className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge(selected.status)}`}>{statusLabel(selected.status)}</span>
                {selected.interview && selected.interview.status !== 'none' && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${interviewBadge(selected.interview.status)}`}>{interviewLabel(selected.interview.status)}</span>
                )}
              </div>

              {(selected.studentLinkedin || selected.studentInterests.length > 0 || selected.studentSkills.length > 0) && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Applicant</h3>
                  {selected.studentLinkedin && <a href={selected.studentLinkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-zinc-700 hover:text-zinc-900 hover:underline mb-2"><ExternalLink size={13} /> LinkedIn</a>}
                  {selected.studentInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">{selected.studentInterests.map(t => <span key={t} className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">{t}</span>)}</div>
                  )}
                  {selected.studentSkills.length > 0 && <p className="text-xs text-zinc-500 mt-2">Skills: {selected.studentSkills.join(', ')}</p>}
                </section>
              )}

              {(selected.cvFile || selected.transcriptFile) && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Documents</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.cvFile && <button onClick={() => downloadApplicationFile(selected.id, 'cv', selected.cvFile?.name || 'cv.pdf').catch(e => alert(e.message))} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 hover:border-zinc-900 font-medium"><FileText size={12} /> CV</button>}
                    {selected.transcriptFile && <button onClick={() => downloadApplicationFile(selected.id, 'transcript', selected.transcriptFile?.name || 'transcript.pdf').catch(e => alert(e.message))} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 hover:border-zinc-900 font-medium"><FileText size={12} /> Transcript</button>}
                  </div>
                </section>
              )}

              {selected.message && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Message</h3>
                  <p className="text-sm text-zinc-700 italic bg-zinc-50 border-l-2 border-zinc-200 rounded-r-lg px-3 py-2">"{selected.message}"</p>
                </section>
              )}

              {selected.answers.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Answers</h3>
                  <div className="space-y-3">{selected.answers.map(a => (
                    <div key={a.fieldId}><p className="text-xs font-semibold text-zinc-700">{a.question}</p><p className="text-xs text-zinc-500 mt-0.5">{a.answer}</p></div>
                  ))}</div>
                </section>
              )}

              {/* Score */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Score</h3>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => saveReview(selected.id, { score: selected.score === n ? null : n })} disabled={savingId === selected.id} className={`w-9 h-9 rounded-lg text-sm font-semibold border transition-colors disabled:opacity-50 ${(selected.score ?? 0) >= n ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-900'}`} aria-label={`Set score ${n}`}>{n}</button>
                  ))}
                </div>
              </section>

              {/* Notes */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Private notes <span className="normal-case font-normal text-zinc-400">(only you)</span></h3>
                <textarea value={notesDraft} onChange={e => setNotesDraft(e.target.value)} rows={3} placeholder="Private notes…" className="w-full text-sm text-zinc-800 border border-zinc-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-zinc-900 resize-none" />
                <button onClick={() => saveReview(selected.id, { professorNotes: notesDraft })} disabled={savingId === selected.id} className="mt-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-black disabled:opacity-50">Save notes</button>
              </section>

              {/* Interview */}
              <section className="border-t border-zinc-100 pt-5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5"><CalendarClock size={12} /> Interview</h3>
                {(!selected.interview || selected.interview.status === 'none' || selected.interview.status === 'cancelled') ? (
                  ['shortlisted', 'under_review'].includes(selected.status) ? (
                    <button onClick={() => invite(selected)} disabled={savingId === selected.id} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-black disabled:opacity-50"><CalendarPlus size={13} /> Invite to interview</button>
                  ) : (
                    <p className="text-xs text-zinc-400">Shortlist or move to under review to invite for an interview.</p>
                  )
                ) : (
                  <div className="space-y-3">
                    {selected.interview.status === 'invited' && <p className="text-xs text-zinc-500">Invited — waiting for the student to choose a slot.</p>}
                    {selected.interview.startTime && (
                      <div className="text-sm text-zinc-700">
                        <p className="font-medium">{formatDateTime(selected.interview.startTime)}</p>
                        {selected.interview.location && <p className="text-xs text-zinc-500">{selected.interview.location}</p>}
                        {selected.interview.meetingLink && <a href={selected.interview.meetingLink} target="_blank" rel="noreferrer" className="text-xs text-zinc-700 hover:underline inline-flex items-center gap-1"><ExternalLink size={11} /> Meeting link</a>}
                      </div>
                    )}
                    {(selected.interview.status === 'scheduled' || selected.interview.status === 'completed') && (
                      <div>
                        <textarea value={feedbackDraft} onChange={e => setFeedbackDraft(e.target.value)} rows={2} placeholder="Private interview feedback…" className="w-full text-sm text-zinc-800 border border-zinc-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-zinc-900 resize-none" />
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateInterview(selected, { professorFeedback: feedbackDraft })} disabled={savingId === selected.id} className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 text-xs font-semibold hover:border-zinc-900 disabled:opacity-50">Save feedback</button>
                          {selected.interview.status === 'scheduled' && (
                            <button onClick={() => updateInterview(selected, { status: 'completed', professorFeedback: feedbackDraft })} disabled={savingId === selected.id} className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-black disabled:opacity-50">Mark completed</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Decision */}
              <section className="border-t border-zinc-100 pt-5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5"><Clock size={12} /> Decision</h3>
                <Decision app={selected} saving={savingId === selected.id} onSet={(status) => saveReview(selected.id, { status })} />
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Decision({ app, saving, onSet }: { app: ReviewApplication; saving: boolean; onSet: (status: string) => void }) {
  const btn = (label: string, status: string, icon: ReactNode) => (
    <button onClick={() => onSet(status)} disabled={saving} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${app.status === status ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-900'}`}>{icon} {label}</button>
  );
  return (
    <div className="flex flex-wrap gap-2">
      {btn('Under review', 'under_review', <Eye size={13} />)}
      {btn('Shortlist', 'shortlisted', <Star size={13} />)}
      {btn('Accept', 'accepted', <Check size={13} />)}
      {btn('Reject', 'rejected', <ThumbsDown size={13} />)}
    </div>
  );
}

// ── Interview availability management ─────────────────────────────────────
function InterviewAvailability({ opportunityId }: { opportunityId: string }) {
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await apiFetch(`/api/professor/opportunities/${encodeURIComponent(opportunityId)}/interview-slots`);
      if (res.ok) { const json = await res.json(); setSlots(Array.isArray(json.slots) ? json.slots : []); }
    } catch { /* keep */ }
    setLoading(false);
  };
  useEffect(() => { setLoading(true); load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [opportunityId]);

  const addSlot = async () => {
    setError('');
    if (!start || !end) { setError('Choose a start and end time.'); return; }
    setSaving(true);
    try {
      const res = await apiFetch(`/api/professor/opportunities/${encodeURIComponent(opportunityId)}/interview-slots`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime: new Date(start).toISOString(), endTime: new Date(end).toISOString(), location, meetingLink, capacity: Number(capacity) || 1 }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to add slot');
      setSlots(prev => [...prev, json.slot].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
      setStart(''); setEnd(''); setLocation(''); setMeetingLink(''); setCapacity('1'); setShowForm(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to add slot'); }
    finally { setSaving(false); }
  };

  const removeSlot = async (id: string) => {
    try {
      const res = await apiFetch(`/api/professor/interview-slots/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || 'Failed to delete'); }
      setSlots(prev => prev.filter(s => s.id !== id));
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete'); }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><CalendarClock size={14} /> Interview availability</h3>
        <button onClick={() => setShowForm(v => !v)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900"><Plus size={13} /> Add slot</button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-200 p-3 mb-3 grid sm:grid-cols-2 gap-2">
          <label className="text-xs text-zinc-600">Start<input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className="mt-1 w-full border border-zinc-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900" /></label>
          <label className="text-xs text-zinc-600">End<input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className="mt-1 w-full border border-zinc-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900" /></label>
          <label className="text-xs text-zinc-600">Location<input value={location} onChange={e => setLocation(e.target.value)} placeholder="Room / building" className="mt-1 w-full border border-zinc-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900" /></label>
          <label className="text-xs text-zinc-600">Meeting link<input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://…" className="mt-1 w-full border border-zinc-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900" /></label>
          <label className="text-xs text-zinc-600">Capacity<input type="number" min={1} value={capacity} onChange={e => setCapacity(e.target.value)} className="mt-1 w-full border border-zinc-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900" /></label>
          <div className="sm:col-span-2 flex items-center gap-2">
            <button onClick={addSlot} disabled={saving} className="px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-black disabled:opacity-50">{saving ? 'Adding…' : 'Add slot'}</button>
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Loading slots…</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-zinc-400">No interview slots yet. Add availability so shortlisted students can book.</p>
      ) : (
        <div className="space-y-2">
          {slots.map(s => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-800">{formatDateTime(s.startTime)} – {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-xs text-zinc-500 truncate">{s.location || s.meetingLink || 'No location set'} · {s.bookedCount}/{s.capacity} booked</p>
              </div>
              {s.bookedCount === 0 && (
                <button onClick={() => removeSlot(s.id)} aria-label="Delete slot" className="p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
