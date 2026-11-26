import 'server-only'
import type { Locale } from '@/i18n/routing'
import { Sidebar } from './Sidebar'

/**
 * Shared content layout for pages with a persistent desktop sidebar.
 *
 * @param locale - Active locale for the sidebar taxonomy.
 * @param children - Page content rendered within the main landmark.
 * @returns The sidebar and main content in the site's standard page container.
 */
export function BlogLayout({
  locale,
  children,
}: Readonly<{
  locale: Locale
  children: React.ReactNode
}>) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-4 lg:gap-8 lg:px-6">
      <Sidebar locale={locale} />
      <main className="min-w-0 flex-1 py-6 lg:py-8">{children}</main>
    </div>
  )
}
