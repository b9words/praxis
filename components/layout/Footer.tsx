import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-white border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">Execemy</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Building demonstrable business acumen through systematic analysis and rigorous assessment.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4 uppercase tracking-wider">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/library/curriculum" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Curriculum
                </Link>
              </li>
              <li>
                <Link href="/library/case-studies" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/ledger" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  The Ledger
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/legal/terms" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <a href="mailto:support@execemy.com" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-neutral-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-500 text-center md:text-left">
              &copy; {new Date().getFullYear()} Execemy Platform. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-neutral-500">
              <span>Assessment-based access</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
