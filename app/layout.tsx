import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { siteConfig } from '@/lib/site-config'
import './globals.css'

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

/** Static site-wide metadata; the locale layout and pages add overrides. */
export const metadata: Metadata = {
  title: {
    default: `${siteConfig.siteTitle}`,
    template: `%s | ${siteConfig.siteTitle}`,
  },
  description: siteConfig.siteDescription,
  metadataBase: new URL(siteConfig.siteUrl),
  openGraph: {
    title: siteConfig.siteTitle,
    description: siteConfig.siteDescription,
    url: siteConfig.siteUrl,
    siteName: siteConfig.siteTitle,
    type: 'website',
  },
}

/**
 * Root layout for the entire application.
 *
 * Renders `<html lang="zh">` and `<body>`, loads Geist fonts, and wraps
 * everything in `ThemeProvider` (next-themes). Analytics and SpeedInsights are
 * included globally. The `lang` attribute is set to the default locale (`zh`)
 * because the root layout sits above the `[lang]` dynamic segment and cannot
 * know the locale at build time without opting into dynamic rendering (which
 * would disable static pre-rendering for all pages). The locale layout's
 * `generateMetadata` provides `hreflang` alternates, which search engines use
 * as the primary signal for language/region targeting.
 *
 * Locale-specific concerns (Header, Sidebar, NextIntlClientProvider,
 * `setRequestLocale`) live in `app/[lang]/layout.tsx`. Future root-level SEO
 * features (sitemap, robots.txt, RSS, llms.txt, structured data) can be added
 * as route handlers or metadata extensions without touching locale logic.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
