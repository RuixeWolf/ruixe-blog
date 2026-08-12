import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ProfileCard } from '@/components/layout/ProfileCard'
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
 * Home page (`/[lang]`) -- equivalent to the post list, plus a compact profile
 * card on mobile.
 *
 * Sets the request locale for static rendering, fetches all posts for the
 * active locale, and renders them via `PostList`. On mobile (`<lg`) a compact
 * `ProfileCard` is shown above the list to compensate for the hidden sidebar.
 */
export default async function HomePage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) {
    notFound()
  }

  const locale = lang as Locale
  setRequestLocale(locale)

  const posts = getAllPosts(locale)
  const t = await getTranslations('Nav')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">{t('Home')}</h1>
      <div className="lg:hidden">
        <ProfileCard />
      </div>
      <PostList posts={posts} locale={locale} />
    </div>
  )
}
