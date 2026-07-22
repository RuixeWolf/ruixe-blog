import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Header } from '../../components/layout/Header'
import { MobileHeader } from '../../components/layout/MobileHeader'
import { Sidebar } from '../../components/layout/Sidebar'
import { SidebarContent } from '../../components/layout/SidebarContent'
import { routing } from '../../i18n/routing'
import type { Locale } from '../../i18n/routing'
import { siteConfig } from '../../lib/site-config'

/** Pre-render both supported locales at build time. */
export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }))
}

/** Static site-wide metadata; individual pages override with `generateMetadata`. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale: Locale = hasLocale(routing.locales, lang) ? lang : routing.defaultLocale

  return {
    title: {
      default: `${siteConfig.siteTitle} - ${siteConfig.siteDescription}`,
      template: `%s | ${siteConfig.siteTitle}`,
    },
    description: siteConfig.siteDescription,
    metadataBase: new URL(siteConfig.siteUrl),
    alternates: {
      languages: {
        zh: `/${routing.locales[0]}`,
        en: `/${routing.locales[1]}`,
      },
    },
    openGraph: {
      title: siteConfig.siteTitle,
      description: siteConfig.siteDescription,
      url: siteConfig.siteUrl,
      siteName: siteConfig.siteTitle,
      locale,
      type: 'website',
    },
  }
}

/**
 * Locale-scoped layout that wraps every `/[lang]/...` page.
 *
 * Validates the `lang` segment, sets the request locale for static rendering,
 * loads messages, and renders the responsive chrome: desktop Header + Sidebar
 * on `lg+`, mobile Header (with Drawer) on `<lg`. The main content area is
 * sandwiched between the sidebar and children.
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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex min-h-screen flex-col">
        <Header locale={locale} />
        <MobileHeader sidebar={<SidebarContent locale={locale} />} />
        <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-0 lg:gap-8 lg:px-6">
          <Sidebar locale={locale} />
          <main className="min-w-0 flex-1 py-6 lg:py-8">{children}</main>
        </div>
      </div>
    </NextIntlClientProvider>
  )
}
