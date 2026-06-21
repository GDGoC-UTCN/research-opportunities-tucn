import React from 'react';
import { motion } from 'motion/react';
import { Bookmark, Calendar, Clock, Share2, ArrowUpRight } from 'lucide-react';
import { ApplicationStatus, Opportunity } from '../types';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: (opp: Opportunity) => void;
  saved: boolean;
  applicationStatus?: ApplicationStatus;
  onToggleSave: (opp: Opportunity) => void;
  onShare: (opp: Opportunity) => void;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Applied',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border border-red-200',
};

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, onClick, saved, applicationStatus, onToggleSave, onShare }) => {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-white rounded-xl overflow-hidden cursor-pointer border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-zinc-900/30 hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.18)] transition-all duration-200 flex flex-col"
      onClick={() => onClick(opportunity)}
    >
      {/* Hairline that inks-in on hover */}
      <div className="h-px w-full bg-zinc-200 group-hover:bg-zinc-900 transition-colors duration-200 flex-shrink-0" />

      <div className="p-5 flex flex-col flex-1">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {opportunity.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200"
            >
              {tag}
            </span>
          ))}
          {opportunity.tags.length > 2 && (
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md text-zinc-400">
              +{opportunity.tags.length - 2}
            </span>
          )}
          <ArrowUpRight size={15} className="ml-auto text-zinc-300 group-hover:text-zinc-900 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
        </div>

        {/* Title */}
        <h2 className="font-display text-[1.05rem] leading-snug text-zinc-900 mb-2 line-clamp-2 flex-shrink-0">
          {opportunity.title}
        </h2>

        {/* Description */}
        <p className="text-xs text-zinc-500 leading-relaxed mb-4 line-clamp-3 flex-1">
          {opportunity.description}
        </p>

        <div className="flex items-center gap-2 mb-4">
          {applicationStatus ? (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ${STATUS_STYLES[applicationStatus]}`}>
              <Bookmark size={13} fill="currentColor" />
              {STATUS_LABELS[applicationStatus]}
            </span>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleSave(opportunity);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors border ${
                saved
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-900 hover:text-zinc-900'
              }`}
              aria-label={saved ? `Remove ${opportunity.title} from saved opportunities` : `Save ${opportunity.title}`}
            >
              <Bookmark size={13} fill={saved ? 'currentColor' : 'none'} />
              {saved ? 'Saved' : 'Save'}
            </button>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onShare(opportunity);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-900 hover:text-zinc-900 transition-colors"
            aria-label={`Share ${opportunity.title}`}
          >
            <Share2 size={13} />
            Share
          </button>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-400 mb-4">
          <span className="flex items-center gap-1">
            <Clock size={11} className="flex-shrink-0" />
            {opportunity.duration}
          </span>
          <span className="w-px h-3 bg-zinc-200 flex-shrink-0" />
          <span className="flex items-center gap-1">
            <Calendar size={11} className="flex-shrink-0" />
            Due {opportunity.deadline.split(',')[0]}
          </span>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2.5 pt-3.5 border-t border-zinc-100 flex-shrink-0">
          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-zinc-200 grayscale">
            <img
              src={opportunity.author.avatar}
              alt={opportunity.author.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-zinc-700 truncate leading-tight">{opportunity.author.name}</span>
            <span className="text-[10px] text-zinc-400 truncate uppercase tracking-wide leading-tight mt-0.5">{opportunity.author.department}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default OpportunityCard;
