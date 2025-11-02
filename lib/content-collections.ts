import { getAllLessonsFlat, getDomainById } from './curriculum-data'
import { getAllInteractiveSimulations } from './case-study-loader'

export interface ContentItem {
  type: 'lesson' | 'case'
  id: string
  title: string
  url: string
  moduleTitle?: string
  domainTitle?: string
  description?: string
}

export interface ContentCollection {
  id: string
  title: string
  subtitle: string
  items: ContentItem[]
  viewAllHref?: string
}

/**
 * Create themed collections that repackage existing content
 */
export function createThemedCollections(userCompletedIds: Set<string> = new Set()): ContentCollection[] {
  const allLessons = getAllLessonsFlat()
  const allSimulations = getAllInteractiveSimulations()
  
  const collections: ContentCollection[] = []

  // 1. M&A Essentials Collection
  const mAndALessons = allLessons.filter(l => 
    l.lessonTitle.toLowerCase().includes('merger') ||
    l.lessonTitle.toLowerCase().includes('acquisition') ||
    l.lessonTitle.toLowerCase().includes('deal') ||
    l.domain.includes('dealmaking') ||
    l.moduleTitle.toLowerCase().includes('m&a')
  ).slice(0, 8)
  
  if (mAndALessons.length > 0) {
    collections.push({
      id: 'm-and-a-essentials',
      title: 'M&A Essentials',
      subtitle: 'Master the fundamentals of mergers and acquisitions',
      items: mAndALessons.map(l => ({
        type: 'lesson' as const,
        id: `${l.domain}-${l.moduleId}-${l.lessonId}`,
        title: l.lessonTitle,
        url: `/library/curriculum/${l.domain}/${l.moduleId}/${l.lessonId}`,
        moduleTitle: l.moduleTitle,
        domainTitle: l.domainTitle,
      })),
      viewAllHref: '/library/curriculum/high-stakes-dealmaking-integration'
    })
  }

  // 2. Financial Acumen Quick Start
  const financialLessons = allLessons.filter(l =>
    l.domain.includes('second-order-decision-making') ||
    l.moduleTitle.toLowerCase().includes('financial') ||
    l.lessonTitle.toLowerCase().includes('economics') ||
    l.lessonTitle.toLowerCase().includes('unit economics')
  ).slice(0, 8)
  
  if (financialLessons.length > 0) {
    collections.push({
      id: 'financial-acumen-quickstart',
      title: 'Financial Acumen Quick Start',
      subtitle: 'Build your financial decision-making foundation',
      items: financialLessons.map(l => ({
        type: 'lesson' as const,
        id: `${l.domain}-${l.moduleId}-${l.lessonId}`,
        title: l.lessonTitle,
        url: `/library/curriculum/${l.domain}/${l.moduleId}/${l.lessonId}`,
        moduleTitle: l.moduleTitle,
        domainTitle: l.domainTitle,
      })),
      viewAllHref: '/library/curriculum/second-order-decision-making'
    })
  }

  // 3. Crisis Leadership Playbook
  const crisisLessons = allLessons.filter(l =>
    l.domain.includes('crisis-leadership') ||
    l.lessonTitle.toLowerCase().includes('crisis') ||
    l.lessonTitle.toLowerCase().includes('emergency')
  ).slice(0, 6)
  
  const crisisCases = allSimulations.filter(s =>
    s.caseId.includes('crisis') || 
    s.title.toLowerCase().includes('crisis') ||
    s.caseId.includes('tesla') ||
    s.caseId.includes('airbnb')
  ).slice(0, 3)
  
  if (crisisLessons.length > 0 || crisisCases.length > 0) {
    collections.push({
      id: 'crisis-leadership-playbook',
      title: 'Crisis Leadership Playbook',
      subtitle: 'Navigate high-stakes situations with confidence',
      items: [
        ...crisisLessons.map(l => ({
          type: 'lesson' as const,
          id: `${l.domain}-${l.moduleId}-${l.lessonId}`,
          title: l.lessonTitle,
          url: `/library/curriculum/${l.domain}/${l.moduleId}/${l.lessonId}`,
          moduleTitle: l.moduleTitle,
          domainTitle: l.domainTitle,
        })),
        ...crisisCases.map(c => ({
          type: 'case' as const,
          id: c.caseId,
          title: c.title,
          url: `/simulations/${c.caseId}/brief`,
        }))
      ].slice(0, 8),
      viewAllHref: '/library/curriculum/crisis-leadership-public-composure'
    })
  }

  // 4. Strategic Thinking Foundations
  const strategicLessons = allLessons.filter(l =>
    l.domain.includes('competitive-moat') ||
    l.moduleTitle.toLowerCase().includes('strategic') ||
    l.lessonTitle.toLowerCase().includes('competitive') ||
    l.lessonTitle.toLowerCase().includes('moat')
  ).slice(0, 8)
  
  if (strategicLessons.length > 0) {
    collections.push({
      id: 'strategic-thinking-foundations',
      title: 'Strategic Thinking Foundations',
      subtitle: 'Develop your competitive advantage mindset',
      items: strategicLessons.map(l => ({
        type: 'lesson' as const,
        id: `${l.domain}-${l.moduleId}-${l.lessonId}`,
        title: l.lessonTitle,
        url: `/library/curriculum/${l.domain}/${l.moduleId}/${l.lessonId}`,
        moduleTitle: l.moduleTitle,
        domainTitle: l.domainTitle,
      })),
      viewAllHref: '/library/curriculum/competitive-moat-architecture'
    })
  }

  // 5. Organizational Design Essentials
  const orgLessons = allLessons.filter(l =>
    l.domain.includes('organizational-design') ||
    l.moduleTitle.toLowerCase().includes('organizational') ||
    l.lessonTitle.toLowerCase().includes('talent')
  ).slice(0, 8)
  
  if (orgLessons.length > 0) {
    collections.push({
      id: 'org-design-essentials',
      title: 'Organizational Design Essentials',
      subtitle: 'Build high-performance teams and structures',
      items: orgLessons.map(l => ({
        type: 'lesson' as const,
        id: `${l.domain}-${l.moduleId}-${l.lessonId}`,
        title: l.lessonTitle,
        url: `/library/curriculum/${l.domain}/${l.moduleId}/${l.lessonId}`,
        moduleTitle: l.moduleTitle,
        domainTitle: l.domainTitle,
      })),
      viewAllHref: '/library/curriculum/organizational-design-talent-density'
    })
  }

  // 6. Module Collections - First modules from each domain (quick introductions)
  const firstModules: ContentItem[] = []
  const domains = new Set<string>()
  
  allLessons.forEach(l => {
    if (!domains.has(l.domain) && l.moduleNumber === 1 && l.lessonNumber <= 2) {
      domains.add(l.domain)
      firstModules.push({
        type: 'lesson',
        id: `${l.domain}-${l.moduleId}-${l.lessonId}`,
        title: l.lessonTitle,
        url: `/library/curriculum/${l.domain}/${l.moduleId}/${l.lessonId}`,
        moduleTitle: l.moduleTitle,
        domainTitle: l.domainTitle,
      })
    }
  })
  
  if (firstModules.length >= 6) {
    collections.push({
      id: 'domain-introductions',
      title: 'Start Here: Domain Introductions',
      subtitle: 'Quick overviews of each learning domain',
      items: firstModules.slice(0, 8),
      viewAllHref: '/library/curriculum'
    })
  }

  // 7. Case Studies Collection
  if (allSimulations.length > 0) {
    collections.push({
      id: 'case-studies-collection',
      title: 'Interactive Case Studies',
      subtitle: 'Apply your learning in real-world scenarios',
      items: allSimulations.slice(0, 8).map(c => ({
        type: 'case' as const,
        id: c.caseId,
        title: c.title,
        url: `/simulations/${c.caseId}/brief`,
      })),
      viewAllHref: '/simulations'
    })
  }

  // 8. Cross-domain mix - Lessons from different domains for variety
  const domainsMap = new Map<string, typeof allLessons[0][]>()
  allLessons.forEach(l => {
    if (!domainsMap.has(l.domain)) {
      domainsMap.set(l.domain, [])
    }
    domainsMap.get(l.domain)!.push(l)
  })
  
  const crossDomainMix: ContentItem[] = []
  const domainArray = Array.from(domainsMap.entries())
  let domainIndex = 0
  while (crossDomainMix.length < 8 && domainArray.length > 0) {
    const [domain, lessons] = domainArray[domainIndex % domainArray.length]
    if (lessons.length > 0) {
      const lesson = lessons[Math.floor(Math.random() * lessons.length)]
      crossDomainMix.push({
        type: 'lesson',
        id: `${lesson.domain}-${lesson.moduleId}-${lesson.lessonId}`,
        title: lesson.lessonTitle,
        url: `/library/curriculum/${lesson.domain}/${lesson.moduleId}/${lesson.lessonId}`,
        moduleTitle: lesson.moduleTitle,
        domainTitle: lesson.domainTitle,
      })
    }
    domainIndex++
  }
  
  if (crossDomainMix.length >= 6) {
    collections.push({
      id: 'cross-domain-explore',
      title: 'Explore Across Domains',
      subtitle: 'A mix of lessons from different learning areas',
      items: crossDomainMix,
      viewAllHref: '/library/curriculum'
    })
  }

  return collections
}

