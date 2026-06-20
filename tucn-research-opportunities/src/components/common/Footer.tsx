export default function Footer() {
  return (
    <footer className="bg-utcn-navy text-white w-full mt-16">
      {/* Red accent top border */}
      <div className="h-1 bg-utcn-red w-full" />

      <div className="container mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* Column 1 — Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <img src="/airi.svg" alt="AIRi@UTCN" className="h-5 w-7 object-contain" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-blue-300">AIRi@UTCN</p>
                <p className="text-sm font-bold leading-none">Research Opportunities</p>
              </div>
            </div>
            <p className="text-sm text-blue-200 leading-relaxed max-w-xs">
              AIRi@UTCN research opportunities at the Technical University of Cluj-Napoca, connecting students with professors and applied AI projects.
            </p>
          </div>

          {/* Column 2 — Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-blue-200">
              {[
                { label: 'Browse Opportunities', href: '#' },
                { label: 'How It Works', href: '#' },
                { label: 'For Professors', href: '#' },
                { label: 'FAQs', href: '#' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="hover:text-white transition-colors hover:underline underline-offset-2">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm text-blue-200">
              <li>
                <span className="text-white/50 text-xs uppercase tracking-wider block mb-0.5">Address</span>
                Str. Memorandumului 28, Cluj-Napoca, Romania
              </li>
              <li>
                <span className="text-white/50 text-xs uppercase tracking-wider block mb-0.5">Email</span>
                <a href="mailto:AIRI@campus.utcluj.ro" className="hover:text-white transition-colors">AIRI@campus.utcluj.ro</a>
              </li>
              <li>
                <span className="text-white/50 text-xs uppercase tracking-wider block mb-0.5">Website</span>
                <a href="https://utcluj.ro" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">utcluj.ro</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-blue-300">
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
