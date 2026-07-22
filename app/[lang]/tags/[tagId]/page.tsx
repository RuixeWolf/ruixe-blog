import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PostList } from '@/components/posts/PostList'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'
import { getPostsByTag } from '@/lib/posts'
import { getTag, getTags } from '@/lib/taxonomy'

/** Pre-render every locale × tag combination at build time. */
export function generateStaticParams() {
  return routing.locales.flatMap((lang) => getTags(lang).map((tag) => ({ lang, tagId: tag.id })))
}

/**
 * Generates metadata with the localized tag name as the title.
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
    const tag = getTag(tagId, lang as Locale)
    return { title: tag.name }
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
  setRequestLocale(locale)

  let tag
  try {
    tag = getTag(tagId, locale)
  } catch {
    notFound()
  }

  const posts = getPostsByTag(tagId, locale)
  const t = await getTranslations('Tags')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">{t('PostsIn', { name: tag.name })}</h1>
      <PostList posts={posts} locale={locale} />
    </div>
  )
}
