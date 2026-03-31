/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  School, 
  Menu, 
  ArrowLeft, 
  CheckCircle2, 
  Bookmark, 
  Share2, 
  Download,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  X,
  Loader2,
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_OPPORTUNITIES, Opportunity } from './types';
import OpportunityCard from './components/OpportunityCard';

// Replaceable Logo Component
const Logo = () => (
  <div className="w-10 h-10 flex items-center justify-center rounded-lg">
    <img src="/favicon.svg" alt="Logo" />
  </div>
);

export default function App() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Simulate loading postings
  const loadPostings = async () => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
  };

  useEffect(() => {
    loadPostings();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    loadPostings();
  }, [searchQuery, activeTags, itemsPerPage]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    MOCK_OPPORTUNITIES.forEach(opp => opp.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, []);

  const handleCardClick = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setView('detail');
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setView('list');
    setSelectedOpportunity(null);
    window.scrollTo(0, 0);
  };

  const toggleTag = (tag: string) => {
    setActiveTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const allFilteredOpportunities = useMemo(() => {
    return MOCK_OPPORTUNITIES.filter(opp => {
      const matchesSearch = 
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTags = activeTags.length === 0 || activeTags.every(tag => opp.tags.includes(tag));
      
      return matchesSearch && matchesTags;
    });
  }, [searchQuery, activeTags]);

  const totalPages = Math.ceil(allFilteredOpportunities.length / itemsPerPage);
  
  const paginatedOpportunities = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return allFilteredOpportunities.slice(start, start + itemsPerPage);
  }, [allFilteredOpportunities, currentPage, itemsPerPage]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md fixed top-0 w-full z-50 shadow-sm flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleBack}>
          <Logo />
          <span className="font-headline font-extrabold tracking-tighter text-on-surface text-xl">
            TUCN Academic Opportunities
          </span>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`p-2 rounded-full transition-colors ${showUserMenu ? 'bg-primary text-white' : 'hover:bg-zinc-100 text-on-surface'}`}
          >
            <Menu size={24} />
          </button>
          
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-outline-variant/20 py-2 z-[100]"
              >
                <div className="px-4 py-3 border-b border-outline-variant/10 mb-1">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Logged in as</p>
                  <p className="text-sm font-bold text-on-surface truncate">user@student.utcluj.ro</p>
                </div>
                <button className="w-full px-4 py-2 text-left text-sm font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-3 transition-colors">
                  <User size={18} className="text-secondary" />
                  Account Settings
                </button>
                <button className="w-full px-4 py-2 text-left text-sm font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-3 transition-colors">
                  <Settings size={18} className="text-secondary" />
                  Preferences
                </button>
                <div className="my-1 border-t border-outline-variant/10"></div>
                <button className="w-full px-4 py-2 text-left text-sm font-bold text-destructive hover:bg-destructive/5 flex items-center gap-3 transition-colors">
                  <LogOut size={18} />
                  Log-out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-20 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Search Section */}
              <section className="mb-16">
                <div className="bg-primary-container p-8 md:p-12 rounded-xl shadow-sm">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-grow w-full">
                      <input
                        type="text"
                        placeholder="Search academic archives..."
                        className="w-full h-16 pl-14 pr-6 bg-white rounded-lg border-none focus:ring-4 focus:ring-primary/20 text-on-surface font-medium placeholder-secondary/60 shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={24} />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto relative">
                      <button 
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className={`h-16 px-6 rounded-lg flex items-center gap-2 font-semibold transition-all shadow-sm whitespace-nowrap ${
                          activeTags.length > 0 || showFilterMenu 
                            ? 'bg-primary text-white' 
                            : 'bg-white text-on-surface hover:bg-surface-container-low'
                        }`}
                      >
                        <Filter size={20} />
                        Filter {activeTags.length > 0 && `(${activeTags.length})`}
                      </button>

                      <AnimatePresence>
                        {showFilterMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-20 right-0 w-72 bg-white rounded-xl shadow-2xl p-6 z-[60] border border-outline-variant/20"
                          >
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-sm uppercase tracking-widest text-primary">Filter by Tags</h3>
                              <button onClick={() => setShowFilterMenu(false)}>
                                <X size={18} className="text-secondary hover:text-primary" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                              {allTags.map(tag => (
                                <button
                                  key={tag}
                                  onClick={() => toggleTag(tag)}
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${
                                    activeTags.includes(tag)
                                      ? 'bg-primary text-white'
                                      : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'
                                  }`}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                            {activeTags.length > 0 && (
                              <button 
                                onClick={() => setActiveTags([])}
                                className="mt-6 w-full py-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                              >
                                Clear All Filters
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="relative w-full md:w-48">
                        <select 
                          className="h-16 w-full pl-6 pr-10 bg-white text-on-surface rounded-lg border-none appearance-none font-semibold focus:ring-4 focus:ring-primary/20 shadow-sm cursor-pointer"
                          value={itemsPerPage}
                          onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        >
                          <option value={4}>4 per page</option>
                          <option value={8}>8 per page</option>
                          <option value={12}>12 per page</option>
                          <option value={36}>36 per page</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary" size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Grid - 4 postings per line (lg:grid-cols-4) */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 w-full col-span-full">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 size={48} className="text-primary" />
                  </motion.div>
                  <p className="mt-6 font-headline font-bold text-xl text-on-surface animate-pulse">
                    Loading academic postings...
                  </p>
                </div>
              ) : paginatedOpportunities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {paginatedOpportunities.map((opp) => (
                    <OpportunityCard 
                      key={opp.id} 
                      opportunity={opp} 
                      onClick={handleCardClick} 
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 w-full col-span-full text-center">
                  <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
                    <Search size={32} className="text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface mb-2">No opportunities found</h3>
                  <p className="text-secondary max-w-md">
                    We couldn't find any postings matching your current search or filter criteria. Try adjusting your filters or search terms.
                  </p>
                  <button 
                    onClick={() => { setSearchQuery(''); setActiveTags([]); }}
                    className="mt-8 px-8 py-3 bg-primary text-white rounded-full font-bold hover:shadow-lg transition-all"
                  >
                    Clear all filters
                  </button>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-20 flex justify-center items-center gap-8">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo(0, 0); }}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border border-primary text-primary font-bold hover:bg-primary/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                    Previous
                  </button>
                  <div className="flex items-center gap-4 text-on-surface font-bold">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first, last, and pages around current
                        return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center gap-2">
                          {index > 0 && array[index - 1] !== page - 1 && <span className="text-secondary">...</span>}
                          <button
                            onClick={() => { setCurrentPage(page); window.scrollTo(0, 0); }}
                            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                              currentPage === page 
                                ? 'bg-primary text-white shadow-lg' 
                                : 'hover:bg-surface-container-low text-on-surface'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))}
                  </div>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo(0, 0); }}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border border-primary text-primary font-bold hover:bg-primary/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight size={20} />
                  </button>
                </nav>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-12 gap-8"
            >
              <div className="col-span-12 lg:col-start-2 lg:col-span-10 xl:col-start-3 xl:col-span-8">
                {/* Back Nav */}
                <nav className="mb-12 flex items-center space-x-2 text-sm font-medium text-on-surface opacity-60">
                  <ArrowLeft size={16} />
                  <button onClick={handleBack} className="hover:text-primary transition-colors">
                    Back to Opportunities
                  </button>
                  <span className="opacity-30">/</span>
                  <span>Opportunity ID: #{selectedOpportunity?.id}</span>
                </nav>

                {/* Hero */}
                <header className="mb-16">
                  <div className="flex flex-wrap gap-3 mb-6">
                    {selectedOpportunity?.tags.map((tag, idx) => (
                      <span key={idx} className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase font-label text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-on-surface mb-8">
                    {selectedOpportunity?.title}
                  </h1>
                  <div className="flex items-center justify-between py-6 border-y border-outline-variant/15">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedOpportunity?.author.avatar}
                        alt={selectedOpportunity?.author.name}
                        className="w-10 h-10 rounded-full object-cover shadow-sm border border-outline-variant/20"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-headline font-bold text-sm tracking-tight text-on-surface">
                        {selectedOpportunity?.author.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold font-label text-primary uppercase tracking-widest mb-1">DEADLINE</p>
                      <p className="text-on-surface font-semibold">{selectedOpportunity?.deadline}</p>
                    </div>
                  </div>
                </header>

                <div className="flex flex-col gap-12">
                  {/* Abstract */}
                  <section className="bg-primary-container p-10 rounded-xl relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    <div className="relative z-10">
                      <h2 className="text-white font-headline font-bold text-2xl mb-6">Executive Abstract</h2>
                      <div className="bg-white p-8 rounded-lg shadow-sm">
                        <p className="text-on-surface text-lg leading-relaxed font-body">
                          {selectedOpportunity?.abstract}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Requirements */}
                  <section className="space-y-8">
                    <h3 className="text-2xl font-bold font-headline border-l-4 border-primary pl-4">Position Requirements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-primary uppercase text-xs tracking-widest font-label">Technical Skills</h4>
                        <ul className="space-y-3 font-body text-on-surface/80">
                          {selectedOpportunity?.requirements.technical.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="text-primary mt-1" size={16} />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-primary uppercase text-xs tracking-widest font-label">Eligibility</h4>
                        <ul className="space-y-3 font-body text-on-surface/80">
                          {selectedOpportunity?.requirements.eligibility.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="text-primary mt-1" size={16} />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="pt-8 space-y-6">
                      <h3 className="text-2xl font-bold font-headline">The Opportunity Landscape</h3>
                      <p className="text-on-surface/90 leading-relaxed font-body">
                        The Academic Editorial Board recognizes the shift towards distributed computing models. This project is not merely an internship but a strategic entry into the future of data architecture. Contributors will be mentored directly by the editorial staff and gain insight into the high-stakes world of academic publishing and technical review.
                      </p>
                    </div>
                  </section>

                  {/* Metadata Sidebar for Mobile */}
                  <div className="lg:hidden bg-surface-container-low p-6 rounded-lg space-y-6">
                    <h4 className="font-label font-bold text-[10px] tracking-widest uppercase text-primary">Metadata</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-on-surface opacity-50 uppercase font-medium">Post Date</p>
                        <p className="text-sm font-semibold">{selectedOpportunity?.postDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface opacity-50 uppercase font-medium">Duration</p>
                        <p className="text-sm font-semibold">{selectedOpportunity?.duration}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] text-on-surface opacity-50 uppercase font-medium">Stipend</p>
                        <p className="text-sm font-semibold text-tertiary">{selectedOpportunity?.stipend}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <footer className="mt-8 flex flex-col sm:flex-row gap-4 pt-10 border-t border-outline-variant/15">
                    <button className="flex-1 bg-gradient-to-br from-primary to-primary-container text-white py-4 px-8 rounded-full font-bold text-lg hover:shadow-lg transition-all active:scale-95">
                      Apply for Fellowship
                    </button>
                    <button className="flex-none bg-surface-container-high text-primary py-4 px-10 rounded-full font-bold text-lg hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2">
                      <Bookmark size={20} />
                      Save Opportunity
                    </button>
                    <button className="flex-none p-4 rounded-full border border-outline-variant/30 text-on-surface/60 hover:text-primary transition-colors">
                      <Share2 size={20} />
                    </button>
                  </footer>
                </div>
              </div>

              {/* Desktop Sidebar */}
              <aside className="hidden lg:block lg:col-span-2 relative">
                <div className="sticky top-24 space-y-8">
                  <div className="bg-surface-container-low p-6 rounded-lg">
                    <h4 className="font-label font-bold text-[10px] tracking-widest uppercase mb-4 text-primary">Metadata</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-on-surface opacity-50 uppercase font-medium flex items-center gap-1">
                          <CalendarIcon size={10} /> Post Date
                        </p>
                        <p className="text-sm font-semibold">{selectedOpportunity?.postDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface opacity-50 uppercase font-medium flex items-center gap-1">
                          <Clock size={10} /> Duration
                        </p>
                        <p className="text-sm font-semibold">{selectedOpportunity?.duration}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface opacity-50 uppercase font-medium flex items-center gap-1">
                          <DollarSign size={10} /> Stipend
                        </p>
                        <p className="text-sm font-semibold text-tertiary">{selectedOpportunity?.stipend}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-label font-bold text-[10px] tracking-widest uppercase mb-4 text-primary">Related Documents</h4>
                    <ul className="space-y-3">
                      <li>
                        <a href="#" className="text-xs font-medium underline flex items-center gap-2 hover:text-primary">
                          Project_Brief.pdf <Download size={14} />
                        </a>
                      </li>
                      <li>
                        <a href="#" className="text-xs font-medium underline flex items-center gap-2 hover:text-primary">
                          Lab_Guidelines.pdf <Download size={14} />
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-[#050405] w-full py-12 mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 w-full max-w-[1440px] mx-auto">
          <div className="font-headline font-black text-xl text-[#f6eff1] mb-6 md:mb-0">
            TUCN ACADEMIC OPPORTUNITIES
          </div>
          <div className="flex flex-wrap justify-center gap-8 mb-8 md:mb-0 font-body text-xs tracking-wide">
            <a href="#" className="text-[#f6eff1]/60 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-[#f6eff1]/60 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-[#f6eff1]/60 hover:text-white transition-colors">Contact Support</a>
            <a href="#" className="text-[#f6eff1]/60 hover:text-white transition-colors">Archive Access</a>
          </div>
          <div className="text-[#f6eff1]/40 font-body text-[10px] tracking-[0.1em] uppercase">
            © 2024 TUCN Academic Editorial. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
