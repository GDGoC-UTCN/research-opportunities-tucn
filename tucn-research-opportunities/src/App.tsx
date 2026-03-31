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
  <div className="w-10 h-10 flex items-center justify-center bg-white rounded flex-shrink-0">
    <img src="/favicon.svg" alt="UTCN Logo" className="h-8 w-8 object-contain" />
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
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* Header */}
      <div className="bg-utcn-blue text-white shadow-md">
        <header className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4 cursor-pointer" onClick={handleBack}>
              <Logo />
              <h1 className="text-2xl font-bold tracking-tight">Research Opportunities</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 focus:outline-none p-2 rounded-full hover:bg-white/10">
                  <User className="w-6 h-6" />
                  <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 text-gray-800"
                    >
                      <a href="#" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </a>
                      <a href="#" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>
      </div>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Search and Filter Section */}
              <section className="mb-8 bg-white p-6 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative md:col-span-2">
                    <input
                      type="text"
                      placeholder="Search by title, description, or tags..."
                      className="w-full h-12 pl-12 pr-4 bg-gray-100 rounded-lg border-transparent focus:ring-2 focus:ring-utcn-blue focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setShowFilterMenu(!showFilterMenu)}
                      className="w-full h-12 px-4 rounded-lg flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <span className="font-medium">Filter by Tags</span>
                      <Filter size={20} className="text-gray-500" />
                    </button>
                    <AnimatePresence>
                      {showFilterMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full right-0 mt-2 w-full md:w-72 bg-white rounded-lg shadow-xl p-4 z-30 border"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-sm">Filter by Tags</h3>
                            <button onClick={() => setShowFilterMenu(false)}>
                              <X size={18} className="text-gray-500 hover:text-gray-800" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {allTags.map(tag => (
                              <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                  activeTags.includes(tag)
                                    ? 'bg-utcn-blue text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                          {activeTags.length > 0 && (
                            <button 
                              onClick={() => setActiveTags([])}
                              className="mt-4 w-full text-center text-xs font-bold text-utcn-blue hover:underline"
                            >
                              Clear All Filters
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>

              {/* Grid */}
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 size={48} className="text-utcn-blue animate-spin" />
                </div>
              ) : paginatedOpportunities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedOpportunities.map((opp) => (
                    <OpportunityCard 
                      key={opp.id} 
                      opportunity={opp} 
                      onClick={handleCardClick} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <h3 className="text-xl font-semibold">No opportunities found</h3>
                  <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-8 flex justify-center items-center gap-4">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo(0, 0); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-gray-300 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <span className="text-sm font-medium text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo(0, 0); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-gray-300 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight size={16} />
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
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                {/* Back Nav */}
                <nav className="mb-6">
                  <button onClick={handleBack} className="flex items-center space-x-2 text-sm font-medium text-utcn-blue hover:underline">
                    <ArrowLeft size={16} />
                    <span>Back to Opportunities</span>
                  </button>
                </nav>

                {/* Hero */}
                <header className="mb-8">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedOpportunity?.tags.map((tag, idx) => (
                      <span key={idx} className="bg-blue-100 text-utcn-blue px-3 py-1 rounded-full text-xs font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {selectedOpportunity?.title}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 border-t pt-4">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <img
                        src={selectedOpportunity?.author.avatar}
                        alt={selectedOpportunity?.author.name}
                        className="w-8 h-8 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-semibold">
                        {selectedOpportunity?.author.name}
                      </span>
                    </div>
                    <div className="font-semibold">
                      Deadline: {selectedOpportunity?.deadline}
                    </div>
                  </div>
                </header>

                <div className="prose prose-lg max-w-none">
                  <h2 className="text-xl font-semibold text-gray-800">Abstract</h2>
                  <p>{selectedOpportunity?.abstract}</p>

                  <h2 className="text-xl font-semibold text-gray-800 mt-8">Requirements</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <div>
                      <h3 className="font-semibold">Technical Skills</h3>
                      <ul>
                        {selectedOpportunity?.requirements.technical.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold">Eligibility</h3>
                      <ul>
                        {selectedOpportunity?.requirements.eligibility.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-800 mt-8">Details</h2>
                  <div className="flex flex-wrap gap-x-8 gap-y-4 text-base">
                    <div className="flex items-center gap-2"><CalendarIcon size={16} /> <strong>Post Date:</strong> {selectedOpportunity?.postDate}</div>
                    <div className="flex items-center gap-2"><Clock size={16} /> <strong>Duration:</strong> {selectedOpportunity?.duration}</div>
                    <div className="flex items-center gap-2"><DollarSign size={16} /> <strong>Stipend:</strong> {selectedOpportunity?.stipend}</div>
                  </div>
                </div>

                {/* Actions */}
                <footer className="mt-10 pt-6 border-t flex flex-col sm:flex-row gap-3">
                  <button className="w-full sm:w-auto flex-grow bg-utcn-blue text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Apply Now
                  </button>
                  <button className="w-full sm:w-auto bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                    <Bookmark size={18} />
                    Save
                  </button>
                  <button className="w-full sm:w-auto bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                    <Share2 size={18} />
                    Share
                  </button>
                </footer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white w-full py-8 mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Technical University of Cluj-Napoca. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
