import CaseCard from '@/components/dashboard/cards/CaseCard'
import ContinueLearningCard from '@/components/dashboard/cards/ContinueLearningCard'
import LearningPathCard from '@/components/dashboard/cards/LearningPathCard'
import LessonCard from '@/components/dashboard/cards/LessonCard'
import NewContentCard from '@/components/dashboard/cards/NewContentCard'
import ResidencyProgress from '@/components/dashboard/ResidencyProgress'
import ContentShelf from '@/components/dashboard/shelves/ContentShelf'
import SmartRecommendation from '@/components/dashboard/SmartRecommendation'
import FirstTimeExperience from '@/components/dashboard/FirstTimeExperience'
import ExecemyRadarChart from '@/components/profile/ExecemyRadarChart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ContentCollection } from '@/lib/content-collections'
import { RecommendationWithAlternates } from '@/lib/recommendation-engine'
import Link from 'next/link'

interface FocusedDashboardProps {
  user: any
  recommendation: RecommendationWithAlternates
  residencyData: {
    year: number
    title: string
    articlesCompleted: number
    totalArticles: number
    simulationsCompleted: number
    totalSimulations: number
  } | null
  currentStreak: number
  recentActivities: any[]
  aggregateScores?: Record<string, number> | null
  jumpBackInItems: Array<{ type: 'lesson' | 'simulation'; id: string; title: string; url: string; progress?: number }>
  strengthenCoreShelves: Array<{
    competencyName: string
    competencyKey: string
    domainId: string
    lessons: Array<{ id: string; title: string; url: string; moduleTitle: string; domainTitle?: string }>
    cases: Array<{ id: string; title: string; url: string }>
  }>
  newContent: Array<{ type: 'lesson' | 'case'; id: string; title: string; url: string; createdAt: Date }>
  popularContent: Array<{ type: 'lesson' | 'case'; id: string; title: string; url: string; moduleTitle?: string; domainTitle?: string }>
  practiceSpotlight: Array<{ type: 'case' | 'lesson'; id: string; title: string; url: string; reason?: string }>
  continueYearPath: Array<{ type: 'lesson' | 'case'; id: string; title: string; url: string; moduleTitle?: string; domainTitle?: string }>
  themedCollections: ContentCollection[]
  moduleCollections: ContentCollection[]
  learningPaths: Array<{
    id: string
    title: string
    description?: string
    duration: string
    items: any[]
    progress?: {
      completed: number
      total: number
      percentage: number
    }
  }>
  domainCompletions?: Array<{
    domainId: string
    domainTitle: string
    completed: boolean
    progress: number
  }>
}

