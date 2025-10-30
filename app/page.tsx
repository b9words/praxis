import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, DollarSign, Shield, Target, TrendingUp, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Praxis - The Proving Ground for Business Leaders',
  description: 'Build demonstrable business acumen through systematic analysis, interactive simulations, and rigorous assessment. A curated platform for analytical professionals.',
  openGraph: {
    title: 'Praxis - The Proving Ground for Business Leaders',
    description: 'Build demonstrable business acumen through systematic analysis, interactive simulations, and rigorous assessment. A curated platform for analytical professionals.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://praxisplatform.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Praxis - The Proving Ground for Business Leaders',
    description: 'Build demonstrable business acumen through systematic analysis, interactive simulations, and rigorous assessment.',
  },
}

// Architectural accent component - creates uniform design language across sections
function SectionAccent({ variant, className = '' }: { variant: 'vertical' | 'horizontal' | 'corner' | 'edge' | 'center'; className?: string }) {
  const baseClasses = 'absolute pointer-events-none'
  
  switch (variant) {
    case 'vertical':
      return (
        <div className={`${baseClasses} left-0 top-0 bottom-0 w-px bg-neutral-200 ${className}`} />
      )
    case 'horizontal':
      return (
        <div className={`${baseClasses} left-0 right-0 top-0 h-px bg-neutral-200 ${className}`} />
      )
    case 'corner':
      return (
        <div className={`${baseClasses} left-0 top-0 w-12 h-px bg-neutral-900 ${className}`} />
      )
    case 'edge':
      return (
        <>
          <div className={`${baseClasses} left-0 top-0 bottom-0 w-px bg-neutral-100 ${className}`} />
          <div className={`${baseClasses} right-0 top-0 bottom-0 w-px bg-neutral-100 ${className}`} />
        </>
      )
    case 'center':
      return (
        <div className={`${baseClasses} left-1/2 top-0 bottom-0 w-px bg-white/10 transform -translate-x-1/2 ${className}`} />
      )
    default:
      return null
  }
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-12">
              <Link href="/" className="text-lg font-semibold text-neutral-900 tracking-tight relative">
                Praxis
                <div className="absolute -bottom-1 left-0 w-full h-[0.5px] bg-neutral-900"></div>
              </Link>
              <div className="hidden md:flex gap-8">
                <Link href="#method" className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors relative">
                  Method
                  <span className="absolute -bottom-1 left-0 w-0 h-[0.5px] bg-neutral-900 transition-all duration-300 hover:w-full"></span>
                </Link>
                <Link href="#curriculum" className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors relative">
                  Curriculum
                  <span className="absolute -bottom-1 left-0 w-0 h-[0.5px] bg-neutral-900 transition-all duration-300 hover:w-full"></span>
                </Link>
                <Link href="/pricing" className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors relative">
                  Pricing
                  <span className="absolute -bottom-1 left-0 w-0 h-[0.5px] bg-neutral-900 transition-all duration-300 hover:w-full"></span>
                </Link>
              </div>
            </div>
            <div className="flex gap-4">
              <Button asChild variant="ghost" size="sm" className="text-neutral-700 rounded-none">
                <Link href="/login">Authenticate</Link>
              </Button>
              <Button asChild size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-none">
                <Link href="/signup">Request Access</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="border-b border-neutral-200 relative">
        <SectionAccent variant="vertical" className="opacity-30" />
        <SectionAccent variant="corner" className="top-24 opacity-20" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="max-w-4xl space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px w-12 bg-neutral-900"></div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
                  Curated for Analytical Rigor
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-light text-neutral-900 leading-tight tracking-tight max-w-3xl">
                The Proving Ground for Business Leaders
              </h1>
              <p className="text-lg text-neutral-700 leading-relaxed max-w-2xl">
                Build demonstrable business acumen through systematic analysis, interactive simulations, and rigorous assessment.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild size="lg" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-none px-8 h-12 text-sm font-medium">
                <Link href="/signup">
                  Request Access
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 rounded-none px-8 h-12 text-sm font-medium">
                <Link href="#method">
                  Review Method
                </Link>
              </Button>
            </div>
            <div className="pt-8 border-t border-neutral-200">
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Trusted by professionals from leading firms and high-growth organizations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-neutral-200 bg-neutral-50 relative">
        <SectionAccent variant="edge" className="opacity-30" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { number: '52', label: 'Intelligence Articles' },
              { number: '14', label: 'Simulation Scenarios' },
              { number: '5-Year', label: 'Structured Curriculum' },
              { number: '24/7', label: 'Analytical Workspace' }
            ].map((stat, idx) => (
              <div key={idx} className="relative">
                <div className="text-3xl font-light text-neutral-900 mb-2 tracking-tight">{stat.number}</div>
                <div className="text-xs text-neutral-600 uppercase tracking-wider">{stat.label}</div>
                {idx < 3 && (
                  <div className="absolute right-0 top-0 w-px h-full bg-neutral-200 hidden md:block opacity-40"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Method */}
      <section id="method" className="border-b border-neutral-200 relative">
        <SectionAccent variant="vertical" className="opacity-30" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <div className="mb-20 relative">
            <div className="absolute -left-8 top-0 w-px h-20 bg-neutral-900 opacity-20 hidden lg:block"></div>
            <h2 className="text-3xl font-light text-neutral-900 mb-4 tracking-tight">The Praxis Method</h2>
            <p className="text-base text-neutral-700 max-w-2xl">
              A systematic approach to developing analytical business decision-making capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
            {/* Connecting guide lines behind method cards (desktop only) */}
            <div className="hidden lg:block absolute left-1/4 top-12 bottom-12 w-px bg-neutral-100 transform -translate-x-1/2"></div>
            <div className="hidden lg:block absolute left-1/2 top-12 bottom-12 w-px bg-neutral-100 transform -translate-x-1/2"></div>
            <div className="hidden lg:block absolute left-3/4 top-12 bottom-12 w-px bg-neutral-100 transform -translate-x-1/2"></div>
            
            {[
              {
                number: '01',
                title: 'Intelligence',
                description: 'Access curated business frameworks in the Intelligence Library. Each article is structured to build systematic understanding through principles, models, common traps, and applied examples.',
                icon: BookOpen,
                features: ['52 Intelligence Articles', 'Query Assistant', 'Structured Progression']
              },
              {
                number: '02',
                title: 'Simulation',
                description: 'Deploy to scenarios with real datasets and financial models. Engage with AI stakeholders that challenge your analytical framework.',
                icon: Target,
                features: ['14 Scenarios', 'Real Data Models', 'Interactive Stakeholders']
              },
              {
                number: '03',
                title: 'After-Action Analysis',
                description: 'Receive performance debriefs that evaluate your decisions against expert rubrics. Analysis focuses on competency gaps and strategic reasoning.',
                icon: TrendingUp,
                features: ['Competency Analysis', 'Performance Scoring', 'Gap Identification']
              },
              {
                number: '04',
                title: 'The Network',
                description: 'Engage with a curated community of analytical professionals. Exchange strategic insights and validate frameworks.',
                icon: Users,
                features: ['The Exchange', 'Peer Analysis', 'Curated Community']
              }
            ].map((step) => {
              const IconComponent = step.icon
              return (
              <div key={step.number} className="space-y-4 relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-2 border border-neutral-200 hover:border-neutral-300 transition-colors relative">
                    <IconComponent className="h-5 w-5 text-neutral-700" />
                  </div>
                  <div className="text-4xl font-light text-neutral-200">{step.number}</div>
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-3">{step.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed mb-6">{step.description}</p>
                <div className="space-y-2 pt-4 border-t border-neutral-100">
                  {step.features.map((feature, idx) => (
                    <div key={idx} className="text-xs text-neutral-500 flex items-center gap-2">
                      <div className="w-1 h-1 bg-neutral-400 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* Core Competencies */}
      <section className="border-b border-neutral-200 bg-neutral-50 relative">
        <SectionAccent variant="horizontal" className="top-0 opacity-20" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <div className="mb-20 relative">
            <div className="absolute -left-8 top-0 w-px h-20 bg-neutral-900 opacity-20 hidden lg:block"></div>
            <h2 className="text-3xl font-light text-neutral-900 mb-4 tracking-tight">Core Competencies</h2>
            <p className="text-base text-neutral-700 max-w-2xl">
              Build demonstrable capabilities across five dimensions of strategic business analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Financial Acumen',
                description: 'Analyze financial statements, metrics, unit economics, and capital allocation. Develop data-driven decision frameworks.',
                icon: DollarSign,
                topics: ['P&L Analysis', 'ROI & CAC', 'Capital Allocation', 'Financial Modeling']
              },
              {
                title: 'Strategic Thinking',
                description: 'Apply frameworks for competitive strategy, market positioning, innovation, and long-term planning.',
                icon: Target,
                topics: ['Porter\'s 5 Forces', 'Competitive Strategy', 'Market Entry', 'Innovation']
              },
              {
                title: 'Market Awareness',
                description: 'Assess customer needs, competitive dynamics, and industry trends that drive business outcomes.',
                icon: TrendingUp,
                topics: ['Customer Analysis', 'Market Sizing', 'Competitive Intelligence', 'Trend Analysis']
              },
              {
                title: 'Risk Management',
                description: 'Identify, assess, and mitigate business risks while balancing growth opportunities analytically.',
                icon: Shield,
                topics: ['Risk Assessment', 'Scenario Planning', 'Crisis Management', 'Due Diligence']
              },
              {
                title: 'Leadership Judgment',
                description: 'Navigate complex stakeholder dynamics and make sound decisions under uncertainty and pressure.',
                icon: Users,
                topics: ['Stakeholder Management', 'Decision-Making', 'Negotiation', 'Organizational Politics']
              }
            ].map((competency, idx) => {
              const IconComponent = competency.icon
              return (
              <div key={idx} className="bg-white border border-neutral-200 p-6 hover:border-neutral-300 transition-colors relative">
                <div className="absolute top-0 left-0 w-full h-[0.5px] bg-neutral-900 opacity-0 hover:opacity-20 transition-opacity"></div>
                <div className="mb-6">
                  <IconComponent className="h-6 w-6 text-neutral-700" />
                </div>
                <h3 className="text-base font-medium text-neutral-900 mb-3">{competency.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed mb-6">{competency.description}</p>
                <div className="space-y-2 pt-4 border-t border-neutral-100">
                  {competency.topics.map((topic, idx) => (
                    <div key={idx} className="text-xs text-neutral-500">
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* The Curriculum */}
      <section id="curriculum" className="border-b border-neutral-200 relative">
        <SectionAccent variant="vertical" className="opacity-30" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <div className="mb-20 relative">
            <div className="absolute -left-8 top-0 w-px h-20 bg-neutral-900 opacity-20 hidden lg:block"></div>
            <h2 className="text-3xl font-light text-neutral-900 mb-4 tracking-tight">A 5-Year Journey to Mastery</h2>
            <p className="text-base text-neutral-700 max-w-2xl">
              Progressive curriculum from operational execution to executive leadership
            </p>
          </div>

          <div className="space-y-1">
            {[
              {
                year: 'Year 1',
                title: 'The Operator\'s Residency',
                theme: 'How a Business Works',
                description: 'Master the fundamental mechanics—financial statements, unit economics, operations, and team management. Learn to run a business unit effectively.',
                domains: ['Financial Fundamentals', 'Go-to-Market Strategy', 'Operations', 'People Management'],
                stats: { articles: 16, cases: 4 }
              },
              {
                year: 'Year 2',
                title: 'The Strategist\'s Residency',
                theme: 'How a Business Wins',
                description: 'Develop competitive strategy skills—Porter\'s Five Forces, economic moats, market positioning, and strategic planning.',
                domains: ['Competitive Strategy', 'Marketing & Brand', 'Market Expansion'],
                stats: { articles: 12, cases: 3 }
              },
              {
                year: 'Year 3',
                title: 'The Dealmaker\'s Residency',
                theme: 'How a Business Grows Inorganically',
                description: 'Navigate M&A, partnerships, and complex transactions. Learn valuation, due diligence, negotiation, and integration.',
                domains: ['M&A Fundamentals', 'Deal Execution', 'Strategic Partnerships'],
                stats: { articles: 11, cases: 3 }
              },
              {
                year: 'Year 4',
                title: 'The Financier\'s Residency',
                theme: 'How a Business Creates Value',
                description: 'Think like a CFO—capital allocation, investor relations, and sophisticated financial decision-making.',
                domains: ['Capital Allocation', 'Investor Relations'],
                stats: { articles: 7, cases: 2 }
              },
              {
                year: 'Year 5',
                title: 'The Leader\'s Residency',
                theme: 'How a Business is Led',
                description: 'Master executive leadership—corporate governance, crisis management, and navigating complex stakeholder dynamics.',
                domains: ['Corporate Governance', 'Crisis Leadership'],
                stats: { articles: 6, cases: 2 }
              }
            ].map((year, idx) => (
              <div key={idx} className="border-b border-neutral-200 py-8 hover:bg-neutral-50 transition-colors relative group pl-8">
                {/* Timeline indicator */}
                <div className="absolute left-0 top-8 bottom-8 w-px bg-neutral-200 group-hover:bg-neutral-900 transition-colors opacity-50 group-hongsTo:opacity-100"></div>
                <div className="absolute left-0 top-8 w-2 h-2 bg-neutral-900 rounded-full transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex items-start justify-between gap-8">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-neutral-900">{year.year}</span>
                      <span className="text-xs text-neutral-500 uppercase tracking-wider">
                        {year.stats.articles} Articles • {year.stats.cases} Cases
                      </span>
                    </div>
                    <h3 className="text-xl font-medium text-neutral-900">{year.title}</h3>
                    <p className="text-sm text-neutral-600 italic">"{year.theme}"</p>
                    <p className="text-sm text-neutral-700 leading-relaxed max-w-2xl">{year.description}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {year.domains.map((domain, idx) => (
                        <span key={idx} className="text-xs text-neutral-600 border border-neutral-200 px-2 py-1">
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-b border-neutral-200 bg-neutral-50 relative">
        <SectionAccent variant="edge" className="opacity-20" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <div className="mb-20 relative">
            <div className="absolute -left-8 top-0 w-px h-20 bg-neutral-900 opacity-20 hidden lg:block"></div>
            <h2 className="text-3xl font-light text-neutral-900 mb-4 tracking-tight">Trusted by Analytical Professionals</h2>
            <p className="text-base text-neutral-700">Across Fortune 500 companies and high-growth organizations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Praxis provided the analytical framework necessary for my transition from engineering to product management. The simulation scenarios are realistic; I apply the mental models daily in strategic decisions.",
                author: "Sarah Chen",
                role: "Senior Product Manager",
                company: "Meta"
              },
              {
                quote: "The performance debriefs are rigorous. Each decision is evaluated against expert rubrics with precise feedback on competency gaps and strategic reasoning.",
                author: "Marcus Rodriguez",
                role: "Strategy Consultant",
                company: "McKinsey & Company"
              },
              {
                quote: "The Financial Acumen curriculum strengthened my analytical capabilities. The frameworks improved the rigor of my board presentations and financial models.",
                author: "Jennifer Park",
                role: "Founder & CEO",
                company: "Series A FinTech Startup"
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white border border-neutral-200 p-6 relative">
                <div className="absolute top-0 left-0 w-12 h-px bg-neutral-900 opacity-20"></div>
                <div className="mb-6">
                  <svg className="w-6 h-6 text-neutral-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed mb-6">{testimonial.quote}</p>
                <div className="border-t border-neutral-100 pt-4">
                  <p className="text-sm font-medium text-neutral-900">{testimonial.author}</p>
                  <p className="text-xs text-neutral-500 mt-1">{testimonial.role}, {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-900 text-white relative overflow-hidden">
        {/* Subtle diagonal pattern */}
        <div className="absolute inset-0 opacity-[0.015]">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diagonal" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40 L40 0" stroke="currentColor" strokeWidth="0.5" className="text-white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonal)" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <div className="max-w-4xl mx-auto text-center relative">
            <SectionAccent variant="center" />
            <h2 className="text-3xl font-light mb-6 tracking-tight">Begin Your Analytical Journey</h2>
            <p className="text-base text-neutral-300 mb-10 leading-relaxed max-w-2xl mx-auto">
              Join professionals building demonstrable business acumen through systematic analysis and rigorous assessment
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100 rounded-none px-8 h-12 text-sm font-medium">
                <Link href="/signup">
                  Request Access
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-neutral-600 text-white hover:bg-neutral-800 rounded-none px-8 h-12 text-sm font-medium">
                <Link href="/pricing">
                  View Pricing
                </Link>
              </Button>
            </div>
            <p className="mt-8 text-xs text-neutral-400 uppercase tracking-wider">
              Curated community • Assessment-based access • 30-day evaluation period
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
