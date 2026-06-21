import { useEffect, useState } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, Pencil } from 'lucide-react';
import { OpportunityQuestion } from '../../types';
import { apiFetch } from '../../api';

const MAX_ANSWER = 2000;

function formatDate(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

export default function ProfessorQuestions() {
  const [questions, setQuestions] = useState<OpportunityQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await apiFetch('/api/professor/questions');
      if (res.ok) {
        const json = await res.json();
        setQuestions(Array.isArray(json.questions) ? json.questions : []);
      }
    } catch { /* keep current */ }
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); }, []);

  const submitAnswer = async (q: OpportunityQuestion) => {
    const answerText = (drafts[q.id] ?? '').trim();
    if (!answerText) return;
    setBusyId(q.id);
    try {
      const res = await apiFetch(`/api/opportunity-questions/${encodeURIComponent(q.id)}/answer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerText }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to send reply');
      setQuestions(prev => prev.map(item => item.id === q.id ? json.question : item));
      setEditing(prev => { const next = new Set(prev); next.delete(q.id); return next; });
      setDrafts(prev => { const next = { ...prev }; delete next[q.id]; return next; });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (q: OpportunityQuestion) => {
    setDrafts(prev => ({ ...prev, [q.id]: q.answerText || '' }));
    setEditing(prev => new Set(prev).add(q.id));
  };

  const openCount = questions.filter(q => q.status === 'open').length;

  return (
    <section className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
          <MessageSquare size={14} /> Questions
        </h2>
        {openCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
            <span className="signal-dot" aria-hidden="true" /> {openCount} awaiting reply
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading questions…</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-zinc-400">No questions yet for your opportunities.</p>
      ) : (
        <div className="space-y-3">
          {questions.map(q => {
            const isEditing = editing.has(q.id);
            const showForm = q.status === 'open' || isEditing;
            return (
              <article key={q.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold truncate">{q.opportunityTitle || 'Opportunity'}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {q.studentName || 'A student'}{q.createdAt && <> · {formatDate(q.createdAt)}</>}
                      {q.isPublic && <span className="ml-1.5 text-zinc-400">· public if answered</span>}
                    </div>
                  </div>
                  {q.status === 'answered' ? (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={11} /> Answered
                    </span>
                  ) : (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Clock size={11} /> Open
                    </span>
                  )}
                </div>

                <p className="text-sm text-zinc-800 leading-relaxed">{q.questionText}</p>

                {q.answerText && !isEditing && (
                  <div className="mt-3 pl-3 border-l-2 border-zinc-900/70">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center justify-between">
                      <span>Your reply {q.answeredAt && <span className="font-normal normal-case tracking-normal">· {formatDate(q.answeredAt)}</span>}</span>
                      <button onClick={() => startEdit(q)} className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 font-semibold normal-case tracking-normal">
                        <Pencil size={11} /> Edit
                      </button>
                    </div>
                    <p className="text-sm text-zinc-700 leading-relaxed">{q.answerText}</p>
                  </div>
                )}

                {showForm && (
                  <div className="mt-3">
                    <textarea
                      value={drafts[q.id] ?? ''}
                      onChange={e => setDrafts(prev => ({ ...prev, [q.id]: e.target.value }))}
                      rows={2}
                      maxLength={MAX_ANSWER}
                      placeholder="Write a reply to the student…"
                      aria-label="Your reply"
                      className="w-full text-sm text-zinc-800 placeholder:text-zinc-400 border border-zinc-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                    />
                    <div className="flex items-center justify-end gap-2 mt-2">
                      {isEditing && (
                        <button
                          onClick={() => setEditing(prev => { const next = new Set(prev); next.delete(q.id); return next; })}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => submitAnswer(q)}
                        disabled={busyId === q.id || !(drafts[q.id] ?? '').trim()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-black disabled:opacity-40 transition-colors"
                      >
                        <Send size={12} /> {busyId === q.id ? 'Sending…' : isEditing ? 'Save reply' : 'Reply'}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
