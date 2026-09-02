'use client'

import { useTransition } from 'react'
import { Button, Dropdown, Label } from '@heroui/react'
import { Globe } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'

/**
 * Native display names and uppercase codes for each supported locale.
 *
 * Language names are intentionally hardcoded (not translated) - a Chinese
 * visitor should always see "English" and an English visitor should always
 * see "中文". Add an entry here when a new locale is introduced. Exported for
 * reuse by `MobileActionsMenu`'s language section.
 */
export const LOCALE_LABELS: Record<Locale, { name: string; code: string }> = {
  zh: { name: '中文', code: 'ZH' },
  en: { name: 'English', code: 'EN' },
}

/**
 * Hook that switches the locale while preserving the current path.
 *
 * next-intl's `usePathname` returns the path *without* the locale prefix, and
 * `useRouter().push` accepts a `{ locale }` option that swaps the `[lang]`
 * segment while keeping the rest of the URL intact. The active locale is read
 * via `useLocale()` (instead of parsing the path) so the comparison is always
 * correct regardless of the current path shape. Shared by `LanguageSwitcher`
 * (desktop header) and `MobileActionsMenu` (mobile actions dropdown).
 *
 * @returns The active locale, the transition-pending flag, and a
 *   `switchTo(locale)` callback.
 */
export function useLocaleSwitch() {
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

  return { currentLocale, isPending, switchTo }
}

/**
 * Locale switcher for the desktop header: a globe icon button that opens a
 * `Dropdown` menu of native locale names with a checkmark on the active one.
 */
export function LanguageSwitcher() {
  const { currentLocale, isPending, switchTo } = useLocaleSwitch()
  const tHeader = useTranslations('Header')

  /**
   * Guards the `Dropdown.Menu` `onAction` callback so only valid locale keys
   * reach `switchTo`. React Aria passes `Key` (`string | number`), which must
   * be narrowed and validated at runtime before the cast to `Locale`.
   *
   * @param key - The `id` of the activated `Dropdown.Item`.
   */
  function handleAction(key: React.Key) {
    if (typeof key !== 'string') return
    if (!(routing.locales as readonly string[]).includes(key)) return
    switchTo(key as Locale)
  }

  return (
    <Dropdown>
      <Button isIconOnly variant="tertiary" aria-label={tHeader('Language')} isDisabled={isPending}>
        <Globe className="size-5" />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu
          selectionMode="single"
          selectedKeys={new Set([currentLocale])}
          onAction={handleAction}
        >
          {routing.locales.map((locale) => (
            <Dropdown.Item key={locale} id={locale} textValue={LOCALE_LABELS[locale].name}>
              <Dropdown.ItemIndicator />
              <Label>
                {LOCALE_LABELS[locale].name} ({LOCALE_LABELS[locale].code})
              </Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
