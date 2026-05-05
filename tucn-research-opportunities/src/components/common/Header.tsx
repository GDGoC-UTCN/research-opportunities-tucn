import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, CheckCircle2, User as UserIcon, ChevronDown, Plus, Users, LogOut } from 'lucide-react';
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
  return (
    <div className="bg-utcn-red text-white shadow-md">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setView(currentUser?.role === 'professor' ? 'dashboard' : 'list')}>
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
                        <button onClick={() => { setView('list'); setShowUserMenu(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                          <School className="w-4 h-4 mr-2" />
                          Browse Opportunities
                        </button>
                      </>
                    )}
                    {currentUser.role === 'student' && (
                      <button onClick={() => { setView('applications'); setShowUserMenu(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        My Applications
                      </button>
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
  );
}
