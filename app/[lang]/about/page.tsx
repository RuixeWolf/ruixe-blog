import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'

/** Generates metadata with the localized "About" title. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) {
    return {}
  }

  const t = await getTranslations({ locale: lang as Locale, namespace: 'About' })
  return { title: t('Title') }
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

  const locale = lang as Locale
  setRequestLocale(locale)

  const t = await getTranslations('About')

  return (
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
  )
}
