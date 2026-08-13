import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Geist, Geist_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { NavLinks } from '@/components/layout/NavLinks'
import { RssButton } from '@/components/layout/RssButton'
import { Sidebar } from '@/components/layout/Sidebar'
import { SidebarContent } from '@/components/layout/SidebarContent'
import { SearchProvider } from '@/components/search/SearchProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'
import { buildSearchIndex } from '@/lib/search'
import { buildPersonJsonLd, buildRssAlternateTypes, buildWebsiteJsonLd } from '@/lib/seo'
import { siteConfig } from '@/lib/site-config'
import '../globals.css'

/** Geist Sans font, exposed as a CSS variable for Tailwind to consume. */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

/** Geist Mono font, exposed as a CSS variable for Tailwind to consume. */
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

/** Pre-render both supported locales at build time. */
export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }))
}

/**
 * Root + locale metadata. Merges site-wide defaults (formerly in the deleted
 * `app/layout.tsx`) with locale-specific `hreflang` alternates and OpenGraph
 * locale. `metadataBase` is inherited from `siteConfig.siteUrl`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale: Locale = hasLocale(routing.locales, lang) ? lang : routing.defaultLocale

  return {
    title: {
      default: siteConfig.siteTitle,
      template: `%s | ${siteConfig.siteTitle}`,
    },
    description: siteConfig.siteDescription,
    metadataBase: new URL(siteConfig.siteUrl),
    alternates: {
      languages: {
        zh: `/${routing.locales[0]}`,
        en: `/${routing.locales[1]}`,
      },
      // Generates `<link rel="alternate" type="application/rss+xml"
      // title="…">` so RSS readers can auto-discover the current locale's
      // feed. The relative href is resolved against `metadataBase` into an
      // absolute URL.
      types: buildRssAlternateTypes(locale),
    },
    openGraph: {
      title: siteConfig.siteTitle,
      description: siteConfig.siteDescription,
      url: siteConfig.siteUrl,
      siteName: siteConfig.siteTitle,
      type: 'website',
      locale,
      images: [
        {
          url: '/opengraph-image.png',
          alt: 'Ruixe Blog',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.siteTitle,
      description: siteConfig.siteDescription,
      creator: '@RuixeWolf',
    },
  }
}

/**
 * Renders the `WebSite` Schema.org JSON-LD globally so search engines
 * understand the site identity on every page.
 */
function WebSiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebsiteJsonLd()) }}
    />
  )
}

/**
 * Renders the global `Person` Schema.org JSON-LD identifying the site author.
 */
function PersonJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildPersonJsonLd()) }}
    />
  )
}

/**
 * Root layout for the entire application (`app/[lang]/layout.tsx`).
 *
 * This is BOTH the root layout (renders `<html>`/`<body>`, loads Geist fonts,
 * wraps everything in `ThemeProvider`, includes Analytics + SpeedInsights +
 * global JSON-LD) AND the locale layout (validates the `[lang]` segment, loads
 * `next-intl` messages, renders the responsive Header/Sidebar chrome).
 *
 * Because the root layout sits inside the `[lang]` dynamic segment, `[lang]` is
 * a **root parameter** (Next.js 16.3+) readable via `next/root-params`. This
 * enables static rendering per locale without the deprecated `setRequestLocale`
 * calls - `i18n/request.ts` resolves the locale from `rootParams.lang()` and
 * `getMessages()` / `getTranslations()` pick it up automatically.
 *
 * The `<html lang>` attribute is set to the validated locale (previously a
 * static `zh` when the root layout sat above `[lang]`); `hreflang` alternates
 * from `generateMetadata` remain the primary search-engine signal.
 */
export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ lang: string }>
}>) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) {
    notFound()
  }

  const locale = lang as Locale
  const messages = await getMessages()
  const searchIndex = buildSearchIndex(locale)

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <WebSiteJsonLd />
          <PersonJsonLd />
          <NextIntlClientProvider locale={locale} messages={messages}>
            <SearchProvider searchIndex={searchIndex}>
              <div className="flex min-h-screen flex-col">
                <Header locale={locale} />
                <MobileHeader
                  siteTitle={siteConfig.siteTitle}
                  navLinks={<NavLinks variant="drawer" />}
                  sidebar={<SidebarContent locale={locale} />}
                  rssButton={<RssButton locale={locale} variant="ghost" />}
                />
                <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-4 lg:gap-8 lg:px-6">
                  <Sidebar locale={locale} />
                  <main className="min-w-0 flex-1 py-6 lg:py-8">{children}</main>
                </div>
              </div>
            </SearchProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
