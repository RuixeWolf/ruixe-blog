import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { getAllPosts } from '@/lib/posts'
import {
  buildCategoryUrl,
  buildPageUrl,
  buildPostAlternates,
  buildPostUrl,
  buildTagUrl,
} from '@/lib/seo'
import { getCategories, getTags } from '@/lib/taxonomy'

/**
 * Generates the site-wide `sitemap.xml` at build time.
 *
 * Enumerates every locale-prefixed URL: static pages (home, post list, about),
 * all category and tag listing pages, and all post detail pages. Post entries
 * declare `alternates.languages` (hreflang) covering only the language variants
 * that actually exist, so crawlers never discover 404 alternates.
 *
 * @returns Array of sitemap entries consumed by Next.js metadata routing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return routing.locales.flatMap((locale) => {
    const staticEntries: MetadataRoute.Sitemap = [
      {
        url: buildPageUrl('', locale),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 1.0,
      },
      {
        url: buildPageUrl('posts', locale),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: buildPageUrl('about', locale),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
      },
    ]

    const categoryEntries: MetadataRoute.Sitemap = getCategories(locale).map((category) => ({
      url: buildCategoryUrl(category.id, locale),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    const tagEntries: MetadataRoute.Sitemap = getTags(locale).map((tag) => ({
      url: buildTagUrl(tag.id, locale),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    const postEntries: MetadataRoute.Sitemap = getAllPosts(locale).map((post) => ({
      url: buildPostUrl(post.slug, locale),
      lastModified: new Date(post.modifiedTime ?? post.publishedTime),
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: buildPostAlternates(post.slug),
      },
    }))

    return [...staticEntries, ...categoryEntries, ...tagEntries, ...postEntries]
  })
}
