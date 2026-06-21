import React, { useState } from 'react';
import { motion } from 'motion/react';
import Logo from './Logo';
import { BookOpen, Users, FlaskConical, GraduationCap, ArrowRight } from 'lucide-react';

interface SignupData {
  name: string;
  role: 'student' | 'professor' | 'admin';
  department?: string;
  email?: string;
  password?: string;
}

interface Props {
  handleLoginEmail: (email: string, password: string, role: 'student' | 'professor' | 'admin') => Promise<UserLike>;
  handleSignup: (data: SignupData) => void;
}

interface UserLike {
  id: string;
}

function readInitialRole(): null | 'student' | 'professor' | 'admin' {
  if (typeof window === 'undefined' || !window.location) return null;
  if (window.location.pathname === '/admin') return 'admin';
  const role = new URLSearchParams(window.location.search).get('role');
  if (role === 'professor' || role === 'student') return role;
  return null;
}

function readInitialMode(): 'signin' | 'signup' {
  if (typeof window === 'undefined' || !window.location) return 'signin';
  return new URLSearchParams(window.location.search).get('signup') ? 'signup' : 'signin';
}

export default function LoginView({ handleLoginEmail, handleSignup }: Props) {
  const initialRole = readInitialRole();
  const [selectedRole, setSelectedRole] = useState<null | 'student' | 'professor' | 'admin'>(initialRole);
  const [mode, setMode] = useState<'signin' | 'signup'>(initialRole ? readInitialMode() : 'signin');
  const [lastError, setLastError] = useState<null | { message: string; status?: number | null; body?: any }>(null);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">

      {/* ── Left Panel — AIRi@UTCN Branding ── */}
      <div className="lg:w-[55%] bg-utcn-navy flex flex-col justify-center items-start p-10 lg:p-16 text-white relative overflow-hidden">

        {/* Research textures */}
        <div className="absolute inset-0 research-grid-dark research-fade opacity-60 pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] bg-utcn-red opacity-[0.07] rounded-full pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-utcn-red/60 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-lg">
          {/* Logo + wordmark */}
          <div className="flex items-center gap-4 mb-10">
            <Logo large />
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] uppercase text-white/45 mb-0.5">AIRi@UTCN</p>
              <p className="text-lg font-display leading-none">Research Opportunities</p>
            </div>
          </div>

          <h1 className="font-display text-4xl lg:text-[3.4rem] leading-[1.08] tracking-tight mb-5">
            AIRi@UTCN<br />
            <span className="italic text-white/45">Research</span><br />
            Opportunities
          </h1>

          <p className="text-white/60 text-base leading-relaxed mb-10 max-w-md">
            Connect with professors, join cutting-edge projects and advance your academic career at the
            <span className="font-semibold text-white"> Technical University of Cluj-Napoca</span>.
          </p>

          <div className="space-y-3.5">
            {[
              { icon: BookOpen,      text: 'Browse curated research projects from every faculty' },
              { icon: FlaskConical,  text: 'Apply directly to professors — no middlemen' },
              { icon: Users,         text: 'Collaborate with top researchers and PhD students' },
              { icon: GraduationCap, text: 'Earn academic credits, stipends & publications' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={15} className="text-white/50" />
                </div>
                <span className="text-sm text-white/70 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>

          {/* Bottom institution line */}
          <div className="mt-12 pt-6 border-t border-white/10 flex items-center gap-3">
            <div className="w-1 h-8 bg-utcn-red rounded-full" />
            <div>
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">AIRi@UTCN</p>
              <p className="text-xs text-white/40 mt-0.5">Technical University of Cluj-Napoca</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Login ── */}
      <div className="lg:w-[45%] bg-slate-50 flex items-center justify-center p-8 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          {/* Mobile-only logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-24 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <img src="/airi.svg" alt="AIRi@UTCN" className="h-7 w-20 object-contain" />
            </div>
            <span className="font-bold text-gray-900">Research Opportunities</span>
          </div>

          {/* If no role selected: show the two large Continue buttons */}
          {!selectedRole ? (
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome</h2>
              <p className="text-gray-500 text-sm mb-6">Sign in to apply, post, or manage AIRi@UTCN opportunities.</p>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => { setSelectedRole('student'); setMode('signin'); }}
                className="group w-full flex items-center justify-between py-4 px-5 bg-utcn-primary text-white rounded-xl font-semibold text-sm shadow-md shadow-zinc-900/10 hover:bg-utcn-primary-dark transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <GraduationCap size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Continue as Student</div>
                    <div className="text-white/60 text-xs font-normal">Browse &amp; apply to opportunities</div>
                  </div>
                </div>
                <ArrowRight size={16} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => { setSelectedRole('professor'); setMode('signin'); }}
                className="group w-full flex items-center justify-between py-4 px-5 bg-utcn-navy text-white rounded-xl font-semibold text-sm shadow-md shadow-slate-200 hover:bg-utcn-navy-light transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                    <BookOpen size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Continue as Professor</div>
                    <div className="text-white/60 text-xs font-normal">Post &amp; manage research projects</div>
                  </div>
                </div>
                <ArrowRight size={16} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </motion.button>

              {/* Admin access is intentionally hidden from the main UI; use the /admin path to access admin sign-in */}
            </div>
          ) : (
            // Role selected: show compact sign in / sign up panel
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-gray-500">Selected role</div>
                  <div className="font-semibold text-lg text-gray-900">{selectedRole === 'student' ? 'Student' : selectedRole === 'professor' ? 'Professor' : 'Admin'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-sm text-gray-500 hover:underline" onClick={() => setSelectedRole(null)}>Change</button>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={() => setMode('signin')} className={`flex-1 py-2 rounded-lg ${mode === 'signin' ? 'bg-utcn-navy text-white' : 'bg-gray-50 text-gray-700'}`}>Sign in</button>
                <button onClick={() => setMode('signup')} className={`flex-1 py-2 rounded-lg ${mode === 'signup' ? 'bg-utcn-primary text-white' : 'bg-gray-50 text-gray-700'}`}>Sign up</button>
              </div>

              {mode === 'signin' ? (
                <form onSubmit={async (e) => { 
                  e.preventDefault(); 
                  const fd = new FormData(e.currentTarget as HTMLFormElement); 
                  const email = fd.get('loginEmail') as string; 
                  const pass = fd.get('loginPass') as string; 
                  setLastError(null);
                  try {
                    await handleLoginEmail(email, pass, selectedRole as any);
                  } catch (err) {
                    // err is structured { message, status, body }
                    setLastError(err as any);
                  }
                }} className="grid gap-3">
                  <input name="loginEmail" type="email" required placeholder="Email" className="w-full text-sm px-3 py-2 border rounded-lg" />
                  <input name="loginPass" type="password" required placeholder="Password" className="w-full text-sm px-3 py-2 border rounded-lg" />
                  <div className="flex justify-end">
                    <button type="submit" className="px-3 py-2 bg-utcn-navy text-white rounded-lg">Sign in</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget as HTMLFormElement; const fd = new FormData(form); const name = fd.get('name') as string; const dept = fd.get('department') as string | undefined; const email = fd.get('signupEmail') as string | null; const password = fd.get('signupPass') as string | null; handleSignup({ name, role: selectedRole as any, department: dept, email: email || undefined, password: password || undefined }); form.reset(); }} className="grid gap-3">
                  <input name="name" required placeholder="Your full name" className="w-full text-sm px-3 py-2 border rounded-lg" />
                  {selectedRole === 'professor' && <input name="department" placeholder="Department (optional)" className="w-full text-sm px-3 py-2 border rounded-lg" />}
                  <input name="signupEmail" type="email" required placeholder="Email" className="w-full text-sm px-3 py-2 border rounded-lg" />
                  <input name="signupPass" type="password" required placeholder="Password" className="w-full text-sm px-3 py-2 border rounded-lg" />
                  <div className="flex justify-end">
                    <button type="submit" className="px-3 py-2 bg-utcn-primary text-white rounded-lg">Create account</button>
                  </div>
                </form>
              )}

              {/* Error details for debugging login failures */}
              {lastError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-sm rounded">
                  <div className="font-semibold text-red-700">Login error: {lastError.message}</div>
                  <div className="text-xs text-gray-600 mt-1">Status: {String(lastError.status)}</div>
                </div>
              )}
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-8 leading-relaxed">
            By signing in you agree to the{' '}
            <a href="#" className="text-utcn-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-utcn-primary hover:underline">Privacy Policy</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
