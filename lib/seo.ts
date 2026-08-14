import 'server-only'
import { routing, type Locale } from '../i18n/routing'
import { getPostBySlug, type PostMeta } from './posts'
import { siteConfig } from './site-config'

/**
 * Central SEO construction module.
 *
 * Concentrates URL generation and Schema.org JSON-LD building logic so that
 * sitemap, `generateMetadata`, and JSON-LD `<script>` injection don't duplicate
 * path-assembly or schema-shaping code. All functions are pure except
 * {@link buildPostAlternates}, which checks post existence via `getPostBySlug`.
 */

/**
 * Builds an absolute, locale-prefixed URL for a page path.
 *
 * @param path - Path segment after the locale prefix (e.g. `'posts'`, `'about'`);
 *   pass an empty string for the locale homepage.
 * @param locale - Target locale code.
 * @returns Absolute URL (e.g. `https://example.com/zh/posts`).
 */
export function buildPageUrl(path: string, locale: Locale): string {
  const siteUrl = siteConfig.siteUrl.replace(/\/$/, '')
  const base = `${siteUrl}/${locale}`
  return path ? `${base}/${path}` : base
}

/**
 * Builds an absolute URL for a post detail page.
 *
 * @param slug - URL-safe post identifier.
 * @param locale - Target locale code.
 * @returns Absolute URL (e.g. `https://example.com/zh/posts/hello-world`).
 */
export function buildPostUrl(slug: string, locale: Locale): string {
  return buildPageUrl(`posts/${slug}`, locale)
}

/**
 * Builds an absolute URL for a post's Markdown version (llms.txt companion).
 *
 * Appends `/index.md` to the post detail URL so the path follows the llms.txt
 * v2 convention for "URLs without file names" (append `index.md`). The
 * corresponding Route Handler lives at
 * `app/[lang]/posts/[slug]/index.md/route.ts` and serves the frontmatter-stripped
 * markdown body.
 *
 * @param slug - URL-safe post identifier.
 * @param locale - Target locale code.
 * @returns Absolute URL (e.g. `https://example.com/zh/posts/hello-world/index.md`).
 */
export function buildPostMarkdownUrl(slug: string, locale: Locale): string {
  return `${buildPostUrl(slug, locale)}/index.md`
}

/**
 * Builds a root-relative path for a post's Markdown version.
 *
 * Unlike {@link buildPostMarkdownUrl}, this returns a path with no origin so
 * the client can resolve it against `window.location.origin` at runtime. Used
 * by the post detail `MarkdownLinkButton` so the "View Markdown" and "Copy
 * link" actions track the current browser origin in dev, preview, and
 * production without depending on the server-only `siteConfig.siteUrl`.
 *
 * @param slug - URL-safe post identifier.
 * @param locale - Target locale code.
 * @returns Root-relative path (e.g. `/zh/posts/hello-world/index.md`).
 */
export function buildPostMarkdownPath(slug: string, locale: Locale): string {
  return `/${locale}/posts/${slug}/index.md`
}

/**
 * Builds an absolute URL for a category listing page.
 *
 * @param categoryId - Category ID referencing `categories.yaml`.
 * @param locale - Target locale code.
 * @returns Absolute URL (e.g. `https://example.com/zh/categories/frontend`).
 */
export function buildCategoryUrl(categoryId: string, locale: Locale): string {
  return buildPageUrl(`categories/${categoryId}`, locale)
}

/**
 * Builds an absolute URL for a tag listing page.
 *
 * @param tagId - Tag ID referencing `tags.yaml`.
 * @param locale - Target locale code.
 * @returns Absolute URL (e.g. `https://example.com/zh/tags/next-js`).
 */
export function buildTagUrl(tagId: string, locale: Locale): string {
  return buildPageUrl(`tags/${tagId}`, locale)
}

/**
 * Builds hreflang alternates for a post, including only locales where the post
 * actually exists.
 *
 * Iterates over all supported locales and uses `getPostBySlug` to check file
 * existence. Non-existent variants are omitted so crawlers never discover 404
 * alternates. The returned mapping always includes the current locale when the
 * post exists in it.
 *
 * @param slug - URL-safe post identifier shared across language variants.
 * @returns Map of locale code to absolute post URL, only for existing variants.
 */
export function buildPostAlternates(slug: string): Record<string, string> {
  const alternates: Record<string, string> = {}
  for (const locale of routing.locales) {
    if (getPostBySlug(slug, locale)) {
      alternates[locale] = buildPostUrl(slug, locale)
    }
  }
  return alternates
}

/**
 * Builds the `alternates.types` mapping for RSS auto-discovery.
 *
 * Returns the MIME-type-to-descriptor pair that Next.js renders as
 * `<link rel="alternate" type="application/rss+xml" title="{siteTitle}"
 * href="...">`. The descriptor's `url` is a relative path
 * (`/{locale}/feed.xml`) which Next.js resolves against `metadataBase` into
 * an absolute URL; `title` names the feed for readers that surface it. Because
 * Next.js shallowly merges metadata, any page that defines its own
 * `alternates` object must include `types` (via this helper) — otherwise the
 * layout's `types` is overwritten.
 *
 * @param locale - Target locale code.
 * @returns Map with the RSS MIME type keyed to an array of alternate-link
 *   descriptors (Next.js resolves `alternates.types` values as arrays of
 *   `{ url, title }`).
 */
export function buildRssAlternateTypes(
  locale: Locale,
): Record<string, { url: string; title: string }[]> {
  return {
    'application/rss+xml': [{ url: `/${locale}/feed.xml`, title: siteConfig.siteTitle }],
  }
}

/**
 * Builds the `WebSite` Schema.org JSON-LD object for the root layout.
 *
 * @returns `WebSite` schema with the site name and URL.
 */
export function buildWebsiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.siteTitle,
    url: siteConfig.siteUrl,
  }
}

/**
 * Builds the `Person` Schema.org JSON-LD object for the site author.
 *
 * @returns `Person` schema with the author's GitHub username, profile URL, and
 *   `sameAs` reference.
 */
export function buildPersonJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.githubUsername,
    url: siteConfig.githubUrl,
    sameAs: [siteConfig.githubUrl],
  }
}

/**
 * Builds the `BlogPosting` Schema.org JSON-LD object for a post detail page.
 *
 * @param post - Post metadata parsed from frontmatter.
 * @param locale - Locale of the post variant being rendered (used for
 *   `inLanguage`).
 * @param url - Absolute URL of the post page.
 * @returns `BlogPosting` schema with headline, description, dates, author, and
 *   main entity reference.
 */
export function buildBlogPostingJsonLd(
  post: PostMeta,
  locale: Locale,
  url: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedTime,
    dateModified: post.modifiedTime ?? post.publishedTime,
    inLanguage: locale,
    author: {
      '@type': 'Person',
      name: siteConfig.githubUsername,
      url: siteConfig.githubUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }
}

/**
 * Builds the `BreadcrumbList` Schema.org JSON-LD object.
 *
 * @param items - Ordered list of breadcrumb items (name + absolute URL), root
 *   first. Position numbers are assigned automatically starting at 1.
 * @returns `BreadcrumbList` schema with an `itemListElement` array.
 */
export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
