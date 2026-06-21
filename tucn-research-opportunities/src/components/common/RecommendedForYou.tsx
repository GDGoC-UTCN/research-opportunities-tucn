import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ApplicationStatus, Opportunity, Recommendation } from '../../types';
import { apiFetch } from '../../api';
import OpportunityCard from '../OpportunityCard';

interface Props {
  handleCardClick: (opp: Opportunity) => void;
  savedOpportunityIds: Set<string>;
  applicationStatusForOpportunity: (opportunityId: string) => ApplicationStatus | undefined;
  handleToggleSave: (opp: Opportunity) => void;
  handleShareOpportunity: (opp: Opportunity) => void;
  onEditInterests: () => void;
}

export default function RecommendedForYou({
  handleCardClick,
  savedOpportunityIds,
  applicationStatusForOpportunity,
  handleToggleSave,
  handleShareOpportunity,
  onEditInterests,
}: Props) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/recommendations/opportunities');
        if (res.ok) {
          const json = await res.json();
          setRecommendations(Array.isArray(json.recommendations) ? json.recommendations.slice(0, 6) : []);
          setNeedsProfile(!!json.needsProfile);
        }
      } catch { /* hide section on failure */ }
      setLoaded(true);
    })();
  }, []);

  if (!loaded || recommendations.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={15} className="text-zinc-500" />
            <h2 className="font-display text-xl text-zinc-900">Recommended for you</h2>
          </div>
          <p className="text-sm text-zinc-500">Recommended based on your interests and saved opportunities.</p>
        </div>
        <button onClick={onEditInterests} className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1.5 self-start sm:self-auto">
          Improve recommendations <ArrowRight size={14} />
        </button>
      </div>

      {needsProfile && (
        <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Add research interests in your profile to get better recommendations.</span>
          <button onClick={onEditInterests} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition-colors flex-shrink-0">
            Add interests
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {recommendations.map(rec => (
          <div key={rec.opportunity.id} className="flex flex-col gap-2">
            {rec.reasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {rec.reasons.map((reason, i) => (
                  <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-900 text-white">
                    {reason}
                  </span>
                ))}
              </div>
            )}
            <OpportunityCard
              opportunity={rec.opportunity}
              onClick={() => handleCardClick(rec.opportunity)}
              saved={savedOpportunityIds.has(rec.opportunity.id)}
              applicationStatus={applicationStatusForOpportunity(rec.opportunity.id)}
              onToggleSave={handleToggleSave}
              onShare={handleShareOpportunity}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
