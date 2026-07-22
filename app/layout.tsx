import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '../components/theme/ThemeProvider'
import { routing } from '../i18n/routing'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Use the default locale as a static fallback for `<html lang>`. The
  // `[lang]/layout.tsx` calls `setRequestLocale` to enable per-locale static
  // rendering; using `getLocale()` here would force dynamic rendering for the
  // entire app. Per-locale `<html lang>` is a known trade-off of the two-layout
  // split (see design.md Decision 3).
  const locale = routing.defaultLocale

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
