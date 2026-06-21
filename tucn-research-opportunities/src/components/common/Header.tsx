import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, CheckCircle2, User as UserIcon, ChevronDown, Plus, LogOut, LayoutDashboard, LogIn, Settings, Bell, Check } from 'lucide-react';
import { User } from '../../types';
import { apiFetch } from '../../api';
import Logo from './Logo';

interface Props {
  currentUser: User | null;
  setView: (view: 'login' | 'list' | 'detail' | 'create' | 'dashboard' | 'applications' | 'profile') => void;
  showUserMenu: boolean;
  setShowUserMenu: (show: boolean) => void;
  handleLogout: () => void;
}

export default function Header({ currentUser, setView, showUserMenu, setShowUserMenu, handleLogout }: Props) {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const homeView = currentUser?.role === 'professor' ? 'dashboard' : currentUser?.role === 'admin' ? 'dashboard' : 'list';

  React.useEffect(() => {
    if (currentUser) {
      apiFetch('/api/notifications').then(r => r.json()).then(data => {
        if (data.notifications) setNotifications(data.notifications);
      }).catch(console.error);
    } else {
      setNotifications([]);
    }
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: 1 } : n));
  };

  const markAllAsRead = async () => {
    await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
  };
  const navigate = (view: 'login' | 'list' | 'detail' | 'create' | 'dashboard' | 'applications' | 'profile') => {
    setView(view);
    setShowUserMenu(false);
    if (view === 'login') window.history.pushState({}, '', '/login');
    if (view === 'list') window.history.pushState({}, '', '/opportunities');
    if (view === 'dashboard' && currentUser?.role === 'admin') window.history.pushState({}, '', '/admin');
    if (view === 'profile') window.history.pushState({}, '', '/profile');
  };

  return (
    <div className="bg-utcn-navy text-white border-b border-white/10">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-utcn-red/70 to-transparent" />
      <header className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[4.25rem]">

          {/* Logo + Title */}
          <button
            className="flex items-center gap-3 cursor-pointer group focus:outline-none"
            onClick={() => navigate(homeView)}
          >
            <Logo />
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-white/45 group-hover:text-white/70 transition-colors">AIRi@UTCN</span>
              <span className="text-base font-display text-white group-hover:text-white/80 transition-colors whitespace-nowrap">Research Opportunities</span>
            </div>
          </button>

          {/* Right side nav */}
          <div className="flex items-center gap-2">

            {/* Inline nav pills (md+) */}
            {!currentUser && (
              <nav className="hidden md:flex items-center gap-1 mr-2">
                <button onClick={() => navigate('list')} className="text-sm text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors font-medium">
                  Browse
                </button>
                <button
                  onClick={() => navigate('login')}
                  className="text-sm bg-white text-zinc-900 hover:bg-zinc-200 px-3.5 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 ml-1"
                >
                  <LogIn size={14} />
                  Sign in
                </button>
              </nav>
            )}
            {currentUser?.role === 'student' && (
              <nav className="hidden md:flex items-center gap-1 mr-2">
                <button onClick={() => navigate('list')} className="text-sm text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors font-medium">
                  Browse
                </button>
                <button onClick={() => { setView('applications'); window.history.pushState({}, '', '/applications'); }} className="text-sm text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors font-medium">
                  My Opportunities
                </button>
              </nav>
            )}
            {currentUser?.role === 'professor' && (
              <nav className="hidden md:flex items-center gap-1 mr-2">
                <button onClick={() => navigate('dashboard')} className="text-sm text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors font-medium">
                  Dashboard
                </button>
                <button onClick={() => navigate('list')} className="text-sm text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors font-medium">
                  Browse
                </button>
                <button
                  onClick={() => { setView('create'); window.history.pushState({}, '', '/create'); }}
                  className="text-sm bg-white text-zinc-900 hover:bg-zinc-200 px-3.5 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 ml-1"
                >
                  <Plus size={14} />
                  Post Project
                </button>
              </nav>
            )}

            {/* Notifications */}
            {currentUser && (
              <div className="relative mr-2">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-utcn-navy"></span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-30 overflow-hidden text-gray-800"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-slate-50">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs text-utcn-primary hover:underline flex items-center gap-1">
                            <Check size={12} /> Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-400 text-sm">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map(n => (
                            <button
                              key={n.id}
                              onClick={() => { if (!n.read) markAsRead(n.id); }}
                              className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-zinc-50' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h4 className={`text-sm ${!n.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                    {n.title}
                                  </h4>
                                  <p className={`text-xs mt-1 line-clamp-2 ${!n.read ? 'text-gray-700' : 'text-gray-500'}`}>
                                    {n.message}
                                  </p>
                                </div>
                                {!n.read && <div className="w-2 h-2 rounded-full bg-utcn-primary mt-1 flex-shrink-0" />}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 focus:outline-none p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                {currentUser ? (
                  <img
                    src={currentUser.avatar}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border-2 border-white/30 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <UserIcon size={16} />
                  </div>
                )}
                <ChevronDown
                  size={14}
                  className={`text-white/70 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-2xl border border-gray-100 z-30 overflow-hidden text-gray-800"
                  >
                    {currentUser ? (
                      <div className="px-4 py-3.5 bg-slate-50 border-b flex items-center gap-3">
                        <img src={currentUser.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-gray-900 truncate">{currentUser.name}</div>
                          <div className="text-xs text-gray-400 capitalize mt-0.5">{currentUser.role}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-3.5 bg-slate-50 border-b">
                        <div className="font-semibold text-sm text-gray-900">Guest</div>
                        <div className="text-xs text-gray-400 mt-0.5">Browse opportunities publicly</div>
                      </div>
                    )}

                    <div className="py-1">
                      {currentUser && (
                        <button onClick={() => navigate('profile')} className="w-full text-left flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors gap-2.5">
                          <Settings size={15} className="text-gray-400" /> My Profile
                        </button>
                      )}
                      {!currentUser && (
                        <>
                          <button onClick={() => navigate('list')} className="w-full text-left flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors gap-2.5">
                            <School size={15} className="text-gray-400" /> Browse Opportunities
                          </button>
                          <button onClick={() => navigate('login')} className="w-full text-left flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors gap-2.5">
                            <LogIn size={15} className="text-gray-400" /> Sign in
                          </button>
                        </>
                      )}
                      {currentUser?.role === 'professor' && (
                        <>
                          <button onClick={() => { setView('create'); setShowUserMenu(false); window.history.pushState({}, '', '/create'); }} className="w-full text-left flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors gap-2.5">
                            <Plus size={15} className="text-gray-400" /> Post Opportunity
                          </button>
                          <button onClick={() => navigate('dashboard')} className="w-full text-left flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors gap-2.5">
                            <LayoutDashboard size={15} className="text-gray-400" /> My Dashboard
                          </button>
                          <button onClick={() => navigate('list')} className="w-full text-left flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors gap-2.5">
                            <School size={15} className="text-gray-400" /> Browse Opportunities
                          </button>
                        </>
                      )}
                      {currentUser?.role === 'student' && (
                        <>
                          <button onClick={() => navigate('list')} className="w-full text-left flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors gap-2.5">
                            <School size={15} className="text-gray-400" /> Browse Opportunities
                          </button>
                          <button onClick={() => { setView('applications'); setShowUserMenu(false); window.history.pushState({}, '', '/applications'); }} className="w-full text-left flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors gap-2.5">
                            <CheckCircle2 size={15} className="text-gray-400" /> My Opportunities
                          </button>
                        </>
                      )}
                      {currentUser?.role === 'admin' && (
                        <>
                          <button onClick={() => navigate('dashboard')} className="w-full text-left flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors gap-2.5">
                            <LayoutDashboard size={15} className="text-gray-400" /> Admin Dashboard
                          </button>
                          <button onClick={() => navigate('list')} className="w-full text-left flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors gap-2.5">
                            <School size={15} className="text-gray-400" /> Browse Opportunities
                          </button>
                        </>
                      )}
                    </div>

                    {currentUser && (
                      <div className="py-1 border-t">
                        <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors gap-2.5">
                          <LogOut size={15} className="text-red-400" /> Sign Out
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
