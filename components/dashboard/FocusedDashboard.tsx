import CurriculumRoadmap from '@/components/dashboard/CurriculumRoadmap'

interface FocusedDashboardProps {
  roadmap: {
    totalLessons: number
    completedCount: number
    nextLesson: {
      domainId: string
      moduleId: string
      lessonId: string
    title: string
      url: string
  } | null
    sections: Array<{
    domainId: string
    domainTitle: string
      modules: Array<{
        moduleId: string
        moduleTitle: string
        moduleNumber: number
        lessons: Array<{
          lessonId: string
          lessonTitle: string
          lessonNumber: number
          status: 'completed' | 'in_progress' | 'not_started'
          url: string
        }>
      }>
    }>
  }
}

export default function FocusedDashboard({
  roadmap,
}: FocusedDashboardProps) {
  return (
    <div className="px-6 lg:px-8 py-12 max-w-7xl mx-auto">
      <CurriculumRoadmap roadmap={roadmap} />
    </div>
  )
}
