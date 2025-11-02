import PublicHeader from '@/components/layout/PublicHeader'
import { SectionAccent } from '@/components/layout/SectionAccent'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About - Execemy',
  description: 'Learn about Execemy Platform and our mission to build the next generation of business leaders.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b border-neutral-200 relative">
        <SectionAccent variant="vertical" className="opacity-30" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <div className="max-w-4xl space-y-8">
            <div className="mb-20 relative">
              <div className="absolute -left-8 top-0 w-px h-20 bg-neutral-900 opacity-20 hidden lg:block"></div>
              <h1 className="text-5xl md:text-6xl font-light text-neutral-900 leading-tight tracking-tight">About Execemy</h1>
            </div>
            <p className="text-lg text-neutral-700 leading-relaxed">
              Execemy is a systematic training program designed to build demonstrable business acumen through interactive simulations, rigorous assessment, and a curated community of analytical professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="border-b border-neutral-200 bg-neutral-50 relative">
        <SectionAccent variant="edge" className="opacity-30" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <div className="max-w-4xl space-y-6">
            <div className="mb-20 relative">
              <div className="absolute -left-8 top-0 w-px h-20 bg-neutral-900 opacity-20 hidden lg:block"></div>
              <h2 className="text-3xl font-light text-neutral-900 mb-4 tracking-tight">Our Mission</h2>
            </div>
            <p className="text-base text-neutral-700 leading-relaxed">
              Traditional business education fails because it emphasizes passive learning over demonstrable skills. Execemy addresses this gap by placing you in realistic business scenarios where you make actual decisions and receive systematic feedback on your performance.
            </p>
            <p className="text-base text-neutral-700 leading-relaxed">
              Our curriculum is built around five years of progressive complexity, from foundational operational decisions to executive-level strategic thinking. Each simulation is designed to test specific competencies, and your performance is measured against objective rubrics—not subjective grading.
            </p>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="border-b border-neutral-200 relative">
        <SectionAccent variant="vertical" className="opacity-30" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <div className="max-w-4xl space-y-6">
            <div className="mb-20 relative">
              <div className="absolute -left-8 top-0 w-px h-20 bg-neutral-900 opacity-20 hidden lg:block"></div>
              <h2 className="text-3xl font-light text-neutral-900 mb-4 tracking-tight">Our Approach</h2>
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-medium text-neutral-900 mb-3">Systematic Progression</h3>
                <p className="text-base text-neutral-700 leading-relaxed">
                  The curriculum is organized into five residency years, each building on the previous. Year 1 focuses on operational fundamentals; Years 2-3 expand into strategic thinking; Years 4-5 prepare you for executive-level decision-making.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-neutral-900 mb-3">Performance-Based Assessment</h3>
                <p className="text-base text-neutral-700 leading-relaxed">
                  Every simulation outcome is evaluated against objective rubrics. You receive detailed feedback on what worked, what didn't, and why. Your Execemy Profile serves as a verifiable credential based on demonstrated competency.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-neutral-900 mb-3">Curated Community</h3>
                <p className="text-base text-neutral-700 leading-relaxed">
                  Access is assessment-based. Our community consists of professionals committed to analytical rigor and continuous improvement. This ensures high-quality discussions and meaningful peer learning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.015]">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diagonal-about" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40 L40 0" stroke="currentColor" strokeWidth="0.5" className="text-white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonal-about)" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <div className="max-w-4xl mx-auto text-center relative">
            <SectionAccent variant="center" />
            <h2 className="text-3xl font-light mb-6 tracking-tight">Join the Execemy Community</h2>
            <p className="text-base text-neutral-300 mb-10 leading-relaxed max-w-2xl mx-auto">
              Start building demonstrable business acumen through systematic analysis and rigorous assessment
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100 rounded-none px-8 h-12 text-sm font-medium">
                <Link href="/signup">Request Access</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-neutral-600 text-white hover:bg-neutral-800 rounded-none px-8 h-12 text-sm font-medium">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

