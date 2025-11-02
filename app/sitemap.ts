import { prisma } from '@/lib/prisma/server'
import { MetadataRoute } from 'next'
import { getAllLearningPaths } from '@/lib/learning-paths'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'

  // Static marketing pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/briefing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/library/paths`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Public user profiles
  try {
    const publicProfiles = await prisma.profile.findMany({
      where: { isPublic: true },
      select: { username: true, updatedAt: true },
      take: 1000, // Limit to prevent excessive sitemap size
    })

    const profilePages: MetadataRoute.Sitemap = publicProfiles.map((profile) => ({
      url: `${baseUrl}/profile/${profile.username}`,
      lastModified: profile.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    // Learning paths pages
    const learningPaths = await getAllLearningPaths()
    const learningPathPages: MetadataRoute.Sitemap = learningPaths.map((path) => ({
      url: `${baseUrl}/library/paths/${path.id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

    return [...staticPages, ...profilePages, ...learningPathPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static pages only if database query fails
    return staticPages
  }
}

