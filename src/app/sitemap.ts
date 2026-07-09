import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://dandouna.sa'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/auth', '/privacy', '/terms']
  return routes.map((r) => ({
    url: `${SITE}${r}`,
    changeFrequency: 'monthly' as const,
    priority: r === '' ? 1 : 0.6,
  }))
}
