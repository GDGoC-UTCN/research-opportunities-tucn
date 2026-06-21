import React from 'react';
import { motion } from 'motion/react';
import { Search, Bookmark, FileText, CheckCircle2, UserPlus, Megaphone, ShieldCheck, ThumbsUp, ArrowRight } from 'lucide-react';

interface Props {
  onBrowse: () => void;
}

const studentSteps = [
  { icon: Search, title: 'Browse research opportunities', text: 'Explore projects published by approved professors across every faculty — no account required.' },
  { icon: Bookmark, title: 'Save opportunities for later', text: 'Bookmark interesting projects and find them again in your My Opportunities area.' },
  { icon: FileText, title: 'Apply using your profile CV/transcript', text: 'Reuse the CV and transcript saved to your profile, or upload new documents when you apply.' },
  { icon: CheckCircle2, title: 'Track status in My Opportunities', text: 'Follow each application from pending to accepted or rejected, all in one place.' },
];

const professorSteps = [
  { icon: UserPlus, title: 'Create an approved professor account', text: 'Sign up as a professor — an admin reviews and approves your account before you can post.' },
  { icon: Megaphone, title: 'Publish research opportunities', text: 'Describe your project, set requirements and define custom application questions.' },
  { icon: ShieldCheck, title: 'Review applications and documents securely', text: 'Read applicant answers and open their CV/transcript through protected, authorized access only.' },
  { icon: ThumbsUp, title: 'Accept or reject applicants', text: 'Make decisions and reply to students directly from your dashboard.' },
];

interface StepCardProps {
  icon: React.ComponentType<{ size?: number }>;
  index: number;
  title: string;
  text: string;
}

const StepCard: React.FC<StepCardProps> = ({ icon: Icon, index, title, text }) => {
  return (
    <div className="flex gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 text-utcn-primary flex items-center justify-center">
          <Icon size={18} />
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-utcn-primary bg-zinc-100 rounded-full w-5 h-5 flex items-center justify-center">{index}</span>
          <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export default function HowItWorks({ onBrowse }: Props) {
  return (
    <motion.div
      key="how-it-works"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto"
    >
      {/* Hero */}
      <div className="bg-gradient-to-r from-utcn-navy to-utcn-navy-light rounded-2xl px-8 py-10 text-white mb-8">
        <p className="text-[11px] font-bold tracking-widest uppercase text-white/60 mb-2">AIRi@UTCN</p>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight">How It Works</h1>
        <p className="text-white/70 text-sm mt-2 max-w-2xl leading-relaxed">
          AIRi@UTCN Research Opportunities connects students at the Technical University of Cluj-Napoca with professors and applied research projects. Here is how the platform works for each side.
        </p>
      </div>

      {/* Students */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">For students</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studentSteps.map((step, i) => (
            <StepCard key={step.title} icon={step.icon} index={i + 1} title={step.title} text={step.text} />
          ))}
        </div>
      </section>

      {/* Professors */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">For professors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {professorSteps.map((step, i) => (
            <StepCard key={step.title} icon={step.icon} index={i + 1} title={step.title} text={step.text} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <h3 className="font-bold text-gray-900">Ready to get started?</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">Browse the latest AIRi@UTCN research opportunities — no account needed.</p>
        <button
          onClick={onBrowse}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-utcn-primary text-white text-sm font-semibold hover:bg-utcn-primary-dark transition-colors"
        >
          Browse Opportunities
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
