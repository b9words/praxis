/**
 * Query key factory for React Query
 * Centralized keys for easy debugging and invalidation
 */
export const queryKeys = {
  notifications: {
    all: () => ['notifications'] as const,
  },
  profiles: {
    byId: (userId: string) => ['profiles', userId] as const,
  },
  simulations: {
    byId: (id: string) => ['simulations', id] as const,
    state: (id: string) => ['simulations', id, 'state'] as const,
  },
  caseStudies: {
    byId: (id: string) => ['case-studies', id] as const,
    state: (id: string) => ['case-studies', id, 'state'] as const,
  },
  debriefs: {
    bySimulation: (simulationId: string) => ['debriefs', simulationId] as const,
  },
  articles: {
    all: () => ['articles'] as const,
    published: () => ['articles', 'published'] as const,
  },
  progress: {
    articles: (userId?: string) => ['progress', 'articles', userId || 'all'] as const,
    lessons: (userId?: string) => ['progress', 'lessons', userId || 'all'] as const,
  },
  applications: {
    all: () => ['applications'] as const,
  },
  user: {
    progress: () => ['user', 'progress'] as const,
  },
  search: {
    lessons: (query: string) => ['search-lessons', query] as const,
  },
  competencies: {
    all: () => ['competencies'] as const,
  },
  storage: {
    byPath: (path: string) => ['storage', path] as const,
  },
}
