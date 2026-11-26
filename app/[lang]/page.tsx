import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { HomeProfile } from '@/components/layout/HomeProfile'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { getPostBySlug } from '@/lib/posts'
import { buildAlternates } from '@/lib/seo'
import { siteConfig } from '@/lib/site-config'

/**
 * Generates alternates-only metadata: canonical + hreflang group (with
 * `x-default` for the prefix-less root) via the shared helper. Deliberately
 * returns no `title` so the browser tab keeps the root layout's
 * `title.default` (`siteConfig.siteTitle`) — a clean "Ruixe Blog" instead of
 * "All Posts | Ruixe Blog" — and no `openGraph` / `description`, which
 * likewise inherit the site-wide layout values (the home page is the layout
 * `openGraph`'s only inheritor, whose `url` points here).
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

  return {
    alternates: buildAlternates('', lang),
  }
}

/**
 * Renders the author's profile and hand-picked articles for the current locale.
 *
 * @param params - Route parameters containing the current locale.
 * @returns The homepage's standalone main content.
 */
export default async function HomePage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) {
    notFound()
  }

  const t = await getTranslations('PostList')
  const featuredPosts = (siteConfig.featuredPosts ?? [])
    .map((slug) => getPostBySlug(slug, lang))
    .filter((post) => post !== null)

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 pb-12 lg:px-6 lg:pt-6">
      <HomeProfile />
      {featuredPosts.length > 0 && (
        <section
          aria-labelledby="featured-heading"
          className="mx-auto mt-5 max-w-5xl sm:mt-8 md:mt-12"
        >
          <h2
            id="featured-heading"
            className="mb-2 text-2xl font-semibold tracking-tight sm:mb-4 sm:text-3xl"
          >
            {t('Featured')}
          </h2>
          <ul className="divide-y divide-border border-y border-border">
            {featuredPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/posts/${post.slug}`}
                  className="group grid grid-cols-[1fr_auto] items-center gap-x-5 gap-y-1.5 py-4 focus-visible:outline-2 focus-visible:outline-focus sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] sm:gap-x-8 sm:py-5"
                >
                  <h3 className="font-semibold text-foreground underline-offset-4 group-hover:underline sm:text-lg">
                    {post.title}
                  </h3>
                  <p className="col-start-1 text-sm leading-relaxed text-muted sm:col-start-auto">
                    {post.description}
                  </p>
                  <ArrowRight
                    className="col-start-2 row-start-1 size-4 text-muted sm:col-start-3"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
