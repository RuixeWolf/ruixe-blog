import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PostList } from '@/components/posts/PostList'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'
import { getPostsByCategory } from '@/lib/posts'
import {
  buildBreadcrumbJsonLd,
  buildCategoryUrl,
  buildPageUrl,
  buildRssAlternateTypes,
} from '@/lib/seo'
import { siteConfig } from '@/lib/site-config'
import { getCategories, getCategory } from '@/lib/taxonomy'

/** Pre-render every locale × category combination at build time. */
export function generateStaticParams() {
  return routing.locales.flatMap((lang) =>
    getCategories(lang).map((category) => ({ lang, categoryId: category.id })),
  )
}

/**
 * Generates metadata with the localized category name as the title.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; categoryId: string }>
}): Promise<Metadata> {
  const { lang, categoryId } = await params
  if (!hasLocale(routing.locales, lang)) {
    return {}
  }

  try {
    const locale = lang as Locale
    const category = getCategory(categoryId, locale)
    return {
      title: category.name,
      alternates: {
        canonical: buildCategoryUrl(categoryId, locale),
        types: buildRssAlternateTypes(locale),
      },
    }
  } catch {
    return {}
  }
}

/**
 * Category page (`/[lang]/categories/[categoryId]`).
 *
 * Lists all posts in the given category. Returns 404 when the category ID
 * doesn't exist in `categories.yaml`.
 */
export default async function CategoryPage({
  params,
}: Readonly<{ params: Promise<{ lang: string; categoryId: string }> }>) {
  const { lang, categoryId } = await params
  if (!hasLocale(routing.locales, lang)) {
    notFound()
  }

  const locale = lang as Locale

  let category
  try {
    category = getCategory(categoryId, locale)
  } catch {
    notFound()
  }

  const posts = getPostsByCategory(categoryId, locale)
  const t = await getTranslations('Categories')

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: siteConfig.siteTitle, url: buildPageUrl('', locale) },
    { name: category.name, url: buildCategoryUrl(categoryId, locale) },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t('PostsIn', { name: category.name })}
        </h1>
        <PostList posts={posts} locale={locale} />
      </div>
    </>
  )
}
