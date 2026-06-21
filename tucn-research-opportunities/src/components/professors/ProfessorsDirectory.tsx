import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, FlaskConical, Users } from 'lucide-react';
import { ProfessorSummary } from '../../types';
import { apiFetch } from '../../api';

interface Props {
  onOpenProfessor: (id: string) => void;
}

export default function ProfessorsDirectory({ onOpenProfessor }: Props) {
  const [professors, setProfessors] = useState<ProfessorSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/professors');
        if (res.ok) {
          const json = await res.json();
          setProfessors(Array.isArray(json.professors) ? json.professors : []);
        }
      } catch { /* leave empty */ }
      setLoading(false);
    })();
  }, []);

  return (
    <motion.div
      key="professors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <section className="relative overflow-hidden rounded-2xl bg-utcn-navy text-white mb-6">
        <div className="absolute inset-0 research-grid-dark research-fade opacity-70" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-utcn-red/70 to-transparent" aria-hidden="true" />
        <div className="relative px-6 sm:px-10 py-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="signal-dot" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">AIRi@UTCN · Faculty network</span>
          </div>
          <h1 className="font-display text-3xl sm:text-[2.5rem] leading-[1.05]">Professors &amp; Research Groups</h1>
          <p className="mt-3 text-sm sm:text-base text-white/65 max-w-xl leading-relaxed">
            Explore approved faculty mentors, their research interests, and the opportunities they are recruiting for.
          </p>
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading professors…</p>
      ) : professors.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-zinc-200/80">
          <Users className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
          <h3 className="text-base font-semibold text-zinc-800">No professors are listed yet</h3>
          <p className="mt-1 text-sm text-zinc-400">Approved professors will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {professors.map(prof => (
            <button
              key={prof.id}
              onClick={() => onOpenProfessor(prof.id)}
              className="group text-left bg-white rounded-2xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-zinc-900/30 hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.18)] transition-all p-5"
            >
              <div className="flex items-start gap-3">
                <img src={prof.avatar} alt={prof.name} referrerPolicy="no-referrer" className="w-12 h-12 rounded-full object-cover ring-1 ring-zinc-200 grayscale flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-lg text-zinc-900 truncate">{prof.name}</h2>
                    <ArrowUpRight size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors flex-shrink-0" />
                  </div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wide truncate">{prof.department || '—'}</p>
                </div>
              </div>
              {prof.labName && (
                <p className="mt-3 text-xs text-zinc-500 flex items-center gap-1.5"><FlaskConical size={12} /> {prof.labName}</p>
              )}
              {prof.researchInterests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {prof.researchInterests.slice(0, 3).map(t => (
                    <span key={t} className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">{t}</span>
                  ))}
                </div>
              )}
              <p className="mt-4 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
                <span className="font-semibold text-zinc-900">{prof.activeOpportunityCount}</span> active opportunit{prof.activeOpportunityCount === 1 ? 'y' : 'ies'}
              </p>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
