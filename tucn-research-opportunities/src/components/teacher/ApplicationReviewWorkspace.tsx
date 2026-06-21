import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, Download, X, FileText, Star, Eye, Clock, Check, ThumbsDown, ExternalLink, Users } from 'lucide-react';
import { ReviewApplication } from '../../types';
import { apiFetch, downloadApplicationFile, downloadProtectedFile } from '../../api';
import { statusLabel, statusBadge } from '../../lib/applicationStatus';

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

export default function ApplicationReviewWorkspace({ onBack }: Props) {
  const [applications, setApplications] = useState<ReviewApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [opportunityFilter, setOpportunityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  const load = async () => {
    try {
      const res = await apiFetch('/api/professor/applications');
      if (res.ok) {
        const json = await res.json();
        setApplications(Array.isArray(json.applications) ? json.applications : []);
      }
    } catch { /* keep */ }
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); }, []);

  const opportunities = useMemo(() => {
    const map = new Map<string, string>();
    applications.forEach(a => map.set(a.opportunityId, a.opportunityTitle));
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [applications]);

  const stats = useMemo(() => {
    const s = { total: applications.length, new: 0, under_review: 0, shortlisted: 0, accepted: 0, rejected: 0 } as Record<string, number>;
    applications.forEach(a => { s[a.status] = (s[a.status] || 0) + 1; });
    return s;
  }, [applications]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = applications.filter(a => {
      if (opportunityFilter !== 'all' && a.opportunityId !== opportunityFilter) return false;
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
  }, [applications, opportunityFilter, statusFilter, search, sort]);

  const selected = applications.find(a => a.id === selectedId) || null;

  const openDrawer = (app: ReviewApplication) => {
    setSelectedId(app.id);
    setNotesDraft(app.professorNotes || '');
    setSavedFlash(false);
  };

  const saveReview = async (id: string, patch: Record<string, unknown>) => {
    setSavingId(id);
    try {
      const res = await apiFetch(`/api/professor/applications/${encodeURIComponent(id)}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      setApplications(prev => prev.map(a => a.id === id ? json.application : a));
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1800);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingId(null);
    }
  };

  const exportCsv = async () => {
    const params = new URLSearchParams();
    if (opportunityFilter !== 'all') params.set('opportunityId', opportunityFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const query = params.toString();
    try {
      await downloadProtectedFile(`/api/professor/applications/export${query ? `?${query}` : ''}`, 'applications-export.csv');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const StatusActions = ({ app }: { app: ReviewApplication }) => {
    const btn = (label: string, status: string, icon: ReactNode, active: boolean) => (
      <button
        onClick={() => saveReview(app.id, { status })}
        disabled={savingId === app.id}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
          active ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-900'
        }`}
      >
        {icon} {label}
      </button>
    );
    return (
      <div className="flex flex-wrap gap-2">
        {btn('Under review', 'under_review', <Eye size={13} />, app.status === 'under_review')}
        {btn('Shortlist', 'shortlisted', <Star size={13} />, app.status === 'shortlisted')}
        {btn('Accept', 'accepted', <Check size={13} />, app.status === 'accepted')}
        {btn('Reject', 'rejected', <ThumbsDown size={13} />, app.status === 'rejected')}
      </div>
    );
  };

  return (
    <motion.div key="review-workspace" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto">
      <nav className="mb-5">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
        </button>
      </nav>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="signal-dot" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Review workspace</span>
          </div>
          <h1 className="font-display text-[2rem] leading-tight text-zinc-900">Applications</h1>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold hover:border-zinc-900 transition-colors flex-shrink-0">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {([['Total', 'total'], ['New', 'new'], ['Under review', 'under_review'], ['Shortlisted', 'shortlisted'], ['Accepted', 'accepted'], ['Rejected', 'rejected']] as const).map(([label, key]) => (
          <div key={key} className="bg-white rounded-xl border border-zinc-200/80 shadow-sm p-3.5">
            <div className="font-display text-2xl text-zinc-900 leading-none tabular-nums">{stats[key] || 0}</div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 mt-1.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-3 mb-5 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name or email…"
            aria-label="Search applicants"
            className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
          />
        </div>
        <select value={opportunityFilter} onChange={e => setOpportunityFilter(e.target.value)} aria-label="Filter by opportunity" className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900">
          <option value="all">All opportunities</option>
          {opportunities.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} aria-label="Filter by status" className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900">
          {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : statusLabel(s)}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as SortKey)} aria-label="Sort applications" className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900">
          <option value="newest">Newest</option>
          <option value="status">Status</option>
          <option value="score">Score</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-zinc-400">Loading applications…</p>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-zinc-200/80">
          <Users className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
          <h3 className="text-base font-semibold text-zinc-800">No applications match your filters</h3>
          <p className="mt-1 text-sm text-zinc-400">{applications.length === 0 ? 'Applications to your opportunities will appear here.' : 'Try clearing filters or search.'}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map(app => (
            <button key={app.id} onClick={() => openDrawer(app)} className="w-full text-left bg-white rounded-xl border border-zinc-200/80 shadow-sm hover:border-zinc-900/30 transition-colors p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-zinc-900 truncate">{app.studentName}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge(app.status)}`}>{statusLabel(app.status)}</span>
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{app.opportunityTitle} · {formatDate(app.submittedAt)}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {app.score != null && <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700"><Star size={12} className="text-zinc-400" /> {app.score}/5</span>}
                <span className="text-xs font-semibold text-zinc-500">Review →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail drawer */}
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
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge(selected.status)}`}>{statusLabel(selected.status)}</span>
                <p className="text-xs text-zinc-400 mt-2">{selected.opportunityTitle} · Submitted {formatDate(selected.submittedAt)}</p>
              </div>

              {(selected.studentLinkedin || selected.studentInterests.length > 0 || selected.studentSkills.length > 0) && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Applicant</h3>
                  {selected.studentLinkedin && (
                    <a href={selected.studentLinkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-zinc-700 hover:text-zinc-900 hover:underline mb-2"><ExternalLink size={13} /> LinkedIn</a>
                  )}
                  {selected.studentInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selected.studentInterests.map(t => <span key={t} className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">{t}</span>)}
                    </div>
                  )}
                  {selected.studentSkills.length > 0 && (
                    <p className="text-xs text-zinc-500 mt-2">Skills: {selected.studentSkills.join(', ')}</p>
                  )}
                </section>
              )}

              {(selected.cvFile || selected.transcriptFile) && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Documents</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.cvFile && (
                      <button onClick={() => downloadApplicationFile(selected.id, 'cv', selected.cvFile?.name || 'cv.pdf').catch(e => alert(e.message))} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 hover:border-zinc-900 font-medium"><FileText size={12} /> CV</button>
                    )}
                    {selected.transcriptFile && (
                      <button onClick={() => downloadApplicationFile(selected.id, 'transcript', selected.transcriptFile?.name || 'transcript.pdf').catch(e => alert(e.message))} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 hover:border-zinc-900 font-medium"><FileText size={12} /> Transcript</button>
                    )}
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
                  <div className="space-y-3">
                    {selected.answers.map(a => (
                      <div key={a.fieldId}>
                        <p className="text-xs font-semibold text-zinc-700">{a.question}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{a.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Score */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Score</h3>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => saveReview(selected.id, { score: selected.score === n ? null : n })}
                      disabled={savingId === selected.id}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold border transition-colors disabled:opacity-50 ${
                        (selected.score ?? 0) >= n ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-900'
                      }`}
                      aria-label={`Set score ${n}`}
                    >
                      {n}
                    </button>
                  ))}
                  {selected.score != null && <span className="text-xs text-zinc-400 ml-1">Tap again to clear</span>}
                </div>
              </section>

              {/* Notes */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Private notes <span className="normal-case font-normal text-zinc-400">(only you can see these)</span></h3>
                <textarea
                  value={notesDraft}
                  onChange={e => setNotesDraft(e.target.value)}
                  rows={3}
                  placeholder="Add private notes about this applicant…"
                  className="w-full text-sm text-zinc-800 border border-zinc-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={() => saveReview(selected.id, { professorNotes: notesDraft })} disabled={savingId === selected.id} className="px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-black disabled:opacity-50">Save notes</button>
                  {savedFlash && <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><Check size={12} /> Saved</span>}
                </div>
              </section>

              {/* Status actions */}
              <section className="border-t border-zinc-100 pt-5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5"><Clock size={12} /> Decision</h3>
                <StatusActions app={selected} />
              </section>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
