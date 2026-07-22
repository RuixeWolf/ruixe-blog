import 'server-only'
import { Button, Link } from '@heroui/react'
import { ExternalLink, Search } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Link as NavLink } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { siteConfig } from '@/lib/site-config'
import { LanguageSwitcher } from './LanguageSwitcher'

/**
 * Desktop header (`hidden lg:flex`), sticky at the top.
 *
 * Left: site title + primary navigation (Home, About, GitHub external link).
 * Right: search button (placeholder for phase 2), language switcher, theme toggle.
 *
 * @param locale - Active locale code (reserved for future search routing).
 */
export async function Header({ locale }: Readonly<{ locale: Locale }>) {
  // `locale` is reserved for future search routing; referenced to keep the prop stable.
  void locale
  const t = await getTranslations('Nav')
  const tHeader = await getTranslations('Header')

  return (
    <header className="sticky top-0 z-40 hidden h-16 items-center justify-between border-b border-default px-6 lg:flex">
      <div className="flex items-center gap-8">
        <NavLink href="/" className="text-lg font-bold text-foreground">
          {siteConfig.siteTitle}
        </NavLink>
        <nav className="flex items-center gap-4" aria-label="Primary navigation">
          <NavLink href="/" className="text-sm text-muted transition-colors hover:text-foreground">
            {t('Home')}
          </NavLink>
          <NavLink
            href="/about"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            {t('About')}
          </NavLink>
          <Link
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('Github')}
            className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            {t('Github')}
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Button isIconOnly variant="ghost" aria-label={tHeader('Search')} isDisabled>
          <Search className="size-5" />
        </Button>
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  )
}
