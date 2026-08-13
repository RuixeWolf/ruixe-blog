import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ProfileCard } from '@/components/layout/ProfileCard'
import { PostList } from '@/components/posts/PostList'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'
import { getAllPosts } from '@/lib/posts'

/**
 * Home page (`/[lang]`) -- equivalent to the post list, plus a compact profile
 * card on mobile.
 *
 * Fetches all posts for the active locale and renders them via `PostList`. On
 * mobile (`<lg`) a compact `ProfileCard` is shown above the list to compensate
 * for the hidden sidebar. Static rendering is enabled automatically by
 * `next/root-params` (see `i18n/request.ts`) - no `setRequestLocale` needed.
 *
 * Deliberately omits `generateMetadata` so the browser tab title falls back to
 * the root layout's `title.default` (`siteConfig.siteTitle`), yielding a clean
 * `"Ruixe Blog"` instead of `"All Posts | Ruixe Blog"`. The `description` and
 * other site-wide metadata are likewise inherited from the root layout.
 */
export default async function HomePage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) {
    notFound()
  }

  const locale = lang as Locale

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
