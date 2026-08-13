import 'server-only'
import { Feed } from 'feed'
import { type Locale } from '../i18n/routing'
import { getAllPosts } from './posts'
import { buildPageUrl, buildPostUrl } from './seo'
import { siteConfig } from './site-config'
import { getCategory, getTag } from './taxonomy'

/** Maximum number of posts included in a single feed (newest first). */
const FEED_ITEM_LIMIT = 20

/**
 * Builds the absolute URL for a locale's RSS feed.
 *
 * Used as the `feedLinks.rss` value in the `Feed` constructor options and as
 * the `<atom:link rel="self">` canonical URL, so RSS readers can locate the
 * feed's own URL. Reuses {@link siteConfig.siteUrl} to derive the absolute URL.
 *
 * @param locale - Target locale code.
 * @returns Absolute feed URL (e.g. `https://example.com/zh/feed.xml`).
 */
export function buildFeedUrl(locale: Locale): string {
  return `${siteConfig.siteUrl.replace(/\/$/, '')}/${locale}/feed.xml`
}

/**
 * Builds an RSS 2.0 feed XML string for the given locale.
 *
 * Creates a `Feed` instance populated with site-wide metadata (title,
 * description, homepage link, author, copyright) from {@link siteConfig}, then
 * adds up to {@link FEED_ITEM_LIMIT} newest posts (via {@link getAllPosts},
 * which returns posts sorted by `publishedTime` descending). Each item
 * includes the post's localized category and tag names (resolved through
 * {@link getCategory}/{@link getTag} so readers see `前端开发` rather than the
 * `frontend` ID) and intentionally omits `content` — only the frontmatter
 * `description` is emitted to keep the feed lightweight and drive traffic back
 * to the site.
 *
 * @param locale - Target locale code; determines post set and taxonomy names.
 * @returns RSS 2.0 XML string (output of `Feed.rss2()`), with XML declaration
 *   `<?xml version="1.0" encoding="UTF-8"?>`, RFC 2822 dates, and XML entity
 *   escaping handled by the `feed` library.
 */
export function buildRssFeed(locale: Locale): string {
  const feed = new Feed({
    title: siteConfig.siteTitle,
    description: siteConfig.siteDescription,
    link: buildPageUrl('', locale),
    id: buildPageUrl('', locale),
    language: locale,
    image: `${siteConfig.siteUrl.replace(/\/$/, '')}/opengraph-image.png`,
    favicon: `${siteConfig.siteUrl.replace(/\/$/, '')}/favicon.ico`,
    updated: new Date(),
    feedLinks: { rss: buildFeedUrl(locale) },
    author: { name: siteConfig.githubUsername, link: siteConfig.githubUrl },
    copyright: `© ${new Date().getFullYear()} ${siteConfig.siteTitle}`,
  })

  for (const post of getAllPosts(locale).slice(0, FEED_ITEM_LIMIT)) {
    feed.addItem({
      title: post.title,
      id: buildPostUrl(post.slug, locale),
      link: buildPostUrl(post.slug, locale),
      description: post.description,
      date: new Date(post.publishedTime),
      category: [
        { name: getCategory(post.category, locale).name },
        ...post.tags.map((tagId) => ({ name: getTag(tagId, locale).name })),
      ],
    })
  }

  return feed.rss2()
}
