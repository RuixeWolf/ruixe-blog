import 'server-only'
import { Link } from '@heroui/react'
import { buttonVariants, type ButtonVariants } from '@heroui/styles'
import { Rss } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'

/** Button visual variant accepted by `buttonVariants`. */
type ButtonVariant = NonNullable<ButtonVariants['variant']>

/**
 * RSS subscription affordance for the header bar.
 *
 * Server Component — reads the localized `aria-label` via `getTranslations`
 * (the `Header.Rss` key). Renders as a native `<a>` (HeroUI `Link`) rather
 * than `next-intl/navigation` `Link` because the feed is a static XML file
 * served by a Route Handler, not an App Router page; client-side navigation
 * does not apply and a plain anchor lets the browser request the XML
 * directly. Styled with `buttonVariants` to match the icon-only buttons in
 * the same bar.
 *
 * The `variant` prop lets each header pick the right visual treatment:
 * `tertiary` (default) for the desktop header where icon-only buttons use
 * `tertiary` (e.g. `LanguageSwitcher`), and `ghost` for the mobile header
 * where icon-only buttons use `ghost` (e.g. search, settings).
 *
 * @param locale - Active locale code; used to build the feed URL and resolve
 *   the `aria-label` translation.
 * @param variant - Button visual variant; defaults to `tertiary`.
 */
export async function RssButton({
  locale,
  variant = 'tertiary',
}: Readonly<{ locale: Locale; variant?: ButtonVariant }>) {
  const t = await getTranslations('Header')

  return (
    <Link
      href={`/${locale}/feed.xml`}
      aria-label={t('Rss')}
      className={buttonVariants({ variant, isIconOnly: true })}
    >
      <Rss className="size-5" aria-hidden="true" />
    </Link>
  )
}
