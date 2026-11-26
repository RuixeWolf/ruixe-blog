import 'server-only'
import { Link } from '@heroui/react'
import { ExternalLink } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link as NavLink } from '@/i18n/navigation'
import { siteConfig } from '@/lib/site-config'

/**
 * Shared primary navigation used by both the desktop Header and the mobile Drawer.
 *
 * Internal links follow the active locale. The GitHub link uses the personal
 * profile URL from site configuration and opens in a new tab.
 *
 * @param variant - `'header'` for horizontal desktop nav, `'drawer'` for vertical mobile nav.
 * @returns The primary navigation links in their display order.
 */
export async function NavLinks({ variant }: Readonly<{ variant: 'header' | 'drawer' }>) {
  const t = await getTranslations('Nav')

  const isHeader = variant === 'header'
  const navClassName = isHeader ? 'flex items-center gap-5' : 'flex flex-col gap-1'
  const linkClassName = isHeader
    ? 'text-sm text-muted transition-[color] hover:text-foreground'
    : 'rounded-medium px-3 py-2 text-base text-muted transition-[color] hover:bg-secondary hover:text-foreground'

  return (
    <nav className={navClassName} aria-label="Primary navigation">
      <NavLink href="/" className={linkClassName}>
        {t('Home')}
      </NavLink>
      <NavLink href="/posts" className={linkClassName}>
        {t('Articles')}
      </NavLink>
      <NavLink href="/about" className={linkClassName}>
        {t('About')}
      </NavLink>
      <Link
        href={siteConfig.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('Github')}
        className={`${linkClassName} flex items-center gap-1.5`}
      >
        {t('Github')}
        <ExternalLink className="size-4" aria-hidden="true" />
      </Link>
    </nav>
  )
}
