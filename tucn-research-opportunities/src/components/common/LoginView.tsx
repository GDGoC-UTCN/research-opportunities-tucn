import React from 'react';
import { motion } from 'motion/react';
import Logo from './Logo';
import { BookOpen, Users, FlaskConical, GraduationCap, ArrowRight } from 'lucide-react';

interface Props {
  handleLogin: (role: 'student' | 'professor') => void;
}

export default function LoginView({ handleLogin }: Props) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">

      {/* ── Left Panel — UTCN Branding ── */}
      <div className="lg:w-[55%] bg-utcn-navy flex flex-col justify-center items-start p-10 lg:p-16 text-white relative overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-utcn-primary opacity-10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] bg-utcn-red opacity-10 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-utcn-navy-light opacity-30 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 max-w-lg">
          {/* Logo + wordmark */}
          <div className="flex items-center gap-4 mb-10">
            <Logo large />
            <div>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-300 mb-0.5">UTCN</p>
              <p className="text-lg font-bold leading-none">Research Portal</p>
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.15] tracking-tight mb-5">
            Discover<br />
            <span className="text-utcn-primary">Research</span><br />
            Opportunities
          </h1>

          <p className="text-blue-200 text-base leading-relaxed mb-10 max-w-md">
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
                  <Icon size={15} className="text-blue-300" />
                </div>
                <span className="text-sm text-blue-100 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>

          {/* Bottom institution line */}
          <div className="mt-12 pt-6 border-t border-white/10 flex items-center gap-3">
            <div className="w-1 h-8 bg-utcn-red rounded-full" />
            <div>
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Technical University of Cluj-Napoca</p>
              <p className="text-xs text-white/40 mt-0.5">utcluj.ro · research.utcluj.ro</p>
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
            <div className="w-9 h-9 bg-utcn-navy rounded-lg flex items-center justify-center">
              <img src="/favicon.svg" alt="UTCN" className="h-6 w-6 object-contain" />
            </div>
            <span className="font-bold text-gray-900">UTCN Research Portal</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to access your research dashboard.</p>

          <div className="space-y-3">
            {/* Student button */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleLogin('student')}
              className="group w-full flex items-center justify-between py-4 px-5 bg-utcn-primary text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-200 hover:bg-utcn-primary-dark transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <GraduationCap size={16} />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Continue as Student</div>
                  <div className="text-blue-200 text-xs font-normal">Browse &amp; apply to opportunities</div>
                </div>
              </div>
              <ArrowRight size={16} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </motion.button>

            {/* Professor button */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleLogin('professor')}
              className="group w-full flex items-center justify-between py-4 px-5 bg-utcn-navy text-white rounded-xl font-semibold text-sm shadow-md shadow-slate-200 hover:bg-utcn-navy-light transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                  <BookOpen size={16} />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Continue as Professor</div>
                  <div className="text-blue-200 text-xs font-normal">Post &amp; manage research projects</div>
                </div>
              </div>
              <ArrowRight size={16} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </motion.button>
          </div>

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
