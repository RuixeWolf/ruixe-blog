import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PostList } from '@/components/posts/PostList'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'
import { getPostsByTag } from '@/lib/posts'
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  buildOpenGraph,
  buildPageUrl,
  buildTagUrl,
} from '@/lib/seo'
import { siteConfig } from '@/lib/site-config'
import { getTag, getTags } from '@/lib/taxonomy'

/** Pre-render every locale × tag combination at build time. */
export function generateStaticParams() {
  return routing.locales.flatMap((lang) => getTags(lang).map((tag) => ({ lang, tagId: tag.id })))
}

/**
 * Generates metadata with the localized tag name as the title, complete
 * alternates (canonical + hreflang for the same path), and page-level
 * OpenGraph so the social card shows the tag instead of site defaults.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; tagId: string }>
}): Promise<Metadata> {
  const { lang, tagId } = await params
  if (!hasLocale(routing.locales, lang)) {
    return {}
  }

  try {
    const locale = lang as Locale
    const tag = getTag(tagId, locale)
    return {
      title: tag.name,
      alternates: buildAlternates(`tags/${tagId}`, locale),
      openGraph: buildOpenGraph({
        title: tag.name,
        description: siteConfig.siteDescription,
        url: buildTagUrl(tagId, locale),
        locale,
      }),
    }
  } catch {
    return {}
  }
}

/**
 * Tag page (`/[lang]/tags/[tagId]`).
 *
 * Lists all posts with the given tag. Returns 404 when the tag ID doesn't
 * exist in `tags.yaml`.
 */
export default async function TagPage({
  params,
}: Readonly<{ params: Promise<{ lang: string; tagId: string }> }>) {
  const { lang, tagId } = await params
  if (!hasLocale(routing.locales, lang)) {
    notFound()
  }

  const locale = lang as Locale

  let tag
  try {
    tag = getTag(tagId, locale)
  } catch {
    notFound()
  }

  const posts = getPostsByTag(tagId, locale)
  const t = await getTranslations('Tags')

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: siteConfig.siteTitle, url: buildPageUrl('', locale) },
    { name: tag.name, url: buildTagUrl(tagId, locale) },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-foreground">{t('PostsIn', { name: tag.name })}</h1>
        <PostList posts={posts} locale={locale} />
      </div>
    </>
  )
}
