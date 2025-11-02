import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Recommendation } from '@/lib/recommendation-engine'
import Link from 'next/link'

interface FirstTimeExperienceProps {
  user: any
  residencyData: {
    year: number
    title: string
    articlesCompleted: number
    totalArticles: number
    simulationsCompleted: number
    totalSimulations: number
  } | null
  primaryRecommendation: Recommendation
}

export default function FirstTimeExperience({
  user,
  residencyData,
  primaryRecommendation,
}: FirstTimeExperienceProps) {
  // Extract first name from user metadata or email
  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 
                    user.email?.split('@')[0]?.split('.')[0] || 
                    'there'

  const getActionUrl = () => {
    if (primaryRecommendation.type === 'curriculum') {
      return primaryRecommendation.url
    }
    // For simulations, use the id to construct URL if needed
    if (primaryRecommendation.type === 'simulation') {
      return primaryRecommendation.id ? `/simulations/${primaryRecommendation.id}/brief` : primaryRecommendation.url
    }
    return primaryRecommendation.url
  }

  const actionUrl = getActionUrl()

  return (
    <div className="space-y-8 px-6 lg:px-8 py-8 max-w-screen-2xl mx-auto">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome, {firstName}
        </h1>
        {residencyData && (
          <p className="text-xl text-gray-600">
            You're on the <span className="font-semibold">{residencyData.title}</span> path (Year {residencyData.year})
          </p>
        )}
      </div>

      {/* First Clear Step Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-blue-900">
            Your First Clear Step
          </CardTitle>
          <CardDescription className="text-blue-700">
            Start your learning journey with this recommended lesson
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-6 border border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {primaryRecommendation.title}
            </h3>
            {primaryRecommendation.reason && (
              <p className="text-gray-600 mb-4">
                {primaryRecommendation.reason}
              </p>
            )}
            <Button asChild size="lg" className="w-full">
              <Link href={actionUrl}>
                Start Learning
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

