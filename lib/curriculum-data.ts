// Complete Curriculum Data - All 10 Domains
import { curriculumDataPart1 } from './curriculum-data-part1'
import { curriculumDataPart2 } from './curriculum-data-part2'
import { curriculumDataPart3 } from './curriculum-data-part3'

// Export all curriculum data combined
export const completeCurriculumData = [
  ...curriculumDataPart1,
  ...curriculumDataPart2,
  ...curriculumDataPart3
]

// Export types
export type { DomainData, LessonData, ModuleData } from './curriculum-data-part1'

// Utility functions for working with curriculum data
export const getCurriculumStats = () => {
  const totalDomains = completeCurriculumData.length
  const totalModules = completeCurriculumData.reduce((sum, domain) => sum + domain.modules.length, 0)
  const totalLessons = completeCurriculumData.reduce((sum, domain) => 
    sum + domain.modules.reduce((moduleSum, module) => moduleSum + module.lessons.length, 0), 0
  )

  return {
    totalDomains,
    totalModules,
    totalLessons
  }
}

export const getAllDomains = () => {
  return completeCurriculumData
}

export const getDomainById = (domainId: string) => {
  return completeCurriculumData.find(domain => domain.id === domainId)
}

export const getModuleById = (domainId: string, moduleId: string) => {
  const domain = getDomainById(domainId)
  return domain?.modules.find(module => module.id === moduleId)
}

export const getLessonById = (domainId: string, moduleId: string, lessonId: string) => {
  const module = getModuleById(domainId, moduleId)
  return module?.lessons.find(lesson => lesson.id === lessonId)
}

export const getAllLessonsFlat = () => {
  const lessons: Array<{
    domain: string
    domainTitle: string
    moduleId: string
    moduleTitle: string
    moduleNumber: number
    lessonId: string
    lessonTitle: string
    lessonNumber: number
    description: string
  }> = []

  completeCurriculumData.forEach(domain => {
    domain.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        lessons.push({
          domain: domain.id,
          domainTitle: domain.title,
          moduleId: module.id,
          moduleTitle: module.title,
          moduleNumber: module.number,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonNumber: lesson.number,
          description: lesson.description
        })
      })
    })
  })

  return lessons
}

// Generate file paths for content organization with numbering
export const generateContentPaths = () => {
  const paths: Array<{
    domain: string
    module: string
    lesson: string
    filePath: string
    title: string
  }> = []

  completeCurriculumData.forEach((domain, domainIndex) => {
    const domainNumber = String(domainIndex + 1).padStart(2, '0')
    domain.modules.forEach(module => {
      const moduleNumber = String(module.number).padStart(2, '0')
      module.lessons.forEach(lesson => {
        const lessonNumber = String(lesson.number).padStart(2, '0')
        // Use numbered paths: {domainNumber}-{domainId}/{moduleNumber}-{moduleId}/{lessonNumber}-{lessonId}.md
        const filePath = `content/curriculum/${domainNumber}-${domain.id}/${moduleNumber}-${module.id}/${lessonNumber}-${lesson.id}.md`
        paths.push({
          domain: domain.id,
          module: module.id,
          lesson: lesson.id,
          filePath,
          title: `${module.number}.${lesson.number}: ${lesson.title}`
        })
      })
    })
  })

  return paths
}
