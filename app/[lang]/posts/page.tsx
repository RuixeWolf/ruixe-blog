import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { BlogLayout } from '@/components/layout/BlogLayout'
import { PostList } from '@/components/posts/PostList'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'
import { getAllPosts } from '@/lib/posts'
import { buildAlternates, buildOpenGraph, buildPageUrl } from '@/lib/seo'
import { siteConfig } from '@/lib/site-config'

/**
 * Generates metadata with the localized post-list title, complete alternates
 * (canonical + hreflang for the same path), and page-level OpenGraph so the
 * social card reflects this page rather than the site defaults.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) {
    return {}
  }

  const locale = lang as Locale
  const t = await getTranslations({ locale, namespace: 'PostList' })
  return {
    title: t('Title'),
    description: siteConfig.siteDescription,
    alternates: buildAlternates('posts', locale),
    openGraph: buildOpenGraph({
      title: t('Title'),
      description: siteConfig.siteDescription,
      url: buildPageUrl('posts', locale),
      locale,
    }),
  }
}

/**
 * Lists all posts published in the current locale, newest first.
 *
 * @param params - Route parameters containing the current locale.
 * @returns The localized post index in the shared blog layout.
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
    <BlogLayout locale={locale}>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-foreground lg:sr-only">{t('Title')}</h1>
        <PostList posts={posts} locale={locale} />
      </div>
    </BlogLayout>
  )
}