/**
 * Get module-based collections (all lessons from a specific module)
 */
export function getModuleCollections(maxCollections: number = 4): ContentCollection[] {
  const allLessons = getAllLessonsFlat()
  const moduleMap = new Map<string, typeof allLessons[0][]>()
  
  allLessons.forEach(l => {
    const key = `${l.domain}-${l.moduleId}`
    if (!moduleMap.has(key)) {
      moduleMap.set(key, [])
    }
    moduleMap.get(key)!.push(l)
  })
  
  const collections: ContentCollection[] = []
  const modules = Array.from(moduleMap.entries())
    .filter(([_, lessons]) => lessons.length >= 2) // Only modules with 2+ lessons
    .slice(0, maxCollections)
  
  modules.forEach(([key, lessons]) => {
    const firstLesson = lessons[0]
    const domain = getDomainById(firstLesson.domain)
    collections.push({
      id: `module-${key}`,
      title: firstLesson.moduleTitle,
      subtitle: `Complete module from ${firstLesson.domainTitle}`,
      items: lessons.map(l => ({
        type: 'lesson' as const,
        id: `${l.domain}-${l.moduleId}-${l.lessonId}`,
        title: l.lessonTitle,
        url: `/library/curriculum/${l.domain}/${l.moduleId}/${l.lessonId}`,
        moduleTitle: l.moduleTitle,
        domainTitle: l.domainTitle,
      })),
      viewAllHref: `/library/curriculum/${firstLesson.domain}/${firstLesson.moduleId}`
    })
  })
  
  return collections
}

