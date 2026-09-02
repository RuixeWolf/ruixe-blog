'use client'

import { Button, Kbd } from '@heroui/react'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMounted } from '@/lib/hooks/use-mounted'
import { useSearch } from './SearchContext'

/**
 * Desktop header search affordance that opens the global {@link SearchDialog}
 * via the shared {@link useSearch} context.
 *
 * Renders an icon + label button followed by a `⌘K` (macOS) or `Ctrl+K`
 * (other platforms) hint via HeroUI's `Kbd`. The mobile header no longer
 * renders a dedicated trigger - search lives in `MobileActionsMenu` as a
 * native dropdown menu item.
 *
 * Platform detection runs only after mount (guarded by {@link useMounted}) so
 * the server markup matches the first client render and avoids hydration
 * mismatch. The global `⌘K`/`Ctrl+K` shortcut listener lives in
 * {@link SearchProvider} - this button is a mouse/touch affordance only.
 */
export function SearchTrigger() {
  const t = useTranslations('Search')
  const { setIsOpen } = useSearch()
  const mounted = useMounted()

  const isMac =
    mounted && typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  const label = t('Trigger')

  return (
    <Button
      variant="outline"
      aria-label={label}
      onPress={() => setIsOpen(true)}
      className="w-50 items-center"
    >
      <Search className="size-5" />
      {mounted ? (
        <div className="flex w-full items-center justify-between">
          <span className="ml-1.5">{label}</span>
          <Kbd className="ml-auto hidden sm:inline-flex">
            <Kbd.Abbr keyValue={isMac ? 'command' : 'ctrl'} />
            <Kbd.Content>K</Kbd.Content>
          </Kbd>
        </div>
      ) : null}
    </Button>
  )
}
