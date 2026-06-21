import { useEffect, useState } from 'react';
import { MessageSquare, Lock, Eye, Send, CheckCircle2, Clock, LogIn } from 'lucide-react';
import { OpportunityQuestion, User } from '../../types';
import { apiFetch } from '../../api';

interface Props {
  opportunityId: string;
  currentUser: User | null;
  onSignInToAsk: () => void;
}

const MAX_QUESTION = 1000;

function formatDate(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

function askerLabel(q: OpportunityQuestion) {
  if (q.isOwnQuestion) return 'You';
  if (q.studentName) return q.studentName;
  return 'A student';
}

export default function OpportunityQA({ opportunityId, currentUser, onSignInToAsk }: Props) {
  const [questions, setQuestions] = useState<OpportunityQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isStudent = currentUser?.role === 'student';

  const load = async () => {
    try {
      const res = await apiFetch(`/api/opportunities/${encodeURIComponent(opportunityId)}/questions`);
      if (res.ok) {
        const json = await res.json();
        setQuestions(Array.isArray(json.questions) ? json.questions : []);
      }
    } catch { /* leave list as-is */ }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId]);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) { setError('Please write a question first.'); return; }
    if (trimmed.length > MAX_QUESTION) { setError(`Questions must be under ${MAX_QUESTION} characters.`); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch(`/api/opportunities/${encodeURIComponent(opportunityId)}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: trimmed, isPublic }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to send question');
      setQuestions(prev => [json.question, ...prev]);
      setText('');
      setIsPublic(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send question');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 p-7 md:p-9">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="signal-dot" aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Ask before applying</span>
      </div>
      <h2 className="font-display text-xl text-zinc-900 flex items-center gap-2">
        <MessageSquare size={18} className="text-zinc-400" />
        Questions about this opportunity
      </h2>

      {/* Ask form / sign-in prompt */}
      <div className="mt-5">
        {!currentUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5">
            <p className="text-sm text-zinc-600">Sign in to ask the professor a question before you apply.</p>
            <button
              onClick={onSignInToAsk}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-black transition-colors flex-shrink-0"
            >
              <LogIn size={15} /> Sign in to ask a question
            </button>
          </div>
        ) : isStudent ? (
          <div className="rounded-xl border border-zinc-200 p-4">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              maxLength={MAX_QUESTION}
              placeholder="Ask a question before applying…"
              aria-label="Your question"
              className="w-full text-sm text-zinc-800 placeholder:text-zinc-400 outline-none resize-none"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-zinc-100">
              <label className="inline-flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                Allow this question to be shown anonymously to other students if answered
              </label>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] text-zinc-400 tabular-nums">{text.length}/{MAX_QUESTION}</span>
                <button
                  onClick={submit}
                  disabled={submitting || !text.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-black disabled:opacity-40 transition-colors"
                >
                  <Send size={14} /> {submitting ? 'Sending…' : 'Send question'}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1.5">
              {isPublic
                ? <><Eye size={12} /> This question will be shown anonymously if answered.</>
                : <><Lock size={12} /> Only you and the professor can see this question.</>}
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            {currentUser.role === 'professor'
              ? 'You can reply to questions from your dashboard. Questions for opportunities you own are listed below.'
              : 'Public answered questions appear below.'}
          </p>
        )}
      </div>

      {/* Questions list */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-zinc-400">Loading questions…</p>
        ) : questions.length === 0 ? (
          <p className="text-sm text-zinc-400">No questions yet. {isStudent ? 'Be the first to ask.' : ''}</p>
        ) : (
          questions.map(q => (
            <article key={q.id} className="rounded-xl border border-zinc-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-zinc-800 leading-relaxed">{q.questionText}</p>
                {q.status === 'answered' ? (
                  <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} /> Answered
                  </span>
                ) : (
                  <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    <Clock size={11} /> Waiting for reply
                  </span>
                )}
              </div>
              <div className="mt-1.5 text-[11px] text-zinc-400 flex items-center gap-2 flex-wrap">
                <span className="font-medium text-zinc-500">{askerLabel(q)}</span>
                {q.createdAt && <span>· {formatDate(q.createdAt)}</span>}
                {q.isOwnQuestion && (
                  <span className="inline-flex items-center gap-1">
                    · {q.isPublic ? <><Eye size={11} /> Public if answered</> : <><Lock size={11} /> Private</>}
                  </span>
                )}
              </div>

              {q.answerText && (
                <div className="mt-3 pl-3 border-l-2 border-zinc-900/70">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-2">
                    Professor reply {q.answeredAt && <span className="font-normal normal-case tracking-normal text-zinc-400">· {formatDate(q.answeredAt)}</span>}
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed">{q.answerText}</p>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
