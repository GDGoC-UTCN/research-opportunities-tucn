import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { MOCK_OPPORTUNITIES, MOCK_APPLICATIONS, Opportunity, User, MOCK_STUDENT, MOCK_STUDENT_2, MOCK_PROFESSOR, MOCK_ADMIN, Application, UploadedFile } from './types';
import AdminDashboard from './components/admin/AdminDashboard';

// Extracted Components
import LoginView from './components/common/LoginView';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import OpportunityList from './components/common/OpportunityList';
import OpportunityDetail from './components/common/OpportunityDetail';
import CreateOpportunity from './components/teacher/CreateOpportunity';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import StudentApplications from './components/student/StudentApplications';
import ApplicationModal from './components/student/ApplicationModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([MOCK_ADMIN, MOCK_STUDENT, MOCK_STUDENT_2, { ...MOCK_PROFESSOR, approved: true }]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(MOCK_OPPORTUNITIES);
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [view, setView] = useState<'login' | 'list' | 'detail' | 'create' | 'dashboard' | 'applications'>('login');
  
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  const handleLogin = (role: 'student' | 'professor' | 'admin') => {
    // simple demo login: pick first user with the role who is approved (professors need approved=true)
    const user = users.find(u => u.role === role && (u.role !== 'professor' || u.approved));
    if (!user) {
      alert('No account available for this role (or awaiting approval). Create an account or ask admin to approve.');
      return;
    }
    setCurrentUser(user);
    setView(user.role === 'professor' ? 'dashboard' : user.role === 'admin' ? 'dashboard' : 'list');
  };

  const handleSignup = (data: { name: string; role: 'student' | 'professor'; department?: string }) => {
    const id = Date.now().toString();
    const newUser: User = {
      id,
      name: data.name,
      role: data.role,
      avatar: `https://picsum.photos/seed/${encodeURIComponent(data.name)}/100/100`,
      department: data.department,
      approved: data.role === 'student' ? true : false,
    };
    const updated = [newUser, ...users];
    setUsers(updated);
    localStorage.setItem('tucn_users', JSON.stringify(updated));
    if (newUser.role === 'student') {
      setCurrentUser(newUser);
      setView('list');
    } else {
      alert('Professor account created and pending admin approval. An admin must approve the account before you can post.');
    }
  };

  // Email/password login handler (called from LoginView via a small global hook)
  const handleLoginEmail = (email: string, password: string, role: 'student' | 'professor' | 'admin') => {
    const user = users.find(u => u.email === email && u.password === password && u.role === role && (role !== 'professor' || u.approved));
    if (!user) {
      alert('Invalid credentials or account not approved.');
      return;
    }
    setCurrentUser(user);
    setView(user.role === 'professor' ? 'dashboard' : user.role === 'admin' ? 'dashboard' : 'list');
  };

  // expose small global function for the simple login form in LoginView
  (window as any).__handleLoginEmail = handleLoginEmail;

  const approveProfessor = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, approved: true } : u));
    alert('Professor approved — they can now log in.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowUserMenu(false);
    setView('login');
  };

  const loadPostings = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
  };

  useEffect(() => {
    loadPostings();
  }, []);

  // load users from localStorage (if present)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tucn_users');
      if (raw) {
        const parsed = JSON.parse(raw) as User[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUsers(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // persist users whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('tucn_users', JSON.stringify(users));
    } catch (e) {
      // ignore
    }
  }, [users]);

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
    return <LoginView handleLogin={handleLogin} handleSignup={handleSignup} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-800">
      <Header 
        currentUser={currentUser} 
        setView={setView} 
        showUserMenu={showUserMenu} 
        setShowUserMenu={setShowUserMenu} 
        handleLogout={handleLogout} 
      />

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <OpportunityList 
              opportunities={opportunities}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeTags={activeTags}
              toggleTag={toggleTag}
              allTags={allTags}
              showFilterMenu={showFilterMenu}
              setShowFilterMenu={setShowFilterMenu}
              paginatedOpportunities={paginatedOpportunities}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              handleCardClick={handleCardClick}
            />
          ) : view === 'create' && currentUser?.role === 'professor' ? (
            <CreateOpportunity 
              currentUser={currentUser}
              opportunities={opportunities}
              setOpportunities={setOpportunities}
              setView={setView}
            />
          ) : view === 'dashboard' && currentUser?.role === 'professor' ? (
            <TeacherDashboard 
              currentUser={currentUser}
              opportunities={opportunities}
              applications={applications}
              setApplications={setApplications}
              setView={setView}
            />
          ) : view === 'dashboard' && currentUser?.role === 'admin' ? (
            // Admin dashboard for approving professor accounts
            <AdminDashboard users={users} approveProfessor={approveProfessor} />
          ) : view === 'detail' && selectedOpportunity ? (
            <OpportunityDetail 
              selectedOpportunity={selectedOpportunity}
              currentUser={currentUser}
              applications={applications}
              setView={setView}
              handleBack={handleBack}
              setApplyModalOpen={setApplyModalOpen}
            />
          ) : view === 'applications' && currentUser?.role === 'student' ? (
            <StudentApplications 
              currentUser={currentUser}
              opportunities={opportunities}
              applications={applications}
              setView={setView}
              setSelectedOpportunity={setSelectedOpportunity}
            />
          ) : null}
        </AnimatePresence>
      </main>

      <Footer />

      {applyModalOpen && selectedOpportunity && currentUser && (
        <ApplicationModal
          opportunity={selectedOpportunity}
          onSubmit={(message, answers, cvFile, transcriptFile) => {
            const newApp: Application = {
              id: Date.now().toString(),
              opportunityId: selectedOpportunity.id,
              studentId: currentUser.id,
              studentName: currentUser.name,
              message: message,
              date: new Date().toLocaleDateString(),
              status: 'pending',
              answers,
              cvFile,
              transcriptFile,
            };
            setApplications([...applications, newApp]);
            setApplyModalOpen(false);
          }}
          onClose={() => setApplyModalOpen(false)}
        />
      )}
    </div>
  );
}
