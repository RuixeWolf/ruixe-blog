import 'server-only'
import type { Locale } from '../../i18n/routing'
import { SidebarContent } from './SidebarContent'

/**
 * Desktop-only persistent sidebar (`hidden lg:block`).
 *
 * Wraps the shared `SidebarContent` in a sticky container so the profile card,
 * categories and tags remain visible while the main content scrolls.
 *
 * @param locale - Active locale code passed through to `SidebarContent`.
 */
export function Sidebar({ locale }: Readonly<{ locale: Locale }>) {
  return (
    <aside className="hidden lg:block lg:w-64 lg:shrink-0">
      <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <SidebarContent locale={locale} />
      </div>
    </aside>
  )
}
