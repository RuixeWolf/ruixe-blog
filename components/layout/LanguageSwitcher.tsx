'use client'

import { useTransition } from 'react'
import { Button } from '@heroui/react'
import { Globe } from 'lucide-react'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

/**
 * Locale switcher that preserves the current path when changing language.
 *
 * next-intl's `usePathname` returns the path *without* the locale prefix, and
 * `useRouter().replace` accepts a `{ locale }` option that swaps the `[lang]`
 * segment while keeping the rest of the URL intact. The active locale is read
 * via `useLocale()` (instead of parsing the path) so the comparison is always
 * correct regardless of the current path shape.
 */
export function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const currentLocale = useLocale()
  const [isPending, startTransition] = useTransition()

  /**
   * Navigates to the same path under the target locale.
   *
   * @param locale - Target locale code to switch to.
   */
  function switchTo(locale: (typeof routing.locales)[number]) {
    if (locale === currentLocale) return
    startTransition(() => {
      // `pathname` is already locale-stripped by next-intl, so we only need to
      // override the locale — the router prepends the new `[lang]` prefix.
      // `push` (not `replace`) so the back button returns to the prior locale.
      router.push(pathname, { locale })
    })
  }

  return (
    <fieldset
      className="flex items-center gap-1 border-0 p-0"
      aria-label="Language switcher"
      disabled={isPending}
    >
      <Globe className="size-4 text-muted" aria-hidden="true" />
      {routing.locales.map((locale) => (
        <Button
          key={locale}
          size="sm"
          variant={locale === currentLocale ? 'secondary' : 'ghost'}
          onPress={() => switchTo(locale)}
          aria-pressed={locale === currentLocale}
          className="px-2 py-1 text-xs uppercase"
        >
          {locale}
        </Button>
      ))}
    </fieldset>
  )
}
