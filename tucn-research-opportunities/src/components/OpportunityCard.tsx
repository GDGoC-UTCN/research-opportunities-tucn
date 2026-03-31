import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Opportunity } from '../types';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: (opp: Opportunity) => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.article
      layout
      initial={{ height: 'auto' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      className="bg-white border-2 border-primary rounded-xl p-6 flex flex-col group cursor-pointer overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
      onClick={() => onClick(opportunity)}
    >
      <div className="flex flex-wrap gap-2 mb-3">
        {opportunity.tags.map((tag, idx) => (
          <span
            key={idx}
            className={`font-label text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${
              idx === 0 ? 'text-primary bg-primary/5' : 'text-tertiary bg-tertiary/5'
            }`}
          >
            {tag}
          </span>
        ))}
      </div>

      <h2 className="font-headline text-lg font-extrabold leading-tight text-on-surface tracking-tight group-hover:text-primary transition-colors mb-3">
        {opportunity.title}
      </h2>

      <AnimatePresence initial={false}>
        {isHovered && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-sm text-secondary leading-relaxed mb-4 pt-1 border-t border-outline-variant/10">
              {opportunity.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 mt-auto pt-3 border-t border-outline-variant/5">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20 flex-shrink-0">
          <img
            src={opportunity.author.avatar}
            alt={opportunity.author.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-on-surface truncate">{opportunity.author.name}</span>
          <span className="text-[9px] text-secondary truncate uppercase tracking-wider">{opportunity.author.department}</span>
        </div>
      </div>
    </motion.article>
  );
};

export default OpportunityCard;
