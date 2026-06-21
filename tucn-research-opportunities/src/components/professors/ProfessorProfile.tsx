import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, FlaskConical, Globe, Linkedin } from 'lucide-react';
import { ApplicationStatus, Opportunity, ProfessorProfile as ProfessorProfileType } from '../../types';
import { apiFetch } from '../../api';
import OpportunityCard from '../OpportunityCard';

interface Props {
  professorId: string;
  onBack: () => void;
  handleCardClick: (opp: Opportunity) => void;
  savedOpportunityIds: Set<string>;
  applicationStatusForOpportunity: (opportunityId: string) => ApplicationStatus | undefined;
  handleToggleSave: (opp: Opportunity) => void;
  handleShareOpportunity: (opp: Opportunity) => void;
}

export default function ProfessorProfile({
  professorId,
  onBack,
  handleCardClick,
  savedOpportunityIds,
  applicationStatusForOpportunity,
  handleToggleSave,
  handleShareOpportunity,
}: Props) {
  const [professor, setProfessor] = useState<ProfessorProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    (async () => {
      try {
        const res = await apiFetch(`/api/professors/${encodeURIComponent(professorId)}`);
        if (!res.ok) { setNotFound(true); setLoading(false); return; }
        const json = await res.json();
        setProfessor(json.professor);
      } catch { setNotFound(true); }
      setLoading(false);
    })();
  }, [professorId]);

  if (loading) return <p className="text-sm text-zinc-400">Loading professor…</p>;

  if (notFound || !professor) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-8 text-center">
        <h1 className="font-display text-xl text-zinc-900">Professor not found</h1>
        <p className="mt-2 text-sm text-zinc-500">This profile may be unavailable or the account is not approved.</p>
        <button onClick={onBack} className="mt-5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-black">Back</button>
      </div>
    );
  }

  return (
    <motion.div key="professor-detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <nav className="mb-5">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back
        </button>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-utcn-navy text-white mb-6">
        <div className="absolute inset-0 research-grid-dark research-fade opacity-70" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-utcn-red/70 to-transparent" aria-hidden="true" />
        <div className="relative px-6 sm:px-10 py-9 flex flex-col sm:flex-row sm:items-center gap-5">
          <img src={professor.avatar} alt={professor.name} referrerPolicy="no-referrer" className="w-20 h-20 rounded-full object-cover ring-2 ring-white/20 grayscale flex-shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="signal-dot" aria-hidden="true" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Professor profile</span>
            </div>
            <h1 className="font-display text-3xl leading-tight">{professor.name}</h1>
            <p className="text-white/55 text-sm uppercase tracking-wide mt-1">{professor.department || '—'}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              {professor.labName && <span className="inline-flex items-center gap-1.5 text-white/70"><FlaskConical size={14} /> {professor.labName}</span>}
              {professor.websiteUrl && <a href={professor.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white"><Globe size={14} /> Website</a>}
              {professor.linkedinUrl && <a href={professor.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white"><Linkedin size={14} /> LinkedIn</a>}
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {professor.bio && (
            <section className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">About</h2>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">{professor.bio}</p>
            </section>
          )}

          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Active opportunities ({professor.opportunities.length})
            </h2>
            {professor.opportunities.length === 0 ? (
              <p className="text-sm text-zinc-400 bg-white rounded-2xl border border-zinc-200/80 p-6">No active opportunities right now.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {professor.opportunities.map(opp => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    onClick={() => handleCardClick(opp)}
                    saved={savedOpportunityIds.has(opp.id)}
                    applicationStatus={applicationStatusForOpportunity(opp.id)}
                    onToggleSave={handleToggleSave}
                    onShare={handleShareOpportunity}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Research interests side panel */}
        <aside className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Research interests</h2>
          {professor.researchInterests.length === 0 ? (
            <p className="text-sm text-zinc-400">Not specified yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {professor.researchInterests.map(t => (
                <span key={t} className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">{t}</span>
              ))}
            </div>
          )}
        </aside>
      </div>
    </motion.div>
  );
}
