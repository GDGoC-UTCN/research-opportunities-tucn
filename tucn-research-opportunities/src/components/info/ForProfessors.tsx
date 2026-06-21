import { motion } from 'motion/react';
import { Megaphone, ShieldCheck, ListChecks, FileCheck2, ThumbsUp, Clock, ArrowRight, LayoutDashboard, School } from 'lucide-react';
import { User } from '../../types';

interface Props {
  currentUser: User | null;
  onCreateAccount: () => void;
  onGoToDashboard: () => void;
  onBrowse: () => void;
}

const features = [
  { icon: Megaphone, title: 'Publish research opportunities', text: 'Share your projects with students across every faculty at UTCN.' },
  { icon: ListChecks, title: 'Define application questions', text: 'Add custom questions applicants must answer so you get the details you need.' },
  { icon: FileCheck2, title: 'Require CV / transcript', text: 'Optionally require a CV or transcript of records as part of the application.' },
  { icon: ShieldCheck, title: 'Review applicants securely', text: 'Applicant documents are protected and visible only to you and authorized users.' },
  { icon: ThumbsUp, title: 'Accept or reject applications', text: 'Make decisions and reply to students directly from your dashboard.' },
];

function ProfessorCta({ currentUser, onCreateAccount, onGoToDashboard, onBrowse }: Props) {
  // Logged out — invite the visitor to create a professor account.
  if (!currentUser) {
    return (
      <button
        onClick={onCreateAccount}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-utcn-primary text-white text-sm font-semibold hover:bg-utcn-primary-dark transition-colors"
      >
        Create professor account
        <ArrowRight size={16} />
      </button>
    );
  }

  // Approved professor — send them to their dashboard.
  if (currentUser.role === 'professor' && currentUser.approved) {
    return (
      <button
        onClick={onGoToDashboard}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-utcn-primary text-white text-sm font-semibold hover:bg-utcn-primary-dark transition-colors"
      >
        <LayoutDashboard size={16} />
        Go to Dashboard
      </button>
    );
  }

  // Pending professor — explain the approval step.
  if (currentUser.role === 'professor') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-sm font-semibold">
        <Clock size={16} />
        Your account is pending approval.
      </div>
    );
  }

  // Admin — point to dashboard.
  if (currentUser.role === 'admin') {
    return (
      <button
        onClick={onGoToDashboard}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-utcn-navy text-white text-sm font-semibold hover:bg-utcn-navy-light transition-colors"
      >
        <LayoutDashboard size={16} />
        Go to Admin Dashboard
      </button>
    );
  }

  // Student (or any other role) — publishing is for professors; offer browsing.
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-gray-500">You are signed in as a student. Publishing opportunities is available to approved professor accounts.</p>
      <button
        onClick={onBrowse}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-utcn-primary text-white text-sm font-semibold hover:bg-utcn-primary-dark transition-colors"
      >
        <School size={16} />
        Browse Opportunities
      </button>
    </div>
  );
}

export default function ForProfessors(props: Props) {
  return (
    <motion.div
      key="for-professors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      {/* Hero */}
      <div className="bg-gradient-to-r from-utcn-navy to-utcn-primary rounded-2xl px-8 py-10 text-white mb-8">
        <p className="text-[11px] font-bold tracking-widest uppercase text-blue-200 mb-2">AIRi@UTCN</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">For Professors</h1>
        <p className="text-blue-100 text-sm mt-2 max-w-2xl leading-relaxed">
          Recruit motivated students for your research projects. Professor and research-coordinator accounts are reviewed by an admin before publishing, keeping the platform trusted for everyone.
        </p>
      </div>

      {/* Features */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-utcn-primary flex items-center justify-center flex-shrink-0">
                <Icon size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Approval note + CTA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <h3 className="font-bold text-gray-900">Accounts need admin approval</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4 max-w-xl mx-auto">
          After signing up as a professor, an admin reviews your account. Once approved, you can publish opportunities and review applicants.
        </p>
        <ProfessorCta {...props} />
      </div>
    </motion.div>
  );
}
