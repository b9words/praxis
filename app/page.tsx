import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-2xl font-bold text-neutral-900">
                Praxis
              </Link>
              <div className="hidden md:flex gap-6">
                <Link href="#how-it-works" className="text-sm text-neutral-600 hover:text-neutral-900">How It Works</Link>
                <Link href="#curriculum" className="text-sm text-neutral-600 hover:text-neutral-900">Curriculum</Link>
                <Link href="/pricing" className="text-sm text-neutral-600 hover:text-neutral-900">Pricing</Link>
              </div>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="ghost" size="sm" className="text-neutral-700">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-blue-700 hover:bg-blue-800 text-white">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-700 text-white px-4 py-1.5 text-xs font-medium">
              FOR AMBITIOUS PROFESSIONALS
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-neutral-900 leading-tight mb-6">
              The Proving Ground for
              <br />
              <span className="text-blue-700">Business Leaders</span>
            </h1>
            <p className="text-xl md:text-2xl text-neutral-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              Build and demonstrate world-class business acumen through interactive simulations, AI-powered coaching, and a vetted network of high-performing peers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-700 hover:bg-blue-800 text-white px-10 h-14 text-lg">
                <Link href="/signup">
                  Start Your Journey
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-neutral-300 hover:border-neutral-400 h-14 px-10 text-lg">
                <Link href="#how-it-works">
                  See How It Works
                </Link>
              </Button>
            </div>
            <p className="mt-8 text-sm text-neutral-500">
              Join 10,000+ professionals from Google, McKinsey, Goldman Sachs, and leading startups
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '52+', label: 'Expert-Curated Articles' },
              { number: '14+', label: 'Business Simulations' },
              { number: '10K+', label: 'Active Members' },
              { number: '5-Year', label: 'Comprehensive Curriculum' }
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-4xl font-bold text-blue-700 mb-2">{stat.number}</div>
                <div className="text-sm text-neutral-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">The Praxis Method</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              A systematic, proven approach to building business decision-making skills
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                number: '01',
                title: 'Learn',
                description: 'Master business frameworks through our expert-curated Competency Library. Every article is structured for maximum retention with core principles, frameworks, common pitfalls, and real examples.',
                icon: '📚',
                features: ['52+ Articles', 'AI Study Assistant', 'Progressive Curriculum']
              },
              {
                number: '02',
                title: 'Practice',
                description: 'Apply knowledge in realistic business simulations with actual datasets, financial models, and AI stakeholders who challenge your thinking.',
                icon: '🎯',
                features: ['14+ Simulations', 'Real Data', 'AI Role-Play']
              },
              {
                number: '03',
                title: 'Debrief',
                description: 'Receive detailed AI-powered performance analysis. Our AI Coach evaluates your decisions against expert rubrics and provides actionable feedback.',
                icon: '📊',
                features: ['AI Coaching', 'Competency Scores', 'Personalized Feedback']
              },
              {
                number: '04',
                title: 'Connect',
                description: 'Discuss strategies and learn from a vetted community of ambitious professionals. Share insights and build your network.',
                icon: '🤝',
                features: ['Private Forum', 'Peer Learning', 'Vetted Community']
              }
            ].map((step) => (
              <Card key={step.number} className="bg-white border-neutral-200 relative hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="text-5xl mb-4">{step.icon}</div>
                  <div className="absolute top-6 right-6 text-7xl font-bold text-neutral-100 select-none">{step.number}</div>
                  <CardTitle className="text-xl font-bold text-neutral-900 mb-2">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-neutral-600 leading-relaxed">{step.description}</p>
                  <div className="space-y-1">
                    {step.features.map((feature, idx) => (
                      <div key={idx} className="text-xs text-neutral-500 flex items-center gap-2">
                        <span className="text-blue-700">✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core Competencies */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Five Core Competencies</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Build a comprehensive, demonstrable skill set across all dimensions of business leadership
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Financial Acumen',
                description: 'Master financial statements, metrics, unit economics, and capital allocation. Make data-driven decisions with confidence.',
                icon: '💰',
                topics: ['P&L Analysis', 'ROI & CAC', 'Capital Allocation', 'Financial Modeling']
              },
              {
                title: 'Strategic Thinking',
                description: 'Develop frameworks for competitive strategy, market positioning, innovation, and long-term planning.',
                icon: '🎯',
                topics: ['Porter\'s 5 Forces', 'Competitive Strategy', 'Market Entry', 'Innovation']
              },
              {
                title: 'Market Awareness',
                description: 'Understand customer needs, competitive dynamics, and industry trends that drive business outcomes.',
                icon: '📈',
                topics: ['Customer Analysis', 'Market Sizing', 'Competitive Intelligence', 'Trend Analysis']
              },
              {
                title: 'Risk Management',
                description: 'Identify, assess, and mitigate business risks while intelligently balancing growth opportunities.',
                icon: '🛡️',
                topics: ['Risk Assessment', 'Scenario Planning', 'Crisis Management', 'Due Diligence']
              },
              {
                title: 'Leadership Judgment',
                description: 'Navigate complex stakeholder dynamics and make sound decisions under uncertainty and pressure.',
                icon: '👥',
                topics: ['Stakeholder Management', 'Decision-Making', 'Negotiation', 'Organizational Politics']
              }
            ].map((competency, idx) => (
              <Card key={idx} className="bg-neutral-50 border-neutral-200 hover:border-blue-700 hover:shadow-md transition-all">
                <CardHeader>
                  <div className="text-4xl mb-4">{competency.icon}</div>
                  <CardTitle className="text-lg font-bold text-neutral-900 mb-2">{competency.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-neutral-600 leading-relaxed">{competency.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {competency.topics.map((topic, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs border-neutral-300 text-neutral-700">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* The Curriculum */}
      <section id="curriculum" className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">A 5-Year Journey to Mastery</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Progressive curriculum from operational execution to executive leadership—designed for working professionals
            </p>
          </div>

          <div className="space-y-4">
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
              <Card key={idx} className="bg-white border-neutral-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <Badge className="bg-blue-700 text-white text-sm px-3 py-1">{year.year}</Badge>
                        <Badge variant="outline" className="text-xs border-neutral-300 text-neutral-600">
                          {year.stats.articles} Articles • {year.stats.cases} Cases
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl font-bold text-neutral-900 mb-2">{year.title}</CardTitle>
                      <p className="text-base text-neutral-600 italic mb-3">"{year.theme}"</p>
                      <p className="text-sm text-neutral-700 leading-relaxed mb-4">{year.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {year.domains.map((domain, idx) => (
                          <span key={idx} className="text-xs text-neutral-600 bg-neutral-100 px-2 py-1 rounded">
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Trusted by Ambitious Professionals</h2>
            <p className="text-lg text-neutral-600">From Fortune 500 to leading startups</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Praxis gave me the business fluency I needed to transition from engineering to product management. The simulations are incredibly realistic—I use the frameworks daily.",
                author: "Sarah Chen",
                role: "Senior Product Manager",
                company: "Meta"
              },
              {
                quote: "The AI coaching is phenomenal. It''s like having a Harvard Business School professor review every decision with detailed, personalized feedback.",
                author: "Marcus Rodriguez",
                role: "Strategy Consultant",
                company: "McKinsey & Company"
              },
              {
                quote: "I completed the Financial Acumen track and immediately applied it to my startup. Our investors noticed the difference in my board presentations and financial modeling.",
                author: "Jennifer Park",
                role: "Founder & CEO",
                company: "Series A FinTech Startup"
              }
            ].map((testimonial, idx) => (
              <Card key={idx} className="bg-neutral-50 border-neutral-200">
                <CardContent className="pt-6">
                  <div className="mb-6">
                    <svg className="w-8 h-8 text-blue-700 mb-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                  <p className="text-sm text-neutral-700 italic mb-6 leading-relaxed">{testimonial.quote}</p>
                  <div className="border-t border-neutral-200 pt-4">
                    <p className="font-semibold text-sm text-neutral-900">{testimonial.author}</p>
                    <p className="text-xs text-neutral-600 mt-1">{testimonial.role}</p>
                    <p className="text-xs text-neutral-500">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Build World-Class Business Acumen?</h2>
          <p className="text-xl mb-10 text-blue-100 leading-relaxed">
            Join thousands of ambitious professionals transforming their careers through systematic, applied learning
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-neutral-100 px-10 h-14 text-lg font-semibold">
              <Link href="/signup">
                Start Free Trial
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-blue-800 px-10 h-14 text-lg">
              <Link href="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-blue-200">
            No credit card required • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
            <div className="md:col-span-2">
              <h3 className="text-white font-bold text-2xl mb-4">Praxis</h3>
              <p className="text-sm leading-relaxed mb-6">
                The proving ground for the next generation of business leaders. Build demonstrable business acumen through interactive simulations and AI-powered coaching.
              </p>
              <div className="flex gap-4">
                <a href="https://twitter.com" className="text-neutral-400 hover:text-white transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                </a>
                <a href="https://linkedin.com" className="text-neutral-400 hover:text-white transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#curriculum" className="hover:text-white transition-colors">Curriculum</Link></li>
                <li><Link href="/for-teams" className="hover:text-white transition-colors">For Teams</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; 2025 Praxis Program, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
