import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'
import { buildPageUrl, buildPersonJsonLd, buildRssAlternateTypes } from '@/lib/seo'

/** Generates metadata with the localized "About" title and canonical URL. */
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
  const t = await getTranslations({ locale, namespace: 'About' })
  return {
    title: t('Title'),
    alternates: {
      canonical: buildPageUrl('about', locale),
      types: buildRssAlternateTypes(locale),
    },
  }
}

/**
 * About page (`/[lang]/about`).
 *
 * Renders localized "About the Author" and "About the Blog" sections from
 * `next-intl` messages. In a future phase this may be replaced with a dedicated
 * MDX file (`content/about.{lang}.mdx`).
 */
export default async function AboutPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) {
    notFound()
  }

  const t = await getTranslations('About')

  const personJsonLd = {
    ...buildPersonJsonLd(),
    description: t('AuthorContent'),
    jobTitle: 'Blogger',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <h1 className="text-3xl font-bold text-foreground">{t('Title')}</h1>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-foreground">{t('AboutAuthor')}</h2>
          <p className="text-base text-pretty text-muted">{t('AuthorContent')}</p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-foreground">{t('AboutBlog')}</h2>
          <p className="text-base text-pretty text-muted">{t('BlogContent')}</p>
        </section>
      </div>
    </>
  )
}
