import { useState, useEffect, useMemo } from 'react';
import bcrypt from 'bcryptjs';
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

type View = 'login' | 'list' | 'detail' | 'create' | 'dashboard' | 'applications';

function loadSession(): { user: User; view: View } | null {
  try {
    const raw = localStorage.getItem('tucn_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.user?.id) return parsed;
  } catch { /* ignore */ }
  return null;
}

function savedOpportunities(): Opportunity[] | null {
  try {
    const raw = localStorage.getItem('tucn_opportunities');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch { /* ignore */ }
  return null;
}

export default function App() {
  // loadSession() is called once outside render cycle — safe because it's a module-level function
  const initialSession = loadSession();
  // 'detail' requires selectedOpportunity state which can't be restored from localStorage — fall back to safe view
  const safeInitialView: View = (initialSession?.view === 'detail' || !initialSession) ? (initialSession?.user?.role === 'professor' || initialSession?.user?.role === 'admin' ? 'dashboard' : 'list') : initialSession.view;

  // Redirect URL on mount: if no session and not already on /login, push /login
  // If session exists and URL is /login, push back to /
  useEffect(() => {
    const path = window.location.pathname;
    if (!initialSession && path !== '/login' && path !== '/admin') {
      window.history.replaceState({}, '', '/login');
    } else if (initialSession && path === '/login') {
      window.history.replaceState({}, '', '/');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [currentUser, setCurrentUser] = useState<User | null>(initialSession?.user ?? null);
  const [users, setUsers] = useState<User[]>([MOCK_ADMIN, MOCK_STUDENT, MOCK_STUDENT_2, { ...MOCK_PROFESSOR, approved: true }]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(savedOpportunities() ?? MOCK_OPPORTUNITIES);
  const [applications, setApplications] = useState<Application[]>([]);
  const [view, setView] = useState<View>(initialSession ? safeInitialView : 'login');
  
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
    const nextView: View = user.role === 'professor' ? 'dashboard' : user.role === 'admin' ? 'dashboard' : 'list';
    setView(nextView);
    try { localStorage.setItem('tucn_session', JSON.stringify({ user, view: nextView })); } catch { /* ignore */ }
    window.history.pushState({}, '', '/');
  };

  const handleSignup = (data: { name: string; role: 'student' | 'professor' | 'admin'; department?: string; email?: string; password?: string }) => {
    // Call backend API to create the user
    (async () => {
      try {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.name, email: data.email, password: data.password, role: data.role, department: data.department }),
        });
        const json = await res.json();
        if (!res.ok) {
          alert(json.error || 'Signup failed');
          return;
        }
        // backend returns created user info (id may be numeric)
        const created = json;
        const newUser: User = {
          id: String(created.id),
          name: created.name,
          role: created.role || data.role,
          avatar: `https://picsum.photos/seed/${encodeURIComponent(created.name)}/100/100`,
          department: created.department,
          approved: created.approved === 1 || created.approved === true,
          email: created.email,
        };
        const updated = [newUser, ...users.filter(u => u.email !== newUser.email)];
        setUsers(updated);
        try { localStorage.setItem('tucn_users', JSON.stringify(updated)); } catch (e) { /* ignore */ }
        if (newUser.role === 'student') {
          setCurrentUser(newUser);
          setView('list');
          try { localStorage.setItem('tucn_session', JSON.stringify({ user: newUser, view: 'list' })); } catch { /* ignore */ }
          window.history.pushState({}, '', '/');
        } else if (newUser.role === 'professor') {
          alert('Professor account created and pending admin approval. An admin must approve the account before you can post.');
        } else if (newUser.role === 'admin') {
          setCurrentUser(newUser);
          setView('dashboard');
        }
      } catch (err) {
        console.error(err);
        alert('Signup failed — check console for details');
      }
    })();
  };

  // Email/password login handler (called from LoginView via a small global hook)
  const handleLoginEmail = async (email: string, password: string, role: 'student' | 'professor' | 'admin') => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      let bodyText = '';
      let json: any = null;
      try { bodyText = await res.text(); json = JSON.parse(bodyText); } catch (e) { bodyText = bodyText || String(e); }
      if (!res.ok) {
        const err = new Error(json?.error || `Login failed (${res.status})`);
        // attach extra details
        (err as any).status = res.status;
        (err as any).body = json || bodyText;
        console.error('Login error details:', { status: res.status, body: json || bodyText });
        throw err;
      }
      const user = json.user || json;
      if (user.role !== role) {
        const err = new Error('Logged in user role mismatch');
        (err as any).status = 200;
        (err as any).body = user;
        console.error('Role mismatch on login:', user);
        throw err;
      }
      const cur: User = {
        id: String(user.id),
        name: user.name,
        role: user.role,
        avatar: `https://picsum.photos/seed/${encodeURIComponent(user.name)}/100/100`,
        department: user.department,
        approved: user.approved === 1 || user.approved === true,
        email: user.email,
      };
      setUsers(prev => {
        const merged = [cur, ...prev.filter(u => u.email !== cur.email)];
        try { localStorage.setItem('tucn_users', JSON.stringify(merged)); } catch (e) {}
        return merged;
      });
      setCurrentUser(cur);
      const nextView: View = cur.role === 'professor' ? 'dashboard' : cur.role === 'admin' ? 'dashboard' : 'list';
      setView(nextView);
      try { localStorage.setItem('tucn_session', JSON.stringify({ user: cur, view: nextView })); } catch { /* ignore */ }
      window.history.pushState({}, '', '/');
      loadApplications(cur).catch(() => {});
      return cur;
    } catch (err) {
      console.error('Login failed:', err);
      // propagate structured error so UI can display details
      const data = {
        message: err.message || 'Login failed',
        status: (err as any).status || null,
        body: (err as any).body || null,
      };
      throw data;
    }
  };

  // expose small global function for the simple login form in LoginView
  (window as any).__handleLoginEmail = handleLoginEmail;

  // When an admin logs in, fetch the full user list so the AdminDashboard is populated
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchAllUsers().catch(() => {});
    }
  }, [currentUser]);

  const approveProfessor = async (id: string) => {
    try {
      // ask backend to approve the professor so approval is persisted
      // if id is numeric string, send as number; otherwise include the user's email so backend can match
      const user = users.find(u => u.id === id);
      const payload: any = {};
      const asNum = Number(id);
      if (!Number.isNaN(asNum) && String(asNum) === String(id)) payload.id = asNum; else if (user && user.email) payload.email = user.email; else payload.id = id;
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('Failed to approve on server', res.status, json);
        alert(json.error || 'Failed to approve professor on server');
        return;
      }
      // update local state after successful server approval
      setUsers(prev => prev.map(u => u.id === id ? { ...u, approved: true } : u));
      try { localStorage.setItem('tucn_users', JSON.stringify(users.map(u => u.id === id ? { ...u, approved: true } : u))); } catch (e) { /* ignore */ }
      alert('Professor approved — they can now log in.');
    } catch (err) {
      console.error('Error approving professor', err);
      alert('Network error while approving — try again');
    }
  };

  // Admin: fetch all users from server
  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const json = await res.json();
      // server returns numeric ids; normalize to strings for local state
      const remoteUsers: User[] = (json.users || []).map((u: any) => ({ id: String(u.id), name: u.name, email: u.email, role: u.role, department: u.department, approved: !!u.approved, avatar: `https://picsum.photos/seed/${encodeURIComponent(u.name)}/100/100` }));
      setUsers(prev => {
        // merge remote users preferring server data
        const emails = new Set(remoteUsers.map(r => r.email));
        const merged = [...remoteUsers, ...prev.filter(p => !emails.has(p.email))];
        try { localStorage.setItem('tucn_users', JSON.stringify(merged)); } catch (e) {}
        return merged;
      });
    } catch (err) {
      console.error('Failed to fetch admin users', err);
    }
  };

  const deleteUser = async (key: string) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(key)}`, { method: 'DELETE' });
      const json = await res.json().catch(()=>({}));
      if (!res.ok) { alert(json.error || 'Failed to delete'); return; }
      setUsers(prev => prev.filter(u => u.id !== key && u.email !== key));
      alert('User deleted');
    } catch (err) {
      console.error('Delete user failed', err);
      alert('Network error deleting user');
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await fetch(`/api/opportunities/${encodeURIComponent(postId)}`, { method: 'DELETE' });
    } catch { /* ignore network error */ }
    setOpportunities(prev => prev.filter(p => p.id !== postId));
  };

  const updateApplicationStatus = async (
    appId: string,
    status: 'accepted' | 'rejected',
    professorReply: string,
  ) => {
    const replyDate = new Date().toLocaleDateString();
    try {
      await fetch(`/api/applications/${encodeURIComponent(appId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, professorReply, replyDate }),
      });
    } catch { /* ignore */ }
    setApplications(prev =>
      prev.map(a => a.id === appId ? { ...a, status, professorReply, replyDate } : a)
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowUserMenu(false);
    setView('login');
    try { localStorage.removeItem('tucn_session'); } catch { /* ignore */ }
    window.history.pushState({}, '', '/login');
  };

  const loadPostings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/opportunities');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.opportunities) && json.opportunities.length > 0) {
          setOpportunities(json.opportunities);
          try { localStorage.setItem('tucn_opportunities', JSON.stringify(json.opportunities)); } catch { /* ignore */ }
        }
      }
    } catch { /* server unreachable — keep localStorage / mock data */ }
    setIsLoading(false);
  };

  const loadApplications = async (forUser?: typeof currentUser) => {
    const user = forUser ?? currentUser;
    if (!user) return;
    try {
      const param = user.role === 'student' ? `?studentId=${encodeURIComponent(user.id)}` : '';
      const res = await fetch(`/api/applications${param}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.applications)) {
          setApplications(json.applications);
        }
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadPostings();
  }, []);

  useEffect(() => {
    if (currentUser) loadApplications(currentUser);
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // persist opportunities so professor-added posts survive a reload
  useEffect(() => {
    try {
      localStorage.setItem('tucn_opportunities', JSON.stringify(opportunities));
    } catch { /* ignore */ }
  }, [opportunities]);

  // keep the stored session view in sync whenever view changes (and user is logged in)
  useEffect(() => {
    if (currentUser) {
      try { localStorage.setItem('tucn_session', JSON.stringify({ user: currentUser, view })); } catch { /* ignore */ }
    }
  }, [view, currentUser]);

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
              updateApplicationStatus={updateApplicationStatus}
              setView={setView}
            />
          ) : view === 'dashboard' && currentUser?.role === 'admin' ? (
            // Admin dashboard for approving professor accounts and managing users/posts
            <AdminDashboard
              users={users}
              opportunities={opportunities}
              approveProfessor={approveProfessor}
              fetchAllUsers={fetchAllUsers}
              deleteUser={deleteUser}
              deletePost={deletePost}
            />
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
          onSubmit={async (message, answers, cvFile, transcriptFile) => {
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
            // Persist to backend so professor sees the application
            const res = await fetch('/api/applications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                opportunityId: newApp.opportunityId,
                studentId: newApp.studentId,
                studentName: newApp.studentName,
                message: newApp.message,
                answers: newApp.answers,
                cvFile: newApp.cvFile,
                transcriptFile: newApp.transcriptFile,
              }),
            });
            if (!res.ok) {
              const errJson = await res.json().catch(() => ({}));
              throw new Error(errJson.error || `Server error ${res.status}`);
            }
            const json = await res.json().catch(() => ({}));
            if (json.id) newApp.id = String(json.id);
            setApplications(prev => [...prev, newApp]);
            setApplyModalOpen(false);
          }}
          onClose={() => setApplyModalOpen(false)}
        />
      )}
    </div>
  );
}
