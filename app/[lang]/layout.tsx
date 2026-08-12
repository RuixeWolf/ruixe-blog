import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { NavLinks } from '@/components/layout/NavLinks'
import { Sidebar } from '@/components/layout/Sidebar'
import { SidebarContent } from '@/components/layout/SidebarContent'
import { SearchProvider } from '@/components/search/SearchProvider'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'
import { buildSearchIndex } from '@/lib/search'
import { siteConfig } from '@/lib/site-config'

/** Pre-render both supported locales at build time. */
export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }))
}

/** Locale-specific metadata; site-wide defaults live in the root layout. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale: Locale = hasLocale(routing.locales, lang) ? lang : routing.defaultLocale

  return {
    alternates: {
      languages: {
        zh: `/${routing.locales[0]}`,
        en: `/${routing.locales[1]}`,
      },
    },
    openGraph: {
      locale,
      images: [
        {
          url: '/opengraph-image.png',
          alt: 'Ruixe Blog',
        },
      ],
    },
  }
}

/**
 * Locale layout for `/[lang]/...`.
 *
 * Validates the `lang` segment, sets the request locale for static rendering,
 * loads messages, and renders the responsive chrome: desktop Header + Sidebar
 * on `lg+`, mobile Header (with Drawer) on `<lg`. The root `app/layout.tsx`
 * provides `<html>`/`<body>`, fonts, ThemeProvider, Analytics, SpeedInsights,
 * and site-wide metadata.
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
  setRequestLocale(locale)
  const messages = await getMessages()
  const searchIndex = buildSearchIndex(locale)

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SearchProvider searchIndex={searchIndex}>
        <div className="flex min-h-screen flex-col">
          <Header locale={locale} />
          <MobileHeader
            siteTitle={siteConfig.siteTitle}
            navLinks={<NavLinks variant="drawer" />}
            sidebar={<SidebarContent locale={locale} />}
          />
          <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-4 lg:gap-8 lg:px-6">
            <Sidebar locale={locale} />
            <main className="min-w-0 flex-1 py-6 lg:py-8">{children}</main>
          </div>
        </div>
      </SearchProvider>
    </NextIntlClientProvider>
  )
}
