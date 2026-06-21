import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, ChevronLeft, ChevronRight, Search, Filter, X, AlertCircle } from 'lucide-react';
import { ApplicationStatus, Opportunity } from '../../types';
import OpportunityCard from '../OpportunityCard';

interface Props {
  opportunities: Opportunity[];
  isLoading?: boolean;
  loadError?: boolean;
  onRetry?: () => void;
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
  savedOpportunityIds: Set<string>;
  applicationStatusForOpportunity: (opportunityId: string) => ApplicationStatus | undefined;
  handleToggleSave: (opp: Opportunity) => void;
  handleShareOpportunity: (opp: Opportunity) => void;
}

export default function OpportunityList({
  opportunities,
  isLoading,
  loadError,
  onRetry,
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
  handleCardClick,
  savedOpportunityIds,
  applicationStatusForOpportunity,
  handleToggleSave,
  handleShareOpportunity
}: Props) {
  const totalVisible = opportunities.filter(opp => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTags = activeTags.length === 0 || activeTags.every(tag => opp.tags.includes(tag));
    return matchesSearch && matchesTags;
  }).length;

  return (
    <motion.div
      key="list"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Research Opportunities</h1>
        {opportunities.length > 0 && (
          <p className="text-gray-500 text-sm mt-1">
            {totalVisible === opportunities.length
              ? `${opportunities.length} opportunities available`
              : `${totalVisible} of ${opportunities.length} opportunities matching your filters`}
          </p>
        )}
      </div>

      {opportunities.length === 0 ? (
        isLoading ? (
          <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="mx-auto h-10 w-10 mb-4 rounded-full border-2 border-gray-200 border-t-utcn-primary animate-spin" />
            <p className="text-sm text-gray-400">Loading research opportunities…</p>
          </div>
        ) : loadError ? (
          <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-gray-100">
            <AlertCircle className="mx-auto h-12 w-12 text-red-200 mb-4" />
            <h3 className="text-base font-semibold text-gray-700">We couldn't load opportunities</h3>
            <p className="mt-1 text-sm text-gray-400">Please check your connection and try again.</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-5 px-4 py-2 rounded-xl bg-utcn-primary text-white text-sm font-semibold hover:bg-utcn-primary-dark"
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-gray-100">
            <Users className="mx-auto h-12 w-12 text-gray-200 mb-4" />
            <h3 className="text-base font-semibold text-gray-700">No research opportunities are available yet</h3>
            <p className="mt-1 text-sm text-gray-400">New AIRi@UTCN research opportunities will appear here soon.</p>
          </div>
        )
      ) : (
      <>
      {/* Search + Filter bar */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, description or tag…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-utcn-primary focus:bg-white focus:border-transparent outline-none transition-colors text-gray-800 placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-8 bg-gray-200" />

        {/* Filter button */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
              activeTags.length > 0
                ? 'bg-utcn-primary text-white border-utcn-primary'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Filter size={15} />
            Filters
            {activeTags.length > 0 && (
              <span className="bg-white/25 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                {activeTags.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showFilterMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-20 p-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-sm text-gray-800">Filter by Tag</h3>
                  {activeTags.length > 0 && (
                    <button
                      onClick={() => activeTags.forEach(t => toggleTag(t))}
                      className="text-xs text-utcn-primary hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                        activeTags.includes(tag)
                          ? 'bg-utcn-primary text-white border-utcn-primary'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-utcn-primary hover:text-utcn-primary'
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

      {/* Active tag chips */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {activeTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-utcn-primary border border-blue-200 px-3 py-1 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              {tag} <X size={11} />
            </button>
          ))}
        </div>
      )}

      {/* Cards or empty state */}
      {paginatedOpportunities.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-gray-100">
          <Users className="mx-auto h-12 w-12 text-gray-200 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">No opportunities found</h3>
          <p className="mt-1 text-sm text-gray-400">Try adjusting your search or removing some filters.</p>
          <button
            onClick={() => { setSearchQuery(''); activeTags.slice().forEach(t => toggleTag(t)); }}
            className="mt-5 text-sm text-utcn-primary hover:underline font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedOpportunities.map((opp) => (
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

          {totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center gap-3 border-t pt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 text-gray-600 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-gray-600 px-2">
                Page <span className="text-gray-900 font-bold">{currentPage}</span> of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 text-gray-600 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
      </>
      )}
    </motion.div>
  );
}
