import 'server-only'
import { Button } from '@heroui/react'
import { Search } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Link as NavLink } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { siteConfig } from '@/lib/site-config'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NavLinks } from './NavLinks'

/**
 * Desktop header (`hidden lg:block`), sticky at the top.
 *
 * The bar background spans the full viewport; inner content is centered with
 * `max-w-7xl` + `px-4 lg:px-6` to align with the page content area in
 * `app/[lang]/layout.tsx`.
 *
 * Left: site title + primary navigation via `NavLinks` (Home, About, GitHub).
 * Right: search button (placeholder for phase 2), language switcher, theme toggle.
 *
 * @param locale - Active locale code (reserved for future search routing).
 */
export async function Header({ locale }: Readonly<{ locale: Locale }>) {
  // `locale` is reserved for future search routing; referenced to keep the prop stable.
  void locale
  const tHeader = await getTranslations('Header')

  return (
    <header className="sticky top-0 z-40 hidden border-b border-default bg-surface/70 backdrop-blur-md lg:block">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-8">
          <NavLink href="/" className="text-lg font-bold text-foreground">
            {siteConfig.siteTitle}
          </NavLink>
          <NavLinks variant="header" />
        </div>

        <div className="flex items-center gap-2">
          <Button isIconOnly variant="ghost" aria-label={tHeader('Search')} isDisabled>
            <Search className="size-5" />
          </Button>
          <LanguageSwitcher variant="dropdown" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
