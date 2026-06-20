import React from 'react';
import { motion } from 'motion/react';
import { Bookmark, Calendar, Clock, Share2 } from 'lucide-react';
import { Opportunity } from '../types';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: (opp: Opportunity) => void;
  saved: boolean;
  onToggleSave: (opp: Opportunity) => void;
  onShare: (opp: Opportunity) => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, onClick, saved, onToggleSave, onShare }) => {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl overflow-hidden cursor-pointer border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-200 flex flex-col"
      onClick={() => onClick(opportunity)}
    >
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-utcn-primary to-utcn-navy w-full flex-shrink-0" />

      <div className="p-5 flex flex-col flex-1">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {opportunity.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-blue-50 text-utcn-primary border border-blue-100"
            >
              {tag}
            </span>
          ))}
          {opportunity.tags.length > 2 && (
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-gray-50 text-gray-400 border border-gray-100">
              +{opportunity.tags.length - 2}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-bold text-sm leading-snug text-gray-900 mb-2 line-clamp-2 flex-shrink-0">
          {opportunity.title}
        </h2>

        {/* Description */}
        <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-3 flex-1">
          {opportunity.description}
        </p>

        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleSave(opportunity);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              saved
                ? 'bg-blue-50 text-utcn-primary border border-blue-100'
                : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'
            }`}
            aria-label={saved ? `Remove ${opportunity.title} from saved opportunities` : `Save ${opportunity.title}`}
          >
            <Bookmark size={13} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Saved' : 'Save'}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onShare(opportunity);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 transition-colors"
            aria-label={`Share ${opportunity.title}`}
          >
            <Share2 size={13} />
            Share
          </button>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <Clock size={11} className="flex-shrink-0" />
            {opportunity.duration}
          </span>
          <span className="w-px h-3 bg-gray-200 flex-shrink-0" />
          <span className="flex items-center gap-1">
            <Calendar size={11} className="flex-shrink-0" />
            Due {opportunity.deadline.split(',')[0]}
          </span>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2.5 pt-3.5 border-t border-gray-100 flex-shrink-0">
          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-gray-200">
            <img
              src={opportunity.author.avatar}
              alt={opportunity.author.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-gray-700 truncate leading-tight">{opportunity.author.name}</span>
            <span className="text-[10px] text-gray-400 truncate uppercase tracking-wide leading-tight mt-0.5">{opportunity.author.department}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default OpportunityCard;
