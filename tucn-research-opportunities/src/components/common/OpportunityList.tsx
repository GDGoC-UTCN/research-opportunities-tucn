import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X, AlertCircle } from 'lucide-react';
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

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-2xl sm:text-3xl text-white leading-none tabular-nums">{value}</span>
      <span className="text-[11px] uppercase tracking-widest text-white/45 mt-1.5">{label}</span>
    </div>
  );
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

  const facultyMentors = new Set(opportunities.map(opp => opp.author?.name).filter(Boolean)).size;

  return (
    <motion.div
      key="list"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-utcn-navy text-white mb-6">
        <div className="absolute inset-0 research-grid-dark research-fade opacity-70" aria-hidden="true" />
        <div className="absolute -right-16 -top-16 w-72 h-72 research-dots rounded-full opacity-60" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-utcn-red/70 to-transparent" aria-hidden="true" />

        <div className="relative px-6 sm:px-10 py-10 sm:py-12">
          <div className="flex items-center gap-2 mb-5">
            <span className="signal-dot" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">AIRi@UTCN · Research Intelligence</span>
          </div>

          <h1 className="font-display text-3xl sm:text-[2.7rem] leading-[1.05] max-w-2xl">
            Research Opportunities
          </h1>
          <p className="mt-4 text-sm sm:text-base text-white/65 leading-relaxed max-w-xl">
            Discover research projects. Connect with faculty. Build your academic path.
          </p>

          {/* Integrated search */}
          <div className="mt-7 max-w-xl">
            <div className="relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                aria-label="Search opportunities"
                placeholder="Search by title, lab, area or keyword…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 bg-white rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 shadow-lg shadow-black/20 outline-none focus:ring-2 focus:ring-white/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-9 flex items-center gap-8 sm:gap-12 border-t border-white/10 pt-6">
            <Stat value={opportunities.length} label="Open opportunities" />
            <Stat value={allTags.length} label="Research areas" />
            <Stat value={facultyMentors} label="Faculty mentors" />
          </div>
        </div>
      </section>

      {opportunities.length === 0 ? (
        isLoading ? (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-zinc-200/80">
            <div className="mx-auto h-10 w-10 mb-4 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
            <p className="text-sm text-zinc-400">Loading research opportunities…</p>
          </div>
        ) : loadError ? (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-zinc-200/80">
            <AlertCircle className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
            <h3 className="text-base font-semibold text-zinc-800">We couldn't load opportunities</h3>
            <p className="mt-1 text-sm text-zinc-400">Please check your connection and try again.</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-black transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-zinc-200/80">
            <Users className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
            <h3 className="text-base font-semibold text-zinc-800">No research opportunities are available yet</h3>
            <p className="mt-1 text-sm text-zinc-400">New AIRi@UTCN research opportunities will appear here soon.</p>
          </div>
        )
      ) : (
      <>
      {/* Toolbar: result count + filter */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <p className="text-sm text-zinc-500">
          {totalVisible === opportunities.length
            ? <><span className="font-semibold text-zinc-900">{opportunities.length}</span> opportunities</>
            : <><span className="font-semibold text-zinc-900">{totalVisible}</span> of {opportunities.length} matching</>}
        </p>

        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            aria-expanded={showFilterMenu}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              activeTags.length > 0
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-900'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeTags.length > 0 && (
              <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
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
                className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-zinc-200 z-20 p-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-sm text-zinc-900">Filter by research area</h3>
                  {activeTags.length > 0 && (
                    <button
                      onClick={() => activeTags.forEach(t => toggleTag(t))}
                      className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium uppercase tracking-wide transition-colors border ${
                        activeTags.includes(tag)
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-900 hover:text-zinc-900'
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
              className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide bg-white text-zinc-700 border border-zinc-300 px-3 py-1 rounded-full hover:border-utcn-red hover:text-utcn-red transition-colors"
            >
              {tag} <X size={11} />
            </button>
          ))}
        </div>
      )}

      {/* Cards or empty state */}
      {paginatedOpportunities.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-zinc-200/80">
          <Users className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
          <h3 className="text-base font-semibold text-zinc-800">No opportunities found</h3>
          <p className="mt-1 text-sm text-zinc-400">Try adjusting your search or removing some filters.</p>
          <button
            onClick={() => { setSearchQuery(''); activeTags.slice().forEach(t => toggleTag(t)); }}
            className="mt-5 text-sm text-zinc-900 hover:underline font-medium"
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
            <div className="mt-10 flex justify-center items-center gap-3 border-t border-zinc-200 pt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-zinc-200 disabled:opacity-30 hover:bg-zinc-50 text-zinc-600 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-zinc-600 px-2">
                Page <span className="text-zinc-900 font-bold">{currentPage}</span> of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-zinc-200 disabled:opacity-30 hover:bg-zinc-50 text-zinc-600 transition-colors"
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
