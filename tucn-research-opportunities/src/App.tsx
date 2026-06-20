import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { MOCK_OPPORTUNITIES, Opportunity, User, Application } from './types';
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
import { apiFetch, resetCsrfToken } from './api';

type View = 'login' | 'list' | 'detail' | 'create' | 'dashboard' | 'applications';

function normalizeUser(user: any): User {
  return {
    id: String(user.id),
    name: user.name,
    role: user.role,
    avatar: `https://picsum.photos/seed/${encodeURIComponent(user.name)}/100/100`,
    department: user.department,
    approved: user.approved === 1 || user.approved === true,
    email: user.email,
  };
}

function homeViewFor(user: User): View {
  return user.role === 'professor' || user.role === 'admin' ? 'dashboard' : 'list';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(MOCK_OPPORTUNITIES);
  const [applications, setApplications] = useState<Application[]>([]);
  const [view, setView] = useState<View>('login');
  
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  const handleSignup = (data: { name: string; role: 'student' | 'professor' | 'admin'; department?: string; email?: string; password?: string }) => {
    // Call backend API to create the user
    (async () => {
      try {
        const res = await apiFetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.name, email: data.email, password: data.password, role: data.role, department: data.department }),
        });
        const json = await res.json();
        if (!res.ok) {
          alert(json.error || 'Signup failed');
          return;
        }
        const newUser = normalizeUser(json.user || json);
        if (newUser.role === 'student') {
          setCurrentUser(newUser);
          setView('list');
          window.history.pushState({}, '', '/');
        } else if (newUser.role === 'professor') {
          alert('Professor account created and pending admin approval. An admin must approve the account before you can post.');
        } else if (newUser.role === 'admin') {
          alert('Admin accounts cannot be created through public signup.');
        }
      } catch (err) {
        console.error(err);
        alert('Signup failed — check console for details');
      }
    })();
  };

  const handleLoginEmail = async (email: string, password: string, role: 'student' | 'professor' | 'admin') => {
    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      let bodyText = '';
      let json: any = null;
      try { bodyText = await res.text(); json = JSON.parse(bodyText); } catch (e) { bodyText = bodyText || String(e); }
      if (!res.ok) {
        const err = new Error(json?.error || `Login failed (${res.status})`);
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
      const cur = normalizeUser(user);
      setCurrentUser(cur);
      const nextView = homeViewFor(cur);
      setView(nextView);
      window.history.pushState({}, '', '/');
      loadApplications(cur).catch(() => {});
      return cur;
    } catch (err) {
      console.error('Login failed:', err);
      const data = {
        message: err.message || 'Login failed',
        status: (err as any).status || null,
        body: (err as any).body || null,
      };
      throw data;
    }
  };

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
      const res = await apiFetch('/api/admin/approve', {
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
      alert('Professor approved — they can now log in.');
    } catch (err) {
      console.error('Error approving professor', err);
      alert('Network error while approving — try again');
    }
  };

  // Admin: fetch all users from server
  const fetchAllUsers = async () => {
    try {
      const res = await apiFetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const json = await res.json();
      // server returns numeric ids; normalize to strings for local state
      const remoteUsers: User[] = (json.users || []).map(normalizeUser);
      setUsers(remoteUsers);
    } catch (err) {
      console.error('Failed to fetch admin users', err);
    }
  };

  const deleteUser = async (key: string) => {
    try {
      const res = await apiFetch(`/api/admin/users/${encodeURIComponent(key)}`, { method: 'DELETE' });
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
      const res = await apiFetch(`/api/opportunities/${encodeURIComponent(postId)}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.error || 'Failed to delete post');
        return;
      }
    } catch {
      alert('Network error deleting post');
      return;
    }
    setOpportunities(prev => prev.filter(p => p.id !== postId));
  };

  const updateApplicationStatus = async (
    appId: string,
    status: 'accepted' | 'rejected',
    professorReply: string,
  ) => {
    const replyDate = new Date().toLocaleDateString();
    try {
      const res = await apiFetch(`/api/applications/${encodeURIComponent(appId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, professorReply, replyDate }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.error || 'Failed to update application');
        return;
      }
    } catch {
      alert('Network error while updating application');
      return;
    }
    setApplications(prev =>
      prev.map(a => a.id === appId ? { ...a, status, professorReply, replyDate } : a)
    );
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/logout', { method: 'POST' });
    } catch { /* ignore */ }
    resetCsrfToken();
    setCurrentUser(null);
    setApplications([]);
    setShowUserMenu(false);
    setView('login');
    window.history.pushState({}, '', '/login');
  };

  const loadPostings = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/opportunities');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.opportunities) && json.opportunities.length > 0) {
          setOpportunities(json.opportunities);
        }
      }
    } catch { /* server unreachable — keep mock data */ }
    setIsLoading(false);
  };

  const loadApplications = async (forUser?: typeof currentUser) => {
    const user = forUser ?? currentUser;
    if (!user) return;
    try {
      const res = await apiFetch('/api/applications');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.applications)) {
          setApplications(json.applications);
        }
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/me');
        if (res.ok) {
          const json = await res.json();
          const user = normalizeUser(json.user);
          setCurrentUser(user);
          setView(homeViewFor(user));
          if (window.location.pathname === '/login') {
            window.history.replaceState({}, '', '/');
          }
        } else if (window.location.pathname !== '/login' && window.location.pathname !== '/admin') {
          window.history.replaceState({}, '', '/login');
        }
      } catch {
        if (window.location.pathname !== '/login' && window.location.pathname !== '/admin') {
          window.history.replaceState({}, '', '/login');
        }
      } finally {
        setAuthChecked(true);
      }
    })();
    loadPostings();
  }, []);

  useEffect(() => {
    if (currentUser) loadApplications(currentUser);
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!authChecked) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (view === 'login') {
    return <LoginView handleLoginEmail={handleLoginEmail} handleSignup={handleSignup} />;
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
            const formData = new FormData();
            formData.append('opportunityId', selectedOpportunity.id);
            formData.append('message', message);
            formData.append('answers', JSON.stringify(answers));
            if (cvFile?.file) formData.append('cv', cvFile.file);
            if (transcriptFile?.file) formData.append('transcript', transcriptFile.file);

            const res = await apiFetch('/api/applications', {
              method: 'POST',
              body: formData,
            });
            if (!res.ok) {
              const errJson = await res.json().catch(() => ({}));
              throw new Error(errJson.error || `Server error ${res.status}`);
            }
            await loadApplications(currentUser);
            setApplyModalOpen(false);
          }}
          onClose={() => setApplyModalOpen(false)}
        />
      )}
    </div>
  );
}
