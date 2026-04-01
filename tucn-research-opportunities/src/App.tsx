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
  User as UserIcon,
  LogOut,
  Settings,
  Plus,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_OPPORTUNITIES, Opportunity, User, MOCK_STUDENT, MOCK_PROFESSOR, Application } from './types';
import OpportunityCard from './components/OpportunityCard';

// Replaceable Logo Component
const Logo = () => (
  <div className="w-10 h-10 flex items-center justify-center bg-white rounded flex-shrink-0">
    <img src="/favicon.svg" alt="UTCN Logo" className="h-8 w-8 object-contain" />
  </div>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(MOCK_OPPORTUNITIES);
  const [applications, setApplications] = useState<Application[]>([]);
  const [view, setView] = useState<'login' | 'list' | 'detail' | 'create' | 'dashboard'>('login');
  
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogin = (role: 'student' | 'professor') => {
    setCurrentUser(role === 'student' ? MOCK_STUDENT : MOCK_PROFESSOR);
    setView('list');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowUserMenu(false);
    setView('login');
  };

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
    opportunities.forEach(opp => opp.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [opportunities]);

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
    return opportunities.filter(opp => {
      const matchesSearch = 
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTags = activeTags.length === 0 || activeTags.every(tag => opp.tags.includes(tag));
      
      return matchesSearch && matchesTags;
    });
  }, [searchQuery, activeTags, opportunities]);

  const totalPages = Math.ceil(allFilteredOpportunities.length / itemsPerPage);
  
  const paginatedOpportunities = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return allFilteredOpportunities.slice(start, start + itemsPerPage);
  }, [allFilteredOpportunities, currentPage, itemsPerPage]);

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <Logo />
          <h1 className="text-2xl font-bold mt-6 mb-2">Welcome to UTCN Research</h1>
          <p className="text-gray-500 mb-8">Please login to continue</p>
          <div className="space-y-4">
            <button 
              onClick={() => handleLogin('student')}
              className="w-full py-3 px-4 bg-utcn-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Continue as Student
            </button>
            <button 
              onClick={() => handleLogin('professor')}
              className="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition"
            >
              Continue as Professor
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* Header */}
      <div className="bg-utcn-blue text-white shadow-md">
        <header className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setView('list')}>
              <Logo />
              <h1 className="text-2xl font-bold tracking-tight">Research Opportunities</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 focus:outline-none p-2 rounded-full hover:bg-white/10">
                  {currentUser ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-white" />
                  ) : (
                    <UserIcon className="w-6 h-6" />
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showUserMenu && currentUser && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-20 text-gray-800"
                    >
                      <div className="px-4 py-3 border-b text-sm">
                        <div className="font-bold">{currentUser.name}</div>
                        <div className="text-gray-500 capitalize text-xs mt-1">{currentUser.role}</div>
                      </div>
                      {currentUser.role === 'professor' && (
                        <>
                          <button onClick={() => { setView('create'); setShowUserMenu(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                            <Plus className="w-4 h-4 mr-2" />
                            Post Opportunity
                          </button>
                          <button onClick={() => { setView('dashboard'); setShowUserMenu(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                            <Users className="w-4 h-4 mr-2" />
                            My Projects & Applicants
                          </button>
                        </>
                      )}
                      <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
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
          ) : view === 'create' && currentUser?.role === 'professor' ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden p-6 sm:p-8 max-w-3xl mx-auto"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Post a New Opportunity</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get('title') as string;
                const abstract = formData.get('abstract') as string;
                const desc = formData.get('description') as string;
                const stipend = formData.get('stipend') as string;
                const dur = formData.get('duration') as string;
                
                const newOpp: Opportunity = {
                  id: Date.now().toString(),
                  title,
                  abstract,
                  description: desc,
                  stipend,
                  duration: dur,
                  deadline: "December 31, 2026",
                  postDate: "Today",
                  tags: ["NEW", "RESEARCH"],
                  requirements: { technical: ["To be specified"], eligibility: ["To be specified"] },
                  author: {
                    id: currentUser.id,
                    name: currentUser.name,
                    department: currentUser.department || 'General',
                    avatar: currentUser.avatar
                  }
                };
                setOpportunities([newOpp, ...opportunities]);
                setView('dashboard');
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input name="title" required type="text" className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-utcn-blue focus:border-utcn-blue" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                  <input name="description" required type="text" className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-utcn-blue focus:border-utcn-blue" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Abstract</label>
                  <textarea name="abstract" required rows={4} className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-utcn-blue focus:border-utcn-blue" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input name="duration" required type="text" placeholder="e.g. 6 Months" className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-utcn-blue focus:border-utcn-blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stipend / Funding</label>
                    <input name="stipend" required type="text" placeholder="e.g. Unpaid or €1,000" className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-utcn-blue focus:border-utcn-blue" />
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button type="submit" className="bg-utcn-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
                    Post Opportunity
                  </button>
                  <button type="button" onClick={() => setView('dashboard')} className="px-6 py-2 rounded-lg font-semibold text-gray-600 hover:bg-gray-100">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          ) : view === 'dashboard' && currentUser?.role === 'professor' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden p-4 sm:p-8 max-w-4xl mx-auto"
            >
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-900">My Posted Projects</h2>
                <button onClick={() => setView('create')} className="bg-utcn-blue text-white px-4 py-2 rounded-lg font-semibold flex items-center shadow hover:bg-blue-700 text-sm">
                  <Plus className="w-5 h-5 mr-1" /> New Project
                </button>
              </div>
              <div className="space-y-6">
                {opportunities.filter(o => o.author.id === currentUser.id).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">You haven't posted any projects yet.</p>
                ) : (
                  opportunities.filter(o => o.author.id === currentUser.id).map(opp => {
                    const oppApps = applications.filter(a => a.opportunityId === opp.id);
                    return (
                      <div key={opp.id} className="border border-gray-200 rounded-lg p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-gray-800">{opp.title}</h3>
                          <span className="bg-blue-100 text-utcn-blue px-3 py-1 rounded-full text-xs font-semibold">
                            {oppApps.length} Applicants
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{opp.description}</p>
                        
                        {oppApps.length > 0 && (
                          <div className="bg-gray-50 rounded-md p-4">
                            <h4 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-3">Recent Applications</h4>
                            <div className="space-y-3">
                              {oppApps.map(app => (
                                <div key={app.id} className="bg-white border text-sm p-3 rounded shadow-sm">
                                  <div className="font-semibold text-gray-800 mb-1 flex justify-between">
                                    <span>{app.studentName}</span>
                                    <span className="text-gray-400 font-normal text-xs">{app.date}</span>
                                  </div>
                                  <p className="text-gray-600 italic">"{app.message}"</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          ) : view === 'detail' ? (
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
                  {currentUser?.role === 'student' && (
                    <button 
                      onClick={() => {
                        if (!selectedOpportunity) return;
                        const hasApplied = applications.some(a => a.opportunityId === selectedOpportunity.id && a.studentId === currentUser.id);
                        if (hasApplied) {
                          alert("You've already applied for this opportunity!");
                          return;
                        }
                        
                        const msg = prompt("Write a brief message for your application:");
                        if (msg) {
                          const newApp: Application = {
                            id: Date.now().toString(),
                            opportunityId: selectedOpportunity.id,
                            studentId: currentUser.id,
                            studentName: currentUser.name,
                            message: msg,
                            date: new Date().toLocaleDateString()
                          };
                          setApplications([...applications, newApp]);
                          alert("Application sent successfully!");
                        }
                      }}
                      className="w-full sm:w-auto flex-grow bg-utcn-blue text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      {applications.some(a => a.opportunityId === selectedOpportunity?.id && a.studentId === currentUser?.id) 
                        ? 'Applied ✓' 
                        : 'Apply Now'}
                    </button>
                  )}
                  {currentUser?.role === 'professor' && selectedOpportunity?.author.id === currentUser.id && (
                    <button onClick={() => setView('dashboard')} className="w-full sm:w-auto flex-grow bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                      View Applicants
                    </button>
                  )}
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
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow min-h-[50vh]">
              <Users size={48} className="text-gray-300 mb-4" />
              <h2 className="text-xl font-bold">Nothing here yet</h2>
              <button onClick={() => setView('list')} className="text-utcn-blue mt-2 hover:underline">Back to listings</button>
            </div>
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
