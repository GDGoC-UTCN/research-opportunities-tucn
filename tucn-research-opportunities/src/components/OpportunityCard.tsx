import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Opportunity } from '../types';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: (opp: Opportunity) => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, onClick }) => {
  return (
    <motion.article
      layout
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
      className="bg-white rounded-lg overflow-hidden cursor-pointer border border-gray-200"
      onClick={() => onClick(opportunity)}
    >
      <div className="p-5">
        <div className="flex flex-wrap gap-2 mb-3">
          {opportunity.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="font-sans text-[10px] font-semibold tracking-wide uppercase px-2 py-1 rounded text-white"
              style={{ backgroundColor: '#D94A4F' }}
            >
              {tag}
            </span>
          ))}
        </div>

        <h2 className="font-bold text-md leading-tight text-gray-800 transition-colors mb-3 h-12">
          {opportunity.title}
        </h2>

        <p className="text-xs text-gray-500 leading-relaxed mb-4 h-16 overflow-hidden">
          {opportunity.description}
        </p>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
            <img
              src={opportunity.author.avatar}
              alt={opportunity.author.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-gray-700 truncate">{opportunity.author.name}</span>
            <span className="text-[10px] text-gray-500 truncate uppercase tracking-wider">{opportunity.author.department}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default OpportunityCard;
