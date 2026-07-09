import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://dandouna.sa'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/privacy', '/terms', '/auth'],
      // مسارات خاصة/محميّة لا تُفهرس
      disallow: ['/api/', '/admin/', '/parent-dashboard', '/children', '/assessment', '/plan', '/calm', '/specialist', '/company', '/institution', '/recommendations', '/onboarding', '/consent'],
    },
    sitemap: `${SITE}/sitemap.xml`,
  }
}
