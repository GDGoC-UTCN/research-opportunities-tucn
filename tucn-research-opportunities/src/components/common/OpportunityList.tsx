import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, ChevronLeft, ChevronRight, Bookmark, Search, Filter } from 'lucide-react';
import { Opportunity } from '../../types';
import OpportunityCard from '../OpportunityCard';

interface Props {
  opportunities: Opportunity[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  searchQuery: string;
  activeTags: string[];
  toggleTag: (tag: string) => void;
  allTags: string[];
  showFilterMenu: boolean;
  setShowFilterMenu: React.Dispatch<React.SetStateAction<boolean>>;
  paginatedOpportunities: Opportunity[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  handleCardClick: (opp: Opportunity) => void;
}

export default function OpportunityList({
  opportunities,
  setSearchQuery,
  searchQuery,
  activeTags,
  toggleTag,
  allTags,
  showFilterMenu,
  setShowFilterMenu,
  paginatedOpportunities,
  currentPage,
  setCurrentPage,
  totalPages,
  handleCardClick
}: Props) {
  return (
    <motion.div
      key="list"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 w-full">
        <div className="relative w-full flex-grow">
          <input
            type="text"
            placeholder="Search titles, descriptions, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-utcn-red focus:bg-white focus:border-transparent outline-none transition-colors"
          />
          <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
        </div>
        <div className="relative w-full md:w-auto">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-6 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors w-full md:w-auto justify-center md:min-w-[140px]"
          >
            <Filter size={20} />
            Filters {activeTags.length > 0 && <span className="bg-utcn-red text-white text-xs px-2 py-0.5 rounded-full">{activeTags.length}</span>}
          </button>

          <AnimatePresence>
            {showFilterMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-12 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 z-10 p-4"
              >
                <h3 className="font-semibold text-sm mb-3">Filter by Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeTags.includes(tag)
                        ? 'bg-utcn-red text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {paginatedOpportunities.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow border border-gray-100">
          <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No opportunities found</h3>
          <p className="mt-1 text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
          <button
            onClick={() => { setSearchQuery(''); activeTags.splice(0, activeTags.length); }}
            className="mt-4 text-utcn-red hover:underline font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedOpportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onClick={() => handleCardClick(opp)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center space-x-4 border-t pt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-full border border-gray-300 disabled:opacity-50 hover:bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-utcn-red"
                aria-label="Previous page"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-full border border-gray-300 disabled:opacity-50 hover:bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-utcn-red"
                aria-label="Next page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