export default function FocusedDashboard({
  user,
  recommendation,
  residencyData,
  currentStreak,
  recentActivities,
  aggregateScores,
  jumpBackInItems,
  strengthenCoreShelves,
  newContent,
  popularContent,
  practiceSpotlight,
  continueYearPath,
  themedCollections,
  moduleCollections,
  learningPaths,
  domainCompletions,
}: FocusedDashboardProps) {
  const getGreeting = () => {
    // Use a stable greeting to avoid hydration mismatches
    return 'Welcome back'
  }

  const getProgressPhase = () => {
    if (!residencyData) return 'setup'
    
    const articleProgress = residencyData.articlesCompleted / residencyData.totalArticles
    const simulationProgress = residencyData.simulationsCompleted / residencyData.totalSimulations
    
    if (articleProgress < 0.3) return 'learn'
    if (simulationProgress < articleProgress * 0.5) return 'practice'
    // Check if user has completed simulations recently (indicates they might need debriefing)
    // Note: debriefed flag is not currently in recentActivities, so we check for completed simulations
    const hasRecentSimulations = recentActivities.some(a => a.type === 'simulation')
    if (hasRecentSimulations && simulationProgress > 0) return 'debrief'
    return 'connect'
  }

  const currentPhase = getProgressPhase()
  const progressPercentage = residencyData 
    ? Math.round((residencyData.articlesCompleted / residencyData.totalArticles) * 100)
    : 0

  // Detect first-time users: no jump back in items and no recent activities
  const isFirstTime = (jumpBackInItems?.length ?? 0) === 0 && (recentActivities?.length ?? 0) === 0
  const primary = recommendation?.primary || null

  // Show FTUE for brand new users with a primary recommendation
  if (isFirstTime && primary) {
    return (
      <FirstTimeExperience
        user={user}
        residencyData={residencyData}
        primaryRecommendation={primary}
      />
    )
  }

  return (
    <div className="space-y-8 px-6 lg:px-8 py-8 max-w-screen-2xl mx-auto">
      {/* Personalized Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          {getGreeting()}, {user.user_metadata?.full_name?.split(' ')[0] || 'there'}
        </h1>
        {residencyData ? (
          <div className="flex items-center justify-center gap-3">
            <Badge variant="outline" className="text-blue-600 border-blue-200 px-4 py-2">
              {residencyData.title}
            </Badge>
            <div className="text-2xl font-bold text-blue-600">
              {progressPercentage}% Complete
            </div>
          </div>
        ) : (
          <p className="text-xl text-gray-600">Ready to begin your executive journey?</p>
        )}
      </div>

      {/* Learning Phase Indicator */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-900">Your Learning Journey</h2>
            <div className="flex items-center gap-2">
              {currentStreak > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  🔥 {currentStreak} day streak
                </Badge>
              )}
            </div>
          </div>

          {/* Learning Flow Visualization */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { phase: 'learn', label: 'Learn', description: 'Master frameworks' },
              { phase: 'practice', label: 'Practice', description: 'Apply in simulations' },
              { phase: 'debrief', label: 'Debrief', description: 'Analyze performance' },
              { phase: 'connect', label: 'Connect', description: 'Share insights' }
            ].map((step, index) => {
              const isActive = step.phase === currentPhase
              const isCompleted = ['learn', 'practice', 'debrief'].indexOf(currentPhase) > index
              
              return (
                <div key={step.phase} className="flex flex-col items-center text-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all
                    ${isActive ? 'bg-blue-600 text-white scale-110' : 
                      isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}
                  `}>
                  </div>
                  <div className={`font-medium text-sm ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Progress Bar */}
          {residencyData && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Overall Progress</span>
                <span>{residencyData.articlesCompleted} of {residencyData.totalArticles} lessons</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Next Optimal Move - Smart Recommendation */}
      <ContentShelf
        title="Your Next Optimal Move"
        subtitle="Personalized recommendation based on your learning journey"
        emptyMessage="Complete your first lesson or simulation to get personalized recommendations"
      >
        <SmartRecommendation recommendation={recommendation} aggregateScores={aggregateScores} />
      </ContentShelf>

      {/* Jump Back In */}
      <ContentShelf
        title="Jump Back In"
        subtitle="Continue where you left off"
        emptyMessage="Start a lesson or simulation to see your progress here"
        viewAllHref={jumpBackInItems.length > 0 ? "/library/curriculum" : undefined}
      >
        {jumpBackInItems.map((item) => (
          <ContinueLearningCard
            key={item.id}
            type={item.type}
            title={item.title}
            url={item.url}
            progress={item.progress}
            id={item.id}
          />
        ))}
      </ContentShelf>

      {/* Strengthen Your Core */}
      {strengthenCoreShelves.map((shelf) => (
        <ContentShelf
          key={shelf.competencyKey}
          title={`Strengthen Your Core: ${shelf.competencyName}`}
          subtitle="Build foundational knowledge in areas where you need growth"
          emptyMessage={`No content available for ${shelf.competencyName} at this time`}
          viewAllHref={`/library/curriculum/${shelf.domainId}`}
        >
          {shelf.lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              id={lesson.id}
              title={lesson.title}
              url={lesson.url}
              moduleTitle={lesson.moduleTitle}
              domainTitle={lesson.domainTitle}
              shelfName={`Strengthen Core: ${shelf.competencyName}`}
            />
          ))}
          {shelf.cases.map((caseItem) => (
            <CaseCard
              key={caseItem.id}
              id={caseItem.id}
              title={caseItem.title}
              url={caseItem.url}
              shelfName={`Strengthen Core: ${shelf.competencyName}`}
            />
          ))}
        </ContentShelf>
      ))}

      {/* New on Execemy */}
      <ContentShelf
        title="New on Execemy"
        subtitle="Latest lessons and case studies"
        emptyMessage="New content will appear here as it's published"
        viewAllHref="/library/curriculum"
      >
        {newContent.map((item) => (
          <NewContentCard
            key={item.id}
            type={item.type}
            title={item.title}
            url={item.url}
            id={item.id}
          />
        ))}
      </ContentShelf>

      {/* Practice Spotlight */}
      <ContentShelf
        title="Practice Spotlight"
        subtitle="Apply what you've learned in real-world scenarios"
        emptyMessage="Complete more lessons to see practice recommendations"
        viewAllHref="/simulations"
      >
        {practiceSpotlight.map((item) => {
          if (item.type === 'case') {
            return (
              <CaseCard
                key={item.id}
                id={item.id}
                title={item.title}
                url={item.url}
                shelfName="Practice Spotlight"
              />
            )
          }
          return (
            <LessonCard
              key={item.id}
              id={item.id}
              title={item.title}
              url={item.url}
              shelfName="Practice Spotlight"
            />
          )
        })}
      </ContentShelf>

      {/* Continue Your Year Path */}
      <ContentShelf
        title="Continue Your Year Path"
        subtitle="Next steps in your residency curriculum"
        emptyMessage="You've completed all available lessons in your current year path"
        viewAllHref="/library/curriculum"
      >
        {continueYearPath.map((item) => {
          if (item.type === 'lesson') {
            return (
              <LessonCard
                key={item.id}
                id={item.id}
                title={item.title}
                url={item.url}
                moduleTitle={item.moduleTitle}
                domainTitle={item.domainTitle}
                shelfName="Continue Year Path"
              />
            )
          }
          return (
            <CaseCard
              key={item.id}
              id={item.id}
              title={item.title}
              url={item.url}
              shelfName="Continue Year Path"
            />
          )
        })}
      </ContentShelf>

      {/* Popular Content */}
      <ContentShelf
        title="Popular Now"
        subtitle="Most completed content by learners"
        emptyMessage="No popular content available at this time"
        viewAllHref="/library/curriculum"
      >
        {popularContent.map((item) => {
          if (item.type === 'lesson') {
            return (
              <LessonCard
                key={item.id}
                id={item.id}
                title={item.title}
                url={item.url}
                moduleTitle={item.moduleTitle}
                domainTitle={item.domainTitle}
                shelfName="Popular Now"
              />
            )
          }
          return (
            <CaseCard
              key={item.id}
              id={item.id}
              title={item.title}
              url={item.url}
              shelfName="Popular Now"
            />
          )
        })}
      </ContentShelf>

      {/* Themed Collections */}
      {themedCollections.map((collection) => (
        <ContentShelf
          key={collection.id}
          title={collection.title}
          subtitle={collection.subtitle}
          emptyMessage={`No items available in ${collection.title} at this time`}
          viewAllHref={collection.viewAllHref}
        >
          {collection.items.map((item) => {
            if (item.type === 'lesson') {
              return (
                <LessonCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  url={item.url}
                  moduleTitle={item.moduleTitle}
                  domainTitle={item.domainTitle}
                  shelfName={collection.title}
                />
              )
            }
            return (
              <CaseCard
                key={item.id}
                id={item.id}
                title={item.title}
                url={item.url}
                shelfName={collection.title}
              />
            )
          })}
        </ContentShelf>
      ))}

      {/* Module Collections */}
      {moduleCollections.map((collection) => (
        <ContentShelf
          key={collection.id}
          title={collection.title}
          subtitle={collection.subtitle}
          emptyMessage={`No items available in ${collection.title} at this time`}
          viewAllHref={collection.viewAllHref}
        >
          {collection.items.map((item) => {
            if (item.type === 'lesson') {
              return (
                <LessonCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  url={item.url}
                  moduleTitle={item.moduleTitle}
                  domainTitle={item.domainTitle}
                  shelfName={collection.title}
                />
              )
            }
            return (
              <CaseCard
                key={item.id}
                id={item.id}
                title={item.title}
                url={item.url}
                shelfName={collection.title}
              />
            )
          })}
        </ContentShelf>
      ))}

      {/* Curated Learning Paths */}
      <ContentShelf
        title="Curated Learning Paths"
        subtitle="Thematic collections that solve specific learning goals"
        emptyMessage="No learning paths available at this time"
        viewAllHref="/library/paths"
      >
        {learningPaths.map((path) => (
          <LearningPathCard key={path.id} path={path} />
        ))}
      </ContentShelf>

      {/* Residency Progress with Domain Map */}
      {residencyData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{residencyData.articlesCompleted}</div>
                  <div className="text-sm text-gray-600">Lessons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{residencyData.simulationsCompleted}</div>
                  <div className="text-sm text-gray-600">Simulations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
                  <div className="text-sm text-gray-600">Day Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>
          {domainCompletions && domainCompletions.length > 0 && (
            <ResidencyProgress 
              residency={residencyData} 
              domainCompletions={domainCompletions.slice(0, 8)} // Show top 8 domains
            />
          )}
        </div>
      )}

      {/* Execemy Profile - Central Progress Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-blue-900">
              Your Execemy Profile
            </CardTitle>
            <CardDescription className="text-blue-700">
              Your competency growth across all simulations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {aggregateScores ? (
              <div className="space-y-4">
                <ExecemyRadarChart data={aggregateScores} />
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium">
                    Complete more simulations to see your profile evolve
                  </p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/simulations">Practice Now</Link>
                  </Button>
                </div>
              </div>
            ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Build Your Profile</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Complete simulations to unlock your competency radar chart
                </p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/simulations">Start First Simulation</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Condensed */}
      {recentActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.slice(0, 3).map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full ${
                    activity.type === 'article' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{activity.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {recentActivities.length > 3 && (
              <div className="text-center mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/library/curriculum">View All Progress</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
