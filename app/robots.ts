import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site-config'

/**
 * Generates `/robots.txt` at build time.
 *
 * Allows all user agents to crawl the entire site and points them to the
 * sitemap for efficient URL discovery.
 *
 * @returns Robots configuration consumed by Next.js metadata routing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteConfig.siteUrl.replace(/\/$/, '')}/sitemap.xml`,
  }
}
