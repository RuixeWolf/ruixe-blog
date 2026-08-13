import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PostList } from '@/components/posts/PostList'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'
import { getAllPosts } from '@/lib/posts'
import { siteConfig } from '@/lib/site-config'

/** Generates metadata with the localized post-list title and site description. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) {
    return {}
  }

  const t = await getTranslations({ locale: lang as Locale, namespace: 'PostList' })
  return {
    title: t('Title'),
    description: siteConfig.siteDescription,
  }
}

/**
 * Post list page (`/[lang]/posts`) -- renders the same post list as the home
 * page, but without the mobile profile card.
 */
export default async function PostsPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) {
    notFound()
  }

  const locale = lang as Locale

  const posts = getAllPosts(locale)
  const t = await getTranslations('PostList')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">{t('Title')}</h1>
      <PostList posts={posts} locale={locale} />
    </div>
  )
}
