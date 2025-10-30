'use client'

import RecommendedReading from '@/components/debrief/RecommendedReading'
import ScoreReveal from '@/components/debrief/ScoreReveal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Award, Share2, Sparkles, TrendingUp, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function DebriefPage({ params }: { params: Promise<{ simulationId: string }> }) {
  const [simulationId, setSimulationId] = useState<string>('')
  const [simulation, setSimulation] = useState<any>(null)
  const [debrief, setDebrief] = useState<any>(null)
  const [recommendedArticles, setRecommendedArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showScores, setShowScores] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Get simulationId from params
        const resolvedParams = await params
        const simId = resolvedParams.simulationId
        setSimulationId(simId)

        // Fetch debrief using API route
        const response = await fetch(`/api/debriefs/${simId}`)
        if (!response.ok) {
          throw new Error('Debrief not found')
        }

        const { debrief: debriefData } = await response.json()

        // Extract simulation and case data from debrief
        const simulationData = debriefData.simulation
        const caseData = simulationData?.case

        // Get recommended articles based on weak areas
        const scores = debriefData.scores as any[]
        const weakCompetencies = scores
          .filter((s: any) => (s.score || s) < 3)
          .map((s: any) => s.competencyName || s.competency)
          .filter(Boolean)

        let formattedArticles: any[] = []
        if (weakCompetencies.length > 0) {
          // Fetch articles for weak competencies
          const articlesResponse = await fetch(`/api/articles?status=published`)
          if (articlesResponse.ok) {
            const { articles } = await articlesResponse.json()
            const filteredArticles = articles
              .filter((article: any) => {
                const competencyName = article.competency?.name?.toLowerCase() || ''
                return weakCompetencies.some((wc: string) =>
                  competencyName.includes(wc.toLowerCase())
                )
              })
              .slice(0, 3)
              .map((article: any) => ({
                id: article.id,
                title: article.title,
                competencyName: article.competency?.name || 'Unknown',
                reason: `Strengthen your ${article.competency?.name || 'this'} knowledge based on your simulation performance`,
              }))
            formattedArticles = filteredArticles
          }
        }

        setSimulation({
          ...simulationData,
          case: caseData,
        })
        setDebrief(debriefData)
        setRecommendedArticles(formattedArticles)
        setLoading(false)

        // Start score reveal animation after 2 seconds
        setTimeout(() => setShowScores(true), 2000)
      } catch (error) {
        console.error('Error fetching debrief:', error)
        toast.error('Failed to load debrief')
        setLoading(false)
      }
    }

    fetchData()
  }, [params])

  const shareDebrief = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Debrief link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-blue-600"
        >
          <Sparkles className="h-12 w-12" />
        </motion.div>
      </div>
    )
  }

  if (!simulation || !debrief) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-medium text-gray-900">Debrief not found</p>
            <p className="text-sm text-gray-600 mt-2">This simulation may not be completed yet</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const scores = (debrief.scores as any[]) || []
  const averageScore =
    scores.length > 0
      ? scores.reduce((sum: number, s: any) => sum + (s.score || s || 0), 0) / scores.length
      : 0
  const totalPossible = scores.length * 5 // Assuming 5 is max score

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10" />
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative max-w-5xl mx-auto px-6 py-16 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6"
          >
            <Trophy className="h-10 w-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4"
          >
            Simulation Complete!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="text-xl text-gray-700 mb-2"
          >
            {simulation.case?.title || 'Unknown Case'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-lg"
          >
            <Award className="h-5 w-5 text-yellow-600" />
            <span className="font-semibold text-gray-900">Overall Score: {averageScore.toFixed(1)}/5.0</span>
          </motion.div>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-16">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="mb-12"
        >
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl text-blue-900">Performance Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-blue-800 leading-relaxed">
                {debrief.summaryText ||
                  "You've completed this simulation and demonstrated your business acumen across multiple competencies."}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Score Reveals */}
        {showScores && (
          <div className="space-y-6 mb-12">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-center text-gray-900 mb-8"
            >
              Your Competency Breakdown
            </motion.h2>

            {scores.map((score: any, index: number) => (
              <ScoreReveal
                key={score.competencyName || score.competency || index}
                competencyName={score.competencyName || score.competency || 'Unknown'}
                score={score.score || score || 0}
                maxScore={5}
                justification={score.justification || score.feedback || ''}
                delay={0.3 * index}
              />
            ))}
          </div>
        )}

        {/* Recommended Reading */}
        {showScores && recommendedArticles.length > 0 && (
          <div className="mb-12">
            <RecommendedReading
              recommendations={recommendedArticles}
              delay={0.3 * scores.length + 0.5}
            />
          </div>
        )}

        {/* Action Buttons */}
        {showScores && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 * scores.length + 1, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button onClick={shareDebrief} variant="outline" size="lg" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share Results
            </Button>

            <Button asChild size="lg">
              <Link href="/simulations">Try Another Simulation</Link>
            </Button>

            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
