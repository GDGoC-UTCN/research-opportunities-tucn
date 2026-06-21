import { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { MOCK_OPPORTUNITIES, Opportunity, User, Application, UserProfile, ApplicationDocumentOptions, MyOpportunities } from './types';
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
import ProfilePage from './components/profile/ProfilePage';
import HowItWorks from './components/info/HowItWorks';
import ForProfessors from './components/info/ForProfessors';
import Faqs from './components/info/Faqs';
import ProfessorsDirectory from './components/professors/ProfessorsDirectory';
import ProfessorProfile from './components/professors/ProfessorProfile';
import RecommendedForYou from './components/common/RecommendedForYou';
import NotificationsPage from './components/common/NotificationsPage';
import { apiFetch, resetCsrfToken } from './api';

// Demo mode is opt-in for local demos only. Production builds leave
// VITE_DEMO_MODE unset/"false" so Browse only ever shows real opportunities
// returned by the API — never bundled mock data.
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const INITIAL_OPPORTUNITIES: Opportunity[] = DEMO_MODE ? MOCK_OPPORTUNITIES : [];

type View = 'login' | 'list' | 'detail' | 'create' | 'dashboard' | 'applications' | 'profile' | 'howItWorks' | 'forProfessors' | 'faqs' | 'professors' | 'professorDetail' | 'notifications' | 'notFound';

function parseRoute(pathname: string): { view: View; opportunityId?: string; professorId?: string } {
  if (pathname === '/login' || pathname === '/admin') return { view: 'login' };
  if (pathname === '/profile') return { view: 'profile' };
  if (pathname === '/applications') return { view: 'applications' };
  if (pathname === '/create') return { view: 'create' };
  if (pathname === '/how-it-works') return { view: 'howItWorks' };
  if (pathname === '/for-professors') return { view: 'forProfessors' };
  if (pathname === '/faqs') return { view: 'faqs' };
  if (pathname === '/notifications') return { view: 'notifications' };
  if (pathname === '/professors') return { view: 'professors' };
  const profMatch = pathname.match(/^\/professors\/([^/]+)$/);
  if (profMatch) return { view: 'professorDetail', professorId: decodeURIComponent(profMatch[1]) };
  if (pathname === '/opportunities' || pathname === '/') return { view: 'list' };
  const match = pathname.match(/^\/opportunities\/([^/]+)$/);
  if (match) return { view: 'detail', opportunityId: decodeURIComponent(match[1]) };
  return { view: 'notFound' };
}

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

const EMPTY_MY_OPPORTUNITIES: MyOpportunities = {
  saved: [],
  applied: [],
  accepted: [],
  rejected: [],
};

export default function App() {
  const initialRoute = parseRoute(window.location.pathname);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const currentUserRef = useRef<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(INITIAL_OPPORTUNITIES);
  const [loadError, setLoadError] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myOpportunities, setMyOpportunities] = useState<MyOpportunities>(EMPTY_MY_OPPORTUNITIES);
  const [savedOpportunityIds, setSavedOpportunityIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<View>(initialRoute.view);
  
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [pendingApplyOpportunityId, setPendingApplyOpportunityId] = useState<string | null>(null);
  const [pendingSaveOpportunityId, setPendingSaveOpportunityId] = useState<string | null>(null);
  const [pendingQuestionOpportunityId, setPendingQuestionOpportunityId] = useState<string | null>(null);
  const [selectedProfessorId, setSelectedProfessorId] = useState<string | null>(initialRoute.professorId ?? null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 2500);
  };

  const pushPath = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  const goToLogin = () => {
    setView('login');
    setShowUserMenu(false);
    pushPath('/login');
  };

  const goToList = () => {
    setView('list');
    setSelectedOpportunity(null);
    setShowUserMenu(false);
    pushPath('/opportunities');
  };

  // Generic SPA navigation used by the footer Quick Links and informational
  // pages. These routes are public, so no auth gating is applied here.
  const navigateToPath = (path: string) => {
    const route = parseRoute(path);
    setSelectedOpportunity(null);
    setApplyModalOpen(false);
    setShowUserMenu(false);
    if (route.professorId) setSelectedProfessorId(route.professorId);
    if (route.opportunityId) {
      loadOpportunityById(route.opportunityId);
    } else {
      setView(route.view);
    }
    pushPath(path);
    window.scrollTo(0, 0);
  };

  const openProfessor = (professorId: string) => {
    setSelectedProfessorId(professorId);
    setSelectedOpportunity(null);
    setShowUserMenu(false);
    setView('professorDetail');
    pushPath(`/professors/${encodeURIComponent(professorId)}`);
    window.scrollTo(0, 0);
  };

  const goToProfessors = () => {
    setShowUserMenu(false);
    setView('professors');
    pushPath('/professors');
    window.scrollTo(0, 0);
  };

  // "Create professor account" CTA: open the login/signup screen with the
  // professor role preselected in signup mode.
  const goToProfessorSignup = () => {
    setShowUserMenu(false);
    setView('login');
    window.history.pushState({}, '', '/login?role=professor&signup=1');
  };

  // Send approved professors / admins to their dashboard. Admins have a stable
  // /admin URL; professor dashboards have no dedicated path in this app, so we
  // mirror the existing Header behavior and keep the home path.
  const goToDashboard = () => {
    setShowUserMenu(false);
    setView('dashboard');
    if (currentUser?.role === 'admin') pushPath('/admin');
    else pushPath('/opportunities');
  };

  const continuePendingApply = (user: User, fallbackView: View) => {
    // Returning from "Sign in to ask a question" — go back to the opportunity.
    if (pendingQuestionOpportunityId) {
      const oppId = pendingQuestionOpportunityId;
      setPendingQuestionOpportunityId(null);
      pushPath(`/opportunities/${encodeURIComponent(oppId)}`);
      loadOpportunityById(oppId);
      return;
    }
    if (user.role === 'student' && pendingApplyOpportunityId) {
      const pending = opportunities.find(opp => opp.id === pendingApplyOpportunityId)
        || (selectedOpportunity?.id === pendingApplyOpportunityId ? selectedOpportunity : null);
      if (pending) {
        setSelectedOpportunity(pending);
        setView('detail');
        setApplyModalOpen(true);
        setPendingApplyOpportunityId(null);
        pushPath(`/opportunities/${encodeURIComponent(pending.id)}`);
        return;
      }
    }

    setView(fallbackView);
    pushPath(fallbackView === 'dashboard' && user.role === 'admin' ? '/admin' : '/');
  };

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
          currentUserRef.current = newUser;
          continuePendingApply(newUser, 'list');
          await completePendingSave();
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
      currentUserRef.current = cur;
      const nextView = homeViewFor(cur);
      continuePendingApply(cur, nextView);
      await completePendingSave();
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
      if (user && user.email) payload.email = user.email;
      else payload.id = String(id);
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
    currentUserRef.current = null;
    setApplications([]);
    setProfile(null);
    setMyOpportunities(EMPTY_MY_OPPORTUNITIES);
    setSavedOpportunityIds(new Set());
    setShowUserMenu(false);
    setApplyModalOpen(false);
    setPendingApplyOpportunityId(null);
    setPendingSaveOpportunityId(null);
    setPendingQuestionOpportunityId(null);
    goToList();
  };

  const loadPostings = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/opportunities');
      if (res.ok) {
        const json = await res.json();
        const list: Opportunity[] = Array.isArray(json.opportunities) ? json.opportunities : [];
        // In demo mode only, fall back to mock data when the API has none.
        setOpportunities(list.length === 0 && DEMO_MODE ? MOCK_OPPORTUNITIES : list);
        setLoadError(false);
      } else {
        // Never silently show fake data in production on an error response.
        setOpportunities(DEMO_MODE ? MOCK_OPPORTUNITIES : []);
        setLoadError(true);
      }
    } catch {
      setOpportunities(DEMO_MODE ? MOCK_OPPORTUNITIES : []);
      setLoadError(true);
    }
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

  const loadProfile = async () => {
    if (!currentUser) return null;
    try {
      const res = await apiFetch('/api/profile');
      if (!res.ok) return null;
      const json = await res.json();
      setProfile(json.profile);
      if (json.profile?.avatar) {
        setCurrentUser(prev => prev ? { ...prev, avatar: `/api/profile/avatar?v=${Date.now()}` } : prev);
      }
      return json.profile as UserProfile;
    } catch {
      return null;
    }
  };

  const loadMyOpportunities = async (forUser?: typeof currentUser) => {
    const user = forUser ?? currentUser;
    if (!user || user.role !== 'student') {
      setMyOpportunities(EMPTY_MY_OPPORTUNITIES);
      setSavedOpportunityIds(new Set());
      return EMPTY_MY_OPPORTUNITIES;
    }
    try {
      const res = await apiFetch('/api/profile/my-opportunities');
      if (!res.ok) return EMPTY_MY_OPPORTUNITIES;
      const json = await res.json();
      const data: MyOpportunities = {
        saved: Array.isArray(json.saved) ? json.saved : [],
        applied: Array.isArray(json.applied) ? json.applied : [],
        accepted: Array.isArray(json.accepted) ? json.accepted : [],
        rejected: Array.isArray(json.rejected) ? json.rejected : [],
      };
      setMyOpportunities(data);
      const saved = data.saved;
      setSavedOpportunityIds(new Set(saved.map(item => item.opportunity.id)));
      return data;
    } catch {
      return EMPTY_MY_OPPORTUNITIES;
    }
  };

  const loadOpportunityById = async (id: string) => {
    try {
      const res = await apiFetch(`/api/opportunities/${encodeURIComponent(id)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.opportunity) {
        setSelectedOpportunity(null);
        setView('notFound');
        return null;
      }
      setSelectedOpportunity(json.opportunity);
      setOpportunities(prev => prev.some(opp => opp.id === json.opportunity.id) ? prev : [json.opportunity, ...prev]);
      setView('detail');
      return json.opportunity as Opportunity;
    } catch {
      const local = opportunities.find(opp => opp.id === id);
      if (local) {
        setSelectedOpportunity(local);
        setView('detail');
        return local;
      }
      setSelectedOpportunity(null);
      setView('notFound');
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      let authenticatedUser: User | null = null;
      try {
        const res = await apiFetch('/api/me');
        if (res.ok) {
          const json = await res.json();
          const user = normalizeUser(json.user);
          authenticatedUser = user;
          setCurrentUser(user);
          currentUserRef.current = user;
          if (window.location.pathname === '/admin') {
            setView(user.role === 'admin' ? 'dashboard' : 'list');
            if (user.role !== 'admin') window.history.replaceState({}, '', '/');
          } else if (window.location.pathname === '/login') {
            setView(homeViewFor(user));
            window.history.replaceState({}, '', user.role === 'admin' ? '/admin' : '/');
          } else if (window.location.pathname === '/profile') {
            setView('profile');
          }
        }
      } catch {
        setCurrentUser(null);
        currentUserRef.current = null;
        if (window.location.pathname === '/admin' || window.location.pathname === '/profile') setView('login');
      } finally {
        const route = parseRoute(window.location.pathname);
        if (route.opportunityId) {
          await loadOpportunityById(route.opportunityId);
        } else if (route.view === 'notFound') {
          setView('notFound');
        } else if (!authenticatedUser && ['profile', 'applications', 'create'].includes(route.view)) {
          setView('login');
          window.history.replaceState({}, '', '/login');
        }
        setAuthChecked(true);
      }
    })();
    loadPostings();
    const handlePopState = () => {
      const route = parseRoute(window.location.pathname);
      if (route.opportunityId) {
        loadOpportunityById(route.opportunityId);
      } else {
        setSelectedOpportunity(null);
        setApplyModalOpen(false);
        if (route.professorId) setSelectedProfessorId(route.professorId);
        if (['profile', 'applications', 'create'].includes(route.view) && !currentUserRef.current) setView('login');
        else setView(route.view);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    currentUserRef.current = currentUser;
    if (currentUser) {
      loadApplications(currentUser);
      loadProfile();
      loadMyOpportunities(currentUser);
    } else {
      setMyOpportunities(EMPTY_MY_OPPORTUNITIES);
      setSavedOpportunityIds(new Set());
    }
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
    pushPath(`/opportunities/${encodeURIComponent(opp.id)}`);
    window.scrollTo(0, 0);
  };

  const handleApplyClick = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    if (!currentUser) {
      setPendingApplyOpportunityId(opp.id);
      goToLogin();
      return;
    }

    if (currentUser.role !== 'student') {
      alert('Only student accounts can apply to opportunities.');
      return;
    }

    const hasApplied = applications.some(a => a.opportunityId === opp.id && a.studentId === currentUser.id);
    if (hasApplied) {
      alert("You've already applied for this opportunity!");
      return;
    }

    setApplyModalOpen(true);
  };

  const applicationStatusForOpportunity = (opportunityId: string) => {
    if (currentUser?.role !== 'student') return undefined;
    return applications.find(app => app.opportunityId === opportunityId && app.studentId === currentUser.id)?.status;
  };

  const handleBack = () => {
    setView('list');
    setSelectedOpportunity(null);
    pushPath('/opportunities');
    window.scrollTo(0, 0);
  };

  const handleShareOpportunity = async (opp: Opportunity) => {
    const url = `${window.location.origin}/opportunities/${encodeURIComponent(opp.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: opp.title, text: opp.description, url });
        showToast('Link shared');
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast('Link copied');
    } catch {
      window.prompt('Copy this link', url);
    }
  };

  const saveOpportunityById = async (opportunityId: string) => {
    const res = await apiFetch(`/api/profile/saved-opportunities/${encodeURIComponent(opportunityId)}`, { method: 'POST' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || 'Failed to save opportunity');
    }
    if (json.alreadyApplied) {
      setSavedOpportunityIds(prev => {
        const next = new Set(prev);
        next.delete(opportunityId);
        return next;
      });
      return json;
    }
    setSavedOpportunityIds(prev => new Set(prev).add(opportunityId));
    return json;
  };

  const handleToggleSave = async (opp: Opportunity) => {
    if (!currentUser) {
      setPendingSaveOpportunityId(opp.id);
      setSelectedOpportunity(opp);
      goToLogin();
      return;
    }

    const alreadySaved = savedOpportunityIds.has(opp.id);
    try {
      if (alreadySaved) {
        const res = await apiFetch(`/api/profile/saved-opportunities/${encodeURIComponent(opp.id)}`, { method: 'DELETE' });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || 'Failed to remove saved opportunity');
        }
        setSavedOpportunityIds(prev => {
          const next = new Set(prev);
          next.delete(opp.id);
          return next;
        });
        setMyOpportunities(prev => ({
          ...prev,
          saved: prev.saved.filter(item => item.opportunity.id !== opp.id),
        }));
        await loadMyOpportunities();
        showToast('Removed from saved opportunities');
      } else {
        const json = await saveOpportunityById(opp.id);
        await loadMyOpportunities();
        showToast(json?.alreadyApplied ? `Already ${json.status || 'applied'}` : 'Saved for later');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update saved opportunity');
    }
  };

  const completePendingSave = async () => {
    if (!pendingSaveOpportunityId) return;
    try {
      await saveOpportunityById(pendingSaveOpportunityId);
      await loadMyOpportunities();
      const savedOpportunity = opportunities.find(opp => opp.id === pendingSaveOpportunityId)
        || (selectedOpportunity?.id === pendingSaveOpportunityId ? selectedOpportunity : null);
      if (savedOpportunity) {
        setSelectedOpportunity(savedOpportunity);
        setView('detail');
        pushPath(`/opportunities/${encodeURIComponent(savedOpportunity.id)}`);
      }
      showToast('Saved for later');
    } catch {
      showToast('Sign in complete. Please try saving again.');
    } finally {
      setPendingSaveOpportunityId(null);
    }
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
        onNavigate={navigateToPath}
      />

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <OpportunityList
              opportunities={opportunities}
              isLoading={isLoading}
              loadError={loadError}
              onRetry={loadPostings}
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
              savedOpportunityIds={savedOpportunityIds}
              applicationStatusForOpportunity={applicationStatusForOpportunity}
              handleToggleSave={handleToggleSave}
              handleShareOpportunity={handleShareOpportunity}
              onOpenProfessor={openProfessor}
              afterHero={
                <RecommendedForYou
                  currentUser={currentUser}
                  handleCardClick={handleCardClick}
                  savedOpportunityIds={savedOpportunityIds}
                  applicationStatusForOpportunity={applicationStatusForOpportunity}
                  handleToggleSave={handleToggleSave}
                  handleShareOpportunity={handleShareOpportunity}
                  onEditInterests={() => { setView('profile'); pushPath('/profile'); window.scrollTo(0, 0); }}
                  onSignIn={goToLogin}
                />
              }
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
              setOpportunities={setOpportunities}
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
              handleApplyClick={handleApplyClick}
              saved={savedOpportunityIds.has(selectedOpportunity.id)}
              applicationStatus={applicationStatusForOpportunity(selectedOpportunity.id)}
              handleToggleSave={handleToggleSave}
              handleShareOpportunity={handleShareOpportunity}
              onSignInToAsk={() => { setPendingQuestionOpportunityId(selectedOpportunity.id); goToLogin(); }}
              onOpenProfessor={openProfessor}
            />
          ) : view === 'applications' && currentUser?.role === 'student' ? (
            <StudentApplications 
              currentUser={currentUser}
              applications={applications}
              myOpportunities={myOpportunities}
              setView={setView}
              onViewOpportunity={handleCardClick}
              onApplyOpportunity={handleApplyClick}
              onRemoveSavedOpportunity={handleToggleSave}
            />
          ) : view === 'profile' && currentUser ? (
            <ProfilePage
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              setView={setView}
            />
          ) : view === 'howItWorks' ? (
            <HowItWorks onBrowse={goToList} />
          ) : view === 'forProfessors' ? (
            <ForProfessors
              currentUser={currentUser}
              onCreateAccount={goToProfessorSignup}
              onGoToDashboard={goToDashboard}
              onBrowse={goToList}
            />
          ) : view === 'faqs' ? (
            <Faqs onBrowse={goToList} />
          ) : view === 'professors' ? (
            <ProfessorsDirectory onOpenProfessor={openProfessor} />
          ) : view === 'professorDetail' && selectedProfessorId ? (
            <ProfessorProfile
              professorId={selectedProfessorId}
              onBack={goToProfessors}
              handleCardClick={handleCardClick}
              savedOpportunityIds={savedOpportunityIds}
              applicationStatusForOpportunity={applicationStatusForOpportunity}
              handleToggleSave={handleToggleSave}
              handleShareOpportunity={handleShareOpportunity}
            />
          ) : view === 'notifications' && currentUser ? (
            <NotificationsPage onNavigate={navigateToPath} />
          ) : view === 'notFound' ? (
            <div className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
              <h1 className="text-xl font-bold text-gray-900">Opportunity not found</h1>
              <p className="mt-2 text-sm text-gray-500">The opportunity link may be outdated or the post may have been removed.</p>
              <button onClick={goToList} className="mt-5 px-4 py-2 rounded-xl bg-utcn-primary text-white text-sm font-semibold hover:bg-utcn-primary-dark">
                Browse opportunities
              </button>
            </div>
          ) : null}
        </AnimatePresence>
      </main>

      <Footer onNavigate={navigateToPath} />

      {applyModalOpen && selectedOpportunity && currentUser && (
        <ApplicationModal
          opportunity={selectedOpportunity}
          profile={profile}
          onProfileRefresh={loadProfile}
          onSubmit={async (message, answers, cvFile, transcriptFile, documentOptions: ApplicationDocumentOptions) => {
            const formData = new FormData();
            formData.append('opportunityId', selectedOpportunity.id);
            formData.append('message', message);
            formData.append('answers', JSON.stringify(answers));
            formData.append('useProfileCv', String(documentOptions.useProfileCv));
            formData.append('useProfileTranscript', String(documentOptions.useProfileTranscript));
            formData.append('saveUploadedCvToProfile', String(documentOptions.saveUploadedCvToProfile));
            formData.append('saveUploadedTranscriptToProfile', String(documentOptions.saveUploadedTranscriptToProfile));
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
            await loadProfile();
            await loadMyOpportunities(currentUser);
            setSavedOpportunityIds(prev => {
              const next = new Set(prev);
              next.delete(selectedOpportunity.id);
              return next;
            });
            setApplyModalOpen(false);
          }}
          onClose={() => setApplyModalOpen(false)}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
