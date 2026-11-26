import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Link } from '@heroui/react'
import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import ogImage from '@/app/opengraph-image.png'
import { BlogLayout } from '@/components/layout/BlogLayout'
import { Link as NavLink } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'
import { buildAlternates, buildOpenGraph, buildPageUrl, buildPersonJsonLd } from '@/lib/seo'
import { siteConfig } from '@/lib/site-config'

/** GitHub repository base URL used to build license file links. */
const repoBase = siteConfig.githubRepoUrl
/** URL of the content license full text (CC BY-NC 4.0). */
const contentLicenseUrl = `${repoBase}/blob/main/LICENSE.content`
/** URL of the code license full text (MIT). */
const codeLicenseUrl = `${repoBase}/blob/main/LICENSE`

/**
 * Renders the content license (CC BY-NC 4.0) full text as an external link.
 *
 * @param chunks - Translated text wrapped by the `<linkLicense>` tag.
 * @returns The license link element.
 */
function ContentLicenseLink(chunks: ReactNode) {
  return (
    <Link
      href={contentLicenseUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-4"
    >
      {chunks}
    </Link>
  )
}

/**
 * Renders the site credit link (attribution target).
 *
 * @param chunks - Translated text wrapped by the `<linkSite>` tag.
 * @returns The site link element.
 */
function SiteCreditLink(chunks: ReactNode) {
  return (
    <Link
      href={siteConfig.siteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-4"
    >
      {chunks}
    </Link>
  )
}

/**
 * Renders the code license (MIT) full text as an external link.
 *
 * @param chunks - Translated text wrapped by the `<linkCode>` tag.
 * @returns The license link element.
 */
function CodeLicenseLink(chunks: ReactNode) {
  return (
    <Link
      href={codeLicenseUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-4"
    >
      {chunks}
    </Link>
  )
}

/**
 * Generates metadata with the localized "About" title, complete alternates
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
  const t = await getTranslations({ locale, namespace: 'About' })
  return {
    title: t('Title'),
    alternates: buildAlternates('about', locale),
    openGraph: buildOpenGraph({
      title: t('Title'),
      description: siteConfig.siteDescription,
      url: buildPageUrl('about', locale),
      locale,
    }),
  }
}

/**
 * Presents the author, the site's creation, and its licensing terms.
 *
 * @param params - Route parameters containing the current locale.
 * @returns Localized author and blog sections with author structured data.
 */
export default async function AboutPage({
  params,
}: Readonly<{ params: Promise<{ lang: string }> }>) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) {
    notFound()
  }

  const t = await getTranslations('About')
  const { displayName } = siteConfig.profile

  const personJsonLd = {
    ...buildPersonJsonLd(),
    name: displayName,
    description: t('AuthorContent', { name: displayName }),
    jobTitle: 'Blogger',
  }

  return (
    <BlogLayout locale={lang}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <h1 className="text-3xl font-bold text-foreground">{t('Title')}</h1>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-foreground">{t('AboutAuthor')}</h2>
          <p className="text-base text-pretty text-muted">{personJsonLd.description}</p>
          <p className="text-base text-pretty text-muted">{t('AuthorMotivation')}</p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-foreground">{t('AboutBlog')}</h2>
          <p className="text-base text-pretty text-muted">{t('BlogContent')}</p>
          <Image
            src={ogImage}
            alt={siteConfig.siteTitle}
            sizes="(max-width: 703px) calc(100vw - 32px), 672px"
            className="h-auto w-full rounded-xl"
          />
          <p className="text-base text-pretty text-muted">
            {t.rich('BuildStory', {
              story: (chunks) => (
                <NavLink
                  href="/posts/my-first-blog-website"
                  className="text-foreground underline underline-offset-4"
                >
                  {chunks}
                </NavLink>
              ),
            })}
          </p>

          <div className="border-default-200 mt-2 flex flex-col gap-2 rounded-xl border p-4">
            <h3 className="text-sm font-semibold text-foreground">{t('BlogLicenseTitle')}</h3>
            <p className="text-sm text-pretty text-muted">
              {t.rich('BlogLicenseContent', {
                name: displayName,
                linkLicense: ContentLicenseLink,
                linkSite: SiteCreditLink,
                linkCode: CodeLicenseLink,
              })}
            </p>
          </div>
        </section>
      </div>
    </BlogLayout>
  )
}
