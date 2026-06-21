import { motion } from 'motion/react';
import { ChevronDown, ArrowRight } from 'lucide-react';

interface Props {
  onBrowse: () => void;
}

const faqs = [
  {
    q: 'Do I need an account to browse opportunities?',
    a: 'No, browsing is public. You need an account only to apply or save opportunities.',
  },
  {
    q: 'Who can apply?',
    a: 'Students with an account can apply to available opportunities.',
  },
  {
    q: 'Can I save opportunities for later?',
    a: 'Yes, saved opportunities appear in My Opportunities.',
  },
  {
    q: 'Can I reuse my CV?',
    a: 'Yes, you can upload a default CV/transcript in your profile and reuse it when applying.',
  },
  {
    q: 'Who can publish opportunities?',
    a: 'Approved professors/research coordinators can publish opportunities.',
  },
  {
    q: 'Are my documents public?',
    a: 'No, documents are protected and visible only to authorized users, such as the professor reviewing your application.',
  },
  {
    q: 'How do professors get approved?',
    a: 'Professor accounts are reviewed and approved by an admin.',
  },
];

export default function Faqs({ onBrowse }: Props) {
  return (
    <motion.div
      key="faqs"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      {/* Hero */}
      <div className="bg-gradient-to-r from-utcn-navy to-utcn-navy-light rounded-2xl px-8 py-10 text-white mb-8">
        <p className="text-[11px] font-bold tracking-widest uppercase text-white/60 mb-2">AIRi@UTCN</p>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight">Frequently Asked Questions</h1>
        <p className="text-white/70 text-sm mt-2 max-w-2xl leading-relaxed">
          Answers to common questions about browsing, applying and publishing AIRi@UTCN research opportunities.
        </p>
      </div>

      {/* FAQ list */}
      <div className="space-y-3">
        {faqs.map(({ q, a }) => (
          <details key={q} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 font-semibold text-gray-900 text-sm">
              {q}
              <ChevronDown size={18} className="text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-5 -mt-1 text-sm text-gray-500 leading-relaxed">
              {a}
            </div>
          </details>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <h3 className="font-bold text-gray-900">Still curious?</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">Browse the latest AIRi@UTCN research opportunities to see what is available.</p>
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
