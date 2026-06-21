interface Props {
  onNavigate: (path: string) => void;
}

const QUICK_LINKS = [
  { label: 'Browse Opportunities', href: '/opportunities' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'For Professors', href: '/for-professors' },
  { label: 'FAQs', href: '/faqs' },
];

export default function Footer({ onNavigate }: Props) {
  return (
    <footer className="relative bg-utcn-navy text-white w-full mt-16 overflow-hidden">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-utcn-red/70 to-transparent" />
      <div className="absolute inset-0 research-grid-dark research-fade opacity-50" aria-hidden="true" />

      <div className="relative container mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* Column 1 — Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <img src="/airi.svg" alt="AIRi@UTCN" className="h-5 w-7 object-contain" />
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-white/45">AIRi@UTCN</p>
                <p className="text-sm font-display leading-none">Research Opportunities</p>
              </div>
            </div>
            <p className="text-sm text-white/55 leading-relaxed max-w-xs">
              A research discovery platform at the Technical University of Cluj-Napoca, connecting students with faculty and applied research projects.
            </p>
          </div>

          {/* Column 2 — Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              {QUICK_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    onClick={(e) => { e.preventDefault(); onNavigate(href); }}
                    className="hover:text-white transition-colors hover:underline underline-offset-4 decoration-utcn-red/60"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li>
                <span className="text-white/35 text-xs uppercase tracking-wider block mb-0.5">Address</span>
                Str. Memorandumului 28, Cluj-Napoca, Romania
              </li>
              <li>
                <span className="text-white/35 text-xs uppercase tracking-wider block mb-0.5">Email</span>
                <a href="mailto:AIRI@campus.utcluj.ro" className="hover:text-white transition-colors">AIRI@campus.utcluj.ro</a>
              </li>
              <li>
                <span className="text-white/35 text-xs uppercase tracking-wider block mb-0.5">Website</span>
                <a href="https://utcluj.ro" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">utcluj.ro</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/45">
          <p>&copy; {new Date().getFullYear()} Technical University of Cluj-Napoca. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
