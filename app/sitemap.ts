import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { getAllPosts, getCategoryPostCounts, getTagPostCounts } from '@/lib/posts'
import {
  buildAlternates,
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
 * category and tag listing pages that have at least one post in the current
 * locale, and all post detail pages. Zero-post taxonomy entries are filtered
 * per locale (a category with posts in zh but none in en only gets a zh
 * entry) so the sitemap spends crawl budget exclusively on pages with
 * content - the empty-state pages themselves stay 200/indexable, they just
 * lose this discovery entrance. Every entry declares `alternates.languages`
 * (hreflang): post entries cover only the language variants that actually
 * exist (so crawlers never discover 404 alternates), while non-post entries
 * reuse the HTML-side `buildAlternates` helper so both surfaces stay in sync
 * — including the home entry's `x-default` pointing at the prefix-less root.
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
        alternates: { languages: buildAlternates('', locale).languages },
      },
      {
        url: buildPageUrl('posts', locale),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: { languages: buildAlternates('posts', locale).languages },
      },
      {
        url: buildPageUrl('about', locale),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
        alternates: { languages: buildAlternates('about', locale).languages },
      },
    ]

    const categoryCounts = getCategoryPostCounts(locale)
    const categoryEntries: MetadataRoute.Sitemap = getCategories(locale)
      .filter((category) => (categoryCounts[category.id] ?? 0) > 0)
      .map((category) => ({
        url: buildCategoryUrl(category.id, locale),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: {
          languages: buildAlternates(`categories/${category.id}`, locale).languages,
        },
      }))

    const tagCounts = getTagPostCounts(locale)
    const tagEntries: MetadataRoute.Sitemap = getTags(locale)
      .filter((tag) => (tagCounts[tag.id] ?? 0) > 0)
      .map((tag) => ({
        url: buildTagUrl(tag.id, locale),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: { languages: buildAlternates(`tags/${tag.id}`, locale).languages },
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
