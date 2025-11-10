import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/profile/edit/',
          '/case-studies/',
          '/debrief/',
          '/onboarding/',
          '/library/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

