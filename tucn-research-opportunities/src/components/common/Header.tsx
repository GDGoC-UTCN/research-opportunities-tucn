import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, CheckCircle2, User as UserIcon, ChevronDown, Plus, LogOut, LayoutDashboard, LogIn } from 'lucide-react';
import { User } from '../../types';
import Logo from './Logo';

interface Props {
  currentUser: User | null;
  setView: (view: 'login' | 'list' | 'detail' | 'create' | 'dashboard' | 'applications') => void;
  showUserMenu: boolean;
  setShowUserMenu: (show: boolean) => void;
  handleLogout: () => void;
}

export default function Header({ currentUser, setView, showUserMenu, setShowUserMenu, handleLogout }: Props) {
  const homeView = currentUser?.role === 'professor' ? 'dashboard' : currentUser?.role === 'admin' ? 'dashboard' : 'list';
  const navigate = (view: 'login' | 'list' | 'detail' | 'create' | 'dashboard' | 'applications') => {
    setView(view);
    setShowUserMenu(false);
    if (view === 'login') window.history.pushState({}, '', '/login');
    if (view === 'list') window.history.pushState({}, '', '/');
    if (view === 'dashboard' && currentUser?.role === 'admin') window.history.pushState({}, '', '/admin');
  };

  return (
    <div className="bg-utcn-navy text-white shadow-lg border-b-[3px] border-utcn-red">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[4.5rem]">

          {/* Logo + Title */}
          <button
            className="flex items-center gap-3 cursor-pointer group focus:outline-none"
            onClick={() => navigate(homeView)}
          >
            <Logo />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-300 group-hover:text-blue-200 transition-colors">AIRi@UTCN</span>
              <span className="text-base font-bold text-white group-hover:text-blue-100 transition-colors">Research Opportunities</span>
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
                  className="text-sm bg-utcn-primary text-white hover:bg-utcn-primary-dark px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 ml-1"
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
                <button onClick={() => setView('applications')} className="text-sm text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors font-medium">
                  My Applications
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
                  onClick={() => setView('create')}
                  className="text-sm bg-utcn-primary text-white hover:bg-utcn-primary-dark px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 ml-1"
                >
                  <Plus size={14} />
                  Post Project
                </button>
              </nav>
            )}

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
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
                          <button onClick={() => { setView('create'); setShowUserMenu(false); }} className="w-full text-left flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors gap-2.5">
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
                          <button onClick={() => { setView('applications'); setShowUserMenu(false); }} className="w-full text-left flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors gap-2.5">
                            <CheckCircle2 size={15} className="text-gray-400" /> My Applications
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
